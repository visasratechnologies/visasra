import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Phase 3: Cart Database Persistence...');

  // 1. Get or create test user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found');
    return;
  }
  console.log('Testing cart for user:', user.email);

  // 2. Ensure Cart exists
  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  console.log('Active Cart ID:', cart.id);

  // Clear any existing test items
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  // 3. Add Catalog Item to DB Cart
  const item1 = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      name: 'Kanchipuram Pure Silk Saree',
      qty: 2,
      priceMin: 8000,
      priceMax: 16000,
      image: '/images/products/womens-fashion/kanchipuram-silk-saree.jpg',
      sourceType: 'catalog',
      categoryName: "Women's Fashion",
    },
  });
  console.log('Added Catalog Item:', item1.name, '· Qty:', item1.qty);

  // 4. Add Custom Sourcing Item to DB Cart
  const item2 = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      name: 'Handcrafted Antique Brass Urli Bowl',
      qty: 1,
      priceMin: 2500,
      priceMax: 5000,
      notes: 'Need a 12-inch heavy traditional urli bowl for floating flowers',
      sourceType: 'mind',
      images: ['/images/custom/sample-urli.jpg'],
    },
  });
  console.log('Added Custom Sourcing Item:', item2.name, '· Notes:', item2.notes);

  // 5. Add Online Retailer Item to DB Cart
  const item3 = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      name: 'Boat Rockerz 450 Bluetooth Headphone',
      qty: 1,
      priceMin: 1499,
      priceMax: 1799,
      sourceType: 'online',
      sourceUrl: 'https://www.amazon.in/dp/B07PR1CL3S',
      notes: 'Color: Aqua Blue. From Amazon India',
    },
  });
  console.log('Added Online Store Item:', item3.name, '· Source:', item3.sourceUrl);

  // 6. Verify items persist in PostgreSQL
  const dbCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true },
  });
  console.log('DB Cart Items Count:', dbCart?.items.length);
  if (dbCart?.items.length !== 3) {
    throw new Error('Expected 3 items in cart');
  }

  // 7. Test Updating Quantity
  const updatedItem1 = await prisma.cartItem.update({
    where: { id: item1.id },
    data: { qty: 3 },
  });
  console.log('Updated Item1 Qty in DB:', updatedItem1.qty);

  // 8. Test Deleting one item
  await prisma.cartItem.delete({ where: { id: item3.id } });
  const remaining = await prisma.cartItem.count({ where: { cartId: cart.id } });
  console.log('Remaining Items in DB Cart:', remaining);
  if (remaining !== 2) {
    throw new Error('Expected 2 remaining items in cart');
  }

  // Clean up test items
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  console.log('Cleaned up test cart items.');

  console.log('✅ Phase 3 Verification PASSED! Cart items persist safely in PostgreSQL.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
