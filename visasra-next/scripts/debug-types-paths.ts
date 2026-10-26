import fs from 'fs';
import { prisma } from '../src/lib/prisma';

function productSlug(name: string) {
  return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const getTypeImg = (catSlug: string, prodName: string, typeName: string) => {
  const cleanCat = productSlug(catSlug);
  const cleanProd = productSlug(prodName);
  const cleanType = productSlug(typeName);
  return `/images/products/${cleanCat}/${cleanProd}/${cleanType}.jpg`;
};

async function main() {
  const cat = await prisma.category.findUnique({
    where: { slug: 'cookware' },
    include: { products: true }
  });

  if (!cat) throw new Error('Cookware not found');

  console.log(`Category slug in DB: "${cat.slug}"`);

  // Test Pans
  const pans = cat.products.find(p => p.name === 'Pans');
  console.log(`\nProduct name: "${pans?.name}"`);
  console.log(`Product types:`, (pans?.types as any[]).map(t => t.name));

  (pans?.types as any[]).forEach(t => {
    const src = getTypeImg(cat.slug, pans!.name, t.name);
    const diskPath = 'public' + src;
    const exists = fs.existsSync(diskPath);
    console.log(`  ${t.name} -> ${src} [${exists ? 'EXISTS' : 'MISSING!'}]`);
  });

  // Test Cups & Mugs
  const cups = cat.products.find(p => p.name === 'Cups & Mugs');
  console.log(`\nProduct name: "${cups?.name}"`);
  console.log(`Product types:`, (cups?.types as any[]).map(t => t.name));

  (cups?.types as any[]).forEach(t => {
    const src = getTypeImg(cat.slug, cups!.name, t.name);
    const diskPath = 'public' + src;
    const exists = fs.existsSync(diskPath);
    console.log(`  ${t.name} -> ${src} [${exists ? 'EXISTS' : 'MISSING!'}]`);
  });
}

main().finally(() => prisma.$disconnect());
