import { PrismaClient } from '@prisma/client';

const fallbackUrl = "postgresql://postgres.xdjqsoveqzmrrbooxkpn:visasra123*@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('db.xdjqsoveqzmrrbooxkpn.supabase.co')) {
  process.env.DATABASE_URL = fallbackUrl;
}
if (!process.env.DIRECT_URL || process.env.DIRECT_URL.includes('db.xdjqsoveqzmrrbooxkpn.supabase.co')) {
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

