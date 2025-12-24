# WorldForge Architecture Guidelines

## Workflow Rules

- **Always ask before committing** - Get user approval before running `git commit`

## Core Principles

### 1. Pure Functions & Idempotency

Functions should be **pure** whenever possible:
- Same inputs always produce same outputs
- No side effects (logging, API calls, state mutations)
- No reliance on external mutable state

Functions should be **idempotent**:
- Calling a function multiple times with the same input produces the same result
- Safe to retry without unintended consequences

### 2. State Management

State should be:
- **Centralized** in designated stores (Zustand)
- **Immutable** - always return new objects, never mutate
- **Explicit** - side effects happen at the edges, not in business logic

### 3. Separation of Concerns

```
┌─────────────────────────────────────────────────────────────────┐
│                      ARCHITECTURE LAYERS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  UI Layer (Components)                                          │
│  └── Pure renders of state, dispatch actions                    │
│                                                                 │
│  State Layer (Stores)                                           │
│  └── Single source of truth, immutable updates                  │
│                                                                 │
│  Business Logic Layer (Pure Functions)                          │
│  └── Transformations, calculations, no side effects             │
│                                                                 │
│  Effects Layer (Services)                                       │
│  └── API calls, logging, external interactions                  │
│                                                                 │
│  Infrastructure Layer (Main Process)                            │
│  └── Electron IPC, system integration                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Dependency Injection for Side Effects

Instead of calling side effects directly:
```typescript
// BAD - side effect embedded in logic
function processChoice(dilemma, choice) {
  debugLog.info('Processing choice')  // side effect!
  const result = applyTraitEffects(...)
  return result
}

// GOOD - pure function, side effects handled by caller
function applyTraitEffects(traits, effects): WorldTraits {
  // Pure transformation
  return { ...traits, ...computedEffects }
}
```

### 5. Deterministic Outputs

Avoid non-deterministic functions in business logic:
```typescript
// BAD - non-deterministic
const record = { timestamp: Date.now() }

// GOOD - inject time as parameter
function createRecord(timestamp: number) {
  return { timestamp }
}
```

## Current Violations to Address

### Priority 1: Extract Pure Business Logic
- ~~`worldStore.recordChoice()` mixes state update with timestamp generation~~ ✅ Fixed: timestamp now injectable
- ~~`debugStore.addLog()` generates timestamp internally~~ ✅ Fixed: timestamp now injectable
- ~~`getFallbackDilemma()` uses `Math.random()` for delay~~ ✅ Fixed: delay now injectable via options

### Priority 2: Separate Logging from Logic
- ~~`claude.ts` has `debugLog` calls throughout~~ ✅ Fixed: logging moved to public function boundaries
- ~~`ue5-bridge.ts` has `console.log` in business methods~~ ✅ Fixed: converted to debugLog

### Priority 3: Make UE5Bridge Stateless
- ~~`UE5Bridge` class has internal mutable state~~ ✅ Fixed: converted to Zustand store
- ~~Consider making it a pure module with state in Zustand~~ ✅ Done: state now in useUE5BridgeStore

## Recommended Patterns

### Pure Trait Calculations
```typescript
// Pure function - no side effects
function calculateNewTraits(
  current: WorldTraits,
  effects: Partial<WorldTraits>
): WorldTraits {
  return Object.entries(effects).reduce(
    (acc, [key, delta]) => ({
      ...acc,
      [key]: clamp(acc[key as keyof WorldTraits] + delta, 0, 1)
    }),
    { ...current }
  )
}
```

### Effect Handling at Boundaries
```typescript
// Component handles effects, calls pure functions
function handleChoice(dilemma: TarotDilemma, choice: 'A' | 'B') {
  // Log at boundary
  debugLog.info('Choice selected', { dilemma: dilemma.id, choice })

  // Pure state update
  const newTraits = calculateNewTraits(traits, selectedChoice.traitEffects)
  const newAtmosphere = determineAtmosphere(newTraits)

  // State update
  store.setState({ traits: newTraits, atmosphere: newAtmosphere })
}
```
