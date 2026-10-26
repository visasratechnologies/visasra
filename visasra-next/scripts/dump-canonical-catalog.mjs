import fs from 'fs';

const srcData = JSON.parse(fs.readFileSync('scripts/source-catalog.json', 'utf8'));

console.log('--- Canonical Source Catalog ---');
console.log('Categories:', srcData.categories.map(c => ({ key: c.key, name: c.name, desc: c.desc, accent: c.accent })));

console.log('\n--- Canonical Products per Category ---');
srcData.catalog.forEach(c => {
  console.log(`\nCategory: ${c.key} (${c.products.length} products)`);
  c.products.forEach(p => {
    const typesCount = p.types ? p.types.length : 0;
    console.log(`  - ${p.name}: ₹${p.mid} - ₹${p.high} ${typesCount > 0 ? `(${typesCount} types: ${p.types.map(t => t.name).join(', ')})` : ''}`);
  });
});
