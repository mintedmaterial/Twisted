export type LightboxIndex = number | null;

export function openLightbox(imageCount: number, requestedIndex: number): LightboxIndex {
  return Number.isInteger(requestedIndex)
    && requestedIndex >= 0
    && requestedIndex < imageCount
    ? requestedIndex
    : null;
}

export function closeLightbox(): null {
  return null;
}

export function previousLightboxIndex(currentIndex: number, imageCount: number): LightboxIndex {
  return imageCount > 0 ? (currentIndex - 1 + imageCount) % imageCount : null;
}

export function nextLightboxIndex(currentIndex: number, imageCount: number): LightboxIndex {
  return imageCount > 0 ? (currentIndex + 1) % imageCount : null;
}
