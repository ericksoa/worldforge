// ============================================================================
// World Traits
// ============================================================================

/**
 * Core traits that define the game world's characteristics.
 * All values range from 0.0 (low) to 1.0 (high).
 */
export interface WorldTraits {
  /** 0 = peaceful, 1 = warlike */
  militarism: number
  /** 0 = impoverished, 1 = wealthy */
  prosperity: number
  /** 0 = secular, 1 = devout */
  religiosity: number
  /** 0 = chaotic, 1 = orderly */
  lawfulness: number
  /** 0 = isolationist, 1 = cosmopolitan */
  openness: number
}

// ============================================================================
// Historical Era
// ============================================================================

/** Aesthetic configuration for an era */
export interface EraAesthetics {
  primaryColor: string
  accentColor: string
  atmosphere: string
}

/** Historical era definition for world building */
export interface Era {
  id: string
  name: string
  period: string
  description: string
  baseTraits: Partial<WorldTraits>
  aesthetics: EraAesthetics
}

// ============================================================================
// Tarot System
// ============================================================================

/** A single choice option in a tarot dilemma */
export interface TarotChoice {
  label: string
  description: string
  traitEffects: Partial<WorldTraits>
  worldEvents: string[]
  /** Landmarks to spawn when this choice is selected */
  landmarks?: Landmark[]
  imagePrompt?: string
}

/** A complete tarot card dilemma with two choices */
export interface TarotDilemma {
  id: string
  cardName: string
  cardNumber: number
  description: string
  choiceA: TarotChoice
  choiceB: TarotChoice
  era: string
}

/** Record of a player's choice for a dilemma */
export interface ChoiceRecord {
  dilemma: TarotDilemma
  chosen: 'A' | 'B'
  timestamp: number
}

// ============================================================================
// World Entities
// ============================================================================

/** A faction in the game world */
export interface Faction {
  id: string
  name: string
  disposition: 'friendly' | 'neutral' | 'hostile'
  strength: number
  traits: string[]
}

/** A notable location in the game world */
export interface Landmark {
  id: string
  name: string
  type: 'settlement' | 'fortress' | 'monastery' | 'ruin' | 'natural'
  description: string
}

/** The overall atmosphere of the world */
export type Atmosphere =
  | 'war_torn'
  | 'prosperous'
  | 'mysterious'
  | 'sacred'
  | 'desolate'
  | 'vibrant'

// ============================================================================
// World State
// ============================================================================

/** Complete state of the game world */
export interface WorldState {
  era: Era | null
  traits: WorldTraits
  choices: ChoiceRecord[]
  factions: Faction[]
  landmarks: Landmark[]
  atmosphere: Atmosphere
}

// ============================================================================
// UE5 Integration
// ============================================================================

/** Commands that can be sent to Unreal Engine 5 */
export type UE5Command =
  | { type: 'SET_ERA'; era: Era }
  | { type: 'SET_TRAIT'; trait: keyof WorldTraits; value: number }
  | { type: 'SPAWN_SETTLEMENT'; settlement: Landmark }
  | { type: 'SET_ATMOSPHERE'; atmosphere: Atmosphere }
  | { type: 'ADD_FACTION'; faction: Faction }
  | { type: 'PLACE_LANDMARK'; landmark: Landmark }
  | { type: 'SYNC_WORLD_STATE'; state: WorldState }
