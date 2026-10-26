import fs from 'fs';
import vm from 'vm';

const content = fs.readFileSync('D:/visasra-suite24/visasra-app/app.js', 'utf8');
const catIdx = content.indexOf('const PRODUCT_CATALOG = [');
const mainCatEnd = content.indexOf('function categoryProductCount');

console.log('catIdx:', catIdx, 'mainCatEnd:', mainCatEnd);
const code = content.slice(catIdx, mainCatEnd);

// Wrap variables to be accessible
const context = {};
try {
  vm.runInNewContext(code.replace(/const /g, 'globalThis.'), context);
  console.log('PRODUCT_CATALOG length:', context.PRODUCT_CATALOG?.length);
  console.log('MAIN_CATEGORIES length:', context.MAIN_CATEGORIES?.length);
  
  let totalProds = 0, totalTypes = 0;
  context.PRODUCT_CATALOG.forEach((c) => {
    totalProds += c.products.length;
    c.products.forEach((p) => {
      if (p.types) totalTypes += p.types.length;
    });
  });
  console.log('Total products:', totalProds, 'Total types:', totalTypes);
  
  // Write out the exact JSON for inspection
  fs.writeFileSync('scripts/source-catalog.json', JSON.stringify({
    categories: context.MAIN_CATEGORIES,
    catalog: context.PRODUCT_CATALOG
  }, null, 2));
  console.log('Wrote scripts/source-catalog.json successfully');
} catch (err) {
  console.error('Error running code:', err);
}
