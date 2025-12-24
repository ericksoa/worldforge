import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateDilemma, generateImage } from './claude'
import { mockWorldTraits, mockDilemma } from '../../test/fixtures'
import { mockWorldforge } from '../../test/setup'
import { useDebugStore } from '../stores/debugStore'

describe('claude service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDebugStore.setState({ logs: [], nextId: 1 })
  })

  describe('generateDilemma', () => {
    it('should call window.worldforge.generateDilemma with correct params', async () => {
      mockWorldforge.generateDilemma.mockResolvedValue({
        success: true,
        dilemma: mockDilemma,
      })

      const result = await generateDilemma('normandy_10th', mockWorldTraits, 1)

      expect(mockWorldforge.generateDilemma).toHaveBeenCalledWith({
        era: 'normandy_10th',
        traits: mockWorldTraits,
        cardNumber: 1,
      })
      expect(result).toEqual(mockDilemma)
    })

    it('should return dilemma from API when successful', async () => {
      mockWorldforge.generateDilemma.mockResolvedValue({
        success: true,
        dilemma: mockDilemma,
      })

      const result = await generateDilemma('normandy_10th', mockWorldTraits, 1)
      expect(result.cardName).toBe('The Path of Power')
    })

    it('should fall back to mock data when API fails', async () => {
      mockWorldforge.generateDilemma.mockResolvedValue({
        success: false,
        dilemma: null,
      })

      const result = await generateDilemma('normandy_10th', mockWorldTraits, 1)

      // Should still return a valid dilemma (from mock data)
      expect(result).toBeDefined()
      expect(result.cardName).toBeDefined()
      expect(result.era).toBe('normandy_10th')
    })

    it('should fall back to mock data when API throws', async () => {
      mockWorldforge.generateDilemma.mockRejectedValue(new Error('API error'))

      const result = await generateDilemma('normandy_10th', mockWorldTraits, 1)

      expect(result).toBeDefined()
      expect(result.cardName).toBeDefined()
    })

    it('should cycle through mock dilemmas based on card number', async () => {
      mockWorldforge.generateDilemma.mockResolvedValue({
        success: false,
        dilemma: null,
      })

      const card1 = await generateDilemma('normandy_10th', mockWorldTraits, 1)
      const card2 = await generateDilemma('normandy_10th', mockWorldTraits, 2)

      // Different cards should have different names
      expect(card1.cardName).not.toBe(card2.cardName)
    })

    it('should log API calls to debug store', async () => {
      mockWorldforge.generateDilemma.mockResolvedValue({
        success: true,
        dilemma: mockDilemma,
      })

      await generateDilemma('normandy_10th', mockWorldTraits, 1)

      const logs = useDebugStore.getState().logs
      expect(logs.some(l => l.message.includes('Generating dilemma'))).toBe(true)
    })

    it('should log errors to debug store', async () => {
      mockWorldforge.generateDilemma.mockRejectedValue(new Error('Test error'))

      await generateDilemma('normandy_10th', mockWorldTraits, 1)

      const logs = useDebugStore.getState().logs
      expect(logs.some(l => l.type === 'error')).toBe(true)
    })

    it('should handle missing window.worldforge', async () => {
      const original = window.worldforge
      // @ts-ignore - Testing undefined case
      window.worldforge = undefined

      const result = await generateDilemma('normandy_10th', mockWorldTraits, 1)

      expect(result).toBeDefined()
      expect(result.cardName).toBeDefined()

      window.worldforge = original
    })

    it('should use normandy_10th mock data for unknown eras', async () => {
      mockWorldforge.generateDilemma.mockResolvedValue({
        success: false,
        dilemma: null,
      })

      const result = await generateDilemma('unknown_era', mockWorldTraits, 1)

      expect(result).toBeDefined()
      expect(result.cardName).toBeDefined()
    })
  })

  describe('generateImage', () => {
    it('should call window.worldforge.generateImage with prompt', async () => {
      mockWorldforge.generateImage.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/image.png',
      })

      const result = await generateImage('Medieval warrior')

      expect(mockWorldforge.generateImage).toHaveBeenCalledWith({
        prompt: 'Medieval warrior',
      })
      expect(result).toBe('https://example.com/image.png')
    })

    it('should return null when API fails', async () => {
      mockWorldforge.generateImage.mockResolvedValue({
        success: false,
        imageUrl: null,
      })

      const result = await generateImage('Test prompt')

      expect(result).toBeNull()
    })

    it('should return null when API throws', async () => {
      mockWorldforge.generateImage.mockRejectedValue(new Error('API error'))

      const result = await generateImage('Test prompt')

      expect(result).toBeNull()
    })

    it('should log API calls', async () => {
      mockWorldforge.generateImage.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/image.png',
      })

      await generateImage('Test prompt for logging')

      const logs = useDebugStore.getState().logs
      expect(logs.some(l => l.message.includes('Generating image'))).toBe(true)
    })

    it('should log errors', async () => {
      mockWorldforge.generateImage.mockRejectedValue(new Error('Image error'))

      await generateImage('Test prompt')

      const logs = useDebugStore.getState().logs
      expect(logs.some(l => l.type === 'error')).toBe(true)
    })

    it('should handle missing window.worldforge', async () => {
      const original = window.worldforge
      // @ts-ignore - Testing undefined case
      window.worldforge = undefined

      const result = await generateImage('Test prompt')

      expect(result).toBeNull()

      window.worldforge = original
    })

    it('should truncate long prompts in logs', async () => {
      mockWorldforge.generateImage.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/image.png',
      })

      const longPrompt = 'A'.repeat(200)
      await generateImage(longPrompt)

      const logs = useDebugStore.getState().logs
      const promptLog = logs.find(l => l.message.includes('Generating image'))
      expect(promptLog?.message).toContain('...')
    })
  })
})
