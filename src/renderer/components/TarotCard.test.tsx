import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TarotCard } from './TarotCard'
import { mockChoiceA, mockChoiceB } from '../../test/fixtures'

describe('TarotCard', () => {
  const defaultProps = {
    cardName: 'The Path of Power',
    cardNumber: 1,
    description: 'A test dilemma',
    choice: mockChoiceA,
    side: 'A' as const,
    onSelect: vi.fn(),
    isSelected: false,
    disabled: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('should render the choice label', () => {
      render(<TarotCard {...defaultProps} />)
      // Label appears on both front and back of card
      const labels = screen.getAllByText('The Conqueror')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('should render the choice description', () => {
      render(<TarotCard {...defaultProps} />)
      expect(screen.getByText(/Expand through might/)).toBeInTheDocument()
    })

    it('should render Roman numeral for card number 1', () => {
      render(<TarotCard {...defaultProps} cardNumber={1} />)
      expect(screen.getByText('I')).toBeInTheDocument()
    })

    it('should render Roman numeral for card number 5', () => {
      render(<TarotCard {...defaultProps} cardNumber={5} />)
      expect(screen.getByText('V')).toBeInTheDocument()
    })

    it('should render Roman numeral for card number 10', () => {
      render(<TarotCard {...defaultProps} cardNumber={10} />)
      expect(screen.getByText('X')).toBeInTheDocument()
    })

    it('should fall back to number for card > 10', () => {
      render(<TarotCard {...defaultProps} cardNumber={11} />)
      expect(screen.getByText('11')).toBeInTheDocument()
    })

    it('should render "Click to Choose This Path" prompt', () => {
      render(<TarotCard {...defaultProps} />)
      expect(screen.getByText('Click to Choose This Path')).toBeInTheDocument()
    })
  })

  describe('trait effects', () => {
    it('should render positive trait effects with ↑', () => {
      render(<TarotCard {...defaultProps} />)
      expect(screen.getByText(/↑ militarism/)).toBeInTheDocument()
    })

    it('should render negative trait effects with ↓', () => {
      render(<TarotCard {...defaultProps} />)
      expect(screen.getByText(/↓ prosperity/)).toBeInTheDocument()
    })

    it('should render choice B trait effects', () => {
      render(<TarotCard {...defaultProps} choice={mockChoiceB} />)
      expect(screen.getByText(/↑ prosperity/)).toBeInTheDocument()
      expect(screen.getByText(/↑ openness/)).toBeInTheDocument()
    })
  })

  describe('image display', () => {
    it('should show loading indicator when no image', () => {
      render(<TarotCard {...defaultProps} />)
      expect(screen.getByText('☽')).toBeInTheDocument()
      expect(screen.getByText('Generating...')).toBeInTheDocument()
    })

    it('should display image when imageUrl is provided', () => {
      render(<TarotCard {...defaultProps} imageUrl="https://example.com/image.png" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'https://example.com/image.png')
      expect(img).toHaveAttribute('alt', 'The Conqueror')
    })

    it('should not show loading indicator when image is loaded', () => {
      render(<TarotCard {...defaultProps} imageUrl="https://example.com/image.png" />)
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument()
    })
  })

  describe('click behavior', () => {
    it('should flip card on click', () => {
      render(<TarotCard {...defaultProps} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')

      fireEvent.click(card!)

      expect(card).toHaveClass('flipped')
    })

    it('should call onSelect after flip animation (600ms)', async () => {
      render(<TarotCard {...defaultProps} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')

      fireEvent.click(card!)

      expect(defaultProps.onSelect).not.toHaveBeenCalled()

      vi.advanceTimersByTime(600)

      expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
    })

    it('should not flip when disabled', () => {
      render(<TarotCard {...defaultProps} disabled={true} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')

      fireEvent.click(card!)

      expect(card).not.toHaveClass('flipped')
      expect(defaultProps.onSelect).not.toHaveBeenCalled()
    })

    it('should not call onSelect multiple times on multiple clicks', () => {
      render(<TarotCard {...defaultProps} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')

      fireEvent.click(card!)
      fireEvent.click(card!)
      fireEvent.click(card!)

      vi.advanceTimersByTime(600)

      expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('disabled state', () => {
    it('should have opacity-50 when disabled and not selected', () => {
      render(<TarotCard {...defaultProps} disabled={true} isSelected={false} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')
      expect(card).toHaveClass('opacity-50')
    })

    it('should have cursor-not-allowed when disabled', () => {
      render(<TarotCard {...defaultProps} disabled={true} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')
      expect(card).toHaveClass('cursor-not-allowed')
    })

    it('should not have opacity-50 when disabled but selected', () => {
      render(<TarotCard {...defaultProps} disabled={true} isSelected={true} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')
      expect(card).not.toHaveClass('opacity-50')
    })
  })

  describe('selected state', () => {
    it('should show "Path Chosen" badge when flipped', () => {
      render(<TarotCard {...defaultProps} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')

      fireEvent.click(card!)

      // The "Path Chosen" text is on the back face
      expect(screen.getByText('Path Chosen')).toBeInTheDocument()
    })

    it('should show world events when flipped', () => {
      render(<TarotCard {...defaultProps} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')

      fireEvent.click(card!)

      expect(screen.getByText('Military encampments appear')).toBeInTheDocument()
      expect(screen.getByText('Fortifications are strengthened')).toBeInTheDocument()
    })

    it('should show "Traits Affected" section when flipped', () => {
      render(<TarotCard {...defaultProps} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')

      fireEvent.click(card!)

      expect(screen.getByText('Traits Affected')).toBeInTheDocument()
    })
  })

  describe('hover behavior', () => {
    it('should update hover state on mouse enter/leave', () => {
      render(<TarotCard {...defaultProps} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')

      fireEvent.mouseEnter(card!)
      // Card back should have hover effects (ring-2)
      const cardBack = card!.querySelector('.card-face')
      expect(cardBack).toHaveClass('ring-2')

      fireEvent.mouseLeave(card!)
      expect(cardBack).not.toHaveClass('ring-2')
    })

    it('should not show hover effects when disabled', () => {
      render(<TarotCard {...defaultProps} disabled={true} />)
      const card = screen.getAllByText('The Conqueror')[0].closest('.card-flip')

      fireEvent.mouseEnter(card!)

      const cardBack = card!.querySelector('.card-face')
      expect(cardBack).not.toHaveClass('ring-2')
    })
  })
})
