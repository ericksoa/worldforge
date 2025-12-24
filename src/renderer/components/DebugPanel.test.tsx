import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DebugPanel } from './DebugPanel'
import { useDebugStore } from '../stores/debugStore'

describe('DebugPanel', () => {
  beforeEach(() => {
    useDebugStore.setState({ logs: [], nextId: 1, isOpen: true })
  })

  describe('rendering', () => {
    it('should render DEBUG label', () => {
      render(<DebugPanel />)
      expect(screen.getByText('DEBUG')).toBeInTheDocument()
    })

    it('should show log count', () => {
      render(<DebugPanel />)
      expect(screen.getByText('0 logs')).toBeInTheDocument()
    })

    it('should show singular "log" for 1 log', () => {
      useDebugStore.getState().addLog('info', 'Test')
      render(<DebugPanel />)
      expect(screen.getByText('1 log')).toBeInTheDocument()
    })

    it('should show "Waiting for activity..." when no logs', () => {
      render(<DebugPanel />)
      expect(screen.getByText('Waiting for activity...')).toBeInTheDocument()
    })

    it('should display log messages', () => {
      useDebugStore.getState().addLog('info', 'Test message')
      render(<DebugPanel />)
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    it('should display log data as JSON', () => {
      useDebugStore.getState().addLog('request', 'API call', { key: 'value' })
      render(<DebugPanel />)
      expect(screen.getByText(/"key": "value"/)).toBeInTheDocument()
    })
  })

  describe('log types', () => {
    it('should render request logs with → icon', () => {
      useDebugStore.getState().addLog('request', 'Request')
      render(<DebugPanel />)
      expect(screen.getByText('→')).toBeInTheDocument()
    })

    it('should render response logs with ← icon', () => {
      useDebugStore.getState().addLog('response', 'Response')
      render(<DebugPanel />)
      expect(screen.getByText('←')).toBeInTheDocument()
    })

    it('should render error logs with ✕ icon', () => {
      useDebugStore.getState().addLog('error', 'Error')
      render(<DebugPanel />)
      expect(screen.getByText('✕')).toBeInTheDocument()
    })

    it('should render info logs with • icon', () => {
      useDebugStore.getState().addLog('info', 'Info')
      render(<DebugPanel />)
      expect(screen.getByText('•')).toBeInTheDocument()
    })
  })

  describe('toggle functionality', () => {
    it('should show ▼ when open', () => {
      useDebugStore.setState({ isOpen: true })
      render(<DebugPanel />)
      expect(screen.getByText('▼')).toBeInTheDocument()
    })

    it('should show ▲ when closed', () => {
      useDebugStore.setState({ isOpen: false })
      render(<DebugPanel />)
      expect(screen.getByText('▲')).toBeInTheDocument()
    })

    it('should toggle panel on click', () => {
      render(<DebugPanel />)
      const toggleBar = screen.getByText('DEBUG').closest('div')
      fireEvent.click(toggleBar!)

      expect(useDebugStore.getState().isOpen).toBe(false)
    })

    it('should not show log panel when closed', () => {
      useDebugStore.setState({ isOpen: false })
      render(<DebugPanel />)
      expect(screen.queryByText('Waiting for activity...')).not.toBeInTheDocument()
    })
  })

  describe('clear functionality', () => {
    it('should show Clear button when open', () => {
      useDebugStore.setState({ isOpen: true })
      render(<DebugPanel />)
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    it('should not show Clear button when closed', () => {
      useDebugStore.setState({ isOpen: false })
      render(<DebugPanel />)
      expect(screen.queryByText('Clear')).not.toBeInTheDocument()
    })

    it('should clear logs when Clear button is clicked', () => {
      useDebugStore.getState().addLog('info', 'Test')
      expect(useDebugStore.getState().logs.length).toBe(1)

      render(<DebugPanel />)
      fireEvent.click(screen.getByText('Clear'))

      expect(useDebugStore.getState().logs).toEqual([])
    })

    it('should stop propagation when Clear is clicked', () => {
      useDebugStore.getState().addLog('info', 'Test')
      render(<DebugPanel />)

      fireEvent.click(screen.getByText('Clear'))

      // Panel should still be open (not toggled)
      expect(useDebugStore.getState().isOpen).toBe(true)
    })
  })

  describe('data display', () => {
    it('should display string data directly', () => {
      useDebugStore.getState().addLog('info', 'Message', 'string data')
      render(<DebugPanel />)
      expect(screen.getByText('string data')).toBeInTheDocument()
    })

    it('should truncate long data', () => {
      const longData = { key: 'a'.repeat(600) }
      useDebugStore.getState().addLog('info', 'Message', longData)
      render(<DebugPanel />)
      // Data should be truncated to 500 chars
      const dataElement = screen.getByText(/^{/)
      expect(dataElement.textContent!.length).toBeLessThanOrEqual(500)
    })
  })
})
