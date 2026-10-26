import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/source-catalog.json', 'utf8'));

function productSlug(name) {
  return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const exts = ['jpg', 'jpeg', 'png', 'webp'];

function findProductFile(catKey, prodName) {
  const cleanCat = productSlug(catKey);
  const cleanProd = productSlug(prodName);
  for (const ext of exts) {
    const rel = `public/images/products/${cleanCat}/${cleanProd}.${ext}`;
    if (fs.existsSync(rel)) return rel;
  }
  return null;
}

function findTypeFile(catKey, prodName, typeName) {
  const cleanCat = productSlug(catKey);
  const cleanProd = productSlug(prodName);
  const cleanType = productSlug(typeName);
  for (const ext of exts) {
    const rel = `public/images/products/${cleanCat}/${cleanProd}/${cleanType}.${ext}`;
    if (fs.existsSync(rel)) return rel;
  }
  return null;
}

function findCategoryBanner(catKey) {
  const cleanCat = productSlug(catKey);
  for (const ext of exts) {
    const rel = `public/images/categories/${cleanCat}.${ext}`;
    if (fs.existsSync(rel)) return rel;
  }
  return null;
}

console.log('=== Checking Categories ===');
for (const cat of data.categories) {
  const banner = findCategoryBanner(cat.key);
  console.log(`Category [${cat.key}]: ${banner ? 'FOUND (' + banner + ')' : 'MISSING!'}`);
}

let foundProds = 0, missingProds = [];
let foundTypes = 0, missingTypes = [];

for (const c of data.catalog) {
  for (const p of c.products) {
    const pFile = findProductFile(c.key, p.name);
    if (pFile) {
      foundProds++;
    } else {
      missingProds.push(`${c.key} -> ${p.name}`);
    }

    if (p.types) {
      for (const t of p.types) {
        const tFile = findTypeFile(c.key, p.name, t.name);
        if (tFile) {
          foundTypes++;
        } else {
          missingTypes.push(`${c.key} -> ${p.name} -> ${t.name}`);
        }
      }
    }
  }
}

console.log(`\nProducts: ${foundProds} found, ${missingProds.length} missing.`);
if (missingProds.length > 0) {
  console.log('Missing products sample:', missingProds.slice(0, 10));
}

console.log(`\nTypes: ${foundTypes} found, ${missingTypes.length} missing.`);
if (missingTypes.length > 0) {
  console.log('Missing types sample:', missingTypes.slice(0, 10));
}
