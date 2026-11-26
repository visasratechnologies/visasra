export const PLACEHOLDER_ITEM = '/images/placeholders/placeholder-item.svg';
export const PLACEHOLDER_CUSTOM = '/images/placeholders/placeholder-custom.svg';
export const PLACEHOLDER_ONLINE = '/images/placeholders/placeholder-online.svg';
export const PLACEHOLDER_CATEGORY = '/images/placeholders/placeholder-category.svg';
export const PLACEHOLDER_DOCUMENT = '/images/placeholders/placeholder-document.svg';
export const PLACEHOLDER_AVATAR = '/images/placeholders/placeholder-avatar.svg';

/**
 * Returns a neutral, semantic placeholder based on the sourcing type
 * instead of arbitrary category photos (e.g. pooja lamps or necklaces).
 */
export function getItemImageFallback(sourceType?: string | null): string {
  if (sourceType === 'mind' || sourceType === 'custom') return PLACEHOLDER_CUSTOM;
  if (sourceType === 'online') return PLACEHOLDER_ONLINE;
  return PLACEHOLDER_ITEM;
}

export function resolveItemImage(image?: string | null, sourceType?: string | null, itemName?: string | null): string {
  if (image && image.trim()) {
    const trimmed = image.trim();
    // Do not use category banner header files as individual product item photos
    if (!trimmed.startsWith('/images/categories/') && !trimmed.endsWith('placeholder-item.svg')) {
      return trimmed;
    }
  }

  // Name-based smart matching to authentic high-res product photos
  if (itemName) {
    const lower = itemName.toLowerCase();
    if (/silk|saree|dupatta|kanchipuram|kurti|dress|wear|fashion|clothing/i.test(lower)) {
      return '/images/products/womens-fashion/kanchipuram-silk-saree.jpg';
    }
    if (/bell|diya|pooja|brass|idol|temple|spiritual|samagri/i.test(lower)) {
      return '/images/products/pooja-spiritual/diyas/brass-diya.jpg';
    }
    if (/kadai|cooker|pan|pot|dinner|cookware/i.test(lower)) {
      return '/images/products/womens-fashion/ethnic-wear.jpg';
    }
  }

  return getItemImageFallback(sourceType);
}

export function resolveCategoryImage(image?: string | null): string {
  if (image && image.trim()) {
    return image.trim();
  }
  return PLACEHOLDER_CATEGORY;
}
