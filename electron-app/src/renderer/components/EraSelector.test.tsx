import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EraSelector } from './EraSelector'
import type { Era } from '../../shared/types'

describe('EraSelector', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the title', () => {
      render(<EraSelector onSelect={mockOnSelect} />)
      expect(screen.getByText('Choose Your Era')).toBeInTheDocument()
    })

    it('should render the description', () => {
      render(<EraSelector onSelect={mockOnSelect} />)
      expect(screen.getByText(/Select the age in which your world shall be forged/)).toBeInTheDocument()
    })

    it('should render all 6 eras', () => {
      render(<EraSelector onSelect={mockOnSelect} />)
      expect(screen.getByText('10th Century Normandy')).toBeInTheDocument()
      expect(screen.getByText('6th Century Byzantium')).toBeInTheDocument()
      expect(screen.getByText('13th Century Mongolia')).toBeInTheDocument()
      expect(screen.getByText('16th Century Japan')).toBeInTheDocument()
      expect(screen.getByText('14th Century BCE Egypt')).toBeInTheDocument()
      expect(screen.getByText('9th Century Scandinavia')).toBeInTheDocument()
    })

    it('should render era periods', () => {
      render(<EraSelector onSelect={mockOnSelect} />)
      expect(screen.getByText('911 - 1066 CE')).toBeInTheDocument()
      expect(screen.getByText('527 - 565 CE')).toBeInTheDocument()
    })

    it('should render era descriptions', () => {
      render(<EraSelector onSelect={mockOnSelect} />)
      expect(screen.getByText(/The age of Vikings turned Norman lords/)).toBeInTheDocument()
    })
  })

  describe('trait badges', () => {
    it('should show Warlike badge for high militarism eras', () => {
      render(<EraSelector onSelect={mockOnSelect} />)
      // Normandy (0.7), Mongolia (0.9), Japan (0.8), Viking (0.8) should have Warlike
      const warlikeBadges = screen.getAllByText('Warlike')
      expect(warlikeBadges.length).toBeGreaterThanOrEqual(4)
    })

    it('should show Prosperous badge for high prosperity eras', () => {
      render(<EraSelector onSelect={mockOnSelect} />)
      // Byzantium (0.7) should have Prosperous
      expect(screen.getByText('Prosperous')).toBeInTheDocument()
    })

    it('should show Devout badge for high religiosity eras', () => {
      render(<EraSelector onSelect={mockOnSelect} />)
      // Byzantium (0.8), Egypt (0.9) should have Devout
      const devoutBadges = screen.getAllByText('Devout')
      expect(devoutBadges.length).toBe(2)
    })

    it('should show Open badge for high openness eras', () => {
      render(<EraSelector onSelect={mockOnSelect} />)
      // Viking (0.7) should have Open
      expect(screen.getByText('Open')).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('should call onSelect with era when clicked', () => {
      render(<EraSelector onSelect={mockOnSelect} />)

      fireEvent.click(screen.getByText('10th Century Normandy'))

      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'normandy_10th',
          name: '10th Century Normandy',
        })
      )
    })

    it('should pass complete era object with all properties', () => {
      render(<EraSelector onSelect={mockOnSelect} />)

      fireEvent.click(screen.getByText('6th Century Byzantium'))

      const calledEra = mockOnSelect.mock.calls[0][0] as Era
      expect(calledEra.id).toBe('byzantine_6th')
      expect(calledEra.baseTraits).toBeDefined()
      expect(calledEra.aesthetics).toBeDefined()
      expect(calledEra.period).toBe('527 - 565 CE')
    })

    it('should be keyboard accessible', () => {
      render(<EraSelector onSelect={mockOnSelect} />)

      const button = screen.getByText('10th Century Normandy').closest('button')
      expect(button).toHaveClass('focus:outline-none')
      expect(button).toHaveClass('focus:ring-2')
    })
  })
})
