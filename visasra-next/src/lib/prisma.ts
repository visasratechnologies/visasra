import { PrismaClient } from '@prisma/client';

const POOLER_TRANSACTION_URL =
  "postgresql://postgres.xdjqsoveqzmrrbooxkpn:visasra123*@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const POOLER_SESSION_URL =
  "postgresql://postgres.xdjqsoveqzmrrbooxkpn:visasra123*@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  // If empty or pointing to the legacy IPv6 direct endpoint that fails on IPv4 networks
  if (!envUrl || envUrl.includes('db.xdjqsoveqzmrrbooxkpn.supabase.co')) {
    return POOLER_TRANSACTION_URL;
  }
  return envUrl;
}

const activeUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = activeUrl;
process.env.DIRECT_URL = POOLER_SESSION_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConfiguredUrl: string | undefined;
};

// Force purge any old cached Prisma client connected to the old IPv6 host
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


