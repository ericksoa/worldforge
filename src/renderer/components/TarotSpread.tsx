import { useState, useEffect } from 'react'
import { TarotCard } from './TarotCard'
import { useWorldStore } from '../stores/worldStore'
import { generateDilemma, generateImage } from '../services/claude'
import { debugLog } from '../stores/debugStore'
import type { TarotDilemma } from '../../shared/types'

// ============================================================================
// Constants
// ============================================================================

/** Delay between generating images to avoid API rate limits (ms) */
const IMAGE_GENERATION_DELAY_MS = 12000

/** Minimum number of progress dots to show */
const MIN_PROGRESS_DOTS = 5

/** Delay before auto-advancing to next card after selection (ms) */
const AUTO_ADVANCE_DELAY_MS = 1500

// ============================================================================
// Helper Components
// ============================================================================

/** Loading spinner shown while generating a dilemma */
function LoadingSpinner({ cardNumber }: { cardNumber: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-medieval text-2xl text-gold-500">{cardNumber}</span>
        </div>
      </div>
      <p className="text-parchment-400 font-medieval tracking-wider animate-pulse">
        The cards are being drawn...
      </p>
    </div>
  )
}

/** Error display with retry button */
function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <p className="text-burgundy-400 font-body italic text-center max-w-md">{error}</p>
      <button onClick={onRetry} className="btn-medieval">
        Try Again
      </button>
    </div>
  )
}

/** Progress indicator showing completed and current card */
function ProgressIndicator({ totalCards, completedCards }: { totalCards: number; completedCards: number }) {
  const dotCount = Math.max(MIN_PROGRESS_DOTS, totalCards)

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: dotCount }).map((_, i) => {
        const isCompleted = i < completedCards
        const isCurrent = i === completedCards

        return (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              isCompleted
                ? 'bg-gold-500'
                : isCurrent
                  ? 'bg-gold-500 animate-pulse ring-2 ring-gold-500/50'
                  : 'bg-charcoal-700'
            }`}
          />
        )
      })}
    </div>
  )
}

/** Card separator between the two choice cards */
function CardSeparator() {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="font-medieval text-2xl text-charcoal-500">or</span>
      <div className="w-px h-16 bg-gradient-to-b from-transparent via-charcoal-600 to-transparent" />
    </div>
  )
}

// ============================================================================
// Image Generation
// ============================================================================

interface ImageState {
  imageA: string | null
  imageB: string | null
}

/** Generate images for both choices sequentially with rate limit delay */
async function generateChoiceImages(
  dilemma: TarotDilemma,
  onImageA: (url: string) => void,
  onImageB: (url: string) => void
): Promise<void> {
  const { choiceA, choiceB } = dilemma

  if (!choiceA.imagePrompt && !choiceB.imagePrompt) {
    return
  }

  debugLog.info('Starting image generation (sequential)...')

  try {
    if (choiceA.imagePrompt) {
      const urlA = await generateImage(choiceA.imagePrompt)
      if (urlA) {
        debugLog.response('Image A generated')
        onImageA(urlA)
      }
    }

    if (choiceB.imagePrompt) {
      await new Promise((resolve) => setTimeout(resolve, IMAGE_GENERATION_DELAY_MS))
      const urlB = await generateImage(choiceB.imagePrompt)
      if (urlB) {
        debugLog.response('Image B generated')
        onImageB(urlB)
      }
    }
  } catch (err) {
    debugLog.error(`Image generation failed: ${err}`)
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function TarotSpread() {
  const { era, traits, choices, recordChoice } = useWorldStore()
  const [currentDilemma, setCurrentDilemma] = useState<TarotDilemma | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<ImageState>({ imageA: null, imageB: null })

  const cardNumber = choices.length + 1

  // --------------------------------------------------------------------------
  // Dilemma Loading
  // --------------------------------------------------------------------------

  const loadNewDilemma = async () => {
    if (!era) return

    setIsLoading(true)
    setError(null)
    setSelectedChoice(null)
    setImages({ imageA: null, imageB: null })

    try {
      const dilemma = await generateDilemma(era.id, traits, cardNumber)
      setCurrentDilemma(dilemma)

      // Generate images in background (don't block card display)
      generateChoiceImages(
        dilemma,
        (url) => setImages((prev) => ({ ...prev, imageA: url })),
        (url) => setImages((prev) => ({ ...prev, imageB: url }))
      )
    } catch (err) {
      setError('Failed to consult the cards. The spirits are restless...')
      debugLog.error(`Failed to generate dilemma: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load initial dilemma when era is selected
  useEffect(() => {
    if (!currentDilemma && era && !isLoading) {
      loadNewDilemma()
    }
  }, [era])

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  const handleSelect = (choice: 'A' | 'B') => {
    if (selectedChoice || !currentDilemma) return

    setSelectedChoice(choice)
    recordChoice(currentDilemma, choice)

    // Auto-advance to next card after brief delay
    setTimeout(() => {
      setCurrentDilemma(null)
      loadNewDilemma()
    }, AUTO_ADVANCE_DELAY_MS)
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (isLoading) {
    return <LoadingSpinner cardNumber={cardNumber} />
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={loadNewDilemma} />
  }

  if (!currentDilemma) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <ProgressIndicator totalCards={cardNumber} completedCards={choices.length} />

      {/* Dilemma title */}
      <div className="text-center">
        <h2 className="font-medieval text-3xl text-gold-500 text-glow mb-2">
          {currentDilemma.cardName}
        </h2>
        <p className="text-parchment-400 font-body italic max-w-xl text-lg">
          {currentDilemma.description}
        </p>
      </div>

      {/* Cards */}
      <div className="flex gap-8 items-center">
        <TarotCard
          cardName={currentDilemma.cardName}
          cardNumber={currentDilemma.cardNumber}
          description={currentDilemma.choiceA.description}
          choice={currentDilemma.choiceA}
          side="A"
          imageUrl={images.imageA || undefined}
          onSelect={() => handleSelect('A')}
          isSelected={selectedChoice === 'A'}
          disabled={selectedChoice !== null}
        />

        <CardSeparator />

        <TarotCard
          cardName={currentDilemma.cardName}
          cardNumber={currentDilemma.cardNumber}
          description={currentDilemma.choiceB.description}
          choice={currentDilemma.choiceB}
          side="B"
          imageUrl={images.imageB || undefined}
          onSelect={() => handleSelect('B')}
          isSelected={selectedChoice === 'B'}
          disabled={selectedChoice !== null}
        />
      </div>

      {/* Choice history hint */}
      {choices.length > 0 && (
        <p className="text-charcoal-500 text-sm">
          {choices.length} choice{choices.length !== 1 ? 's' : ''} have shaped your world
        </p>
      )}
    </div>
  )
}
