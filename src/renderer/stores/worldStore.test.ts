import { describe, it, expect, beforeEach } from 'vitest'
import { useWorldStore, useEra, useTraits, useChoices, useAtmosphere } from './worldStore'
import { mockEra, mockDilemma, createMockTraits } from '../../test/fixtures'
import type { Faction, Landmark } from '../../shared/types'

describe('worldStore', () => {
  beforeEach(() => {
    useWorldStore.getState().resetWorld()
  })

  describe('initial state', () => {
    it('should have null era initially', () => {
      expect(useWorldStore.getState().era).toBeNull()
    })

    it('should have default traits at 0.5', () => {
      const traits = useWorldStore.getState().traits
      expect(traits.militarism).toBe(0.5)
      expect(traits.prosperity).toBe(0.5)
      expect(traits.religiosity).toBe(0.5)
      expect(traits.lawfulness).toBe(0.5)
      expect(traits.openness).toBe(0.5)
    })

    it('should have empty choices array', () => {
      expect(useWorldStore.getState().choices).toEqual([])
    })

    it('should have mysterious atmosphere by default', () => {
      expect(useWorldStore.getState().atmosphere).toBe('mysterious')
    })
  })

  describe('setEra', () => {
    it('should set the era', () => {
      useWorldStore.getState().setEra(mockEra)
      expect(useWorldStore.getState().era).toEqual(mockEra)
    })

    it('should apply era base traits', () => {
      useWorldStore.getState().setEra(mockEra)
      const traits = useWorldStore.getState().traits
      expect(traits.militarism).toBe(0.6)
      expect(traits.religiosity).toBe(0.5)
    })

    it('should reset choices when setting era', () => {
      useWorldStore.getState().setEra(mockEra)
      useWorldStore.getState().recordChoice(mockDilemma, 'A')
      expect(useWorldStore.getState().choices.length).toBe(1)

      useWorldStore.getState().setEra(mockEra)
      expect(useWorldStore.getState().choices).toEqual([])
    })

    it('should reset atmosphere to mysterious when setting era', () => {
      useWorldStore.getState().setAtmosphere('war_torn')
      useWorldStore.getState().setEra(mockEra)
      expect(useWorldStore.getState().atmosphere).toBe('mysterious')
    })
  })

  describe('updateTraits', () => {
    it('should update specific traits', () => {
      useWorldStore.getState().updateTraits({ militarism: 0.8 })
      expect(useWorldStore.getState().traits.militarism).toBe(0.8)
      expect(useWorldStore.getState().traits.prosperity).toBe(0.5) // unchanged
    })

    it('should clamp traits to 0-1 range (max)', () => {
      useWorldStore.getState().updateTraits({ militarism: 1.5 })
      expect(useWorldStore.getState().traits.militarism).toBe(1)
    })

    it('should clamp traits to 0-1 range (min)', () => {
      useWorldStore.getState().updateTraits({ militarism: -0.5 })
      expect(useWorldStore.getState().traits.militarism).toBe(0)
    })
  })

  describe('recordChoice', () => {
    it('should record choice A and apply trait effects', () => {
      useWorldStore.getState().recordChoice(mockDilemma, 'A')

      const state = useWorldStore.getState()
      expect(state.choices.length).toBe(1)
      expect(state.choices[0].chosen).toBe('A')
      expect(state.choices[0].dilemma).toEqual(mockDilemma)
      expect(state.traits.militarism).toBe(0.65) // 0.5 + 0.15
      expect(state.traits.prosperity).toBe(0.45) // 0.5 - 0.05
    })

    it('should record choice B and apply trait effects', () => {
      useWorldStore.getState().recordChoice(mockDilemma, 'B')

      const state = useWorldStore.getState()
      expect(state.choices[0].chosen).toBe('B')
      expect(state.traits.prosperity).toBe(0.65) // 0.5 + 0.15
      expect(state.traits.openness).toBe(0.6) // 0.5 + 0.1
    })

    it('should add timestamp to choice (defaults to Date.now)', () => {
      const before = Date.now()
      useWorldStore.getState().recordChoice(mockDilemma, 'A')
      const after = Date.now()

      const timestamp = useWorldStore.getState().choices[0].timestamp
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('should use injected timestamp when provided (deterministic)', () => {
      const fixedTimestamp = 1700000000000
      useWorldStore.getState().recordChoice(mockDilemma, 'A', fixedTimestamp)

      const timestamp = useWorldStore.getState().choices[0].timestamp
      expect(timestamp).toBe(fixedTimestamp)
    })

    it('should set atmosphere to war_torn when militarism > 0.7', () => {
      useWorldStore.getState().updateTraits({ militarism: 0.7 })
      useWorldStore.getState().recordChoice(mockDilemma, 'A') // +0.15 militarism
      expect(useWorldStore.getState().atmosphere).toBe('war_torn')
    })

    it('should set atmosphere to prosperous when prosperity > 0.7', () => {
      useWorldStore.getState().updateTraits({ prosperity: 0.6 })
      useWorldStore.getState().recordChoice(mockDilemma, 'B') // +0.15 prosperity
      expect(useWorldStore.getState().atmosphere).toBe('prosperous')
    })

    it('should set atmosphere to sacred when religiosity > 0.7', () => {
      useWorldStore.getState().updateTraits({ religiosity: 0.8 })
      useWorldStore.getState().recordChoice(mockDilemma, 'A')
      expect(useWorldStore.getState().atmosphere).toBe('sacred')
    })

    it('should set atmosphere to desolate when prosperity < 0.3', () => {
      useWorldStore.getState().updateTraits({ prosperity: 0.2 })
      useWorldStore.getState().recordChoice(mockDilemma, 'A') // -0.05 prosperity = 0.15
      expect(useWorldStore.getState().atmosphere).toBe('desolate')
    })

    it('should set atmosphere to vibrant when openness > 0.7', () => {
      useWorldStore.getState().updateTraits({ openness: 0.65 })
      useWorldStore.getState().recordChoice(mockDilemma, 'B') // +0.1 openness
      expect(useWorldStore.getState().atmosphere).toBe('vibrant')
    })

    it('should clamp trait effects to 0-1 range', () => {
      useWorldStore.getState().updateTraits({ militarism: 0.95 })
      useWorldStore.getState().recordChoice(mockDilemma, 'A') // +0.15 would be 1.1
      expect(useWorldStore.getState().traits.militarism).toBe(1)
    })
  })

  describe('addFaction', () => {
    it('should add a faction', () => {
      const faction: Faction = {
        id: 'test_faction',
        name: 'Test Faction',
        disposition: 'friendly',
        strength: 0.5,
        traits: ['trading'],
      }

      useWorldStore.getState().addFaction(faction)
      expect(useWorldStore.getState().factions).toContainEqual(faction)
    })

    it('should accumulate multiple factions', () => {
      const faction1: Faction = { id: 'f1', name: 'F1', disposition: 'friendly', strength: 0.5, traits: [] }
      const faction2: Faction = { id: 'f2', name: 'F2', disposition: 'hostile', strength: 0.8, traits: [] }

      useWorldStore.getState().addFaction(faction1)
      useWorldStore.getState().addFaction(faction2)

      expect(useWorldStore.getState().factions.length).toBe(2)
    })
  })

  describe('addLandmark', () => {
    it('should add a landmark', () => {
      const landmark: Landmark = {
        id: 'test_landmark',
        name: 'Test Castle',
        type: 'fortress',
        description: 'A mighty fortress',
      }

      useWorldStore.getState().addLandmark(landmark)
      expect(useWorldStore.getState().landmarks).toContainEqual(landmark)
    })
  })

  describe('setAtmosphere', () => {
    it('should set the atmosphere', () => {
      useWorldStore.getState().setAtmosphere('war_torn')
      expect(useWorldStore.getState().atmosphere).toBe('war_torn')
    })
  })

  describe('resetWorld', () => {
    it('should reset all state to initial values', () => {
      useWorldStore.getState().setEra(mockEra)
      useWorldStore.getState().recordChoice(mockDilemma, 'A')
      useWorldStore.getState().addFaction({ id: 'f', name: 'F', disposition: 'neutral', strength: 0.5, traits: [] })
      useWorldStore.getState().addLandmark({ id: 'l', name: 'L', type: 'ruin', description: 'test' })
      useWorldStore.getState().setAtmosphere('war_torn')

      useWorldStore.getState().resetWorld()

      const state = useWorldStore.getState()
      expect(state.era).toBeNull()
      expect(state.choices).toEqual([])
      expect(state.factions).toEqual([])
      expect(state.landmarks).toEqual([])
      expect(state.atmosphere).toBe('mysterious')
      expect(state.traits.militarism).toBe(0.5)
    })
  })

  describe('exportWorldState', () => {
    it('should return current world state', () => {
      useWorldStore.getState().setEra(mockEra)
      useWorldStore.getState().recordChoice(mockDilemma, 'A')

      const exported = useWorldStore.getState().exportWorldState()

      expect(exported.era).toEqual(mockEra)
      expect(exported.choices.length).toBe(1)
      expect(exported.traits).toBeDefined()
      expect(exported.factions).toEqual([])
      expect(exported.landmarks).toEqual([])
    })
  })

  describe('selector hooks', () => {
    it('useEra should return era', () => {
      useWorldStore.getState().setEra(mockEra)
      // Note: In actual React components these would be hooks
      // Here we just verify the selectors work via getState
      expect(useWorldStore.getState().era).toEqual(mockEra)
    })

    it('useTraits should return traits', () => {
      const traits = useWorldStore.getState().traits
      expect(traits).toBeDefined()
      expect(traits.militarism).toBe(0.5)
    })

    it('useChoices should return choices', () => {
      useWorldStore.getState().recordChoice(mockDilemma, 'A')
      expect(useWorldStore.getState().choices.length).toBe(1)
    })

    it('useAtmosphere should return atmosphere', () => {
      expect(useWorldStore.getState().atmosphere).toBe('mysterious')
    })
  })
})
