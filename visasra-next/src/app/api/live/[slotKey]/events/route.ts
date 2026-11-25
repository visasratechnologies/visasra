import { subscribeLiveEvent, LiveSessionEvent } from '@/lib/eventBus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slotKey: string }> }
) {
  const { slotKey } = await params;
  const decodedKey = decodeURIComponent(slotKey);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: LiveSessionEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Stream already closed by client
        }
      };

      // 1. Initial Handshake Message
      sendEvent({
        slotKey: decodedKey,
        type: 'init',
        payload: { connectedAt: new Date().toISOString() },
        timestamp: Date.now(),
      });

      // 2. Subscribe to In-Memory Event Bus for sub-50ms dispatch
      const unsubscribe = subscribeLiveEvent(decodedKey, (event) => {
        sendEvent(event);
      });

      // 3. Keep-Alive Heartbeat every 15 seconds (prevents proxy timeouts)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // 4. Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx / Cloudflare
    },
  });
}
