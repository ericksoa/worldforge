import { create } from 'zustand'
import type { UE5Command, WorldState, Landmark } from '../../shared/types'
import { debugLog } from '../stores/debugStore'

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface UE5BridgeState {
  status: ConnectionStatus
  lastError: string | null
  commandQueue: UE5Command[]
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 8765

// ============================================================================
// Zustand Store
// ============================================================================

interface UE5BridgeStore extends UE5BridgeState {
  // Connection management
  connect: (host?: string, port?: number) => Promise<boolean>
  disconnect: () => void

  // Command sending
  sendCommand: (command: UE5Command) => Promise<boolean>

  // Convenience methods
  syncWorldState: (state: WorldState) => Promise<boolean>
  setTrait: (trait: keyof WorldState['traits'], value: number) => Promise<boolean>
  setAtmosphere: (atmosphere: WorldState['atmosphere']) => Promise<boolean>
  spawnSettlement: (settlement: Landmark) => Promise<boolean>

  // For testing - reset state
  _reset: () => void
}

export const useUE5BridgeStore = create<UE5BridgeStore>((set, get) => ({
  // Initial state
  status: 'disconnected',
  lastError: null,
  commandQueue: [],

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  connect: async (host = DEFAULT_HOST, port = DEFAULT_PORT) => {
    const { status } = get()

    // Don't reconnect if already connected or connecting
    if (status === 'connected' || status === 'connecting') {
      return status === 'connected'
    }

    set({ status: 'connecting', lastError: null })

    try {
      const connected = await attemptConnection(host, port)

      if (connected) {
        set({ status: 'connected' })
        await flushQueue(get, set)
        return true
      }

      set({ status: 'error', lastError: 'Failed to connect to UE5. Is the plugin running?' })
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      set({ status: 'error', lastError: message })
      return false
    }
  },

  disconnect: () => {
    set({ status: 'disconnected' })
  },

  // --------------------------------------------------------------------------
  // Command Sending
  // --------------------------------------------------------------------------

  sendCommand: async (command) => {
    const { status, commandQueue } = get()

    if (status !== 'connected') {
      set({ commandQueue: [...commandQueue, command] })
      debugLog.info(`UE5 not connected, command queued: ${command.type}`)
      return false
    }

    return executeCommand(command)
  },

  // --------------------------------------------------------------------------
  // Convenience Methods
  // --------------------------------------------------------------------------

  syncWorldState: async (state) => {
    return get().sendCommand({ type: 'SYNC_WORLD_STATE', state })
  },

  setTrait: async (trait, value) => {
    return get().sendCommand({ type: 'SET_TRAIT', trait, value })
  },

  setAtmosphere: async (atmosphere) => {
    return get().sendCommand({ type: 'SET_ATMOSPHERE', atmosphere })
  },

  spawnSettlement: async (settlement) => {
    debugLog.info(`Spawning settlement: ${settlement.name} (${settlement.type})`)
    return get().sendCommand({ type: 'SPAWN_SETTLEMENT', settlement })
  },

  // --------------------------------------------------------------------------
  // Testing Helper
  // --------------------------------------------------------------------------

  _reset: () => {
    set({ status: 'disconnected', lastError: null, commandQueue: [] })
  },
}))

// ============================================================================
// Pure Helper Functions
// ============================================================================

/** Attempt to establish WebSocket connection */
async function attemptConnection(host: string, port: number): Promise<boolean> {
  if (!window.worldforge) {
    return false
  }
  const result = await window.worldforge.connectToUE5({ host, port })
  return result.success
}

/** Execute a command via the bridge */
async function executeCommand(command: UE5Command): Promise<boolean> {
  try {
    if (!window.worldforge) {
      return false
    }
    const result = await window.worldforge.sendToUE5(command)
    return result.success
  } catch (err) {
    debugLog.error(`Failed to send command to UE5: ${err}`)
    return false
  }
}

/** Flush queued commands after successful connection */
async function flushQueue(
  get: () => UE5BridgeStore,
  set: (partial: Partial<UE5BridgeState>) => void
): Promise<void> {
  const queue = [...get().commandQueue]
  set({ commandQueue: [] })

  for (const command of queue) {
    await get().sendCommand(command)
  }
}

// ============================================================================
// Legacy API (for backward compatibility)
// ============================================================================

/**
 * Legacy bridge object for backward compatibility.
 * Prefer using useUE5BridgeStore hook directly.
 */
export const ue5Bridge = {
  connect: (host?: string, port?: number) => useUE5BridgeStore.getState().connect(host, port),
  disconnect: () => useUE5BridgeStore.getState().disconnect(),
  sendCommand: (command: UE5Command) => useUE5BridgeStore.getState().sendCommand(command),
  syncWorldState: (state: WorldState) => useUE5BridgeStore.getState().syncWorldState(state),
  setTrait: (trait: keyof WorldState['traits'], value: number) =>
    useUE5BridgeStore.getState().setTrait(trait, value),
  setAtmosphere: (atmosphere: WorldState['atmosphere']) =>
    useUE5BridgeStore.getState().setAtmosphere(atmosphere),
  spawnSettlement: (settlement: Landmark) =>
    useUE5BridgeStore.getState().spawnSettlement(settlement),
  getStatus: () => useUE5BridgeStore.getState().status,
  getLastError: () => useUE5BridgeStore.getState().lastError,
  subscribe: (listener: (state: UE5BridgeState) => void) => {
    // Call listener immediately with current state (matches original behavior)
    const currentState = useUE5BridgeStore.getState()
    listener({ status: currentState.status, lastError: currentState.lastError, commandQueue: currentState.commandQueue })

    // Zustand subscribe returns unsubscribe function
    return useUE5BridgeStore.subscribe((state) =>
      listener({ status: state.status, lastError: state.lastError, commandQueue: state.commandQueue })
    )
  },
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for accessing UE5 bridge state and methods.
 * Uses Zustand store directly - automatically subscribes to state changes.
 */
export function useUE5Bridge() {
  const state = useUE5BridgeStore()
  return {
    status: state.status,
    lastError: state.lastError,
    commandQueue: state.commandQueue,
    connect: state.connect,
    disconnect: state.disconnect,
    sendCommand: state.sendCommand,
    syncWorldState: state.syncWorldState,
  }
}
