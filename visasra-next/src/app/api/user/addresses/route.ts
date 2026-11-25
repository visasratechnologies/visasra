import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ success: true, addresses: [] });
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId: authUser.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, addresses });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch addresses';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { name, label, phone, line1, line2, city, region, zip, country, isDefault } = body;

    if (!name || !line1 || !city || !zip) {
      return NextResponse.json({ error: 'Name, street address, city, and postal code are required' }, { status: 400 });
    }

    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: authUser.id },
        data: { isDefault: false },
      });
    }

    const addr = await prisma.userAddress.create({
      data: {
        userId: authUser.id,
        name: name.trim(),
        label: label ? label.trim() : 'Home',
        phone: phone ? phone.trim() : null,
        line1: line1.trim(),
        line2: line2 ? line2.trim() : null,
        city: city.trim(),
        region: region ? region.trim() : null,
        zip: zip.trim(),
        country: country || 'India',
        isDefault: Boolean(isDefault),
      },
    });

    return NextResponse.json({ success: true, address: addr });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save address';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, label, phone, line1, line2, city, region, zip, country, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    // Verify ownership before modifying
    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: authUser.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 404 });
    }

    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: authUser.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.userAddress.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(label ? { label: label.trim() } : {}),
        ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
        ...(line1 ? { line1: line1.trim() } : {}),
        ...(line2 !== undefined ? { line2: line2 ? line2.trim() : null } : {}),
        ...(city ? { city: city.trim() } : {}),
        ...(region !== undefined ? { region: region ? region.trim() : null } : {}),
        ...(zip ? { zip: zip.trim() } : {}),
        ...(country ? { country: country.trim() } : {}),
        ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
      },
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update address';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 });

    // Enforce strict user ownership on deletion (IDOR protection)
    const result = await prisma.userAddress.deleteMany({
      where: {
        id,
        userId: authUser.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Address not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete address';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
