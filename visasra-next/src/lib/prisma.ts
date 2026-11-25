import { PrismaClient } from '@prisma/client';

function resolveDatabaseUrl(): string {
  let envUrl = process.env.DATABASE_URL;
  if (!envUrl) {
    throw new Error('DATABASE_URL environment variable is missing. Check your .env configuration.');
  }

  // Ensure connection pooling parameters are attached for high-concurrency serverless environments
  if (!envUrl.includes('connection_limit=')) {
    const sep = envUrl.includes('?') ? '&' : '?';
    envUrl = `${envUrl}${sep}connection_limit=25&pool_timeout=30`;
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
