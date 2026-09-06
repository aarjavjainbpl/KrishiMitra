// Agricultural Produce Standard High-Resolution Image Presets and Fallbacks

export const CROP_DEFAULT_IMAGES: Record<string, string> = {
  Wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  Tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
  Potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80',
  Onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80',
  Soybean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80',
  Rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
  Mustard: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&auto=format&fit=crop&q=80',
  'Green Chilli': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
  Chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
  Garlic: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=800&auto=format&fit=crop&q=80',
  Cotton: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=800&auto=format&fit=crop&q=80',
  Maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80',
  Corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80',
  Gram: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&auto=format&fit=crop&q=80',
  Chana: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&auto=format&fit=crop&q=80',
};

export function getCropFallbackImage(cropName?: string): string {
  if (!cropName) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80';
  }

  const normalized = Object.keys(CROP_DEFAULT_IMAGES).find(
    (key) => key.toLowerCase() === cropName.toLowerCase() || cropName.toLowerCase().includes(key.toLowerCase())
  );

  return normalized
    ? CROP_DEFAULT_IMAGES[normalized]
    : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80';
}

/**
 * Ensures any image URL displayed on Buyer Mart is safe, non-blob, and persistent.
 */
export function resolveDisplayImage(photoUrl?: string, qualityImageUrl?: string, cropName?: string): string {
  if (photoUrl && !photoUrl.startsWith('blob:')) {
    return photoUrl;
  }
  if (qualityImageUrl && !qualityImageUrl.startsWith('blob:')) {
    return qualityImageUrl;
  }
  return getCropFallbackImage(cropName);
}
