import fs from 'fs';
import { prisma } from '../lib/prisma';

async function run() {
  const appJs = fs.readFileSync('d:/visasra-suite/visasra-app/app.js', 'utf8');
  const startApp = appJs.indexOf('const PRODUCT_CATALOG = [');
  const endApp = appJs.indexOf('/* Tapping a product: add it to the draft', startApp);
  const catalogCode = appJs.substring(startApp, endApp).replace('const PRODUCT_CATALOG =', 'global.APP_CATALOG =');
  eval(catalogCode);

  const dbCats = await prisma.category.findMany({ include: { products: true } });

  console.log('App.js Categories:', (global as any).APP_CATALOG.length);
  console.log('DB Categories:', dbCats.length);

  let missingCats: string[] = [];
  let missingProds: string[] = [];
  let missingTypes: string[] = [];

  (global as any).APP_CATALOG.forEach((appCat: any) => {
    const dbCat = dbCats.find(c => c.slug === appCat.key);
    if (!dbCat) {
      missingCats.push(`${appCat.name} (${appCat.key})`);
      return;
    }
    appCat.products.forEach((appP: any) => {
      const dbP = dbCat.products.find(p => p.name.toLowerCase() === appP.name.toLowerCase());
      if (!dbP) {
        missingProds.push(`${appCat.name} -> ${appP.name}`);
        return;
      }
      if (appP.types && appP.types.length) {
        const types = dbP.types ? (typeof dbP.types === 'string' ? JSON.parse(dbP.types) : dbP.types) : [];
        if (!types.length) {
          missingTypes.push(`${appCat.name} -> ${appP.name} (All ${appP.types.length} types missing in DB)`);
        } else {
          appP.types.forEach((appT: any) => {
            const dbT = types.find((t: any) => t.name.toLowerCase() === appT.name.toLowerCase());
            if (!dbT) {
              missingTypes.push(`${appCat.name} -> ${appP.name} -> ${appT.name}`);
            }
          });
        }
      }
    });
  });

  console.log('Missing Categories in DB:', missingCats);
  console.log('Missing Products in DB:', missingProds);
  console.log('Missing Types in DB:', missingTypes);

  let extraProds: string[] = [];
  dbCats.forEach(dbCat => {
    const appCat = (global as any).APP_CATALOG.find((c: any) => c.key === dbCat.slug);
    if (!appCat) console.log('Extra Category in DB:', dbCat.name);
    else {
      dbCat.products.forEach(dbP => {
        const appP = appCat.products.find((p: any) => p.name.toLowerCase() === dbP.name.toLowerCase());
        if (!appP) extraProds.push(`${dbCat.name} -> ${dbP.name}`);
      });
    }
  });
  console.log('Extra Products in DB:', extraProds);

  await prisma.$disconnect();
}

run().catch(console.error);
