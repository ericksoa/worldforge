import { contextBridge, ipcRenderer } from 'electron'

// ============================================================================
// Types
// ============================================================================

interface DilemmaParams {
  era: string
  traits: object
  cardNumber: number
}

interface ImageParams {
  prompt: string
}

interface UE5ConnectParams {
  host: string
  port: number
}

interface DilemmaResult {
  success: boolean
  dilemma: object | null
}

interface ImageResult {
  success: boolean
  imageUrl: string | null
}

interface ServicesStatus {
  claude: boolean
  replicate: boolean
  mockImages: boolean
}

interface UE5Result {
  success: boolean
}

// ============================================================================
// API Bridge
// ============================================================================

/**
 * Expose protected methods that allow the renderer process to use
 * ipcRenderer without exposing the entire object.
 */
const worldforgeAPI = {
  // Claude API
  generateDilemma: (params: DilemmaParams): Promise<DilemmaResult> =>
    ipcRenderer.invoke('claude:generate-dilemma', params),

  // Image Generation
  generateImage: (params: ImageParams): Promise<ImageResult> =>
    ipcRenderer.invoke('replicate:generate-image', params),

  // Service Status
  getServicesStatus: (): Promise<ServicesStatus> => ipcRenderer.invoke('services:status'),

  // UE5 Bridge
  connectToUE5: (params: UE5ConnectParams): Promise<UE5Result> =>
    ipcRenderer.invoke('ue5:connect', params),

  sendToUE5: (command: object): Promise<UE5Result> =>
    ipcRenderer.invoke('ue5:send-command', command),

  // Platform info
  platform: process.platform,
}

contextBridge.exposeInMainWorld('worldforge', worldforgeAPI)

// ============================================================================
// Global Type Declarations
// ============================================================================

declare global {
  interface Window {
    worldforge: typeof worldforgeAPI
  }
}
