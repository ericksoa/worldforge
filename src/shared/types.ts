// World traits that define the game world
export interface WorldTraits {
  militarism: number      // 0-1: peaceful to warlike
  prosperity: number      // 0-1: impoverished to wealthy
  religiosity: number     // 0-1: secular to devout
  lawfulness: number      // 0-1: chaotic to orderly
  openness: number        // 0-1: isolationist to cosmopolitan
}

// Historical era definition
export interface Era {
  id: string
  name: string
  period: string
  description: string
  baseTraits: Partial<WorldTraits>
  aesthetics: {
    primaryColor: string
    accentColor: string
    atmosphere: string
  }
}

// Tarot card choice
export interface TarotChoice {
  label: string
  description: string
  traitEffects: Partial<WorldTraits>
  worldEvents: string[]
  imagePrompt?: string
}

// Generated tarot dilemma
export interface TarotDilemma {
  id: string
  cardName: string
  cardNumber: number
  description: string
  choiceA: TarotChoice
  choiceB: TarotChoice
  era: string
}

// World state after choices
export interface WorldState {
  era: Era | null
  traits: WorldTraits
  choices: Array<{
    dilemma: TarotDilemma
    chosen: 'A' | 'B'
    timestamp: number
  }>
  factions: Faction[]
  landmarks: Landmark[]
  atmosphere: Atmosphere
}

export interface Faction {
  id: string
  name: string
  disposition: 'friendly' | 'neutral' | 'hostile'
  strength: number
  traits: string[]
}

export interface Landmark {
  id: string
  name: string
  type: 'settlement' | 'fortress' | 'monastery' | 'ruin' | 'natural'
  description: string
}

export type Atmosphere =
  | 'war_torn'
  | 'prosperous'
  | 'mysterious'
  | 'sacred'
  | 'desolate'
  | 'vibrant'

// UE5 Commands
export type UE5Command =
  | { type: 'SET_ERA'; era: Era }
  | { type: 'SET_TRAIT'; trait: keyof WorldTraits; value: number }
  | { type: 'SPAWN_SETTLEMENT'; settlement: Landmark }
  | { type: 'SET_ATMOSPHERE'; atmosphere: Atmosphere }
  | { type: 'ADD_FACTION'; faction: Faction }
  | { type: 'PLACE_LANDMARK'; landmark: Landmark }
  | { type: 'SYNC_WORLD_STATE'; state: WorldState }
