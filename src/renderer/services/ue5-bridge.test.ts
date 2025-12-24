import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockWorldforge } from '../../test/setup'
import { mockWorldState } from '../../test/fixtures'

// Create a fresh UE5Bridge for each test by re-importing
let ue5Bridge: typeof import('./ue5-bridge').ue5Bridge

describe('UE5Bridge', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset module to get fresh singleton
    vi.resetModules()
    const module = await import('./ue5-bridge')
    ue5Bridge = module.ue5Bridge
  })

  describe('initial state', () => {
    it('should start disconnected', () => {
      expect(ue5Bridge.getStatus()).toBe('disconnected')
    })

    it('should have no error initially', () => {
      expect(ue5Bridge.getLastError()).toBeNull()
    })
  })

  describe('connect', () => {
    it('should call window.worldforge.connectToUE5 with host and port', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })

      await ue5Bridge.connect('192.168.1.100', 9000)

      expect(mockWorldforge.connectToUE5).toHaveBeenCalledWith({
        host: '192.168.1.100',
        port: 9000,
      })
    })

    it('should use default host and port', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })

      await ue5Bridge.connect()

      expect(mockWorldforge.connectToUE5).toHaveBeenCalledWith({
        host: 'localhost',
        port: 8765,
      })
    })

    it('should set status to connected on success', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })

      await ue5Bridge.connect()

      expect(ue5Bridge.getStatus()).toBe('connected')
    })

    it('should return true on successful connection', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })

      const result = await ue5Bridge.connect()

      expect(result).toBe(true)
    })

    it('should set status to error on failure', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: false })

      await ue5Bridge.connect()

      expect(ue5Bridge.getStatus()).toBe('error')
    })

    it('should set lastError on failure', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: false })

      await ue5Bridge.connect()

      expect(ue5Bridge.getLastError()).toBe('Failed to connect to UE5. Is the plugin running?')
    })

    it('should return false on failure', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: false })

      const result = await ue5Bridge.connect()

      expect(result).toBe(false)
    })

    it('should handle connection errors', async () => {
      mockWorldforge.connectToUE5.mockRejectedValue(new Error('Network error'))

      await ue5Bridge.connect()

      expect(ue5Bridge.getStatus()).toBe('error')
      expect(ue5Bridge.getLastError()).toBe('Network error')
    })

    it('should not reconnect if already connected', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })

      await ue5Bridge.connect()
      const result = await ue5Bridge.connect() // Second call

      expect(mockWorldforge.connectToUE5).toHaveBeenCalledTimes(1)
      expect(result).toBe(true)
    })
  })

  describe('disconnect', () => {
    it('should set status to disconnected', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })
      await ue5Bridge.connect()

      ue5Bridge.disconnect()

      expect(ue5Bridge.getStatus()).toBe('disconnected')
    })
  })

  describe('sendCommand', () => {
    it('should send command when connected', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })
      mockWorldforge.sendToUE5.mockResolvedValue({ success: true })

      await ue5Bridge.connect()
      const result = await ue5Bridge.sendCommand({ type: 'SET_ATMOSPHERE', atmosphere: 'war_torn' })

      expect(mockWorldforge.sendToUE5).toHaveBeenCalledWith({
        type: 'SET_ATMOSPHERE',
        atmosphere: 'war_torn',
      })
      expect(result).toBe(true)
    })

    it('should queue command when not connected', async () => {
      const result = await ue5Bridge.sendCommand({ type: 'SET_ATMOSPHERE', atmosphere: 'war_torn' })

      expect(mockWorldforge.sendToUE5).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('should flush queue on successful connection', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })
      mockWorldforge.sendToUE5.mockResolvedValue({ success: true })

      // Queue some commands
      await ue5Bridge.sendCommand({ type: 'SET_ATMOSPHERE', atmosphere: 'war_torn' })
      await ue5Bridge.sendCommand({ type: 'SET_TRAIT', trait: 'militarism', value: 0.8 })

      expect(mockWorldforge.sendToUE5).not.toHaveBeenCalled()

      // Connect
      await ue5Bridge.connect()

      expect(mockWorldforge.sendToUE5).toHaveBeenCalledTimes(2)
    })

    it('should return false on send error', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })
      mockWorldforge.sendToUE5.mockRejectedValue(new Error('Send error'))

      await ue5Bridge.connect()
      const result = await ue5Bridge.sendCommand({ type: 'SET_ATMOSPHERE', atmosphere: 'war_torn' })

      expect(result).toBe(false)
    })
  })

  describe('syncWorldState', () => {
    it('should send SYNC_WORLD_STATE command', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })
      mockWorldforge.sendToUE5.mockResolvedValue({ success: true })

      await ue5Bridge.connect()
      await ue5Bridge.syncWorldState(mockWorldState)

      expect(mockWorldforge.sendToUE5).toHaveBeenCalledWith({
        type: 'SYNC_WORLD_STATE',
        state: mockWorldState,
      })
    })
  })

  describe('setTrait', () => {
    it('should send SET_TRAIT command', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })
      mockWorldforge.sendToUE5.mockResolvedValue({ success: true })

      await ue5Bridge.connect()
      await ue5Bridge.setTrait('militarism', 0.75)

      expect(mockWorldforge.sendToUE5).toHaveBeenCalledWith({
        type: 'SET_TRAIT',
        trait: 'militarism',
        value: 0.75,
      })
    })
  })

  describe('setAtmosphere', () => {
    it('should send SET_ATMOSPHERE command', async () => {
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })
      mockWorldforge.sendToUE5.mockResolvedValue({ success: true })

      await ue5Bridge.connect()
      await ue5Bridge.setAtmosphere('sacred')

      expect(mockWorldforge.sendToUE5).toHaveBeenCalledWith({
        type: 'SET_ATMOSPHERE',
        atmosphere: 'sacred',
      })
    })
  })

  describe('subscribe', () => {
    it('should call listener immediately with current state', () => {
      const listener = vi.fn()

      ue5Bridge.subscribe(listener)

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        status: 'disconnected',
      }))
    })

    it('should call listener on state changes', async () => {
      const listener = vi.fn()
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })

      ue5Bridge.subscribe(listener)
      await ue5Bridge.connect()

      // Called once on subscribe, then on connecting, then on connected
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        status: 'connected',
      }))
    })

    it('should return unsubscribe function', async () => {
      const listener = vi.fn()
      mockWorldforge.connectToUE5.mockResolvedValue({ success: true })

      const unsubscribe = ue5Bridge.subscribe(listener)
      listener.mockClear()
      unsubscribe()

      await ue5Bridge.connect()

      expect(listener).not.toHaveBeenCalled()
    })
  })
})
