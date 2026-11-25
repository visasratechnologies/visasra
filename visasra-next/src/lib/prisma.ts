import { PrismaClient } from '@prisma/client';

function resolveDatabaseUrl(): string {
  let envUrl = process.env.DATABASE_URL;
  if (!envUrl) {
    throw new Error('DATABASE_URL environment variable is missing. Check your .env configuration.');
  }

  // Supabase PgBouncer (transaction pooler on port 6543) requires disciplined connection limits
  // to avoid pool exhaustion, queue starvation, and 30-50s request timeouts.
  envUrl = envUrl.replace(/connection_limit=\d+/, 'connection_limit=5');
  envUrl = envUrl.replace(/pool_timeout=\d+/, 'pool_timeout=10');

  if (!envUrl.includes('connection_limit=')) {
    const sep = envUrl.includes('?') ? '&' : '?';
    envUrl = `${envUrl}${sep}connection_limit=5&pool_timeout=10`;
  }
  if (!envUrl.includes('connect_timeout=')) {
    const sep = envUrl.includes('?') ? '&' : '?';
    envUrl = `${envUrl}${sep}connect_timeout=10`;
  }
  return envUrl;
}

const activeUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = activeUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConfiguredUrl: string | undefined;
};

// Force purge any old cached Prisma client connected to a previous URL
if (globalForPrisma.prisma && globalForPrisma.prismaConfiguredUrl !== activeUrl) {
  try {
    globalForPrisma.prisma.$disconnect();
  } catch {}
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeUrl,
      },
    },
    log: ['error', 'warn'],
  });

globalForPrisma.prisma = prisma;
globalForPrisma.prismaConfiguredUrl = activeUrl;
