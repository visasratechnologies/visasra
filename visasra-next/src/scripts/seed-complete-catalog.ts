import { prisma } from '../lib/prisma';

interface ProductDef {
  name: string;
  mid: number;
  high: number;
  types?: Array<{ name: string; mid?: number; high?: number }>;
  tag?: string;
  desc?: string;
}

interface CategoryDef {
  key: string;
  name: string;
  desc: string;
  accent: string;
  image: string;
  sort: number;
  products: ProductDef[];
}

const FULL_CATALOG: CategoryDef[] = [
  {
    key: 'cookware',
    name: 'Cookware',
    desc: 'Pots, pans, cutlery & everyday kitchen sets',
    accent: '#C1622D',
    image: '/images/categories/cookware.jpg',
    sort: 1,
    products: [
      {
        name: 'Cooker', mid: 1500, high: 4590, tag: 'bestseller',
        types: [
          { name: 'Electric Pressure Cooker' },
          { name: 'Idli Steamer' },
          { name: 'Steel Idli Steamer' },
          { name: 'Aluminium Idli Steamer' },
          { name: '2 Litre Cooker' },
          { name: '3 Litre Cooker' },
          { name: 'Dual Lid Cooker' },
          { name: 'Rice Cooker' },
        ],
      },
      {
        name: 'Pots', mid: 1500, high: 6000,
        types: [
          { name: 'Bowls Set' },
          { name: 'Handi Set' },
          { name: 'Copper Bottom Handi Set' },
          { name: 'Milk Pots Combo' },
          { name: 'Cast Iron Pot' },
        ],
      },
      {
        name: 'Pans', mid: 900, high: 3300, tag: 'popular',
        types: [
          { name: 'Appam Pan' },
          { name: 'Cast Iron Appam Pan' },
          { name: 'Cast Iron Tadka Pan' },
          { name: 'Cast Iron Wok Pan' },
          { name: 'Deep Fry Pan' },
          { name: 'Frying Pan' },
          { name: 'Grill Pan' },
          { name: 'Sauce Pan' },
          { name: 'Steel Deep Fry Pan' },
          { name: 'Steel Fry Pan' },
          { name: 'Tadka Pan' },
        ],
      },
      {
        name: 'Tawas', mid: 1400, high: 5000,
        types: [
          { name: 'Non-Stick Tawa' },
          { name: 'Aluminium Tawa' },
          { name: 'Dosa Tawa' },
          { name: 'Roti Tawa' },
        ],
      },
      {
        name: 'Kadai', mid: 1200, high: 4000,
        types: [
          { name: 'Iron Kadai' },
          { name: 'Non-Stick Kadai' },
          { name: 'Stainless Steel Kadai' },
        ],
      },
      { name: 'Woks', mid: 1800, high: 3500 },
      { name: 'Handi', mid: 1800, high: 3300 },
      { name: 'Dutch Ovens', mid: 1700, high: 8500 },
      { name: 'Cookware Sets', mid: 1800, high: 5300, tag: 'trending' },
      { name: 'Spoons', mid: 300, high: 1500 },
      { name: 'Forks', mid: 600, high: 1600 },
      {
        name: 'Knives', mid: 400, high: 1000,
        types: [
          { name: 'Knife Set' },
          { name: 'Knives' },
        ],
      },
      {
        name: 'Spatula', mid: 450, high: 900,
        types: [
          { name: 'Silicone Spatula' },
          { name: 'Silicone Utensil Set' },
          { name: 'Spatula Set' },
          { name: 'Wooden Spatula Set' },
          { name: 'Whisk' },
        ],
      },
      {
        name: 'Plates', mid: 700, high: 1200,
        types: [
          { name: 'Steel Plates' },
          { name: 'Dinner Plates' },
          { name: 'Partition Plate' },
          { name: 'Hammered Plate' },
        ],
      },
      {
        name: 'Bowls', mid: 1000, high: 1600,
        types: [
          { name: 'Ceramic Bowl' },
          { name: 'Serving Bowls' },
          { name: 'Steel Bowls' },
        ],
      },
      {
        name: 'Dinner Sets', mid: 1600, high: 6000, tag: 'bestseller',
        types: [
          { name: 'Ceramic Dinner Set' },
          { name: 'Steel Thali Set' },
        ],
      },
      { name: 'Serving Sets', mid: 900, high: 3000 },
      {
        name: 'Trays', mid: 600, high: 1800,
        types: [
          { name: 'Trays' },
          { name: 'Wooden Trays' },
          { name: 'Steel Trays' },
        ],
      },
      { name: 'Cutlery Sets', mid: 1800, high: 4800 },
      {
        name: 'Glasses', mid: 1200, high: 3000,
        types: [
          { name: 'Brass Glasses' },
          { name: 'Copper Glasses' },
          { name: 'Steel Water Glass' },
          { name: 'Glassware Water Glasses' },
        ],
      },
      {
        name: 'Cups & Mugs', mid: 1100, high: 3000,
        types: [
          { name: 'Ceramic Tea Cups' },
          { name: 'Handcrafted Mugs' },
          { name: 'Steel Tea Cups' },
          { name: 'Mugs' },
          { name: 'Glassware Tea Cups' },
        ],
      },
    ],
  },
  {
    key: 'home-decors',
    name: 'Home Decors',
    desc: 'Lighting, wall art, rugs & decorative pieces',
    accent: '#7C3AED',
    image: '/images/categories/home-decors.jpg',
    sort: 2,
    products: [
      { name: 'Home Decor', mid: 1300, high: 6000 },
      { name: 'Wall Decor', mid: 1400, high: 5000, tag: 'bestseller' },
      { name: 'Lamps & Lighting', mid: 1600, high: 12500, tag: 'trending' },
      { name: 'Candles & Diyas', mid: 800, high: 2000 },
      { name: 'Clocks', mid: 1000, high: 4000 },
      { name: 'Cushions & Covers', mid: 800, high: 2500 },
      { name: 'Curtains', mid: 900, high: 2000 },
      { name: 'Rugs & Carpets', mid: 2000, high: 12000 },
      {
        name: 'Storage & Organizers', mid: 1000, high: 3000,
        types: [
          { name: 'Drying Stand' },
          { name: 'Pot Rack' },
          { name: 'Shoe Rack' },
          { name: 'Steel Rack' },
          { name: 'Storage Unit' },
        ],
      },
      { name: 'Artificial Flowers', mid: 600, high: 2500 },
      { name: 'Decorative Items', mid: 900, high: 4200 },
    ],
  },
  {
    key: 'home-furnishing',
    name: 'Home Furnishing',
    desc: 'Bedsheets, towels, blankets & everyday linen',
    accent: '#0E8074',
    image: '/images/categories/home-furnishing.jpg',
    sort: 3,
    products: [
      { name: 'Bedsheets', mid: 500, high: 3700, tag: 'bestseller' },
      { name: 'Blankets', mid: 950, high: 5500 },
      { name: 'Comforters', mid: 1100, high: 7000 },
      { name: 'Pillows', mid: 750, high: 3500 },
      { name: 'Pillow Covers', mid: 350, high: 600 },
      { name: 'Mattress Protectors', mid: 800, high: 3500 },
      { name: 'Towels', mid: 500, high: 1600 },
      { name: 'Bath Mats', mid: 1600, high: 4500 },
      { name: 'Table Covers', mid: 1600, high: 4100 },
      { name: 'Kitchen Towel', mid: 800, high: 1700 },
    ],
  },
  {
    key: 'electronics-accessories',
    name: 'Electronics & Accessories',
    desc: 'Chargers, earphones, smart watches & gadgets',
    accent: '#2563EB',
    image: '/images/categories/electronics-accessories.jpg',
    sort: 4,
    products: [
      { name: 'Mobile Accessories', mid: 100, high: 1000 },
      { name: 'Chargers', mid: 500, high: 2000 },
      { name: 'Cables', mid: 150, high: 600 },
      { name: 'Earphones', mid: 1000, high: 2000 },
      { name: 'Headphones', mid: 1000, high: 3000 },
      { name: 'Smart Watches', mid: 1500, high: 5000, tag: 'trending' },
      { name: 'Speakers', mid: 1500, high: 10000 },
      { name: 'Power Banks', mid: 1000, high: 3000 },
      { name: 'Small Appliances', mid: 499, high: 3000 },
    ],
  },
  {
    key: 'toys-games',
    name: 'Toys & Games',
    desc: 'Puzzles, dolls, board games & toys for every age',
    accent: '#16A34A',
    image: '/images/categories/toys-games.jpg',
    sort: 5,
    products: [
      { name: 'Educational Toys', mid: 250, high: 1000 },
      { name: 'Remote Control Toys', mid: 500, high: 2000 },
      { name: 'Dolls & Doll Sets', mid: 500, high: 2000 },
      { name: 'Cars & Vehicles', mid: 500, high: 8000 },
      { name: 'Board Games', mid: 300, high: 1000, tag: 'popular' },
      { name: 'Puzzles', mid: 250, high: 500 },
      { name: 'Building Blocks', mid: 300, high: 700 },
      { name: 'Soft Toys', mid: 300, high: 1500 },
      { name: 'Outdoor Games', mid: 700, high: 3000 },
      { name: 'Musical Toys', mid: 300, high: 700 },
      { name: 'Baby Toys', mid: 250, high: 700 },
    ],
  },
  {
    key: 'jewellery-accessories',
    name: 'Jewellery & Accessories',
    desc: 'Earrings, necklaces, bangles & full sets',
    accent: '#B8860B',
    image: '/images/categories/jewellery-accessories.jpg',
    sort: 6,
    products: [
      { name: 'Oxidized Jewellery', mid: 150, high: 1000 },
      { name: 'Earrings', mid: 100, high: 800, tag: 'popular' },
      { name: 'Necklaces', mid: 400, high: 1200 },
      { name: 'Chains', mid: 150, high: 600 },
      { name: 'Bracelets', mid: 150, high: 800 },
      { name: 'Bangles', mid: 250, high: 800 },
      { name: 'Rings', mid: 150, high: 500 },
      { name: 'Anklets', mid: 300, high: 1000 },
      { name: 'Maang Tikka', mid: 250, high: 1500 },
      { name: 'Nose Pins', mid: 350, high: 800 },
      { name: 'Jewellery Sets', mid: 1500, high: 5000, tag: 'bestseller' },
    ],
  },
  {
    key: 'pooja-spiritual',
    name: 'Pooja & Spiritual',
    desc: 'Pooja sets, diyas, idols & festive essentials',
    accent: '#E11D48',
    image: '/images/categories/pooja-spiritual.jpg',
    sort: 7,
    products: [
      { name: 'Pooja Sets', mid: 800, high: 2000, tag: 'bestseller' },
      {
        name: 'Diyas', mid: 400, high: 1000, tag: 'popular',
        types: [
          { name: 'Peacock Standing Diya' },
          { name: 'Branch Standing Diya' },
          { name: 'Classic Standing Diya' },
          { name: 'Silver Diya' },
          { name: 'Copper Diya' },
          { name: 'Brass Diya' },
        ],
      },
      {
        name: 'Incense Sticks', mid: 200, high: 500,
        types: [
          { name: 'Dhoop Sticks' },
          { name: 'Incense Holder' },
        ],
      },
      { name: 'Camphor', mid: 200, high: 600 },
      { name: 'Pooja Utensils', mid: 500, high: 3000 },
      { name: 'Brass Idols', mid: 1000, high: 3500, tag: 'trending' },
      { name: 'Decorative Torans', mid: 300, high: 600 },
      { name: 'Rangoli Items', mid: 300, high: 600 },
    ],
  },
  {
    key: 'bags-wallets',
    name: 'Bags & Wallets',
    desc: 'Handbags, backpacks, wallets & travel bags',
    accent: '#7B4B2A',
    image: '/images/categories/bags-wallets.jpg',
    sort: 8,
    products: [
      { name: 'Handbags', mid: 800, high: 5000, tag: 'bestseller' },
      { name: 'Sling Bags', mid: 600, high: 2000 },
      { name: 'Tote Bags', mid: 800, high: 5000 },
      { name: 'Backpacks', mid: 1000, high: 2500 },
      { name: 'Clutches', mid: 500, high: 1000 },
      { name: 'Wallets', mid: 500, high: 1000 },
      { name: 'Card Holders', mid: 350, high: 700 },
      { name: 'Laptop Bags', mid: 1000, high: 2000 },
      { name: 'Travel Bags', mid: 800, high: 1500 },
      { name: 'Duffle Bags', mid: 1000, high: 1500 },
      { name: 'Crossbody Bags', mid: 500, high: 1000 },
    ],
  },
  {
    key: 'womens-fashion',
    name: "Women's Fashion",
    desc: 'Ethnic wear, tops, footwear & watches',
    accent: '#DB2777',
    image: '/images/categories/womens-fashion.jpg',
    sort: 9,
    products: [
      { name: 'Tops', mid: 400, high: 1500 },
      { name: 'Ethnic Wear', mid: 800, high: 5000, tag: 'bestseller' },
      { name: 'Bottom Wear', mid: 600, high: 1500 },
      { name: 'Blouses', mid: 500, high: 3000 },
      { name: 'Nightwear', mid: 1000, high: 2000 },
      { name: 'Women\'s Watches', mid: 500, high: 5000 },
      { name: 'Women\'s Footwear', mid: 500, high: 3000 },
    ],
  },
  {
    key: 'mens-fashion',
    name: "Men's Fashion",
    desc: 'Shirts, trousers, ethnic wear & footwear',
    accent: '#334155',
    image: '/images/categories/mens-fashion.jpg',
    sort: 10,
    products: [
      { name: 'Shirts', mid: 1000, high: 3000 },
      { name: 'T-Shirts', mid: 500, high: 1500 },
      { name: 'Trousers', mid: 1000, high: 2000 },
      { name: 'Ethnic Wear', mid: 800, high: 5000, tag: 'bestseller' },
      { name: 'Jackets', mid: 1000, high: 2500 },
      { name: 'Sweatshirts', mid: 700, high: 2500 },
      { name: 'Shorts', mid: 700, high: 1500 },
      { name: 'Men\'s Footwear', mid: 800, high: 2000 },
      { name: 'Men\'s Watches', mid: 1000, high: 5000 },
    ],
  },
];

