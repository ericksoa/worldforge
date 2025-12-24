import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorldPreview } from './WorldPreview'
import { useWorldStore } from '../stores/worldStore'
import { mockEra, mockDilemma } from '../../test/fixtures'

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url')
global.URL.revokeObjectURL = vi.fn()

describe('WorldPreview', () => {
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useWorldStore.getState().resetWorld()
  })

  describe('without era', () => {
    it('should render nothing when no era is set', () => {
      const { container } = render(<WorldPreview onBack={mockOnBack} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('with era set', () => {
    beforeEach(() => {
      useWorldStore.getState().setEra(mockEra)
    })

    it('should render atmosphere title', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('A Realm of Secrets')).toBeInTheDocument()
    })

    it('should render atmosphere description', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText(/Mists cling to ancient forests/)).toBeInTheDocument()
    })

    it('should render World Traits section', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('World Traits')).toBeInTheDocument()
    })

    it('should render all trait bars', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('militarism')).toBeInTheDocument()
      expect(screen.getByText('prosperity')).toBeInTheDocument()
      expect(screen.getByText('religiosity')).toBeInTheDocument()
      expect(screen.getByText('lawfulness')).toBeInTheDocument()
      expect(screen.getByText('openness')).toBeInTheDocument()
    })

    it('should render trait labels', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('Peaceful')).toBeInTheDocument()
      expect(screen.getByText('Warlike')).toBeInTheDocument()
    })

    it('should render era info', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText(/Era: Normandy/)).toBeInTheDocument()
      expect(screen.getByText('10th Century')).toBeInTheDocument()
    })

    it('should render Continue Forging button', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('Continue Forging')).toBeInTheDocument()
    })

    it('should render Export for UE5 button', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('Export for UE5')).toBeInTheDocument()
    })

    it('should show UE5 not connected status', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('UE5 Not Connected')).toBeInTheDocument()
    })
  })

  describe('choice history', () => {
    beforeEach(() => {
      useWorldStore.getState().setEra(mockEra)
    })

    it('should show empty state when no choices made', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('No choices made yet.')).toBeInTheDocument()
    })

    it('should show choice count', () => {
      useWorldStore.getState().recordChoice(mockDilemma, 'A')
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('Your Path (1 Choices)')).toBeInTheDocument()
    })

    it('should display choice history', () => {
      useWorldStore.getState().recordChoice(mockDilemma, 'A')
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('The Path of Power')).toBeInTheDocument()
      expect(screen.getByText('Chose: The Conqueror')).toBeInTheDocument()
    })

    it('should display multiple choices', () => {
      useWorldStore.getState().recordChoice(mockDilemma, 'A')
      useWorldStore.getState().recordChoice({ ...mockDilemma, id: 'second', cardName: 'Second Card' }, 'B')
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('The Path of Power')).toBeInTheDocument()
      expect(screen.getByText('Second Card')).toBeInTheDocument()
    })
  })

  describe('atmosphere changes', () => {
    beforeEach(() => {
      useWorldStore.getState().setEra(mockEra)
    })

    it('should show war_torn atmosphere', () => {
      useWorldStore.getState().setAtmosphere('war_torn')
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('A Land of Conflict')).toBeInTheDocument()
    })

    it('should show prosperous atmosphere', () => {
      useWorldStore.getState().setAtmosphere('prosperous')
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('A Golden Age')).toBeInTheDocument()
    })

    it('should show sacred atmosphere', () => {
      useWorldStore.getState().setAtmosphere('sacred')
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('A Holy Realm')).toBeInTheDocument()
    })

    it('should show desolate atmosphere', () => {
      useWorldStore.getState().setAtmosphere('desolate')
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('A Blighted Land')).toBeInTheDocument()
    })

    it('should show vibrant atmosphere', () => {
      useWorldStore.getState().setAtmosphere('vibrant')
      render(<WorldPreview onBack={mockOnBack} />)
      expect(screen.getByText('A Crossroads of Cultures')).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    beforeEach(() => {
      useWorldStore.getState().setEra(mockEra)
    })

    it('should call onBack when Continue Forging is clicked', () => {
      render(<WorldPreview onBack={mockOnBack} />)
      fireEvent.click(screen.getByText('Continue Forging'))
      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })

    it('should trigger export when Export button is clicked', () => {
      render(<WorldPreview onBack={mockOnBack} />)

      // Just verify the button exists and is clickable
      const exportButton = screen.getByText('Export for UE5')
      expect(exportButton).toBeInTheDocument()

      // Click should not throw
      fireEvent.click(exportButton)
      expect(URL.createObjectURL).toHaveBeenCalled()
    })
  })
})
