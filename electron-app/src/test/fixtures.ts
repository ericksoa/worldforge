import type { Era, TarotDilemma, TarotChoice, WorldTraits, WorldState } from '../shared/types'

export const mockWorldTraits: WorldTraits = {
  militarism: 0.5,
  prosperity: 0.5,
  religiosity: 0.5,
  lawfulness: 0.5,
  openness: 0.5,
}

export const mockEra: Era = {
  id: 'normandy_10th',
  name: 'Normandy',
  period: '10th Century',
  description: 'The age of the Northmen turned Norman lords',
  baseTraits: {
    militarism: 0.6,
    religiosity: 0.5,
  },
  aesthetics: {
    primaryColor: '#8B4513',
    accentColor: '#D4AF37',
    atmosphere: 'medieval',
  },
}

export const mockChoiceA: TarotChoice = {
  label: 'The Conqueror',
  description: 'Expand through might. Let the banner of the Norman lords fly over new territories.',
  traitEffects: { militarism: 0.15, prosperity: -0.05 },
  worldEvents: ['Military encampments appear', 'Fortifications are strengthened'],
  imagePrompt: 'Medieval woodcut of a warrior',
}

export const mockChoiceB: TarotChoice = {
  label: 'The Merchant',
  description: 'Build through trade. Let wealth flow through the ports and markets.',
  traitEffects: { prosperity: 0.15, openness: 0.1 },
  worldEvents: ['Trade routes are established', 'Markets flourish'],
  imagePrompt: 'Medieval woodcut of a merchant',
}

export const mockDilemma: TarotDilemma = {
  id: 'conquest_vs_trade',
  cardName: 'The Path of Power',
  cardNumber: 1,
  description: 'The Northmen have settled these shores, but how shall they build their legacy?',
  era: 'normandy_10th',
  choiceA: mockChoiceA,
  choiceB: mockChoiceB,
}

export const mockWorldState: WorldState = {
  era: mockEra,
  traits: mockWorldTraits,
  choices: [],
  factions: [],
  landmarks: [],
  atmosphere: 'prosperous',
}

export function createMockDilemma(overrides: Partial<TarotDilemma> = {}): TarotDilemma {
  return { ...mockDilemma, ...overrides }
}

export function createMockTraits(overrides: Partial<WorldTraits> = {}): WorldTraits {
  return { ...mockWorldTraits, ...overrides }
}
