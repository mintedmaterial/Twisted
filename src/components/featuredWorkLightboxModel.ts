export type FeaturedPhotoIndex = number | null;

export function openFeaturedPhoto(count: number, requestedIndex: number): FeaturedPhotoIndex {
  return Number.isInteger(requestedIndex)
    && requestedIndex >= 0
    && requestedIndex < count
    ? requestedIndex
    : null;
}

export function previousFeaturedPhoto(currentIndex: number, count: number): FeaturedPhotoIndex {
  return count > 0 ? (currentIndex - 1 + count) % count : null;
}

export function nextFeaturedPhoto(currentIndex: number, count: number): FeaturedPhotoIndex {
  return count > 0 ? (currentIndex + 1) % count : null;
}

export function nextFeaturedFocusIndex(
  currentIndex: number,
  focusableCount: number,
  moveBackward: boolean,
): FeaturedPhotoIndex {
  if (focusableCount <= 0) return null;
  if (currentIndex < 0 || currentIndex >= focusableCount) {
    return moveBackward ? focusableCount - 1 : 0;
  }
  return (currentIndex + (moveBackward ? -1 : 1) + focusableCount) % focusableCount;
}