function productSlug(name: string) {
  return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function run() {
  console.log('Connecting to PostgreSQL via Prisma for full catalog seeding...');

  try {
    // 1. Ensure `types` column exists on ProductCatalog
    await prisma.$executeRawUnsafe(`ALTER TABLE "ProductCatalog" ADD COLUMN IF NOT EXISTS "types" JSONB;`);

    let totalCategories = 0;
    let totalProducts = 0;
    let totalSubTypes = 0;

    for (const cat of FULL_CATALOG) {
      // Upsert Category
      const createdCat = await prisma.category.upsert({
        where: { slug: cat.key },
        update: { name: cat.name, image: cat.image, sort: cat.sort },
        create: {
          slug: cat.key,
          name: cat.name,
          image: cat.image,
          sort: cat.sort,
        },
      });
      totalCategories++;

      // Delete old products for clean sync
      await prisma.productCatalog.deleteMany({
        where: { categoryId: createdCat.id },
      });

      // Insert all products for this category
      for (const prod of cat.products) {
        const slug = productSlug(prod.name);
        const imagePath = `/images/products/${cat.key}/${slug}.jpg`;
        const desc = prod.desc || `Authentic ${prod.name} sourced directly from local market merchants with verified billing.`;
        const tag = prod.tag || (prod.types && prod.types.length > 0 ? `${prod.types.length} Types` : 'Artisan Choice');
        const typesJson = prod.types && prod.types.length > 0 ? (prod.types as any) : null;

        if (prod.types) {
          totalSubTypes += prod.types.length;
        }

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
        totalProducts++;
      }
    }

    console.log(`\nSUCCESSFULLY SEEDED COMPLETE VISASRA CATALOG:`);
    console.log(`- Categories: ${totalCategories}`);
    console.log(`- Products/Subcategories: ${totalProducts}`);
    console.log(`- Types/Sub-variants: ${totalSubTypes}`);
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
