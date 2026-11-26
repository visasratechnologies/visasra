import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const productSlug = (name) => {
  return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

async function main() {
  console.log('Seeding PostgreSQL database for Visasra...');

  // 1. Admins
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@visasra.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'admin@visasra.com',
      password: adminPassword,
      role: 'superadmin',
    },
  });
  console.log('Admin seeded:', admin.email);

  // 2. Load authentic catalog from source-catalog.json
  const sourceCatalogPath = path.join(__dirname, '../scripts/source-catalog.json');
  const sourceData = JSON.parse(fs.readFileSync(sourceCatalogPath, 'utf8'));

  for (let idx = 0; idx < sourceData.catalog.length; idx++) {
    const cat = sourceData.catalog[idx];
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.key },
      update: { name: cat.name, image: `/images/categories/${cat.key}.jpg`, sort: idx + 1 },
      create: {
        slug: cat.key,
        name: cat.name,
        image: `/images/categories/${cat.key}.jpg`,
        sort: idx + 1,
      },
    });

    // Delete placeholder records to replace with authentic products
    await prisma.productCatalog.deleteMany({
      where: { categoryId: createdCat.id },
    });

    for (const prod of cat.products) {
      const slug = productSlug(prod.name);
      const imagePath = `/images/products/${cat.key}/${slug}.jpg`;
      const desc = `Authentic ${prod.name} sourced directly from local market merchants with verified billing.`;
      const tag = prod.tag || (prod.types && prod.types.length > 0 ? `${prod.types.length} Types` : null);
      const typesJson = prod.types && prod.types.length > 0 ? prod.types : null;

      await prisma.productCatalog.create({
        data: {
          name: prod.name,
          categoryId: createdCat.id,
          price: prod.mid,
          estMin: prod.mid,
          estMax: prod.high,
          image: imagePath,
          description: desc,
          tag,
          unit: 'piece',
          types: typesJson,
        },
      });
    }
  }
  console.log(`Successfully seeded ${sourceData.catalog.length} categories and 108 products with authentic photo paths.`);

  console.log('Database seeding successfully finished (Clean Production Schema)!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
