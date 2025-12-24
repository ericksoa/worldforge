import type { UE5Command, WorldState } from '../../shared/types'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface UE5BridgeState {
  status: ConnectionStatus
  lastError: string | null
  commandQueue: UE5Command[]
}

class UE5Bridge {
  private state: UE5BridgeState = {
    status: 'disconnected',
    lastError: null,
    commandQueue: [],
  }

  private listeners: Set<(state: UE5BridgeState) => void> = new Set()
  private reconnectTimeout: number | null = null

  // Subscribe to state changes
  subscribe(listener: (state: UE5BridgeState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  private setState(partial: Partial<UE5BridgeState>) {
    this.state = { ...this.state, ...partial }
    this.notify()
  }

  // Connect to UE5 WebSocket server
  async connect(host: string = 'localhost', port: number = 8765): Promise<boolean> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      return this.state.status === 'connected'
    }

    this.setState({ status: 'connecting', lastError: null })

    try {
      if (window.worldforge) {
        const result = await window.worldforge.connectToUE5({ host, port })
        if (result.success) {
          this.setState({ status: 'connected' })
          // Flush command queue
          await this.flushQueue()
          return true
        }
      }

      this.setState({
        status: 'error',
        lastError: 'Failed to connect to UE5. Is the plugin running?',
      })
      return false
    } catch (err) {
      this.setState({
        status: 'error',
        lastError: err instanceof Error ? err.message : 'Connection failed',
      })
      return false
    }
  }

  // Disconnect from UE5
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.setState({ status: 'disconnected' })
  }

  // Send a command to UE5
  async sendCommand(command: UE5Command): Promise<boolean> {
    if (this.state.status !== 'connected') {
      // Queue command for later
      this.setState({
        commandQueue: [...this.state.commandQueue, command],
      })
      console.log('UE5 not connected, command queued:', command.type)
      return false
    }

    try {
      if (window.worldforge) {
        const result = await window.worldforge.sendToUE5(command)
        return result.success
      }
      return false
    } catch (err) {
      console.error('Failed to send command to UE5:', err)
      return false
    }
  }

  // Flush queued commands
  private async flushQueue(): Promise<void> {
    const queue = [...this.state.commandQueue]
    this.setState({ commandQueue: [] })

    for (const command of queue) {
      await this.sendCommand(command)
    }
  }

  // Helper: Sync full world state
  async syncWorldState(state: WorldState): Promise<boolean> {
    return this.sendCommand({
      type: 'SYNC_WORLD_STATE',
      state,
    })
  }

  // Helper: Set a specific trait
  async setTrait(trait: keyof WorldState['traits'], value: number): Promise<boolean> {
    return this.sendCommand({
      type: 'SET_TRAIT',
      trait,
      value,
    })
  }

  // Helper: Set atmosphere
  async setAtmosphere(atmosphere: WorldState['atmosphere']): Promise<boolean> {
    return this.sendCommand({
      type: 'SET_ATMOSPHERE',
      atmosphere,
    })
  }

  // Get current status
  getStatus(): ConnectionStatus {
    return this.state.status
  }

  // Get last error
  getLastError(): string | null {
    return this.state.lastError
  }
}

// Singleton instance
export const ue5Bridge = new UE5Bridge()

// React hook for UE5 bridge state
export function useUE5Bridge() {
  const [state, setState] = React.useState<UE5BridgeState>({
    status: 'disconnected',
    lastError: null,
    commandQueue: [],
  })

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

// Need to import React for the hook
import * as React from 'react'
