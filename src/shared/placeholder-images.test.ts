import { describe, it, expect } from 'vitest'
import {
  PLACEHOLDER_IMAGE_COUNT,
  getPlaceholderFilename,
  getAllPlaceholderFilenames,
  getRandomPlaceholderFilename,
  getSeededPlaceholderFilename,
} from './placeholder-images'

describe('placeholder-images', () => {
  describe('PLACEHOLDER_IMAGE_COUNT', () => {
    it('should be a positive number', () => {
      expect(PLACEHOLDER_IMAGE_COUNT).toBeGreaterThan(0)
    })
  })

  describe('getPlaceholderFilename', () => {
    it('should return correct filename for index 1', () => {
      expect(getPlaceholderFilename(1)).toBe('tarot-01.png')
    })

    it('should return correct filename for index 10', () => {
      expect(getPlaceholderFilename(10)).toBe('tarot-10.png')
    })

    it('should return correct filename for index 31', () => {
      expect(getPlaceholderFilename(31)).toBe('tarot-31.png')
    })

    it('should clamp index below 1 to 1', () => {
      expect(getPlaceholderFilename(0)).toBe('tarot-01.png')
      expect(getPlaceholderFilename(-5)).toBe('tarot-01.png')
    })

    it('should clamp index above count to count', () => {
      expect(getPlaceholderFilename(100)).toBe(`tarot-${String(PLACEHOLDER_IMAGE_COUNT).padStart(2, '0')}.png`)
    })
  })

  describe('getAllPlaceholderFilenames', () => {
    it('should return array of correct length', () => {
      const filenames = getAllPlaceholderFilenames()
      expect(filenames).toHaveLength(PLACEHOLDER_IMAGE_COUNT)
    })

    it('should return correctly formatted filenames', () => {
      const filenames = getAllPlaceholderFilenames()
      expect(filenames[0]).toBe('tarot-01.png')
      expect(filenames[filenames.length - 1]).toBe(`tarot-${String(PLACEHOLDER_IMAGE_COUNT).padStart(2, '0')}.png`)
    })

    it('should return unique filenames', () => {
      const filenames = getAllPlaceholderFilenames()
      const uniqueFilenames = new Set(filenames)
      expect(uniqueFilenames.size).toBe(PLACEHOLDER_IMAGE_COUNT)
    })
  })

  describe('getRandomPlaceholderFilename', () => {
    it('should return a valid filename format', () => {
      const filename = getRandomPlaceholderFilename()
      expect(filename).toMatch(/^tarot-\d{2}\.png$/)
    })

    it('should return different values over multiple calls (probabilistic)', () => {
      const results = new Set<string>()
      for (let i = 0; i < 100; i++) {
        results.add(getRandomPlaceholderFilename())
      }
      // Should have at least 2 different results
      expect(results.size).toBeGreaterThan(1)
    })
  })

  describe('getSeededPlaceholderFilename', () => {
    it('should return a valid filename format', () => {
      const filename = getSeededPlaceholderFilename('test prompt')
      expect(filename).toMatch(/^tarot-\d{2}\.png$/)
    })

    it('should return same filename for same seed', () => {
      const seed = 'Medieval woodcut style tarot card illustration of a king'
      const result1 = getSeededPlaceholderFilename(seed)
      const result2 = getSeededPlaceholderFilename(seed)
      expect(result1).toBe(result2)
    })

    it('should return different filenames for different seeds', () => {
      const result1 = getSeededPlaceholderFilename('prompt about war')
      const result2 = getSeededPlaceholderFilename('prompt about peace')
      // Different seeds should (usually) produce different results
      // This is probabilistic but with good hash distribution should work
      expect(result1).not.toBe(result2)
    })

    it('should handle empty string', () => {
      const filename = getSeededPlaceholderFilename('')
      expect(filename).toMatch(/^tarot-\d{2}\.png$/)
    })

    it('should handle long strings', () => {
      const longPrompt = 'a'.repeat(10000)
      const filename = getSeededPlaceholderFilename(longPrompt)
      expect(filename).toMatch(/^tarot-\d{2}\.png$/)
    })
  })
})
