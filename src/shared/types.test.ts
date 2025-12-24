import { describe, it, expect } from 'vitest'
import type {
  WorldTraits,
  Era,
  TarotChoice,
  TarotDilemma,
  WorldState,
  Faction,
  Landmark,
  Atmosphere,
  UE5Command,
} from './types'

// Type tests - these verify the types are correctly defined
// No runtime assertions needed for pure type definitions

describe('Type Definitions', () => {
  describe('WorldTraits', () => {
    it('should have all required trait properties', () => {
      const traits: WorldTraits = {
        militarism: 0.5,
        prosperity: 0.5,
        religiosity: 0.5,
        lawfulness: 0.5,
        openness: 0.5,
      }
      expect(traits).toBeDefined()
      expect(Object.keys(traits)).toHaveLength(5)
    })
  })

  describe('Era', () => {
    it('should have all required properties', () => {
      const era: Era = {
        id: 'test',
        name: 'Test Era',
        period: '1000 CE',
        description: 'A test era',
        baseTraits: { militarism: 0.5 },
        aesthetics: {
          primaryColor: '#000',
          accentColor: '#fff',
          atmosphere: 'test',
        },
      }
      expect(era).toBeDefined()
      expect(era.id).toBe('test')
    })
  })

  describe('TarotChoice', () => {
    it('should have required properties', () => {
      const choice: TarotChoice = {
        label: 'Test Choice',
        description: 'A test choice',
        traitEffects: { militarism: 0.1 },
        worldEvents: ['Event 1'],
      }
      expect(choice).toBeDefined()
    })

    it('should allow optional imagePrompt', () => {
      const choice: TarotChoice = {
        label: 'Test Choice',
        description: 'A test choice',
        traitEffects: {},
        worldEvents: [],
        imagePrompt: 'A test image',
      }
      expect(choice.imagePrompt).toBe('A test image')
    })
  })

  describe('TarotDilemma', () => {
    it('should have all required properties', () => {
      const dilemma: TarotDilemma = {
        id: 'test_dilemma',
        cardName: 'Test Card',
        cardNumber: 1,
        description: 'Test description',
        choiceA: {
          label: 'A',
          description: 'Choice A',
          traitEffects: {},
          worldEvents: [],
        },
        choiceB: {
          label: 'B',
          description: 'Choice B',
          traitEffects: {},
          worldEvents: [],
        },
        era: 'test_era',
      }
      expect(dilemma).toBeDefined()
    })
  })

  describe('Faction', () => {
    it('should have all required properties', () => {
      const faction: Faction = {
        id: 'test_faction',
        name: 'Test Faction',
        disposition: 'neutral',
        strength: 0.5,
        traits: ['trading'],
      }
      expect(faction).toBeDefined()
      expect(['friendly', 'neutral', 'hostile']).toContain(faction.disposition)
    })
  })

  describe('Landmark', () => {
    it('should have all required properties', () => {
      const landmark: Landmark = {
        id: 'test_landmark',
        name: 'Test Castle',
        type: 'fortress',
        description: 'A test fortress',
      }
      expect(landmark).toBeDefined()
      expect(['settlement', 'fortress', 'monastery', 'ruin', 'natural']).toContain(landmark.type)
    })
  })

  describe('Atmosphere', () => {
    it('should be one of the valid values', () => {
      const atmospheres: Atmosphere[] = [
        'war_torn',
        'prosperous',
        'mysterious',
        'sacred',
        'desolate',
        'vibrant',
      ]
      expect(atmospheres).toHaveLength(6)
    })
  })

  describe('WorldState', () => {
    it('should have all required properties', () => {
      const state: WorldState = {
        era: null,
        traits: {
          militarism: 0.5,
          prosperity: 0.5,
          religiosity: 0.5,
          lawfulness: 0.5,
          openness: 0.5,
        },
        choices: [],
        factions: [],
        landmarks: [],
        atmosphere: 'mysterious',
      }
      expect(state).toBeDefined()
    })
  })

  describe('UE5Command', () => {
    it('should support SET_ERA command', () => {
      const command: UE5Command = {
        type: 'SET_ERA',
        era: {
          id: 'test',
          name: 'Test',
          period: '1000',
          description: 'Test',
          baseTraits: {},
          aesthetics: { primaryColor: '#000', accentColor: '#fff', atmosphere: 'test' },
        },
      }
      expect(command.type).toBe('SET_ERA')
    })

    it('should support SET_TRAIT command', () => {
      const command: UE5Command = {
        type: 'SET_TRAIT',
        trait: 'militarism',
        value: 0.8,
      }
      expect(command.type).toBe('SET_TRAIT')
    })

    it('should support SET_ATMOSPHERE command', () => {
      const command: UE5Command = {
        type: 'SET_ATMOSPHERE',
        atmosphere: 'war_torn',
      }
      expect(command.type).toBe('SET_ATMOSPHERE')
    })

    it('should support SYNC_WORLD_STATE command', () => {
      const command: UE5Command = {
        type: 'SYNC_WORLD_STATE',
        state: {
          era: null,
          traits: {
            militarism: 0.5,
            prosperity: 0.5,
            religiosity: 0.5,
            lawfulness: 0.5,
            openness: 0.5,
          },
          choices: [],
          factions: [],
          landmarks: [],
          atmosphere: 'mysterious',
        },
      }
      expect(command.type).toBe('SYNC_WORLD_STATE')
    })
  })
})
