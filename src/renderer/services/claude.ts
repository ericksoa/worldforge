import type { TarotDilemma, WorldTraits } from '../../shared/types'
import { debugLog } from '../stores/debugStore'

// ============================================================================
// Constants
// ============================================================================

/** Simulated network delay range for mock data (milliseconds) */
const MOCK_DELAY_MIN_MS = 800
const MOCK_DELAY_VARIANCE_MS = 400

/** Maximum prompt length to show in logs */
const LOG_PROMPT_MAX_LENGTH = 50

// ============================================================================
// Mock Data (used when Claude API is unavailable)
// ============================================================================

const MOCK_DILEMMAS: Record<string, TarotDilemma[]> = {
  normandy_10th: [
    {
      id: 'conquest_vs_trade',
      cardName: 'The Path of Power',
      cardNumber: 1,
      description: 'The Northmen have settled these shores, but how shall they build their legacy? Through the sword that takes, or the coin that binds?',
      era: 'normandy_10th',
      choiceA: {
        label: 'The Conqueror',
        description: 'Expand through might. Let the banner of the Norman lords fly over new territories, taken by right of arms.',
        traitEffects: { militarism: 0.15, prosperity: -0.05, lawfulness: -0.1 },
        worldEvents: ['Military encampments appear across the land', 'Fortifications are strengthened'],
      },
      choiceB: {
        label: 'The Merchant',
        description: 'Build through trade. Let wealth flow through the ports and markets, binding allies through commerce.',
        traitEffects: { prosperity: 0.15, openness: 0.1, militarism: -0.1 },
        worldEvents: ['Trade routes are established', 'Markets flourish in major towns'],
      },
    },
    {
      id: 'faith_vs_pragmatism',
      cardName: 'The Sacred Question',
      cardNumber: 2,
      description: 'The old gods whisper from the northern winds, while the church bells call the faithful. Which voice shall guide your people?',
      era: 'normandy_10th',
      choiceA: {
        label: 'The Pious',
        description: 'Embrace the Church fully. Build monasteries, support the clergy, and let faith guide the realm.',
        traitEffects: { religiosity: 0.2, lawfulness: 0.1, openness: -0.1 },
        worldEvents: ['Monasteries are founded', 'Church influence grows'],
      },
      choiceB: {
        label: 'The Pragmatist',
        description: 'Let faith serve the realm, not rule it. Maintain traditions but bend when advantage demands.',
        traitEffects: { prosperity: 0.1, lawfulness: 0.05, religiosity: -0.1 },
        worldEvents: ['Secular courts gain power', 'Religious tolerance spreads'],
      },
    },
    {
      id: 'order_vs_freedom',
      cardName: 'The Iron Hand',
      cardNumber: 3,
      description: 'The common folk look to their lords for justice. Shall law be written in stone, or flow like water to the need?',
      era: 'normandy_10th',
      choiceA: {
        label: 'The Lawgiver',
        description: 'Establish strict codes and harsh justice. Order brings prosperity; rebellion brings ruin.',
        traitEffects: { lawfulness: 0.2, militarism: 0.1, openness: -0.1 },
        worldEvents: ['Courts of law are established', 'Crime decreases'],
      },
      choiceB: {
        label: 'The Liberator',
        description: 'Trust in the wisdom of local custom. Let communities govern themselves within broad bounds.',
        traitEffects: { openness: 0.15, prosperity: 0.1, lawfulness: -0.15 },
        worldEvents: ['Local assemblies gain power', 'Regional diversity flourishes'],
      },
    },
    {
      id: 'build_vs_destroy',
      cardName: 'The Builder\'s Choice',
      cardNumber: 4,
      description: 'The old Roman roads crumble, their villas long fallen. Do you raise new monuments, or let the land reclaim what was?',
      era: 'normandy_10th',
      choiceA: {
        label: 'The Architect',
        description: 'Build great works. Castles, cathedrals, and bridges that will stand for a thousand years.',
        traitEffects: { prosperity: 0.15, religiosity: 0.1, militarism: 0.05 },
        worldEvents: ['Great construction projects begin', 'Skilled craftsmen gather'],
      },
      choiceB: {
        label: 'The Shepherd',
        description: 'Let the land heal. Focus on the people rather than monuments; tend to what exists.',
        traitEffects: { prosperity: 0.1, openness: 0.1 },
        worldEvents: ['Rural communities strengthen', 'Agricultural improvements spread'],
      },
    },
    {
      id: 'ally_vs_isolate',
      cardName: 'The Foreign Question',
      cardNumber: 5,
      description: 'Beyond your borders lie other realms - some rich, some dangerous, all watching. How do you face the wider world?',
      era: 'normandy_10th',
      choiceA: {
        label: 'The Diplomat',
        description: 'Forge alliances through marriage and treaty. The world is full of potential friends... and useful enemies.',
        traitEffects: { openness: 0.2, prosperity: 0.1, militarism: -0.05 },
        worldEvents: ['Foreign emissaries arrive', 'Trade agreements are signed'],
      },
      choiceB: {
        label: 'The Fortress',
        description: 'Trust no outsider fully. Build strength at home; let others come to you from positions of weakness.',
        traitEffects: { militarism: 0.15, lawfulness: 0.1, openness: -0.15 },
        worldEvents: ['Border fortifications increase', 'Self-sufficiency is emphasized'],
      },
    },
  ],
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Generate a tarot dilemma using Claude API.
 * Falls back to mock data if API is unavailable or fails.
 */
export async function generateDilemma(
  eraId: string,
  currentTraits: WorldTraits,
  cardNumber: number
): Promise<TarotDilemma> {
  debugLog.info(`Generating dilemma for ${eraId}, card #${cardNumber}`)

  const apiDilemma = await tryGenerateDilemmaFromAPI(eraId, currentTraits, cardNumber)
  if (apiDilemma) {
    return apiDilemma
  }

  return getFallbackDilemma(eraId, cardNumber)
}

/**
 * Generate an image using Replicate/Stable Diffusion API.
 * Returns null if generation fails.
 */
export async function generateImage(prompt: string): Promise<string | null> {
  const truncatedPrompt = prompt.substring(0, LOG_PROMPT_MAX_LENGTH)
  debugLog.info(`Generating image for prompt: "${truncatedPrompt}..."`)

  if (!window.worldforge) {
    debugLog.error('window.worldforge not available for image generation')
    return null
  }

  try {
    debugLog.request('Calling Replicate API...', { prompt: prompt.substring(0, 100) })

    const result = await window.worldforge.generateImage({ prompt })

    if (result?.success && result.imageUrl) {
      debugLog.response('Image generated successfully')
      return result.imageUrl
    }

    debugLog.error(`Image generation failed: ${JSON.stringify(result)}`)
    return null
  } catch (err) {
    debugLog.error(`Replicate API error: ${err}`)
    return null
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

/** Attempt to generate a dilemma from the Claude API */
async function tryGenerateDilemmaFromAPI(
  eraId: string,
  currentTraits: WorldTraits,
  cardNumber: number
): Promise<TarotDilemma | null> {
  if (!window.worldforge) {
    debugLog.error('window.worldforge not available (preload issue?)')
    return null
  }

  try {
    debugLog.request('Calling Claude API...', { era: eraId, cardNumber })

    const result = await window.worldforge.generateDilemma({
      era: eraId,
      traits: currentTraits,
      cardNumber,
    })

    if (result?.success && result.dilemma) {
      const dilemma = result.dilemma as TarotDilemma
      debugLog.response(`Claude generated: "${dilemma.cardName}"`)
      return dilemma
    }

    debugLog.error(`API returned unsuccessful: ${JSON.stringify(result)}`)
    return null
  } catch (err) {
    debugLog.error(`Claude API error: ${err}`)
    return null
  }
}

/** Get a mock dilemma as fallback when API is unavailable */
async function getFallbackDilemma(eraId: string, cardNumber: number): Promise<TarotDilemma> {
  debugLog.info('Using mock dilemma data')

  const dilemmasForEra = MOCK_DILEMMAS[eraId] ?? MOCK_DILEMMAS['normandy_10th']
  const dilemmaIndex = (cardNumber - 1) % dilemmasForEra.length
  const dilemma = { ...dilemmasForEra[dilemmaIndex], cardNumber }

  // Simulate network delay for a realistic feel
  const delay = MOCK_DELAY_MIN_MS + Math.random() * MOCK_DELAY_VARIANCE_MS
  await new Promise((resolve) => setTimeout(resolve, delay))

  return dilemma
}

// Claude API prompt template for generating dilemmas
export const DILEMMA_PROMPT = `You are a world-builder creating ethical dilemmas for a historical setting.

Era: {era}
Current World Traits:
- Militarism: {militarism} (0 = peaceful, 1 = warlike)
- Prosperity: {prosperity} (0 = impoverished, 1 = wealthy)
- Religiosity: {religiosity} (0 = secular, 1 = devout)
- Lawfulness: {lawfulness} (0 = chaotic, 1 = orderly)
- Openness: {openness} (0 = isolated, 1 = cosmopolitan)

Previous choices: {previousChoices}

Generate a tarot card-style dilemma that presents two opposing philosophies or paths. The dilemma should:
1. Be thematically appropriate for the era
2. Present genuinely difficult choices with no obvious "right" answer
3. Have meaningful consequences for the world state
4. Use evocative, atmospheric language

Respond with valid JSON in this exact format:
{
  "id": "unique_snake_case_id",
  "cardName": "The [Evocative Title]",
  "cardNumber": {cardNumber},
  "description": "Atmospheric description of the dilemma (2-3 sentences)",
  "era": "{eraId}",
  "choiceA": {
    "label": "The [Title]",
    "description": "What this choice means and implies (2-3 sentences)",
    "traitEffects": { "traitName": delta (-0.2 to 0.2), ... },
    "worldEvents": ["Description of visible change", "Another change"]
  },
  "choiceB": {
    "label": "The [Title]",
    "description": "What this choice means and implies (2-3 sentences)",
    "traitEffects": { "traitName": delta (-0.2 to 0.2), ... },
    "worldEvents": ["Description of visible change", "Another change"]
  }
}`
