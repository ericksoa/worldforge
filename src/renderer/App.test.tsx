import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { useWorldStore } from './stores/worldStore'
import { useDebugStore } from './stores/debugStore'
import { mockEra } from '../test/fixtures'

// Mock child components to isolate App testing
vi.mock('./components/EraSelector', () => ({
  EraSelector: ({ onSelect }: { onSelect: (era: typeof mockEra) => void }) => (
    <div data-testid="era-selector">
      <button onClick={() => onSelect(mockEra)}>Select Era</button>
    </div>
  ),
}))

vi.mock('./components/TarotSpread', () => ({
  TarotSpread: () => <div data-testid="tarot-spread">Tarot Spread</div>,
}))

vi.mock('./components/WorldPreview', () => ({
  WorldPreview: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="world-preview">
      <button onClick={onBack}>Back from Preview</button>
    </div>
  ),
}))

vi.mock('./components/DebugPanel', () => ({
  DebugPanel: () => <div data-testid="debug-panel">Debug Panel</div>,
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWorldStore.getState().resetWorld()
    useDebugStore.setState({ logs: [], nextId: 1 })
  })

  describe('initial rendering', () => {
    it('should render the WorldForge title', () => {
      render(<App />)
      expect(screen.getByText('WorldForge')).toBeInTheDocument()
    })

    it('should render the footer', () => {
      render(<App />)
      expect(screen.getByText('Shape your world through the wisdom of the cards')).toBeInTheDocument()
    })

    it('should render the EraSelector by default', () => {
      render(<App />)
      expect(screen.getByTestId('era-selector')).toBeInTheDocument()
    })

    it('should render the DebugPanel', () => {
      render(<App />)
      expect(screen.getByTestId('debug-panel')).toBeInTheDocument()
    })

    it('should not show back button on era-select screen', () => {
      render(<App />)
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
      // Check for the SVG path that represents the back arrow
      expect(document.querySelector('svg path[d="M15 19l-7-7 7-7"]')).not.toBeInTheDocument()
    })

    it('should not show era header when no era selected', () => {
      render(<App />)
      expect(screen.queryByText('Era:')).not.toBeInTheDocument()
    })
  })

  describe('navigation: era-select to tarot', () => {
    it('should navigate to tarot screen when era is selected', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))

      expect(screen.getByTestId('tarot-spread')).toBeInTheDocument()
      expect(screen.queryByTestId('era-selector')).not.toBeInTheDocument()
    })

    it('should show era name in header after selection', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))

      expect(screen.getByText('Era:')).toBeInTheDocument()
      expect(screen.getByText('Normandy')).toBeInTheDocument()
    })

    it('should show View World button on tarot screen', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))

      expect(screen.getByText('View World')).toBeInTheDocument()
    })

    it('should show back button on tarot screen', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))

      // Back button is an SVG, check the container button exists
      const backButton = document.querySelector('svg path[d="M15 19l-7-7 7-7"]')
      expect(backButton).toBeInTheDocument()
    })

    it('should set era in store when selected', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))

      expect(useWorldStore.getState().era?.id).toBe('normandy_10th')
    })
  })

  describe('navigation: tarot to preview', () => {
    it('should navigate to preview when View World is clicked', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))
      fireEvent.click(screen.getByText('View World'))

      expect(screen.getByTestId('world-preview')).toBeInTheDocument()
      expect(screen.queryByTestId('tarot-spread')).not.toBeInTheDocument()
    })

    it('should not show View World button on preview screen', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))
      fireEvent.click(screen.getByText('View World'))

      expect(screen.queryByText('View World')).not.toBeInTheDocument()
    })

    it('should still show era name on preview screen', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))
      fireEvent.click(screen.getByText('View World'))

      expect(screen.getByText('Era:')).toBeInTheDocument()
      expect(screen.getByText('Normandy')).toBeInTheDocument()
    })
  })

  describe('navigation: back button behavior', () => {
    it('should return to era-select from tarot and reset world', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))
      expect(useWorldStore.getState().era).not.toBeNull()

      // Click back button (find the button containing the SVG)
      const backButton = document.querySelector('button:has(svg path[d="M15 19l-7-7 7-7"])')
      fireEvent.click(backButton!)

      expect(screen.getByTestId('era-selector')).toBeInTheDocument()
      expect(useWorldStore.getState().era).toBeNull()
    })

    it('should return to tarot from preview without resetting world', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))
      fireEvent.click(screen.getByText('View World'))

      // Use the onBack callback from WorldPreview mock
      fireEvent.click(screen.getByText('Back from Preview'))

      expect(screen.getByTestId('tarot-spread')).toBeInTheDocument()
      expect(useWorldStore.getState().era).not.toBeNull()
    })

    it('should use header back button to return from preview to tarot', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Select Era'))
      fireEvent.click(screen.getByText('View World'))

      // Click header back button
      const backButton = document.querySelector('button:has(svg path[d="M15 19l-7-7 7-7"])')
      fireEvent.click(backButton!)

      expect(screen.getByTestId('tarot-spread')).toBeInTheDocument()
    })
  })

  describe('header visibility', () => {
    it('should always show WorldForge title', () => {
      render(<App />)
      expect(screen.getByText('WorldForge')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Select Era'))
      expect(screen.getByText('WorldForge')).toBeInTheDocument()

      fireEvent.click(screen.getByText('View World'))
      expect(screen.getByText('WorldForge')).toBeInTheDocument()
    })
  })

  describe('ErrorBoundary', () => {
    // ErrorBoundary is difficult to test directly, but we can verify it renders children
    it('should render children when no error occurs', () => {
      render(<App />)
      expect(screen.getByText('WorldForge')).toBeInTheDocument()
    })
  })
})
