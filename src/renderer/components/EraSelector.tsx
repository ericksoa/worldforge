import type { Era } from '../../shared/types'

const ERAS: Era[] = [
  {
    id: 'normandy_10th',
    name: '10th Century Normandy',
    period: '911 - 1066 CE',
    description:
      'The age of Vikings turned Norman lords. A land of conquest, faith, and the forging of a new realm from the ashes of Carolingian Francia.',
    baseTraits: {
      militarism: 0.7,
      religiosity: 0.6,
      lawfulness: 0.4,
    },
    aesthetics: {
      primaryColor: '#8B4513',
      accentColor: '#DAA520',
      atmosphere: 'conquest',
    },
  },
  {
    id: 'byzantine_6th',
    name: '6th Century Byzantium',
    period: '527 - 565 CE',
    description:
      'The reign of Justinian. An empire of ancient splendor seeking to reclaim the glory of Rome through law, faith, and the sword.',
    baseTraits: {
      prosperity: 0.7,
      religiosity: 0.8,
      lawfulness: 0.7,
    },
    aesthetics: {
      primaryColor: '#4B0082',
      accentColor: '#FFD700',
      atmosphere: 'imperial',
    },
  },
  {
    id: 'mongol_13th',
    name: '13th Century Mongolia',
    period: '1206 - 1294 CE',
    description:
      'The storm from the steppes. An age when horse lords carved the largest empire the world had ever seen.',
    baseTraits: {
      militarism: 0.9,
      openness: 0.6,
      lawfulness: 0.5,
    },
    aesthetics: {
      primaryColor: '#2F4F4F',
      accentColor: '#CD853F',
      atmosphere: 'conquest',
    },
  },
  {
    id: 'japan_16th',
    name: '16th Century Japan',
    period: '1467 - 1615 CE',
    description:
      'The age of warring states. Samurai lords vie for supremacy as the old order crumbles and a new Japan rises from the chaos.',
    baseTraits: {
      militarism: 0.8,
      lawfulness: 0.3,
      religiosity: 0.5,
    },
    aesthetics: {
      primaryColor: '#8B0000',
      accentColor: '#C0C0C0',
      atmosphere: 'war',
    },
  },
  {
    id: 'egypt_14th_bce',
    name: '14th Century BCE Egypt',
    period: '1353 - 1336 BCE',
    description:
      'The reign of Akhenaten. A pharaoh who dared challenge the gods themselves, reshaping an ancient civilization.',
    baseTraits: {
      religiosity: 0.9,
      prosperity: 0.6,
      lawfulness: 0.7,
    },
    aesthetics: {
      primaryColor: '#DAA520',
      accentColor: '#00CED1',
      atmosphere: 'sacred',
    },
  },
  {
    id: 'viking_9th',
    name: '9th Century Scandinavia',
    period: '793 - 1066 CE',
    description:
      'The age of the Northmen. Raiders, traders, and explorers who carved their sagas across the known world.',
    baseTraits: {
      militarism: 0.8,
      openness: 0.7,
      religiosity: 0.5,
    },
    aesthetics: {
      primaryColor: '#2E4057',
      accentColor: '#8B4513',
      atmosphere: 'adventure',
    },
  },
]

interface EraSelectorProps {
  onSelect: (era: Era) => void
}

export function EraSelector({ onSelect }: EraSelectorProps) {
  return (
    <div className="w-full max-w-6xl">
      <div className="text-center mb-12">
        <h2 className="font-medieval text-4xl text-gold-500 text-glow mb-4">
          Choose Your Era
        </h2>
        <p className="text-parchment-400 text-lg max-w-2xl mx-auto">
          Select the age in which your world shall be forged. Each era brings its own
          challenges, cultures, and destinies to shape.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ERAS.map((era) => (
          <button
            key={era.id}
            onClick={() => onSelect(era)}
            className="group relative p-6 rounded-lg border-2 border-charcoal-700
                       bg-gradient-to-b from-charcoal-900 to-charcoal-950
                       hover:border-gold-700 hover:from-charcoal-800 hover:to-charcoal-900
                       transition-all duration-300 text-left
                       focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-charcoal-950"
          >
            {/* Decorative corner */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-700 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-700 opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="mb-4">
              <h3 className="font-medieval text-xl text-parchment-100 group-hover:text-gold-400 transition-colors">
                {era.name}
              </h3>
              <p className="text-sm text-parchment-500 font-body italic">
                {era.period}
              </p>
            </div>

            <p className="text-parchment-400 text-sm leading-relaxed mb-4">
              {era.description}
            </p>

            {/* Trait indicators */}
            <div className="flex gap-2 flex-wrap">
              {era.baseTraits.militarism && era.baseTraits.militarism > 0.6 && (
                <span className="px-2 py-1 text-xs bg-burgundy-900/50 text-burgundy-300 rounded border border-burgundy-700">
                  Warlike
                </span>
              )}
              {era.baseTraits.prosperity && era.baseTraits.prosperity > 0.6 && (
                <span className="px-2 py-1 text-xs bg-gold-900/50 text-gold-300 rounded border border-gold-700">
                  Prosperous
                </span>
              )}
              {era.baseTraits.religiosity && era.baseTraits.religiosity > 0.6 && (
                <span className="px-2 py-1 text-xs bg-purple-900/50 text-purple-300 rounded border border-purple-700">
                  Devout
                </span>
              )}
              {era.baseTraits.openness && era.baseTraits.openness > 0.6 && (
                <span className="px-2 py-1 text-xs bg-teal-900/50 text-teal-300 rounded border border-teal-700">
                  Open
                </span>
              )}
            </div>

            {/* Hover glow effect */}
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${era.aesthetics.accentColor}10 0%, transparent 70%)`,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
