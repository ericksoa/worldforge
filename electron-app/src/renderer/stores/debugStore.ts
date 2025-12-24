import { create } from 'zustand'

// ============================================================================
// Types
// ============================================================================

export type LogType = 'request' | 'response' | 'error' | 'info'

export interface DebugLogEntry {
  id: number
  timestamp: Date
  type: LogType
  message: string
  data?: unknown
}

// ============================================================================
// Constants
// ============================================================================

const MAX_LOG_ENTRIES = 50

// ============================================================================
// Store
// ============================================================================

interface DebugStore {
  logs: DebugLogEntry[]
  isOpen: boolean
  nextId: number
  /** Add a log entry. Timestamp is injectable for testing (defaults to new Date()). */
  addLog: (type: LogType, message: string, data?: unknown, timestamp?: Date) => void
  clearLogs: () => void
  togglePanel: () => void
}

export const useDebugStore = create<DebugStore>((set, get) => ({
  logs: [],
  isOpen: true,
  nextId: 1,

  addLog: (type, message, data, timestamp = new Date()) => {
    const newEntry: DebugLogEntry = {
      id: get().nextId,
      timestamp,
      type,
      message,
      data,
    }

    set((state) => {
      // Keep only the most recent logs to prevent memory growth
      const recentLogs = state.logs.slice(-(MAX_LOG_ENTRIES - 1))
      return {
        logs: [...recentLogs, newEntry],
        nextId: state.nextId + 1,
      }
    })
  },

  clearLogs: () => set({ logs: [] }),

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
}))

// ============================================================================
// Convenience Logger
// ============================================================================

/**
 * Global debug logger for use anywhere in the app.
 * Logs are displayed in the DebugPanel component.
 */
export const debugLog = {
  info: (message: string, data?: unknown) =>
    useDebugStore.getState().addLog('info', message, data),

  request: (message: string, data?: unknown) =>
    useDebugStore.getState().addLog('request', message, data),

  response: (message: string, data?: unknown) =>
    useDebugStore.getState().addLog('response', message, data),

  error: (message: string, data?: unknown) =>
    useDebugStore.getState().addLog('error', message, data),
}
