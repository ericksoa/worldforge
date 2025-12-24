import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('worldforge', {
  // Claude API
  generateDilemma: (params: { era: string; traits: object; cardNumber: number }) =>
    ipcRenderer.invoke('claude:generate-dilemma', params),

  // Image Generation
  generateImage: (params: { prompt: string }) =>
    ipcRenderer.invoke('replicate:generate-image', params),

  // Service Status
  getServicesStatus: () =>
    ipcRenderer.invoke('services:status'),

  // UE5 Bridge
  connectToUE5: (params: { host: string; port: number }) =>
    ipcRenderer.invoke('ue5:connect', params),

  sendToUE5: (command: object) =>
    ipcRenderer.invoke('ue5:send-command', command),

  // Platform info
  platform: process.platform
})

// Type declarations for the exposed API
declare global {
  interface Window {
    worldforge: {
      generateDilemma: (params: { era: string; traits: object; cardNumber: number }) => Promise<{ success: boolean; dilemma: object | null }>
      generateImage: (params: { prompt: string }) => Promise<{ success: boolean; imageUrl: string | null }>
      getServicesStatus: () => Promise<{ claude: boolean; replicate: boolean }>
      connectToUE5: (params: { host: string; port: number }) => Promise<{ success: boolean }>
      sendToUE5: (command: object) => Promise<{ success: boolean }>
      platform: string
    }
  }
}
