import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Anthropic from '@anthropic-ai/sdk'
import Replicate from 'replicate'
import { config } from 'dotenv'

// ============================================================================
// Configuration
// ============================================================================

// Load .env file from the app directory
config({ path: join(__dirname, '../../.env') })

// ============================================================================
// Constants
// ============================================================================

const WINDOW_CONFIG = {
  width: 1400,
  height: 900,
  minWidth: 1200,
  minHeight: 800,
  backgroundColor: '#1a1a1a',
} as const

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
const CLAUDE_MAX_TOKENS = 1500

const SDXL_MODEL = 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc'
const SDXL_CONFIG = {
  width: 512,
  height: 512,
  num_outputs: 1,
  scheduler: 'K_EULER',
  num_inference_steps: 25,
  guidance_scale: 7.5,
  negative_prompt: 'blurry, low quality, modern, photorealistic, 3d render, cartoon, anime',
} as const

/** Era descriptions for better prompt context */
const ERA_CONTEXTS: Record<string, string> = {
  normandy_10th:
    '10th Century Normandy - The age of Vikings turned Norman lords. A land of conquest, faith, and feudal power struggles.',
  byzantine_6th:
    '6th Century Byzantium - The reign of Justinian. An empire of ancient splendor seeking to reclaim Roman glory.',
  mongol_13th:
    '13th Century Mongolia - The storm from the steppes. Horse lords carving the largest empire in history.',
  japan_16th:
    '16th Century Japan - The Sengoku period. Samurai lords vie for supremacy as the old order crumbles.',
  egypt_14th_bce:
    '14th Century BCE Egypt - The reign of Akhenaten. A pharaoh who dared challenge the gods themselves.',
  viking_9th: '9th Century Scandinavia - The age of the Northmen. Raiders, traders, and explorers.',
}

// ============================================================================
// State
// ============================================================================

let mainWindow: BrowserWindow | null = null
let anthropic: Anthropic | null = null
let replicate: Replicate | null = null

// ============================================================================
// Service Initialization
// ============================================================================

/** Initialize Claude API client. Returns true if successful. */
function initClaude(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set - using mock dilemmas')
    return false
  }

  anthropic = new Anthropic({ apiKey })
  console.log('Claude API initialized')
  return true
}

/** Initialize Replicate client. Returns true if successful. */
function initReplicate(): boolean {
  const apiToken = process.env.REPLICATE_API_TOKEN
  if (!apiToken) {
    console.warn('REPLICATE_API_TOKEN not set - images will not be generated')
    return false
  }

  replicate = new Replicate({ auth: apiToken })
  console.log('Replicate API initialized')
  return true
}

// ============================================================================
// Window Management
// ============================================================================

