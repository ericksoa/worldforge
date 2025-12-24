import { useState } from 'react'
import { EraSelector } from './components/EraSelector'
import { TarotSpread } from './components/TarotSpread'
import { WorldPreview } from './components/WorldPreview'
import { DebugPanel } from './components/DebugPanel'
import { useWorldStore } from './stores/worldStore'
import type { Era } from '../shared/types'

// ============================================================================
// Types
// ============================================================================

type Screen = 'era-select' | 'tarot' | 'preview'

// ============================================================================
// Helper Components
// ============================================================================

/** Back button with chevron icon */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-parchment-400 hover:text-parchment-200 transition-colors"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}

/** Header showing current era and optional view world button */
function EraHeader({
  eraName,
  showViewWorld,
  onViewWorld,
}: {
  eraName: string
  showViewWorld: boolean
  onViewWorld: () => void
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-sm text-parchment-400">
        <span className="text-parchment-600">Era:</span>{' '}
        <span className="font-medieval text-parchment-200">{eraName}</span>
      </div>
      {showViewWorld && (
        <button onClick={onViewWorld} className="btn-medieval">
          View World
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

function App() {
  const [screen, setScreen] = useState<Screen>('era-select')
  const { era, setEra, resetWorld } = useWorldStore()

  // --------------------------------------------------------------------------
  // Navigation Handlers
  // --------------------------------------------------------------------------

  const handleEraSelect = (selectedEra: Era) => {
    setEra(selectedEra)
    setScreen('tarot')
  }

  const handleBack = () => {
    if (screen === 'tarot') {
      resetWorld()
      setScreen('era-select')
    } else if (screen === 'preview') {
      setScreen('tarot')
    }
  }

  const handleViewWorld = () => {
    setScreen('preview')
  }

  // --------------------------------------------------------------------------
  // Render Helpers
  // --------------------------------------------------------------------------

  const renderCurrentScreen = () => {
    switch (screen) {
      case 'era-select':
        return <EraSelector onSelect={handleEraSelect} />
      case 'tarot':
        return <TarotSpread />
      case 'preview':
        return <WorldPreview onBack={() => setScreen('tarot')} />
    }
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex flex-col pb-56">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-charcoal-800">
        <div className="flex items-center gap-4">
          {screen !== 'era-select' && <BackButton onClick={handleBack} />}
          <h1 className="font-medieval text-2xl tracking-wider text-gold-500 text-glow">
            WorldForge
          </h1>
        </div>

        {era && (
          <EraHeader
            eraName={era.name}
            showViewWorld={screen === 'tarot'}
            onViewWorld={handleViewWorld}
          />
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        {renderCurrentScreen()}
      </main>

      {/* Footer */}
      <footer className="px-8 py-3 border-t border-charcoal-800 text-center">
        <p className="text-xs text-charcoal-500 font-body italic">
          Shape your world through the wisdom of the cards
        </p>
      </footer>

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  )
}

export default App
