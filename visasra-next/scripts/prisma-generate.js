const { execSync } = require('child_process');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not set in environment; ensure .env is configured');
}

try {
  console.log('⚡ Generating Prisma Client with validated pooler URL...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env, shell: true });
  console.log('✅ Prisma Client generated successfully.');
} catch (err) {
  console.error('❌ Error during prisma generate:', err.message);
  process.exit(1);
}
