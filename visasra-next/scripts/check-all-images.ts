import fs from 'fs';
import { prisma } from '../src/lib/prisma';

function productSlug(name: string) {
  return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  const cats = await prisma.category.findMany({
    include: { products: true }
  });

  console.log(`Checking images for ${cats.length} categories...`);
  
  let totalProds = 0, prodsFound = 0;
  let totalTypes = 0, typesFound = 0;
  const missingProds: string[] = [];
  const missingTypes: string[] = [];

  for (const cat of cats) {
    const catSlug = productSlug(cat.slug);
    const catImgPath = `public/images/categories/${catSlug}.jpg`;
    if (!fs.existsSync(catImgPath)) {
      console.log(`[CAT BANNER MISSING] ${catImgPath}`);
    }

    for (const prod of cat.products) {
      totalProds++;
      const prodSlug = productSlug(prod.name);
      
      // Check product image
      let pFound = false;
      for (const ext of ['jpg', 'png', 'jpeg', 'webp']) {
        if (fs.existsSync(`public/images/products/${catSlug}/${prodSlug}.${ext}`)) {
          pFound = true;
          break;
        }
      }
      if (pFound) {
        prodsFound++;
      } else {
        missingProds.push(`${cat.slug}/${prod.name} -> expected public/images/products/${catSlug}/${prodSlug}.jpg`);
      }

      // Check types
      const types = (prod.types as any[]) || [];
      for (const t of types) {
        totalTypes++;
        const tSlug = productSlug(t.name);
        let tFound = false;
        for (const ext of ['jpg', 'png', 'jpeg', 'webp']) {
          if (fs.existsSync(`public/images/products/${catSlug}/${prodSlug}/${tSlug}.${ext}`)) {
            tFound = true;
            break;
          }
        }
        if (tFound) {
          typesFound++;
        } else {
          missingTypes.push(`${cat.slug}/${prod.name}/${t.name} -> expected public/images/products/${catSlug}/${prodSlug}/${tSlug}.jpg`);
        }
      }
    }
  }

  console.log(`\nResults:`);
  console.log(`Products: ${prodsFound} / ${totalProds} images found on disk.`);
  if (missingProds.length) console.log('Missing products:', missingProds);
  console.log(`Types: ${typesFound} / ${totalTypes} images found on disk.`);
  if (missingTypes.length) console.log('Missing types:', missingTypes);
}

main().finally(() => prisma.$disconnect());
