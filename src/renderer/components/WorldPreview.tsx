import { useWorldStore } from '../stores/worldStore'
import type { WorldTraits, Atmosphere } from '../../shared/types'

interface WorldPreviewProps {
  onBack: () => void
}

const TRAIT_LABELS: Record<keyof WorldTraits, { low: string; high: string }> = {
  militarism: { low: 'Peaceful', high: 'Warlike' },
  prosperity: { low: 'Impoverished', high: 'Prosperous' },
  religiosity: { low: 'Secular', high: 'Devout' },
  lawfulness: { low: 'Chaotic', high: 'Orderly' },
  openness: { low: 'Isolated', high: 'Cosmopolitan' },
}

const ATMOSPHERE_DESCRIPTIONS: Record<Atmosphere, { title: string; description: string }> = {
  war_torn: {
    title: 'A Land of Conflict',
    description: 'The drums of war echo across the land. Smoke rises from distant villages, and the roads are filled with soldiers and refugees.',
  },
  prosperous: {
    title: 'A Golden Age',
    description: 'The markets bustle with trade from distant lands. The harvests are plentiful, and the people walk without fear.',
  },
  mysterious: {
    title: 'A Realm of Secrets',
    description: 'Mists cling to ancient forests, and whispered tales speak of powers beyond mortal ken. The land holds many secrets.',
  },
  sacred: {
    title: 'A Holy Realm',
    description: 'The faithful fill the temples, and the divine presence is felt in every stone. This is a land touched by the gods.',
  },
  desolate: {
    title: 'A Blighted Land',
    description: 'The fields lie fallow, and the villages stand half-empty. A great shadow has fallen upon this realm.',
  },
  vibrant: {
    title: 'A Crossroads of Cultures',
    description: 'Travelers from distant lands fill the cities, bringing new ideas, arts, and customs. The world is vast and full of wonder.',
  },
}

function TraitBar({ trait, value }: { trait: keyof WorldTraits; value: number }) {
  const labels = TRAIT_LABELS[trait]
  const percentage = value * 100

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-parchment-500">{labels.low}</span>
        <span className="text-parchment-400 font-medieval uppercase tracking-wider">
          {trait}
        </span>
        <span className="text-parchment-500">{labels.high}</span>
      </div>
      <div className="h-2 bg-charcoal-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-burgundy-700 via-gold-600 to-gold-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function WorldPreview({ onBack }: WorldPreviewProps) {
  const { era, traits, choices, atmosphere, exportWorldState } = useWorldStore()

  if (!era) return null

  const atmosphereInfo = ATMOSPHERE_DESCRIPTIONS[atmosphere]

  const handleExport = () => {
    const worldState = exportWorldState()
    const json = JSON.stringify(worldState, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `worldforge-${era.id}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-4xl">
      {/* World Summary Header */}
      <div className="text-center mb-8">
        <h2 className="font-medieval text-4xl text-gold-500 text-glow mb-2">
          {atmosphereInfo.title}
        </h2>
        <p className="text-parchment-400 text-lg font-body italic max-w-2xl mx-auto">
          {atmosphereInfo.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* World Traits */}
        <div className="bg-charcoal-900/50 border border-charcoal-700 rounded-lg p-6">
          <h3 className="font-medieval text-xl text-parchment-200 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-gold-500 rounded-full" />
            World Traits
          </h3>
          {Object.entries(traits).map(([trait, value]) => (
            <TraitBar key={trait} trait={trait as keyof WorldTraits} value={value} />
          ))}
        </div>

        {/* Choice History */}
        <div className="bg-charcoal-900/50 border border-charcoal-700 rounded-lg p-6">
          <h3 className="font-medieval text-xl text-parchment-200 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-gold-500 rounded-full" />
            Your Path ({choices.length} Choices)
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {choices.length === 0 ? (
              <p className="text-parchment-500 italic">No choices made yet.</p>
            ) : (
              choices.map((choice, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-charcoal-800/50 rounded border border-charcoal-700"
                >
                  <span className="font-medieval text-gold-600 text-lg">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="text-parchment-200 font-medieval text-sm">
                      {choice.dilemma.cardName}
                    </p>
                    <p className="text-parchment-500 text-xs mt-1">
                      Chose: {choice.chosen === 'A'
                        ? choice.dilemma.choiceA.label
                        : choice.dilemma.choiceB.label}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Era Info */}
      <div className="mt-8 bg-charcoal-900/50 border border-charcoal-700 rounded-lg p-6">
        <h3 className="font-medieval text-xl text-parchment-200 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-gold-500 rounded-full" />
          Era: {era.name}
        </h3>
        <p className="text-parchment-400 font-body italic">{era.description}</p>
        <p className="text-parchment-600 text-sm mt-2">{era.period}</p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center gap-4">
        <button onClick={onBack} className="btn-medieval">
          Continue Forging
        </button>
        <button
          onClick={handleExport}
          className="btn-medieval bg-gradient-to-b from-charcoal-700 to-charcoal-900 hover:from-charcoal-600 hover:to-charcoal-800"
        >
          Export for UE5
        </button>
      </div>

      {/* UE5 Connection Status */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal-800/50 rounded-full border border-charcoal-700">
          <span className="w-2 h-2 bg-charcoal-500 rounded-full" />
          <span className="text-charcoal-400 text-sm">UE5 Not Connected</span>
        </div>
      </div>
    </div>
  )
}
