import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getUserFromRequest } from '@/lib/session';

interface IncomingCartItem {
  id?: string;
  productId?: string;
  name: string;
  qty?: number;
  priceMin?: number;
  priceMax?: number;
  image?: string;
  images?: string[];
  notes?: string;
  sourceType?: string;
  sourceUrl?: string;
  categoryName?: string;
}

// Helper to format CartItem for the frontend
function formatCartItem(it: {
  id: string;
  productId: string | null;
  name: string;
  qty: number;
  priceMin: number;
  priceMax: number;
  image: string | null;
  images: unknown;
  notes: string | null;
  sourceType: string;
  sourceUrl: string | null;
  categoryName: string | null;
}) {
  let parsedImages: string[] | undefined = undefined;
  if (Array.isArray(it.images)) {
    parsedImages = it.images as string[];
  } else if (typeof it.images === 'string') {
    try {
      parsedImages = JSON.parse(it.images);
    } catch {}
  }

  return {
    id: it.id,
    productId: it.productId || undefined,
    name: it.name,
    qty: it.qty,
    priceMin: it.priceMin,
    priceMax: it.priceMax,
    image: it.image || undefined,
    images: parsedImages,
    notes: it.notes || undefined,
    sourceType: it.sourceType,
    sourceUrl: it.sourceUrl || undefined,
    categoryName: it.categoryName || undefined,
  };
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: true, items: [] });
    }

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const items = cart.items.map(formatCartItem);
    return NextResponse.json({ success: true, items, cartId: cart.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch cart';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let user = await getUserFromRequest(req);

    if (!user && (body.userId || body.email)) {
      if (body.userId) {
        user = await prisma.user.findUnique({
          where: { id: body.userId },
        });
      }
      if (!user && body.email) {
        user = await prisma.user.findUnique({
          where: { email: String(body.email).toLowerCase().trim() },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User must be authenticated to persist cart to database' }, { status: 401 });
    }

    const { action, items, item } = body;

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
      include: { items: true },
    });

    // 1. Merge an array of guest items into the user's DB cart upon login
    if (action === 'merge' && Array.isArray(items)) {
      for (const raw of items as IncomingCartItem[]) {
        if (!raw.name) continue;

        // Check if an item already exists with matching name & sourceType or matching productId
        const existing = cart.items.find(
          (i) =>
            (raw.productId && i.productId === raw.productId) ||
            (i.name.toLowerCase() === raw.name.toLowerCase() && i.sourceType === (raw.sourceType || 'catalog'))
        );

        if (existing) {
          await prisma.cartItem.update({
            where: { id: existing.id },
            data: {
              qty: existing.qty + (raw.qty || 1),
              notes: raw.notes ? `${existing.notes || ''} ${raw.notes}`.trim() : existing.notes,
            },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: raw.productId || null,
              name: raw.name.trim(),
              qty: Math.max(1, raw.qty || 1),
              priceMin: Number(raw.priceMin) || 0,
              priceMax: Number(raw.priceMax) || Number(raw.priceMin) || 1000,
              image: raw.image || null,
              images: raw.images && raw.images.length > 0 ? (raw.images as unknown as object) : undefined,
              notes: raw.notes?.trim() || null,
              sourceType: raw.sourceType || 'catalog',
              sourceUrl: raw.sourceUrl?.trim() || null,
              categoryName: raw.categoryName?.trim() || null,
            },
          });
        }
      }
    } else if (item && typeof item === 'object') {
      // 2. Add single item
      const raw = item as IncomingCartItem;
      if (!raw.name) {
        return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
      }

      const existing = cart.items.find(
        (i) =>
          (raw.productId && i.productId === raw.productId) ||
          (i.name.toLowerCase() === raw.name.toLowerCase() && i.sourceType === (raw.sourceType || 'catalog'))
      );

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            qty: existing.qty + (raw.qty || 1),
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: raw.productId || null,
            name: raw.name.trim(),
            qty: Math.max(1, raw.qty || 1),
            priceMin: Number(raw.priceMin) || 0,
            priceMax: Number(raw.priceMax) || Number(raw.priceMin) || 1000,
            image: raw.image || null,
            images: raw.images && raw.images.length > 0 ? (raw.images as unknown as object) : undefined,
            notes: raw.notes?.trim() || null,
            sourceType: raw.sourceType || 'catalog',
            sourceUrl: raw.sourceUrl?.trim() || null,
            categoryName: raw.categoryName?.trim() || null,
          },
        });
      }
    }

    // Return fresh list of all cart items
    const freshCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const formatted = (freshCart?.items || []).map(formatCartItem);
    return NextResponse.json({ success: true, items: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update cart';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let user = await getUserFromRequest(req);

    if (!user && (body.userId || body.email)) {
      if (body.userId) {
        user = await prisma.user.findUnique({ where: { id: body.userId } });
      }
      if (!user && body.email) {
        user = await prisma.user.findUnique({ where: { email: String(body.email).toLowerCase().trim() } });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id, qty, notes, priceMin, priceMax, name, image, images } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // If quantity is set to 0 or below, remove item
    if (typeof qty === 'number' && qty <= 0) {
      await prisma.cartItem.deleteMany({
        where: { id, cartId: cart.id },
      });
    } else {
      const updateData: {
        qty?: number;
        notes?: string | null;
        priceMin?: number;
        priceMax?: number;
        name?: string;
        image?: string | null;
        images?: Prisma.InputJsonValue;
      } = {};

      if (typeof qty === 'number') updateData.qty = qty;
      if (typeof notes === 'string') updateData.notes = notes.trim() || null;
      if (typeof priceMin === 'number') updateData.priceMin = priceMin;
      if (typeof priceMax === 'number') updateData.priceMax = priceMax;
      if (typeof name === 'string' && name.trim()) updateData.name = name.trim();
      if (typeof image === 'string') updateData.image = image.trim() || null;
      if (Array.isArray(images)) updateData.images = images as unknown as Prisma.InputJsonValue;

      await prisma.cartItem.updateMany({
        where: { id, cartId: cart.id },
        data: updateData,
      });
    }

    const freshCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const formatted = (freshCart?.items || []).map(formatCartItem);
    return NextResponse.json({ success: true, items: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to modify cart item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let user = await getUserFromRequest(req);

    if (!user) {
      const email = searchParams.get('email');
      const userId = searchParams.get('userId');
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } });
      }
      if (!user && email) {
        user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      return NextResponse.json({ success: true, items: [] });
    }

    if (clearAll) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    } else if (id) {
      await prisma.cartItem.deleteMany({
        where: { id, cartId: cart.id },
      });
    }

    const freshCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const formatted = (freshCart?.items || []).map(formatCartItem);
    return NextResponse.json({ success: true, items: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete from cart';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
