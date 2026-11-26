import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getUserFromRequest } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized or session expired' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized or session expired' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, location, avatar, currentPassword, newPassword } = body;

    const updateData: {
      name?: string;
      email?: string;
      phone?: string | null;
      location?: string | null;
      avatar?: string | null;
      password?: string;
    } = {};

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof email === 'string' && email.trim()) {
      const emailNormalized = email.trim().toLowerCase();
      if (emailNormalized !== user.email?.toLowerCase()) {
        const existing = await prisma.user.findUnique({ where: { email: emailNormalized } });
        if (existing && existing.id !== user.id) {
          return NextResponse.json({ error: 'This email is already in use by another account' }, { status: 400 });
        }
        updateData.email = emailNormalized;
      }
    }

    if (typeof phone === 'string') {
      updateData.phone = phone.trim() || null;
    }

    if (typeof location === 'string') {
      updateData.location = location.trim() || null;
    }

    if (typeof avatar === 'string') {
      updateData.avatar = avatar.trim() || null;
    }

    // Optional password update
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      // Fetch user's existing password hash
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isValid = await bcrypt.compare(currentPassword, dbUser.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password does not match' }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        avatar: true,
        walletBalance: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
