import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Parse .env manually
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
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, image: true },
    orderBy: { sort: 'asc' }
  });
  console.log(`=== Database Categories (${categories.length}) ===`);
  for (const c of categories) {
    console.log(`Cat [${c.slug}]: ${c.name} -> image: "${c.image}"`);
  }

  const products = await prisma.productCatalog.findMany({
    take: 20,
    select: { id: true, name: true, categoryId: true, image: true, estMin: true, estMax: true }
  });
  console.log(`\n=== Sample Database Products (first 20) ===`);
  for (const p of products) {
    console.log(`Prod: "${p.name}" -> image: "${p.image}" | range: "₹${p.estMin} - ₹${p.estMax}"`);
  }

  // Count products where image is null or placeholder
  const nullImages = await prisma.productCatalog.count({
    where: { OR: [{ image: null }, { image: '' }] }
  });
  console.log(`\nProducts with NULL or empty image: ${nullImages}`);

  // Count total products
  const total = await prisma.productCatalog.count();
  console.log(`Total products in DB: ${total}`);

  // Group by distinct images to see duplicates
  const allProds = await prisma.productCatalog.findMany({ select: { name: true, image: true } });
  const imgMap = new Map();
  for (const p of allProds) {
    if (!p.image) continue;
    if (!imgMap.has(p.image)) imgMap.set(p.image, []);
    imgMap.get(p.image).push(p.name);
  }

  console.log(`\nDistinct image URLs: ${imgMap.size}`);
  let duplicateCount = 0;
  for (const [img, names] of imgMap.entries()) {
    if (names.length > 1) {
      duplicateCount++;
      if (duplicateCount <= 10) {
        console.log(`Duplicate image "${img}" shared by: ${names.join(', ')}`);
      }
    }
  }
  console.log(`Total images shared by multiple products: ${duplicateCount}`);
}

main().finally(() => prisma.$disconnect());
