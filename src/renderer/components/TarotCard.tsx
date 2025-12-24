import { useState } from 'react'
import type { TarotChoice } from '../../shared/types'

interface TarotCardProps {
  cardName: string
  cardNumber: number
  description: string
  choice: TarotChoice
  side: 'A' | 'B'
  imageUrl?: string
  onSelect: () => void
  isSelected: boolean
  disabled: boolean
}

export function TarotCard({
  cardName,
  cardNumber,
  description,
  choice,
  side,
  imageUrl,
  onSelect,
  isSelected,
  disabled,
}: TarotCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (disabled) return

    if (!isFlipped) {
      setIsFlipped(true)
      // Auto-select after reveal
      setTimeout(() => {
        onSelect()
      }, 600)
    }
  }

  // Roman numerals for card number
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  const numeral = romanNumerals[cardNumber - 1] || cardNumber.toString()

  return (
    <div
      className={`card-flip w-80 h-[480px] cursor-pointer ${isFlipped ? 'flipped' : ''} ${
        disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-flip-inner">
        {/* Card Back - Shows the choice preview */}
        <div
          className={`card-face woodcut-border rounded-xl overflow-hidden
            ${isHovered && !isFlipped && !disabled ? 'animate-float' : ''}
            ${isHovered && !isFlipped && !disabled ? 'ring-2 ring-gold-500/50' : ''}`}
          style={{
            background: `linear-gradient(145deg, #2a1f1a 0%, #1a1412 50%, #2a1f1a 100%)`,
          }}
        >
          <div className="relative h-full p-6 flex flex-col">
            {/* Corner ornaments */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold-600" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold-600" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold-600" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold-600" />

            {/* Card number */}
            <div className="text-center mb-2">
              <span className="font-medieval text-xl text-gold-600">{numeral}</span>
            </div>

            {/* Choice Label - The main title */}
            <h3 className="font-medieval text-2xl text-gold-400 text-center mb-2 text-glow leading-tight">
              {choice.label}
            </h3>

            {/* Image placeholder or generated image */}
            <div className="mx-auto mb-3 w-56 h-56 rounded-lg border-2 border-gold-800 bg-charcoal-900/50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt={choice.label} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gold-800 text-center p-4">
                  <div className="text-5xl mb-2 animate-pulse">☽</div>
                  <span className="text-sm font-medieval">Generating...</span>
                </div>
              )}
            </div>

            {/* Choice description preview */}
            <p className="text-parchment-300 text-sm leading-relaxed text-center font-body flex-1 px-1 overflow-hidden">
              {choice.description}
            </p>

            {/* Trait effects preview */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {Object.entries(choice.traitEffects).map(([trait, value]) => (
                <span
                  key={trait}
                  className={`text-sm px-3 py-1 rounded-full border font-medium ${
                    (value as number) > 0
                      ? 'border-emerald-600/60 text-emerald-400 bg-emerald-900/30'
                      : 'border-red-600/60 text-red-400 bg-red-900/30'
                  }`}
                >
                  {(value as number) > 0 ? '↑' : '↓'} {trait}
                </span>
              ))}
            </div>

            {/* Click prompt */}
            <div className="mt-4 text-center">
              <p className="text-gold-500 text-sm font-medieval tracking-wider">
                Click to Choose This Path
              </p>
            </div>
          </div>
        </div>

        {/* Card Front - Confirmation of choice */}
        <div
          className={`card-face card-face-back parchment-bg rounded-xl overflow-hidden
            ${isSelected ? 'ring-4 ring-gold-500 animate-glow' : ''}`}
        >
          <div className="relative h-full p-6 flex flex-col">
            {/* Chosen badge */}
            <div className="text-center mb-3">
              <span className="px-5 py-1.5 bg-burgundy-800 text-parchment-100 text-sm font-medieval rounded-full uppercase tracking-wider">
                Path Chosen
              </span>
            </div>

            {/* Choice Label */}
            <h3 className="font-medieval text-3xl text-burgundy-900 text-center mb-4 leading-tight">
              {choice.label}
            </h3>

            {/* Decorative divider */}
            <div className="flex items-center gap-2 mb-4 px-4">
              <div className="flex-1 h-px bg-charcoal-400" />
              <div className="w-3 h-3 rotate-45 bg-burgundy-700" />
              <div className="flex-1 h-px bg-charcoal-400" />
            </div>

            {/* World Events - What will happen */}
            <div className="flex-1">
              <p className="text-charcoal-600 text-sm font-medieval uppercase tracking-wider mb-3">
                The world shifts...
              </p>
              <ul className="space-y-3">
                {choice.worldEvents.map((event, i) => (
                  <li key={i} className="flex items-start gap-3 text-charcoal-800 text-base font-body">
                    <span className="text-burgundy-600 mt-1 text-lg">✦</span>
                    <span>{event}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trait changes */}
            <div className="mt-4 pt-4 border-t-2 border-charcoal-300">
              <p className="text-charcoal-600 text-sm font-medieval uppercase tracking-wider mb-3">
                Traits Affected
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(choice.traitEffects).map(([trait, value]) => (
                  <span
                    key={trait}
                    className={`text-sm px-3 py-1.5 rounded-full font-medium ${
                      (value as number) > 0
                        ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}
                  >
                    {(value as number) > 0 ? '▲' : '▼'} {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
