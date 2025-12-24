import * as React from 'react'
import type { UE5Command, WorldState } from '../../shared/types'
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

const INITIAL_STATE: UE5BridgeState = {
  status: 'disconnected',
  lastError: null,
  commandQueue: [],
}

// ============================================================================
// UE5 Bridge Class
// ============================================================================

/**
 * Bridge for communicating with Unreal Engine 5 via WebSocket.
 * Manages connection state and command queuing.
 */
class UE5Bridge {
  private state: UE5BridgeState = { ...INITIAL_STATE }
  private listeners: Set<(state: UE5BridgeState) => void> = new Set()
  private reconnectTimeout: number | null = null

  // --------------------------------------------------------------------------
  // Subscription Management
  // --------------------------------------------------------------------------

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(listener: (state: UE5BridgeState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state))
  }

  private setState(partial: Partial<UE5BridgeState>): void {
    this.state = { ...this.state, ...partial }
    this.notify()
  }

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  /** Connect to UE5 WebSocket server */
  async connect(host: string = DEFAULT_HOST, port: number = DEFAULT_PORT): Promise<boolean> {
    if (this.isConnectedOrConnecting()) {
      return this.state.status === 'connected'
    }

    this.setState({ status: 'connecting', lastError: null })

    try {
      const connected = await this.attemptConnection(host, port)
      if (connected) {
        this.setState({ status: 'connected' })
        await this.flushQueue()
        return true
      }

      this.setConnectionError('Failed to connect to UE5. Is the plugin running?')
      return false
    } catch (err) {
      this.setConnectionError(err instanceof Error ? err.message : 'Connection failed')
      return false
    }
  }

  /** Disconnect from UE5 */
  disconnect(): void {
    this.clearReconnectTimeout()
    this.setState({ status: 'disconnected' })
  }

  private isConnectedOrConnecting(): boolean {
    return this.state.status === 'connected' || this.state.status === 'connecting'
  }

  private async attemptConnection(host: string, port: number): Promise<boolean> {
    if (!window.worldforge) {
      return false
    }
    const result = await window.worldforge.connectToUE5({ host, port })
    return result.success
  }

  private setConnectionError(message: string): void {
    this.setState({ status: 'error', lastError: message })
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  // --------------------------------------------------------------------------
  // Command Sending
  // --------------------------------------------------------------------------

  /** Send a command to UE5. Queues if not connected. */
  async sendCommand(command: UE5Command): Promise<boolean> {
    if (this.state.status !== 'connected') {
      this.queueCommand(command)
      return false
    }

    return this.executeCommand(command)
  }

  private queueCommand(command: UE5Command): void {
    this.setState({
      commandQueue: [...this.state.commandQueue, command],
    })
    debugLog.info(`UE5 not connected, command queued: ${command.type}`)
  }

  private async executeCommand(command: UE5Command): Promise<boolean> {
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

  private async flushQueue(): Promise<void> {
    const queue = [...this.state.commandQueue]
    this.setState({ commandQueue: [] })

    for (const command of queue) {
      await this.sendCommand(command)
    }
  }

  // --------------------------------------------------------------------------
  // Convenience Methods
  // --------------------------------------------------------------------------

  /** Sync the full world state to UE5 */
  async syncWorldState(state: WorldState): Promise<boolean> {
    return this.sendCommand({ type: 'SYNC_WORLD_STATE', state })
  }

  /** Set a specific world trait */
  async setTrait(trait: keyof WorldState['traits'], value: number): Promise<boolean> {
    return this.sendCommand({ type: 'SET_TRAIT', trait, value })
  }

  /** Set the world atmosphere */
  async setAtmosphere(atmosphere: WorldState['atmosphere']): Promise<boolean> {
    return this.sendCommand({ type: 'SET_ATMOSPHERE', atmosphere })
  }

  // --------------------------------------------------------------------------
  // State Accessors
  // --------------------------------------------------------------------------

  /** Get current connection status */
  getStatus(): ConnectionStatus {
    return this.state.status
  }

  /** Get last error message, if any */
  getLastError(): string | null {
    return this.state.lastError
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const ue5Bridge = new UE5Bridge()

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for accessing UE5 bridge state and methods.
 * Automatically subscribes to state changes.
 */
export function useUE5Bridge() {
  const [state, setState] = React.useState<UE5BridgeState>({ ...INITIAL_STATE })

  React.useEffect(() => {
    return ue5Bridge.subscribe(setState)
  }, [])

  return {
    ...state,
    connect: ue5Bridge.connect.bind(ue5Bridge),
    disconnect: ue5Bridge.disconnect.bind(ue5Bridge),
    sendCommand: ue5Bridge.sendCommand.bind(ue5Bridge),
    syncWorldState: ue5Bridge.syncWorldState.bind(ue5Bridge),
  }
}
