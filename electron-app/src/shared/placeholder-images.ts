/**
 * Placeholder tarot images for development and testing
 *
 * These images are pre-generated medieval woodcut style tarot card illustrations
 * used to avoid API calls during development.
 */

/** Total number of placeholder images available */
export const PLACEHOLDER_IMAGE_COUNT = 31

/** Generate the filename for a placeholder image by index (1-based) */
export function getPlaceholderFilename(index: number): string {
  const clampedIndex = Math.max(1, Math.min(index, PLACEHOLDER_IMAGE_COUNT))
  return `tarot-${String(clampedIndex).padStart(2, '0')}.png`
}

/** Get all placeholder image filenames */
export function getAllPlaceholderFilenames(): string[] {
  return Array.from({ length: PLACEHOLDER_IMAGE_COUNT }, (_, i) => getPlaceholderFilename(i + 1))
}

/** Get a random placeholder image filename */
export function getRandomPlaceholderFilename(): string {
  const index = Math.floor(Math.random() * PLACEHOLDER_IMAGE_COUNT) + 1
  return getPlaceholderFilename(index)
}

/**
 * Get a deterministic placeholder image based on a seed string
 * This ensures the same prompt always gets the same placeholder
 */
export function getSeededPlaceholderFilename(seed: string): string {
  // Simple hash function to convert string to number
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  const index = (Math.abs(hash) % PLACEHOLDER_IMAGE_COUNT) + 1
  return getPlaceholderFilename(index)
}
