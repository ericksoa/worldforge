import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TarotSpread } from './TarotSpread'
import { useWorldStore } from '../stores/worldStore'
import { mockEra, mockDilemma } from '../../test/fixtures'
import { mockWorldforge } from '../../test/setup'

// Mock the claude service
vi.mock('../services/claude', () => ({
  generateDilemma: vi.fn(),
  generateImage: vi.fn(),
}))

import { generateDilemma, generateImage } from '../services/claude'

describe('TarotSpread', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWorldStore.getState().resetWorld()
    ;(generateDilemma as ReturnType<typeof vi.fn>).mockResolvedValue(mockDilemma)
    ;(generateImage as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  })

  describe('without era', () => {
    it('should render nothing when no era is set', () => {
      const { container } = render(<TarotSpread />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('loading state', () => {
    it('should show loading indicator while generating dilemma', async () => {
      useWorldStore.getState().setEra(mockEra)
      ;(generateDilemma as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<TarotSpread />)

      expect(screen.getByText('The cards are being drawn...')).toBeInTheDocument()
    })

    it('should show card number in loading indicator', async () => {
      useWorldStore.getState().setEra(mockEra)
      ;(generateDilemma as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      )

      render(<TarotSpread />)

      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should show error message when dilemma generation fails', async () => {
      useWorldStore.getState().setEra(mockEra)
      ;(generateDilemma as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'))

      render(<TarotSpread />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to consult the cards/)).toBeInTheDocument()
      })
    })

    it('should show Try Again button on error', async () => {
      useWorldStore.getState().setEra(mockEra)
      ;(generateDilemma as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'))

      render(<TarotSpread />)

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })
  })

  describe('dilemma display', () => {
    it('should display dilemma card name', async () => {
      useWorldStore.getState().setEra(mockEra)

      render(<TarotSpread />)

      await waitFor(() => {
        expect(screen.getByText('The Path of Power')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should display dilemma description', async () => {
      useWorldStore.getState().setEra(mockEra)

      render(<TarotSpread />)

      await waitFor(() => {
        expect(screen.getByText(/The Northmen have settled these shores/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should display choice A card', async () => {
      useWorldStore.getState().setEra(mockEra)

      render(<TarotSpread />)

      await waitFor(() => {
        // getAllByText because the label appears twice (front and back of card)
        const elements = screen.getAllByText('The Conqueror')
        expect(elements.length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })

    it('should display choice B card', async () => {
      useWorldStore.getState().setEra(mockEra)

      render(<TarotSpread />)

      await waitFor(() => {
        const elements = screen.getAllByText('The Merchant')
        expect(elements.length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })

    it('should display "or" divider between cards', async () => {
      useWorldStore.getState().setEra(mockEra)

      render(<TarotSpread />)

      await waitFor(() => {
        expect(screen.getByText('or')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('progress indicator', () => {
    it('should show progress dots', async () => {
      useWorldStore.getState().setEra(mockEra)

      render(<TarotSpread />)

      await waitFor(() => {
        // Should have at least 5 progress dots
        const container = screen.getByText('The Path of Power').closest('div')?.parentElement
        const dots = container?.querySelectorAll('.rounded-full.w-3')
        expect(dots?.length).toBeGreaterThanOrEqual(5)
      })
    })

    it('should show choice count message after making choices', async () => {
      useWorldStore.getState().setEra(mockEra)
      useWorldStore.getState().recordChoice(mockDilemma, 'A')

      render(<TarotSpread />)

      await waitFor(() => {
        expect(screen.getByText(/1 choice have shaped your world/)).toBeInTheDocument()
      })
    })
  })

  describe('image generation', () => {
    it('should call generateImage for choice A', async () => {
      useWorldStore.getState().setEra(mockEra)

      render(<TarotSpread />)

      await waitFor(() => {
        expect(generateImage).toHaveBeenCalledWith('Medieval woodcut of a warrior')
      }, { timeout: 3000 })
    })
  })

  describe('service calls', () => {
    it('should call generateDilemma with correct parameters', async () => {
      useWorldStore.getState().setEra(mockEra)

      render(<TarotSpread />)

      await waitFor(() => {
        expect(generateDilemma).toHaveBeenCalledWith(
          'normandy_10th',
          expect.objectContaining({
            militarism: expect.any(Number),
            prosperity: expect.any(Number),
          }),
          1
        )
      }, { timeout: 3000 })
    })
  })
})
