const { execSync } = require('child_process');

const poolerUrl = "postgresql://postgres.xdjqsoveqzmrrbooxkpn:visasra123*@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('db.xdjqsoveqzmrrbooxkpn.supabase.co')) {
  process.env.DATABASE_URL = poolerUrl;
}
if (!process.env.DIRECT_URL || process.env.DIRECT_URL.includes('db.xdjqsoveqzmrrbooxkpn.supabase.co')) {
  process.env.DIRECT_URL = "postgresql://postgres.xdjqsoveqzmrrbooxkpn:visasra123*@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";
}

try {
  console.log('⚡ Generating Prisma Client with validated pooler URL...');
  execSync('prisma generate', { stdio: 'inherit', env: process.env });
  console.log('✅ Prisma Client generated successfully.');
} catch (err) {
  console.error('❌ Error during prisma generate:', err.message);
  process.exit(1);
}
