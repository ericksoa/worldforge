import { useState, useEffect } from 'react'
import { TarotCard } from './TarotCard'
import { useWorldStore } from '../stores/worldStore'
import { generateDilemma, generateImage } from '../services/claude'
import { debugLog } from '../stores/debugStore'
import type { TarotDilemma } from '../../shared/types'

export function TarotSpread() {
  const { era, traits, choices, recordChoice } = useWorldStore()
  const [currentDilemma, setCurrentDilemma] = useState<TarotDilemma | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageA, setImageA] = useState<string | null>(null)
  const [imageB, setImageB] = useState<string | null>(null)

  const cardNumber = choices.length + 1

  // Generate initial dilemma
  useEffect(() => {
    if (!currentDilemma && era && !isLoading) {
      loadNewDilemma()
    }
  }, [era])

  const loadNewDilemma = async () => {
    if (!era) return

    setIsLoading(true)
    setError(null)
    setSelectedChoice(null)
    setImageA(null)
    setImageB(null)

    try {
      const dilemma = await generateDilemma(era.id, traits, choices.length + 1)
      setCurrentDilemma(dilemma)

      // Generate images sequentially to avoid rate limits
      if (dilemma.choiceA.imagePrompt || dilemma.choiceB.imagePrompt) {
        debugLog.info('Starting image generation (sequential)...')

        // Run in background, don't block card display
        ;(async () => {
          try {
            if (dilemma.choiceA.imagePrompt) {
              const urlA = await generateImage(dilemma.choiceA.imagePrompt)
              if (urlA) {
                debugLog.response(`Image A generated`)
                setImageA(urlA)
              }
            }

            // Wait before generating second image to avoid rate limit
            if (dilemma.choiceB.imagePrompt) {
              await new Promise((resolve) => setTimeout(resolve, 12000)) // 12s delay
              const urlB = await generateImage(dilemma.choiceB.imagePrompt)
              if (urlB) {
                debugLog.response(`Image B generated`)
                setImageB(urlB)
              }
            }
          } catch (err) {
            debugLog.error(`Image generation failed: ${err}`)
          }
        })()
      }
    } catch (err) {
      setError('Failed to consult the cards. The spirits are restless...')
      console.error('Failed to generate dilemma:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (choice: 'A' | 'B') => {
    if (selectedChoice || !currentDilemma) return

    setSelectedChoice(choice)
    recordChoice(currentDilemma, choice)
  }

  const handleNextCard = () => {
    setCurrentDilemma(null)
    loadNewDilemma()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-medieval text-2xl text-gold-500">
              {cardNumber}
            </span>
          </div>
        </div>
        <p className="text-parchment-400 font-medieval tracking-wider animate-pulse">
          The cards are being drawn...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <p className="text-burgundy-400 font-body italic text-center max-w-md">
          {error}
        </p>
        <button onClick={loadNewDilemma} className="btn-medieval">
          Try Again
        </button>
      </div>
    )
  }

  if (!currentDilemma) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {Array.from({ length: Math.max(5, cardNumber) }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < choices.length
                ? 'bg-gold-500'
                : i === choices.length
                ? 'bg-gold-500 animate-pulse ring-2 ring-gold-500/50'
                : 'bg-charcoal-700'
            }`}
          />
        ))}
      </div>

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
          imageUrl={imageA || undefined}
          onSelect={() => handleSelect('A')}
          isSelected={selectedChoice === 'A'}
          disabled={selectedChoice !== null}
        />

        <div className="flex flex-col items-center gap-4">
          <span className="font-medieval text-2xl text-charcoal-500">or</span>
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-charcoal-600 to-transparent" />
        </div>

        <TarotCard
          cardName={currentDilemma.cardName}
          cardNumber={currentDilemma.cardNumber}
          description={currentDilemma.choiceB.description}
          choice={currentDilemma.choiceB}
          side="B"
          imageUrl={imageB || undefined}
          onSelect={() => handleSelect('B')}
          isSelected={selectedChoice === 'B'}
          disabled={selectedChoice !== null}
        />
      </div>

      {/* Continue button */}
      {selectedChoice && (
        <div className="mt-4 animate-fade-in">
          <button onClick={handleNextCard} className="btn-medieval">
            Draw Next Card
          </button>
        </div>
      )}

      {/* Choice history hint */}
      {choices.length > 0 && (
        <p className="text-charcoal-500 text-sm">
          {choices.length} choice{choices.length !== 1 ? 's' : ''} have shaped your world
        </p>
      )}
    </div>
  )
}
