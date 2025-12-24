import { create } from 'zustand'
import type { Era, WorldTraits, WorldState, TarotDilemma, Faction, Landmark, Atmosphere } from '../../shared/types'

interface WorldStore extends WorldState {
  // Actions
  setEra: (era: Era) => void
  updateTraits: (traits: Partial<WorldTraits>) => void
  recordChoice: (dilemma: TarotDilemma, chosen: 'A' | 'B') => void
  addFaction: (faction: Faction) => void
  addLandmark: (landmark: Landmark) => void
  setAtmosphere: (atmosphere: Atmosphere) => void
  resetWorld: () => void
  exportWorldState: () => WorldState
}

const defaultTraits: WorldTraits = {
  militarism: 0.5,
  prosperity: 0.5,
  religiosity: 0.5,
  lawfulness: 0.5,
  openness: 0.5,
}

const initialState: WorldState = {
  era: null,
  traits: { ...defaultTraits },
  choices: [],
  factions: [],
  landmarks: [],
  atmosphere: 'mysterious',
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  ...initialState,

  setEra: (era) => {
    const baseTraits = { ...defaultTraits, ...era.baseTraits }
    set({
      era,
      traits: baseTraits,
      choices: [],
      factions: [],
      landmarks: [],
      atmosphere: 'mysterious',
    })
  },

  updateTraits: (newTraits) => {
    set((state) => ({
      traits: {
        ...state.traits,
        ...Object.fromEntries(
          Object.entries(newTraits).map(([key, value]) => [
            key,
            Math.max(0, Math.min(1, value as number)), // Clamp 0-1
          ])
        ),
      } as WorldTraits,
    }))
  },

  recordChoice: (dilemma, chosen) => {
    const choice = chosen === 'A' ? dilemma.choiceA : dilemma.choiceB

    set((state) => {
      // Apply trait effects
      const newTraits = { ...state.traits }
      for (const [trait, delta] of Object.entries(choice.traitEffects)) {
        const key = trait as keyof WorldTraits
        newTraits[key] = Math.max(0, Math.min(1, newTraits[key] + (delta as number)))
      }

      // Determine atmosphere based on traits
      let atmosphere: Atmosphere = state.atmosphere
      if (newTraits.militarism > 0.7) atmosphere = 'war_torn'
      else if (newTraits.prosperity > 0.7) atmosphere = 'prosperous'
      else if (newTraits.religiosity > 0.7) atmosphere = 'sacred'
      else if (newTraits.prosperity < 0.3) atmosphere = 'desolate'
      else if (newTraits.openness > 0.7) atmosphere = 'vibrant'

      return {
        traits: newTraits,
        choices: [
          ...state.choices,
          { dilemma, chosen, timestamp: Date.now() },
        ],
        atmosphere,
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
    set(initialState)
  },

  exportWorldState: () => {
    const state = get()
    return {
      era: state.era,
      traits: state.traits,
      choices: state.choices,
      factions: state.factions,
      landmarks: state.landmarks,
      atmosphere: state.atmosphere,
    }
  },
}))

// Selector hooks for specific state slices
export const useEra = () => useWorldStore((state) => state.era)
export const useTraits = () => useWorldStore((state) => state.traits)
export const useChoices = () => useWorldStore((state) => state.choices)
export const useAtmosphere = () => useWorldStore((state) => state.atmosphere)
