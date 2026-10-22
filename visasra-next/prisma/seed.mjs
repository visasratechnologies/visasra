import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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


  // 5. Categories
  const categoriesData = [
    { slug: 'womens-fashion', name: "Women's Fashion", image: '/images/categories/womens-fashion.jpg', sort: 1 },
    { slug: 'mens-fashion', name: "Men's Fashion", image: '/images/categories/mens-fashion.jpg', sort: 2 },
    { slug: 'jewellery-accessories', name: 'Jewellery & Accessories', image: '/images/categories/jewellery-accessories.jpg', sort: 3 },
    { slug: 'pooja-spiritual', name: 'Pooja & Spiritual', image: '/images/categories/pooja-spiritual.jpg', sort: 4 },
    { slug: 'home-decors', name: 'Home Decors', image: '/images/categories/home-decors.jpg', sort: 5 },
    { slug: 'home-furnishing', name: 'Home Furnishing', image: '/images/categories/home-furnishing.jpg', sort: 6 },
    { slug: 'cookware', name: 'Cookware & Brass', image: '/images/categories/cookware.jpg', sort: 7 },
    { slug: 'bags-wallets', name: 'Bags & Wallets', image: '/images/categories/bags-wallets.jpg', sort: 8 },
    { slug: 'electronics-accessories', name: 'Electronics Accessories', image: '/images/categories/electronics-accessories.jpg', sort: 9 },
    { slug: 'toys-games', name: 'Traditional Toys & Games', image: '/images/categories/toys-games.jpg', sort: 10 },
  ];

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, image: cat.image, sort: cat.sort },
      create: cat,
    });

    // Seed sample products for this category
    const count = await prisma.productCatalog.count({ where: { categoryId: createdCat.id } });
    if (count === 0) {
      if (cat.slug === 'womens-fashion') {
        await prisma.productCatalog.createMany({
          data: [
            {
              categoryId: createdCat.id,
              name: 'Kanchipuram Pure Silk Saree',
              price: 12500,
              estMin: 8000,
              estMax: 16000,
              image: '/images/products/womens-fashion/kanchipuram-silk-saree.jpg',
              description: 'Authentic pure mulberry silk saree with zari border from Weaver cooperatives.',
              tag: 'bestseller',
            },
            {
              categoryId: createdCat.id,
              name: 'Handcrafted Anarkali Kurti Set',
              price: 3400,
              estMin: 2500,
              estMax: 4500,
              image: '/images/products/womens-fashion/ethnic-wear.jpg',
              description: 'Pure cotton block print with delicate gota patti detailing.',
              tag: 'trending',
            },
          ],
        });
      } else if (cat.slug === 'jewellery-accessories') {
        await prisma.productCatalog.createMany({
          data: [
            {
              categoryId: createdCat.id,
              name: 'Temple Jewellery Kemp Necklace Set',
              price: 2440,
              estMin: 1500,
              estMax: 5000,
              image: '/images/products/jewellery-accessories/jewellery-sets.jpg',
              description: 'Traditional matte finish antique kemp stone necklace set with matching jhumkas.',
              tag: 'bestseller',
            },
            {
              categoryId: createdCat.id,
              name: 'Silver Antique Bangles Pair',
              price: 4800,
              estMin: 3000,
              estMax: 6500,
              image: '/images/products/jewellery-accessories/bangles.jpg',
              description: '92.5 hallmark pure silver antique style handcrafted kada pair.',
              tag: 'popular',
            },
          ],
        });
      } else if (cat.slug === 'pooja-spiritual') {
        await prisma.productCatalog.createMany({
          data: [
            {
              categoryId: createdCat.id,
              name: 'Brass Ashtalakshmi Diya Set',
              price: 1850,
              estMin: 1200,
              estMax: 2600,
              image: '/images/categories/pooja-spiritual.jpg',
              description: 'Heavy solid brass traditional oil lamp with 8 Lakshmi forms engraved.',
              tag: 'bestseller',
            },
          ],
        });
      } else {
        await prisma.productCatalog.create({
          data: {
            categoryId: createdCat.id,
            name: `${cat.name} Curated Sourcing`,
            price: 2200,
            estMin: 1500,
            estMax: 4000,
            image: cat.image,
            description: `Custom direct sourcing from the best local bazaars across India for ${cat.name}.`,
            tag: 'popular',
          },
        });
      }
    }
  }
  console.log('Categories and Products seeded.');

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
