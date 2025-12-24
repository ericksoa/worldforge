import { create } from 'zustand'
import type { Era, WorldTraits, WorldState, TarotDilemma, Faction, Landmark, Atmosphere } from '../../shared/types'

// ============================================================================
// Constants
// ============================================================================

const TRAIT_MIN = 0
const TRAIT_MAX = 1
const TRAIT_DEFAULT = 0.5

const ATMOSPHERE_THRESHOLDS = {
  high: 0.7,
  low: 0.3,
} as const

const DEFAULT_TRAITS: WorldTraits = {
  militarism: TRAIT_DEFAULT,
  prosperity: TRAIT_DEFAULT,
  religiosity: TRAIT_DEFAULT,
  lawfulness: TRAIT_DEFAULT,
  openness: TRAIT_DEFAULT,
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Clamp a value between min and max (inclusive) */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Clamp a trait value to valid range [0, 1] */
function clampTrait(value: number): number {
  return clamp(value, TRAIT_MIN, TRAIT_MAX)
}

/** Determine world atmosphere based on current trait values */
function determineAtmosphere(traits: WorldTraits, currentAtmosphere: Atmosphere): Atmosphere {
  const { high, low } = ATMOSPHERE_THRESHOLDS

  if (traits.militarism > high) return 'war_torn'
  if (traits.prosperity > high) return 'prosperous'
  if (traits.religiosity > high) return 'sacred'
  if (traits.prosperity < low) return 'desolate'
  if (traits.openness > high) return 'vibrant'

  return currentAtmosphere
}

/** Apply trait effect deltas to current traits */
function applyTraitEffects(
  currentTraits: WorldTraits,
  effects: Partial<WorldTraits>
): WorldTraits {
  const newTraits = { ...currentTraits }

  for (const [traitName, delta] of Object.entries(effects)) {
    const key = traitName as keyof WorldTraits
    newTraits[key] = clampTrait(newTraits[key] + (delta as number))
  }

  return newTraits
}

// ============================================================================
// Store Interface
// ============================================================================

interface WorldStore extends WorldState {
  setEra: (era: Era) => void
  updateTraits: (traits: Partial<WorldTraits>) => void
  recordChoice: (dilemma: TarotDilemma, chosen: 'A' | 'B') => void
  addFaction: (faction: Faction) => void
  addLandmark: (landmark: Landmark) => void
  setAtmosphere: (atmosphere: Atmosphere) => void
  resetWorld: () => void
  exportWorldState: () => WorldState
}

// ============================================================================
// Store Implementation
// ============================================================================

const INITIAL_STATE: WorldState = {
  era: null,
  traits: { ...DEFAULT_TRAITS },
  choices: [],
  factions: [],
  landmarks: [],
  atmosphere: 'mysterious',
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  ...INITIAL_STATE,

  setEra: (era) => {
    const traitsWithEraDefaults = { ...DEFAULT_TRAITS, ...era.baseTraits }
    set({
      era,
      traits: traitsWithEraDefaults,
      choices: [],
      factions: [],
      landmarks: [],
      atmosphere: 'mysterious',
    })
  },

  updateTraits: (traitUpdates) => {
    set((state) => {
      const clampedUpdates = Object.fromEntries(
        Object.entries(traitUpdates).map(([key, value]) => [
          key,
          clampTrait(value as number),
        ])
      )
      return {
        traits: { ...state.traits, ...clampedUpdates } as WorldTraits,
      }
    })
  },

  recordChoice: (dilemma, chosen) => {
    const selectedChoice = chosen === 'A' ? dilemma.choiceA : dilemma.choiceB

    set((state) => {
      const updatedTraits = applyTraitEffects(state.traits, selectedChoice.traitEffects)
      const newAtmosphere = determineAtmosphere(updatedTraits, state.atmosphere)
      const choiceRecord = { dilemma, chosen, timestamp: Date.now() }

      return {
        traits: updatedTraits,
        choices: [...state.choices, choiceRecord],
        atmosphere: newAtmosphere,
      }
    })
  },

  addFaction: (faction) => {
    set((state) => ({
      factions: [...state.factions, faction],
    }))
  },

  addLandmark: (landmark) => {
    set((state) => ({
      landmarks: [...state.landmarks, landmark],
    }))
  },

  setAtmosphere: (atmosphere) => {
    set({ atmosphere })
  },

  resetWorld: () => {
    set(INITIAL_STATE)
  },

  exportWorldState: () => {
    const { era, traits, choices, factions, landmarks, atmosphere } = get()
    return { era, traits, choices, factions, landmarks, atmosphere }
  },
}))

// Selector hooks for specific state slices
export const useEra = () => useWorldStore((state) => state.era)
export const useTraits = () => useWorldStore((state) => state.traits)
export const useChoices = () => useWorldStore((state) => state.choices)
export const useAtmosphere = () => useWorldStore((state) => state.atmosphere)
