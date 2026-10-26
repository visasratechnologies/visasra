import { prisma } from '../src/lib/prisma';

async function testCatalogApi() {
  console.log('--- Testing Catalog & Category Relations in PostgreSQL ---');
  
  const categories = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
    include: {
      products: true,
    },
  });

  console.log(`Fetched ${categories.length} categories.`);
  let totalProducts = 0;
  let totalTypes = 0;

  for (const cat of categories) {
    const prodCount = cat.products.length;
    totalProducts += prodCount;
    let catTypes = 0;
    cat.products.forEach(p => {
      if (p.types && Array.isArray(p.types)) {
        catTypes += p.types.length;
        totalTypes += p.types.length;
      }
    });
    console.log(`- [${cat.slug}] "${cat.name}": ${prodCount} products, ${catTypes} sub-type varieties`);
  }

  console.log(`\nTOTALS:`);
  console.log(`Total Categories: ${categories.length}`);
  console.log(`Total Products: ${totalProducts}`);
  console.log(`Total Sub-type Varieties: ${totalTypes}`);

  if (categories.length === 10 && totalProducts === 108 && totalTypes === 72) {
    console.log('\n[PASS] Catalog data in PostgreSQL is 100% complete and fully linked.');
  } else {
    console.error('\n[WARN] Catalog count mismatch:', { categories: categories.length, totalProducts, totalTypes });
  }
}

testCatalogApi()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
