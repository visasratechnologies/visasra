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

export function resolveItemImage(image?: string | null, sourceType?: string | null): string {
  if (image && image.trim() && !image.includes('pooja-spiritual.jpg') && !image.includes('jewellery-accessories.jpg')) {
    return image.trim();
  }
  return getItemImageFallback(sourceType);
}

export function resolveCategoryImage(image?: string | null): string {
  if (image && image.trim()) {
    return image.trim();
  }
  return PLACEHOLDER_CATEGORY;
}
