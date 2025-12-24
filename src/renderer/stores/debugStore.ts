import { create } from 'zustand'

export interface DebugLogEntry {
  id: number
  timestamp: Date
  type: 'request' | 'response' | 'error' | 'info'
  message: string
  data?: unknown
}

interface DebugStore {
  logs: DebugLogEntry[]
  isOpen: boolean
  nextId: number
  addLog: (type: DebugLogEntry['type'], message: string, data?: unknown) => void
  clearLogs: () => void
  togglePanel: () => void
}

export const useDebugStore = create<DebugStore>((set, get) => ({
  logs: [],
  isOpen: true, // Start open for debugging
  nextId: 1,

  addLog: (type, message, data) => {
    const entry: DebugLogEntry = {
      id: get().nextId,
      timestamp: new Date(),
      type,
      message,
      data,
    }
    set((state) => ({
      logs: [...state.logs.slice(-50), entry], // Keep last 50 logs
      nextId: state.nextId + 1,
    }))
  },

  clearLogs: () => set({ logs: [] }),

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
}))

// Helper to log from anywhere
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
