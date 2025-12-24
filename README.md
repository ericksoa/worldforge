# WorldForge

**An AI-powered world builder where ethical dilemmas shape civilizations**

Draw tarot cards. Make impossible choices. Watch worlds emerge.

WorldForge uses Claude AI to generate morally complex dilemmas set in historical eras. Each choice you make—whether to show mercy or strength, to embrace tradition or change—shapes the fundamental character of your world. The resulting civilization can be exported to Unreal Engine 5 for procedural world generation.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   1. CHOOSE AN ERA           2. DRAW CARDS              3. SHAPE WORLDS    │
│                                                                             │
│   ╭─────────────────╮       ╭─────────╮ ╭─────────╮     ╭───────────────╮  │
│   │  10th Century   │       │  ┌───┐  │ │  ┌───┐  │     │ Militarism ▓░ │  │
│   │    Normandy     │  ───► │  │ A │  │ │  │ B │  │ ──► │ Prosperity ▓▓ │  │
│   │                 │       │  └───┘  │ │  └───┘  │     │ Religiosity ▓ │  │
│   ╰─────────────────╯       ╰─────────╯ ╰─────────╯     ╰───────────────╯  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**World Traits:**
- **Militarism** — Is your civilization peaceful or warlike?
- **Prosperity** — Are the people impoverished or wealthy?
- **Religiosity** — Is society secular or devoutly spiritual?
- **Lawfulness** — Does chaos reign or does order prevail?
- **Openness** — Are borders closed or is the culture cosmopolitan?

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop App | Electron + React 18 + TypeScript |
| Styling | Tailwind CSS (custom medieval theme) |
| State | Zustand |
| AI Backend | Claude API (Anthropic) |
| Image Generation | Replicate (Flux) |
| Game Engine | Unreal Engine 5 Plugin |
| Testing | Vitest + React Testing Library |

## Quick Start

### Prerequisites
- Node.js 18+
- Claude API key from [Anthropic](https://console.anthropic.com/)
- (Optional) Replicate API key for AI-generated card art

### Setup

```bash
# Install dependencies
npm install

# Configure API keys
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# Start development server
npm run dev
```

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional - for AI-generated tarot card images
REPLICATE_API_TOKEN=r8_...

# Development - use placeholder images instead of Replicate API
USE_MOCK_IMAGES=true
```

## Available Eras

| Era | Setting |
|-----|---------|
| 10th Century Normandy | Viking settlements becoming feudal lords |
| 6th Century Byzantium | The last flames of Rome |
| 13th Century Mongolia | The Khans reshape the world |
| 16th Century Japan | Warring states and the way of the sword |
| 14th Century BCE Egypt | Pharaohs and the Nile's bounty |
| 9th Century Scandinavia | Gods, raids, and the sea |

## Project Structure

```
src/
├── main/              # Electron main process
│   └── index.ts       # App entry, IPC handlers, Claude API
├── preload/           # Context bridge (IPC security layer)
│   └── index.ts       # Exposes worldforge API to renderer
├── renderer/          # React application
│   ├── App.tsx        # Root component
│   ├── components/    # UI components
│   │   ├── TarotCard.tsx      # Interactive card with flip animation
│   │   ├── TarotSpread.tsx    # Card pair display & selection
│   │   ├── EraSelector.tsx    # Historical era picker
│   │   ├── WorldPreview.tsx   # Trait visualization
│   │   └── DebugPanel.tsx     # Dev tools overlay
│   ├── services/      # External integrations
│   │   ├── claude.ts          # Dilemma generation
│   │   └── ue5-bridge.ts      # WebSocket to UE5
│   └── stores/        # Zustand state
│       ├── worldStore.ts      # World traits, choices, era
│       └── debugStore.ts      # Debug logging
├── shared/            # Shared between processes
│   ├── types.ts               # TypeScript interfaces
│   └── placeholder-images.ts  # Mock image system
└── test/              # Test utilities
    ├── setup.ts               # Vitest configuration
    └── fixtures.ts            # Test data factories
```

## UE5 Integration

The Electron app connects to Unreal Engine via WebSocket:

```
Electron App ◄──── WebSocket (port 8765) ────► UE5 WorldForge Plugin
                   JSON commands
```

**Supported commands:**
- `SET_TRAIT` — Update a world trait value
- `SET_ATMOSPHERE` — Change world atmosphere (pastoral, war_torn, etc.)
- `SYNC_WORLD_STATE` — Push complete world state
- `SPAWN_SETTLEMENT` — Trigger settlement generation

## Development

```bash
# Run tests (watch mode)
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

### Mock Images

For faster development without API costs, enable mock images:

```bash
USE_MOCK_IMAGES=true npm run dev
```

This uses 31 pre-generated tarot-style placeholder images instead of calling Replicate.

## Project Philosophy

WorldForge follows these principles:

- **Pure functions** — Business logic is side-effect free
- **Immutable state** — All state updates create new objects
- **Effects at boundaries** — API calls and logging happen at the edges
- **LLM-first constraints** — Prompt engineering over truncation

See `CLAUDE.md` for detailed architecture guidelines.

## License

MIT
