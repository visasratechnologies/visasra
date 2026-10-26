import fs from 'fs';
import path from 'path';
import {
  PLACEHOLDER_ITEM,
  PLACEHOLDER_CUSTOM,
  PLACEHOLDER_ONLINE,
  PLACEHOLDER_CATEGORY,
  PLACEHOLDER_DOCUMENT,
  PLACEHOLDER_AVATAR,
  getItemImageFallback,
  resolveItemImage,
  resolveCategoryImage
} from '../src/lib/placeholders';

async function testPhase4() {
  console.log('--- Testing Phase 4: Placeholder & Fallback System ---');

  // 1. Verify all placeholder SVG files exist in public/
  const placeholders = [
    { name: 'Item Placeholder', path: path.join(process.cwd(), 'public', PLACEHOLDER_ITEM) },
    { name: 'Custom Placeholder', path: path.join(process.cwd(), 'public', PLACEHOLDER_CUSTOM) },
    { name: 'Online Placeholder', path: path.join(process.cwd(), 'public', PLACEHOLDER_ONLINE) },
    { name: 'Category Placeholder', path: path.join(process.cwd(), 'public', PLACEHOLDER_CATEGORY) },
    { name: 'Document Placeholder', path: path.join(process.cwd(), 'public', PLACEHOLDER_DOCUMENT) },
    { name: 'Avatar Placeholder', path: path.join(process.cwd(), 'public', PLACEHOLDER_AVATAR) },
  ];

  for (const p of placeholders) {
    if (fs.existsSync(p.path)) {
      const stats = fs.statSync(p.path);
      console.log(`[PASS] ${p.name} exists (${stats.size} bytes): ${p.path}`);
    } else {
      console.error(`[FAIL] ${p.name} NOT found at: ${p.path}`);
      process.exit(1);
    }
  }

  // 2. Test fallback functions
  console.log('\n--- Testing Logic Helpers in src/lib/placeholders.ts ---');

  // Mind item fallback
  const customFb = getItemImageFallback('mind');
  if (customFb === PLACEHOLDER_CUSTOM) {
    console.log('[PASS] getItemImageFallback("mind") returns PLACEHOLDER_CUSTOM');
  } else {
    console.error('[FAIL] getItemImageFallback("mind") returned:', customFb);
    process.exit(1);
  }

  // Online item fallback
  const onlineFb = getItemImageFallback('online');
  if (onlineFb === PLACEHOLDER_ONLINE) {
    console.log('[PASS] getItemImageFallback("online") returns PLACEHOLDER_ONLINE');
  } else {
    console.error('[FAIL] getItemImageFallback("online") returned:', onlineFb);
    process.exit(1);
  }

  // Default item fallback
  const defaultFb = getItemImageFallback('catalog');
  if (defaultFb === PLACEHOLDER_ITEM) {
    console.log('[PASS] getItemImageFallback("catalog") returns PLACEHOLDER_ITEM');
  } else {
    console.error('[FAIL] getItemImageFallback("catalog") returned:', defaultFb);
    process.exit(1);
  }

  // Eradicate pooja lamp random fallback
  const legacyPooja = resolveItemImage('/images/categories/pooja-spiritual.jpg', 'catalog');
  if (legacyPooja === PLACEHOLDER_ITEM) {
    console.log('[PASS] resolveItemImage cleans out legacy pooja-spiritual.jpg fallback -> PLACEHOLDER_ITEM');
  } else {
    console.error('[FAIL] legacy pooja-spiritual.jpg was not cleaned:', legacyPooja);
    process.exit(1);
  }

  // Eradicate jewellery random fallback
  const legacyJewel = resolveItemImage('/images/categories/jewellery-accessories.jpg', 'mind');
  if (legacyJewel === PLACEHOLDER_CUSTOM) {
    console.log('[PASS] resolveItemImage cleans out legacy jewellery-accessories.jpg fallback -> PLACEHOLDER_CUSTOM');
  } else {
    console.error('[FAIL] legacy jewellery-accessories.jpg was not cleaned:', legacyJewel);
    process.exit(1);
  }

  // Valid legitimate image preserved
  const validImg = resolveItemImage('https://images.example.com/item.png', 'catalog');
  if (validImg === 'https://images.example.com/item.png') {
    console.log('[PASS] resolveItemImage preserves legitimate customer/catalog images');
  } else {
    console.error('[FAIL] valid image was altered:', validImg);
    process.exit(1);
  }

  // Category fallback
  const catFb = resolveCategoryImage(null);
  if (catFb === PLACEHOLDER_CATEGORY) {
    console.log('[PASS] resolveCategoryImage(null) returns PLACEHOLDER_CATEGORY');
  } else {
    console.error('[FAIL] resolveCategoryImage returned:', catFb);
    process.exit(1);
  }

  console.log('\n[SUCCESS] Phase 4 Image Placeholder & Fallback System is 100% verified.');
}

testPhase4().catch(err => {
  console.error(err);
  process.exit(1);
});
