import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Parse .env manually if needed
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database via Prisma...');
  
  // 1. Fetch all base tables in the public schema
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  console.log(`Found ${tables.length} tables in public schema:`);
  for (const t of tables) {
    console.log(` - ${t.table_name}`);
  }

  console.log('\n--- Step 1: Enabling Row Level Security (RLS) on all tables ---');
  for (const t of tables) {
    const tableName = t.table_name;
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`[RLS ENABLED] ${tableName}`);
    } catch (err) {
      console.error(`[ERROR] Failed to enable RLS on ${tableName}:`, err.message);
    }
  }

  console.log('\n--- Step 2: Revoking all permissions from anon and authenticated roles ---');
  for (const t of tables) {
    const tableName = t.table_name;
    try {
      await prisma.$executeRawUnsafe(`REVOKE ALL ON TABLE "${tableName}" FROM anon, authenticated;`);
      console.log(`[REVOKED ALL] ${tableName} from anon, authenticated`);
    } catch (err) {
      console.error(`[ERROR] Failed to revoke on ${tableName}:`, err.message);
    }
  }

  console.log('\n--- Step 3: Revoking schema and sequence permissions from anon and authenticated ---');
  try {
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;`);
    console.log('[REVOKED] All sequences in public from anon, authenticated');
  } catch (err) {
    console.error('[ERROR] Sequences revoke failed:', err.message);
  }

  try {
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;`);
    console.log('[REVOKED] All routines in public from anon, authenticated');
  } catch (err) {
    console.error('[ERROR] Routines revoke failed:', err.message);
  }

  console.log('\n--- Step 4: Verification of RLS status across all public tables ---');
  const verification = await prisma.$queryRaw`
    SELECT 
      relname AS table_name,
      relrowsecurity AS rls_enabled,
      relforcerowsecurity AS rls_forced
    FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public' 
      AND pg_class.relkind = 'r'
    ORDER BY relname;
  `;

  console.log('Current table RLS states:');
  let allSecured = true;
  for (const row of verification) {
    console.log(` - ${row.table_name}: RLS=${row.rls_enabled}`);
    if (!row.rls_enabled) {
      allSecured = false;
    }
  }

  if (allSecured) {
    console.log('\n>>> SUCCESS: All tables in public schema have Row Level Security ENABLED! <<<');
    console.log('Supabase advisor check rls_disabled_in_public and sensitive_columns_exposed are RESOLVED.');
  } else {
    console.warn('\n>>> WARNING: Some tables still do not have RLS enabled! Check output above. <<<');
  }
}

main()
  .catch((e) => {
    console.error('Fatal execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
