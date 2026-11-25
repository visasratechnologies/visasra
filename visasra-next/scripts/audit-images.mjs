import fs from 'fs';
import path from 'path';

const catalogPath = path.resolve('scripts/source-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const productSlug = (item) => {
  const name = typeof item === 'string' ? item : (item?.name || String(item || ''));
  return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

let totalCategories = catalog.catalog.length;
let totalProducts = 0;
let missingCategoryImages = [];
let existingProductImages = 0;
let missingProductImages = [];
let existingTypeImages = 0;
let missingTypeImages = [];

for (const cat of catalog.catalog) {
  const catImg = path.resolve(`public/images/categories/${cat.key}.jpg`);
  if (!fs.existsSync(catImg)) {
    missingCategoryImages.push(`/images/categories/${cat.key}.jpg`);
  }

  for (const prod of cat.products) {
    totalProducts++;
    const slug = productSlug(prod.name);
    const prodImg = path.resolve(`public/images/products/${cat.key}/${slug}.jpg`);
    
    // Check if jpg, png, webp, jpeg exist
    const baseDir = path.resolve(`public/images/products/${cat.key}`);
    const exists = fs.existsSync(prodImg) ||
                   fs.existsSync(path.resolve(baseDir, `${slug}.png`)) ||
                   fs.existsSync(path.resolve(baseDir, `${slug}.webp`)) ||
                   fs.existsSync(path.resolve(baseDir, `${slug}.jpeg`));
    
    if (exists) {
      existingProductImages++;
    } else {
      missingProductImages.push({ category: cat.key, name: prod.name, expected: `${slug}.jpg` });
    }

    if (prod.types && prod.types.length > 0) {
      for (const t of prod.types) {
        const tSlug = productSlug(t);
        const typeImg = path.resolve(`public/images/products/${cat.key}/${slug}/${tSlug}.jpg`);
        const typeExists = fs.existsSync(typeImg) ||
                           fs.existsSync(path.resolve(`public/images/products/${cat.key}/${slug}/${tSlug}.png`)) ||
                           fs.existsSync(path.resolve(`public/images/products/${cat.key}/${slug}/${tSlug}.webp`));
        if (typeExists) {
          existingTypeImages++;
        } else {
          missingTypeImages.push({ category: cat.key, product: prod.name, type: t, expected: `${slug}/${tSlug}.jpg` });
        }
      }
    }
  }
}

console.log('=== Image Audit Results ===');
console.log(`Total Categories: ${totalCategories}`);
console.log(`Missing Category Images: ${missingCategoryImages.length}`);
if (missingCategoryImages.length > 0) {
  console.log('Missing Category Images:', missingCategoryImages);
}

console.log(`\nTotal Products: ${totalProducts}`);
console.log(`Existing Product Images: ${existingProductImages}`);
console.log(`Missing Product Images: ${missingProductImages.length}`);
if (missingProductImages.length > 0) {
  console.log('First 15 missing product images:', missingProductImages.slice(0, 15));
}

console.log(`\nTotal Types Missing Images: ${missingTypeImages.length}`);