function createWindow(): void {
  mainWindow = new BrowserWindow({
    ...WINDOW_CONFIG,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ============================================================================
// Claude API
// ============================================================================

interface DilemmaRequest {
  era: string
  traits: {
    militarism: number
    prosperity: number
    religiosity: number
    lawfulness: number
    openness: number
  }
  cardNumber: number
}

/** Build the prompt for generating a tarot dilemma */
function buildDilemmaPrompt(era: string, traits: DilemmaRequest['traits'], cardNumber: number): string {
  const eraContext = ERA_CONTEXTS[era] || era

  return `You are a world-builder creating ethical dilemmas for an open world game set in ${eraContext}.

Current World Traits (0.0 = low, 1.0 = high):
- Militarism: ${traits.militarism.toFixed(2)} (how warlike vs peaceful)
- Prosperity: ${traits.prosperity.toFixed(2)} (economic wealth)
- Religiosity: ${traits.religiosity.toFixed(2)} (influence of faith)
- Lawfulness: ${traits.lawfulness.toFixed(2)} (order vs chaos)
- Openness: ${traits.openness.toFixed(2)} (cosmopolitan vs isolationist)

This is card #${cardNumber} in the player's journey.

Generate a tarot card-style ethical dilemma that:
1. Fits the historical era authentically
2. Presents TWO genuinely difficult choices with no obvious "right" answer
3. Has meaningful, lasting consequences for the world
4. Uses evocative, atmospheric medieval language
5. Each choice should affect 2-3 traits (values between -0.2 and +0.2)
6. Include an imagePrompt for each choice - a detailed description for generating a tarot card illustration in woodcut/medieval art style

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "id": "unique_snake_case_id",
  "cardName": "The [Evocative Name]",
  "cardNumber": ${cardNumber},
  "description": "2-3 sentence atmospheric description of the situation requiring a choice",
  "era": "${era}",
  "choiceA": {
    "label": "The [Title]",
    "description": "2-3 sentences describing this philosophical path and its implications",
    "traitEffects": {"traitName": 0.15, "otherTrait": -0.1},
    "worldEvents": ["Specific visible change in the world", "Another consequence"],
    "imagePrompt": "Medieval woodcut style tarot card illustration of [detailed visual description], black and white with gold accents, symbolic imagery"
  },
  "choiceB": {
    "label": "The [Title]",
    "description": "2-3 sentences describing this philosophical path and its implications",
    "traitEffects": {"traitName": 0.15, "otherTrait": -0.1},
    "worldEvents": ["Specific visible change in the world", "Another consequence"],
    "imagePrompt": "Medieval woodcut style tarot card illustration of [detailed visual description], black and white with gold accents, symbolic imagery"
  }
}`
}

/** Strip markdown code blocks from Claude response */
function stripMarkdownCodeBlocks(text: string): string {
  let jsonText = text.trim()
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return jsonText
}

/** Handle Claude dilemma generation request */
async function handleGenerateDilemma(
  _event: Electron.IpcMainInvokeEvent,
  { era, traits, cardNumber }: DilemmaRequest
): Promise<{ success: boolean; dilemma: object | null; error?: string }> {
  console.log('Received dilemma request:', { era, cardNumber, hasTraits: !!traits })

  if (!anthropic) {
    console.log('Claude not initialized, returning null')
    return { success: false, dilemma: null }
  }

  const prompt = buildDilemmaPrompt(era, traits, cardNumber)

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const jsonText = stripMarkdownCodeBlocks(content.text)
    const dilemma = JSON.parse(jsonText)
    console.log('Generated dilemma:', dilemma.cardName)

    return { success: true, dilemma }
  } catch (error) {
    console.error('Claude API error:', error)
    return { success: false, dilemma: null, error: String(error) }
  }
}

// ============================================================================
// Replicate Image Generation
// ============================================================================

/** Extract URL from Replicate output (handles various output formats) */
function extractImageUrl(output: unknown): string | null {
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0]
    if (typeof first === 'string') {
      return first
    } else if (first && typeof first === 'object') {
      return String(first)
    }
  } else if (typeof output === 'string') {
    return output
  } else if (output && typeof output === 'object') {
    return String(output)
  }
  return null
}

/** Handle Replicate image generation request */
async function handleGenerateImage(
  _event: Electron.IpcMainInvokeEvent,
  { prompt }: { prompt: string }
): Promise<{ success: boolean; imageUrl: string | null; error?: string }> {
  console.log('Received image generation request:', prompt.substring(0, 50) + '...')

  if (!replicate) {
    console.log('Replicate not initialized')
    return { success: false, imageUrl: null }
  }

  try {
    const output = await replicate.run(SDXL_MODEL, {
      input: {
        prompt,
        ...SDXL_CONFIG,
      },
    })

    const imageUrl = extractImageUrl(output)
    console.log('Generated image:', imageUrl)

    return { success: true, imageUrl }
  } catch (error) {
    console.error('Replicate API error:', error)
    return { success: false, imageUrl: null, error: String(error) }
  }
}

// ============================================================================
// IPC Handlers
// ============================================================================

function registerIpcHandlers(): void {
  // Claude API
  ipcMain.handle('claude:generate-dilemma', handleGenerateDilemma)

  // Image Generation
  ipcMain.handle('replicate:generate-image', handleGenerateImage)

  // Service Status
  ipcMain.handle('services:status', () => ({
    claude: anthropic !== null,
    replicate: replicate !== null,
  }))

  // UE5 Bridge (placeholder implementation)
  ipcMain.handle('ue5:connect', async (_event, { host, port }) => {
    console.log('Connecting to UE5 at:', host, port)
    return { success: true }
  })

  ipcMain.handle('ue5:send-command', async (_event, command) => {
    console.log('Sending command to UE5:', command)
    return { success: true }
  })
}

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.worldforge.app')

  // Initialize services
  initClaude()
  initReplicate()

  // Register IPC handlers
  registerIpcHandlers()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
