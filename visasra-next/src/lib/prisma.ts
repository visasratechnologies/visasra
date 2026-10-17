import { PrismaClient } from '@prisma/client';

const fallbackUrl = "postgresql://postgres:visasra123*@db.xdjqsoveqzmrrbooxkpn.supabase.co:5432/postgres";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = fallbackUrl;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = fallbackUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || fallbackUrl,
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

