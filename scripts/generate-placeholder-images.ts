/**
 * Script to generate placeholder tarot images for development/testing
 *
 * Usage: npx tsx scripts/generate-placeholder-images.ts
 *
 * Rate limit: Replicate limits to ~1 request per minute with low credit balance
 * This script will take ~30 minutes to generate 30 images
 */

import Replicate from 'replicate'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '../.env') })

// ============================================================================
// Configuration
// ============================================================================

const SDXL_MODEL = 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc'
const SDXL_CONFIG = {
  width: 512,
  height: 512,
  num_outputs: 1,
  scheduler: 'K_EULER',
  num_inference_steps: 25,
  guidance_scale: 7.5,
  negative_prompt: 'blurry, low quality, modern, photorealistic, 3d render, cartoon, anime',
}

const OUTPUT_DIR = join(__dirname, '../src/renderer/assets/placeholder-images')
const DELAY_BETWEEN_REQUESTS_MS = 65000 // 65 seconds to be safe with rate limits

// ============================================================================
// Tarot Image Prompts
// ============================================================================

const TAROT_PROMPTS = [
  // Medieval rulers and nobility
  'Medieval woodcut style tarot card illustration of a crowned king on a throne holding a sword, black and white with gold accents, symbolic medieval imagery',
  'Medieval woodcut style tarot card illustration of a queen in royal robes holding a golden scepter, intricate patterns, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a knight in armor on horseback with banner, heraldic symbols, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a prince choosing between two paths in a forest, symbolic crossroads, black and white with gold accents',

  // Religious and spiritual
  'Medieval woodcut style tarot card illustration of a monk praying in a monastery with divine light, religious iconography, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a bishop blessing a crowd, cathedral architecture, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of pilgrims journeying to a distant shrine, symbolic path, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of an angel descending with a scroll, celestial imagery, black and white with gold accents',

  // War and conflict
  'Medieval woodcut style tarot card illustration of two armies clashing on a battlefield, banners and spears, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a fortress under siege with catapults and defenders, dramatic scene, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a warrior standing over fallen enemies, victory pose, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a peace treaty being signed by two lords, symbolic handshake, black and white with gold accents',

  // Trade and prosperity
  'Medieval woodcut style tarot card illustration of a merchant ship laden with goods in harbor, prosperity symbols, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a bustling medieval marketplace with traders, coins and goods, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a blacksmith forging a sword at an anvil, fire and craftsmanship, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of farmers harvesting wheat in golden fields, abundance symbols, black and white with gold accents',

  // Justice and law
  'Medieval woodcut style tarot card illustration of a judge with scales of justice and law books, balanced composition, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a prisoner in chains before a tribunal, dramatic justice scene, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a herald proclaiming laws in a town square, scrolls and trumpets, black and white with gold accents',

  // Nature and elements
  'Medieval woodcut style tarot card illustration of a great tree with roots reaching to underworld and branches to heaven, cosmic tree, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a storm at sea with a ship struggling against waves, dramatic weather, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of fire consuming a village while people flee, dramatic flames, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a mountain with a cave entrance and mysterious glow, adventure awaits, black and white with gold accents',

  // Mystical and arcane
  'Medieval woodcut style tarot card illustration of an alchemist in tower laboratory with potions and books, mystical symbols, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a witch or wise woman reading bones and runes, divination scene, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a dragon coiled around treasure in a cave, mythical beast, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a phoenix rising from flames, rebirth symbolism, black and white with gold accents',

  // Life events
  'Medieval woodcut style tarot card illustration of a wedding ceremony in a cathedral, union and celebration, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a funeral procession with mourners and torches, solemn ceremony, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of a newborn child being blessed by elders, new beginnings, black and white with gold accents',
  'Medieval woodcut style tarot card illustration of an old sage passing wisdom to a young apprentice, knowledge transfer, black and white with gold accents',
]

// ============================================================================
// Image Generation
// ============================================================================

async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  const buffer = await response.arrayBuffer()
  await writeFile(filepath, Buffer.from(buffer))
}

async function generateImage(replicate: Replicate, prompt: string, index: number): Promise<string | null> {
  console.log(`\n[${index + 1}/${TAROT_PROMPTS.length}] Generating: ${prompt.substring(0, 60)}...`)

  try {
    const output = await replicate.run(SDXL_MODEL, {
      input: {
        prompt,
        ...SDXL_CONFIG,
      },
    })

    // Extract URL from output
    let imageUrl: string | null = null
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = typeof output[0] === 'string' ? output[0] : String(output[0])
    } else if (typeof output === 'string') {
      imageUrl = output
    }

    if (!imageUrl) {
      console.error('  ✗ No image URL in response')
      return null
    }

    // Download and save the image
    const filename = `tarot-${String(index + 1).padStart(2, '0')}.png`
    const filepath = join(OUTPUT_DIR, filename)
    await downloadImage(imageUrl, filepath)

    console.log(`  ✓ Saved: ${filename}`)
    return filename
  } catch (error) {
    console.error(`  ✗ Error: ${error}`)
    return null
  }
}

async function main() {
  const apiToken = process.env.REPLICATE_API_TOKEN
  if (!apiToken) {
    console.error('Error: REPLICATE_API_TOKEN not set in .env')
    process.exit(1)
  }

  const replicate = new Replicate({ auth: apiToken })

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true })

  console.log('='.repeat(60))
  console.log('Generating Placeholder Tarot Images')
  console.log('='.repeat(60))
  console.log(`Total images: ${TAROT_PROMPTS.length}`)
  console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS_MS / 1000}s`)
  console.log(`Estimated time: ~${Math.ceil(TAROT_PROMPTS.length * DELAY_BETWEEN_REQUESTS_MS / 60000)} minutes`)
  console.log(`Output directory: ${OUTPUT_DIR}`)
  console.log('='.repeat(60))

  const results: { success: string[]; failed: number[] } = { success: [], failed: [] }

  for (let i = 0; i < TAROT_PROMPTS.length; i++) {
    const filename = await generateImage(replicate, TAROT_PROMPTS[i], i)

    if (filename) {
      results.success.push(filename)
    } else {
      results.failed.push(i + 1)
    }

    // Wait before next request (except for the last one)
    if (i < TAROT_PROMPTS.length - 1) {
      const waitSeconds = DELAY_BETWEEN_REQUESTS_MS / 1000
      console.log(`  Waiting ${waitSeconds}s before next request...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS_MS))
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('Generation Complete')
  console.log('='.repeat(60))
  console.log(`Success: ${results.success.length}/${TAROT_PROMPTS.length}`)
  if (results.failed.length > 0) {
    console.log(`Failed: ${results.failed.join(', ')}`)
  }
  console.log('='.repeat(60))
}

main().catch(console.error)
