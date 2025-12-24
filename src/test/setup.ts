import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.worldforge (Electron preload API)
export const mockWorldforge = {
  generateDilemma: vi.fn(),
  generateImage: vi.fn(),
  getServicesStatus: vi.fn(),
  connectToUE5: vi.fn(),
  sendToUE5: vi.fn(),
  platform: 'darwin',
}

Object.defineProperty(window, 'worldforge', {
  value: mockWorldforge,
  writable: true,
})

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
