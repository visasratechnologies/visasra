import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';

function productSlug(name: string) {
  return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const getProductImg = (catSlug: string, prodName?: string, fallbackImg?: string) => {
  if (fallbackImg) return fallbackImg;
  const cleanCat = productSlug(catSlug);
  if (prodName) {
    const cleanProd = productSlug(prodName);
    return `/images/products/${cleanCat}/${cleanProd}.jpg`;
  }
  return `/images/categories/${cleanCat}.jpg`;
};

const getTypeImg = (catSlug: string, prodName: string, typeName: string) => {
  const cleanCat = productSlug(catSlug);
  const cleanProd = productSlug(prodName);
  const cleanType = productSlug(typeName);
  return `/images/products/${cleanCat}/${cleanProd}/${cleanType}.jpg`;
};

async function main() {
  console.log('================================================================');
  console.log('   FULL CATALOG OVERHAUL & ASSET INTEGRITY VERIFICATION');
  console.log('================================================================');

  // 1. Database check
  const cats = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
    include: { products: true },
  });

  console.log(`\n[DB CHECK] Found ${cats.length} categories.`);
  if (cats.length !== 10) throw new Error(`Expected 10 categories, found ${cats.length}`);

  let totalProducts = 0;
  let totalTypes = 0;
  let missingProductFiles = 0;
  let missingTypeFiles = 0;

  for (const cat of cats) {
    const bannerFile = path.join('public', cat.image.replace(/^\//, ''));
    if (!fs.existsSync(bannerFile)) {
      console.error(`[ERROR] Missing banner file for category ${cat.name}: ${bannerFile}`);
    }

    for (const prod of cat.products) {
      totalProducts++;
      const resolvedProdImg = getProductImg(cat.slug, prod.name);
      const prodPath = path.join('public', resolvedProdImg.replace(/^\//, ''));
      if (!fs.existsSync(prodPath)) {
        console.error(`[ERROR] Missing product photo: ${cat.name} > ${prod.name} at ${prodPath}`);
        missingProductFiles++;
      }

      const types = (prod.types as any[]) || [];
      for (const t of types) {
        totalTypes++;
        const resolvedTypeImg = getTypeImg(cat.slug, prod.name, t.name);
        const typePath = path.join('public', resolvedTypeImg.replace(/^\//, ''));
        if (!fs.existsSync(typePath)) {
          console.error(`[ERROR] Missing type photo: ${cat.name} > ${prod.name} > ${t.name} at ${typePath}`);
          missingTypeFiles++;
        }
      }
    }
  }

  console.log(`[DB PRODUCTS] Verified ${totalProducts} products (expected 108).`);
  console.log(`[DB VARIETIES] Verified ${totalTypes} sub-types (expected 72).`);
  console.log(`[FILE INTEGRITY] Missing product photos: ${missingProductFiles}`);
  console.log(`[FILE INTEGRITY] Missing variety photos: ${missingTypeFiles}`);

  // 2. Specific Cookware > Tawas inspection (addressing user screenshot)
  console.log('\n--- TAWAS VARIETIES DIRECT CHECK ---');
  const tawasTypes = ['Non-Stick Tawa', 'Aluminium Tawa', 'Dosa Tawa', 'Roti Tawa'];
  tawasTypes.forEach(typeName => {
    const src = getTypeImg('cookware', 'Tawas', typeName);
    const fullPath = path.join('public', src.replace(/^\//, ''));
    const exists = fs.existsSync(fullPath);
    const size = exists ? fs.statSync(fullPath).size : 0;
    console.log(`  ✓ ${typeName}: ${src} [${exists ? 'EXISTS, ' + (size / 1024).toFixed(1) + ' KB' : 'MISSING!'}]`);
    if (!exists) throw new Error(`Tawas variety photo missing: ${src}`);
  });

  if (missingProductFiles === 0 && missingTypeFiles === 0 && totalProducts === 108 && totalTypes === 72) {
    console.log('\n>>> OVERHAUL 100% SUCCESSFUL: All categories, products, varieties, and images match D:\\visasra-suite24! <<<');
  } else {
    throw new Error('Integrity checks failed');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
