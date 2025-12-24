import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDebugStore, debugLog } from './debugStore'

describe('debugStore', () => {
  beforeEach(() => {
    useDebugStore.setState({ logs: [], nextId: 1, isOpen: true })
  })

  describe('initial state', () => {
    it('should have empty logs initially', () => {
      expect(useDebugStore.getState().logs).toEqual([])
    })

    it('should be open by default', () => {
      expect(useDebugStore.getState().isOpen).toBe(true)
    })

    it('should start with nextId of 1', () => {
      expect(useDebugStore.getState().nextId).toBe(1)
    })
  })

  describe('addLog', () => {
    it('should add a log entry with correct type', () => {
      useDebugStore.getState().addLog('info', 'Test message')

      const logs = useDebugStore.getState().logs
      expect(logs.length).toBe(1)
      expect(logs[0].type).toBe('info')
      expect(logs[0].message).toBe('Test message')
    })

    it('should add log with data', () => {
      const testData = { key: 'value' }
      useDebugStore.getState().addLog('request', 'API call', testData)

      const logs = useDebugStore.getState().logs
      expect(logs[0].data).toEqual(testData)
    })

    it('should increment id for each log', () => {
      useDebugStore.getState().addLog('info', 'First')
      useDebugStore.getState().addLog('info', 'Second')

      const logs = useDebugStore.getState().logs
      expect(logs[0].id).toBe(1)
      expect(logs[1].id).toBe(2)
    })

    it('should include timestamp', () => {
      const before = new Date()
      useDebugStore.getState().addLog('info', 'Test')
      const after = new Date()

      const timestamp = useDebugStore.getState().logs[0].timestamp
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should keep only last 50 logs', () => {
      for (let i = 0; i < 60; i++) {
        useDebugStore.getState().addLog('info', `Log ${i}`)
      }

      const logs = useDebugStore.getState().logs
      expect(logs.length).toBe(50)
      expect(logs[0].message).toBe('Log 10') // First 10 should be removed
      expect(logs[49].message).toBe('Log 59')
    })

    it('should handle all log types', () => {
      useDebugStore.getState().addLog('request', 'Request')
      useDebugStore.getState().addLog('response', 'Response')
      useDebugStore.getState().addLog('error', 'Error')
      useDebugStore.getState().addLog('info', 'Info')

      const logs = useDebugStore.getState().logs
      expect(logs[0].type).toBe('request')
      expect(logs[1].type).toBe('response')
      expect(logs[2].type).toBe('error')
      expect(logs[3].type).toBe('info')
    })
  })

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      useDebugStore.getState().addLog('info', 'Test 1')
      useDebugStore.getState().addLog('info', 'Test 2')
      expect(useDebugStore.getState().logs.length).toBe(2)

      useDebugStore.getState().clearLogs()
      expect(useDebugStore.getState().logs).toEqual([])
    })
  })

  describe('togglePanel', () => {
    it('should toggle isOpen from true to false', () => {
      expect(useDebugStore.getState().isOpen).toBe(true)
      useDebugStore.getState().togglePanel()
      expect(useDebugStore.getState().isOpen).toBe(false)
    })

    it('should toggle isOpen from false to true', () => {
      useDebugStore.setState({ isOpen: false })
      useDebugStore.getState().togglePanel()
      expect(useDebugStore.getState().isOpen).toBe(true)
    })
  })

  describe('debugLog helper', () => {
    beforeEach(() => {
      useDebugStore.setState({ logs: [], nextId: 1 })
    })

    it('debugLog.info should add info log', () => {
      debugLog.info('Info message')
      expect(useDebugStore.getState().logs[0].type).toBe('info')
      expect(useDebugStore.getState().logs[0].message).toBe('Info message')
    })

    it('debugLog.request should add request log', () => {
      debugLog.request('API request', { url: '/test' })
      const log = useDebugStore.getState().logs[0]
      expect(log.type).toBe('request')
      expect(log.message).toBe('API request')
      expect(log.data).toEqual({ url: '/test' })
    })

    it('debugLog.response should add response log', () => {
      debugLog.response('Got response')
      expect(useDebugStore.getState().logs[0].type).toBe('response')
    })

    it('debugLog.error should add error log', () => {
      debugLog.error('Something failed')
      expect(useDebugStore.getState().logs[0].type).toBe('error')
    })

    it('debugLog helpers should work with optional data', () => {
      debugLog.info('No data')
      debugLog.info('With data', { test: true })

      const logs = useDebugStore.getState().logs
      expect(logs[0].data).toBeUndefined()
      expect(logs[1].data).toEqual({ test: true })
    })
  })
})
