import { EventEmitter } from 'events';

export type LiveEventType =
  | 'init'
  | 'ping'
  | 'option_created'
  | 'option_decision'
  | 'qr_uploaded'
  | 'qr_cleared'
  | 'stage_changed'
  | 'location_updated'
  | 'session_refresh';

export interface LiveSessionEvent {
  slotKey: string;
  type: LiveEventType;
  payload?: Record<string, unknown> | null;
  timestamp: number;
}

// Global singleton to persist across Next.js API route invocations in the Node process
declare global {
  // eslint-disable-next-line no-var
  var __visasraLiveEventBus: EventEmitter | undefined;
}

function getEventBus(): EventEmitter {
  if (!globalThis.__visasraLiveEventBus) {
    const bus = new EventEmitter();
    // Allow unlimited active listeners for concurrent live shopping sessions
    bus.setMaxListeners(0);
    globalThis.__visasraLiveEventBus = bus;
  }
  return globalThis.__visasraLiveEventBus;
}

export const liveEventBus = getEventBus();

/**
 * Broadcast an event to all connected SSE clients for a given slotKey
 */
export function broadcastLiveEvent(
  slotKey: string,
  type: LiveEventType,
  payload?: Record<string, unknown> | null
) {
  const decodedKey = decodeURIComponent(slotKey);
  const event: LiveSessionEvent = {
    slotKey: decodedKey,
    type,
    payload: payload || null,
    timestamp: Date.now(),
  };
  liveEventBus.emit(`live:${decodedKey}`, event);
  liveEventBus.emit('live:*', event);
}

/**
 * Subscribe to real-time events for a specific slotKey
 */
export function subscribeLiveEvent(
  slotKey: string,
  listener: (event: LiveSessionEvent) => void
): () => void {
  const decodedKey = decodeURIComponent(slotKey);
  const channel = `live:${decodedKey}`;
  liveEventBus.on(channel, listener);
  return () => {
    liveEventBus.off(channel, listener);
  };
}
