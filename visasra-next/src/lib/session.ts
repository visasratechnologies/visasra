import { prisma } from './prisma';

export interface SessionInfo {
  token: string;
  expiresAt: Date;
}

/**
 * Creates an authoritative database-backed session for a user and updates their lastLoginAt timestamp.
 */
export async function createSession(userId: string, req?: Request): Promise<SessionInfo> {
  const token = `cs_${crypto.randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  let userAgent: string | null = null;
  let ipAddress: string | null = null;

  if (req) {
    try {
      userAgent = req.headers.get('user-agent') || null;
      ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    } catch {
      // Ignore header parsing errors in non-standard request environments
    }
  }

  // Record session and update user's last login in PostgreSQL
  await Promise.all([
    prisma.userSession.create({
      data: {
        userId,
        token,
        userAgent,
        ipAddress,
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    }),
    // Ensure the user has an initialized Cart row
    prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
  ]);

  return { token, expiresAt };
}

/**
 * Validates a session token against PostgreSQL and returns the associated User if valid and not expired.
 */
export async function validateSession(token: string) {
  if (!token || !token.trim()) return null;

  const session = await prisma.userSession.findUnique({
    where: { token: token.trim() },
    include: {
      user: {
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
      },
    },
  });

  if (!session) return null;

  // Check if session has expired
  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    // Session expired; remove it asynchronously
    prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Update lastActiveAt periodically (if older than 5 minutes)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (session.lastActiveAt < fiveMinAgo) {
    prisma.userSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});
  }

  return session.user;
}

/**
 * Resolves the authenticated user from a Request by inspecting Authorization header,
 * or fallback search parameters / request body identifiers.
 */
export async function getUserFromRequest(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const user = await validateSession(token);
      if (user) return user;
    }

    const { searchParams } = new URL(req.url);
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      const user = await validateSession(tokenParam);
      if (user) return user;
    }

    const email = searchParams.get('email');
    if (email) {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
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
    }

    const userId = searchParams.get('userId');
    if (userId) {
      return await prisma.user.findUnique({
        where: { id: userId },
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
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Destroys a session on logout.
 */
export async function destroySession(token: string) {
  if (!token) return false;
  try {
    await prisma.userSession.deleteMany({
      where: { token: token.trim() },
    });
    return true;
  } catch {
    return false;
  }
}
