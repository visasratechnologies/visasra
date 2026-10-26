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
  const cats = await prisma.category.findMany({ include: { products: true } });
  let count = 0, passed = 0;
  const failed: string[] = [];

  for (const c of cats) {
    for (const p of c.products) {
      const types = (p.types as any[]) || [];
      for (const t of types) {
        count++;
        const resolved = getTypeImg(c.slug, p.name, t.name);
        const onDisk = 'public' + resolved;
        if (fs.existsSync(onDisk)) {
          passed++;
        } else {
          failed.push(`DB: [${c.slug}] [${p.name}] [${t.name}] -> Resolved: ${resolved}`);
        }
      }
    }
  }

  console.log(`Total types checked: ${count}`);
  console.log(`Successfully verified on disk: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.error('Failed types:', failed);
  }
}

main().finally(() => prisma.$disconnect());
