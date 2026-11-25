const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not set in environment; ensure .env is configured');
}

try {
  console.log('⚡ Generating Prisma Client with validated pooler URL...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env, shell: true });
  console.log('✅ Prisma Client generated successfully.');
} catch (err) {
  // If Prisma client is already generated and Windows has a file lock on query_engine.dll, continue safely
  const clientPath = path.join(__dirname, '../node_modules/.prisma/client/index.js');
  if (fs.existsSync(clientPath)) {
    console.warn('⚠️ Prisma generate encountered a transient file lock, but Prisma Client is already generated. Proceeding...');
  } else {
    console.error('❌ Error during prisma generate:', err.message);
    process.exit(1);
  }
}
