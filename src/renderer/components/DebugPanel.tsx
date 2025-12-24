import { useDebugStore, DebugLogEntry } from '../stores/debugStore'
import { useRef, useEffect } from 'react'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function LogEntry({ entry }: { entry: DebugLogEntry }) {
  const colors: Record<DebugLogEntry['type'], string> = {
    request: 'text-blue-400',
    response: 'text-green-400',
    error: 'text-red-400',
    info: 'text-gray-400',
  }

  const icons: Record<DebugLogEntry['type'], string> = {
    request: '→',
    response: '←',
    error: '✕',
    info: '•',
  }

  return (
    <div className="font-mono text-xs leading-relaxed">
      <span className="text-gray-500">[{formatTime(entry.timestamp)}]</span>{' '}
      <span className={colors[entry.type]}>{icons[entry.type]}</span>{' '}
      <span className="text-gray-300">{entry.message}</span>
      {entry.data && (
        <pre className="text-gray-500 ml-6 mt-1 text-[10px] overflow-x-auto">
          {typeof entry.data === 'string'
            ? entry.data
            : JSON.stringify(entry.data, null, 2).slice(0, 500)}
        </pre>
      )}
    </div>
  )
}

export function DebugPanel() {
  const { logs, isOpen, clearLogs, togglePanel } = useDebugStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Toggle bar */}
      <div
        className="flex items-center justify-between px-4 py-1 bg-charcoal-900 border-t border-charcoal-700 cursor-pointer"
        onClick={togglePanel}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gold-600">DEBUG</span>
          <span className="text-xs text-gray-500">
            {logs.length} log{logs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearLogs()
              }}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Clear
            </button>
          )}
          <span className="text-gray-500 text-xs">{isOpen ? '▼' : '▲'}</span>
        </div>
      </div>

      {/* Log panel */}
      {isOpen && (
        <div
          ref={scrollRef}
          className="h-48 overflow-y-auto bg-charcoal-950 border-t border-charcoal-800 p-3 space-y-1"
        >
          {logs.length === 0 ? (
            <p className="text-gray-600 text-xs font-mono">
              Waiting for activity...
            </p>
          ) : (
            logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
          )}
        </div>
      )}
    </div>
  )
}
