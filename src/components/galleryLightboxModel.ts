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

export function preserveLightboxOpener<T>(currentOpener: T | null, candidateOpener: T): T {
  return currentOpener ?? candidateOpener;
}

export function reconcileLightboxIndex(selectedIndex: LightboxIndex, imageCount: number): LightboxIndex {
  return selectedIndex === null ? null : openLightbox(imageCount, selectedIndex);
}

export function shouldCloseLightboxForImagesChange<T>(
  openedImages: readonly T[] | null,
  currentImages: readonly T[],
  selectedIndex: LightboxIndex,
): boolean {
  return openedImages !== currentImages
    || reconcileLightboxIndex(selectedIndex, currentImages.length) === null;
}

export function nextLightboxFocusIndex(
  currentIndex: number,
  focusableCount: number,
  moveBackward: boolean,
): LightboxIndex {
  if (focusableCount <= 0) return null;
  if (currentIndex < 0 || currentIndex >= focusableCount) {
    return moveBackward ? focusableCount - 1 : 0;
  }
  return (currentIndex + (moveBackward ? -1 : 1) + focusableCount) % focusableCount;
}
