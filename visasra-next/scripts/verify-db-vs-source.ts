import fs from 'fs';
import { prisma } from '../src/lib/prisma';

async function main() {
  const src = JSON.parse(fs.readFileSync('scripts/source-catalog.json', 'utf8'));
  const dbCats = await prisma.category.findMany({ include: { products: true } });

  console.log(`DB has ${dbCats.length} categories, Source has ${src.categories.length}`);
  
  let mismatches = 0;
  for (const srcCat of src.categories) {
    const dbCat = dbCats.find(c => c.slug === srcCat.key);
    if (!dbCat) {
      console.log(`[MISMATCH] Category missing in DB: ${srcCat.key}`);
      mismatches++;
      continue;
    }

    const srcCatalogItem = src.catalog.find((c: any) => c.key === srcCat.key);
    if (!srcCatalogItem) continue;

    for (const srcProd of srcCatalogItem.products) {
      const dbProd = dbCat.products.find(p => p.name === srcProd.name);
      if (!dbProd) {
        console.log(`[MISMATCH] Product missing in DB: ${srcCat.key} -> ${srcProd.name}`);
        mismatches++;
      } else {
        // Check price & types
        if (dbProd.estMin !== srcProd.mid || dbProd.estMax !== srcProd.high) {
          console.log(`[PRICE MISMATCH] ${srcProd.name}: DB(${dbProd.estMin}-${dbProd.estMax}) vs Src(${srcProd.mid}-${srcProd.high})`);
          mismatches++;
        }
        const dbTypes = (dbProd.types as any[]) || [];
        const srcTypes = srcProd.types || [];
        if (dbTypes.length !== srcTypes.length) {
          console.log(`[TYPES COUNT MISMATCH] ${srcProd.name}: DB(${dbTypes.length}) vs Src(${srcTypes.length})`);
          mismatches++;
        }
      }
    }
  }

  console.log(`Total catalog mismatches: ${mismatches}`);
}

main().finally(() => prisma.$disconnect());
