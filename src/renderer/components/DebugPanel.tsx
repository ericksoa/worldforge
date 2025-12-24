import { useRef, useEffect } from 'react'
import { useDebugStore, DebugLogEntry, LogType } from '../stores/debugStore'

// ============================================================================
// Constants
// ============================================================================

/** Maximum length of data to display in log entries */
const MAX_DATA_DISPLAY_LENGTH = 500

/** Color classes for each log type */
const LOG_TYPE_COLORS: Record<LogType, string> = {
  request: 'text-blue-400',
  response: 'text-green-400',
  error: 'text-red-400',
  info: 'text-gray-400',
}

/** Icon characters for each log type */
const LOG_TYPE_ICONS: Record<LogType, string> = {
  request: '→',
  response: '←',
  error: '✕',
  info: '•',
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Format a Date as HH:MM:SS */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Format log data for display, truncating if necessary */
function formatLogData(data: unknown): string {
  if (typeof data === 'string') {
    return data
  }
  return JSON.stringify(data, null, 2).slice(0, MAX_DATA_DISPLAY_LENGTH)
}

// ============================================================================
// Helper Components
// ============================================================================

/** Individual log entry display */
function LogEntry({ entry }: { entry: DebugLogEntry }) {
  return (
    <div className="font-mono text-xs leading-relaxed">
      <span className="text-gray-500">[{formatTime(entry.timestamp)}]</span>{' '}
      <span className={LOG_TYPE_COLORS[entry.type]}>{LOG_TYPE_ICONS[entry.type]}</span>{' '}
      <span className="text-gray-300">{entry.message}</span>
      {entry.data && (
        <pre className="text-gray-500 ml-6 mt-1 text-[10px] overflow-x-auto">
          {formatLogData(entry.data)}
        </pre>
      )}
    </div>
  )
}

/** Toggle bar at the top of the debug panel */
function ToggleBar({
  logCount,
  isOpen,
  onToggle,
  onClear,
}: {
  logCount: number
  isOpen: boolean
  onToggle: () => void
  onClear: () => void
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-1 bg-charcoal-900 border-t border-charcoal-700 cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-gold-600">DEBUG</span>
        <span className="text-xs text-gray-500">
          {logCount} log{logCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Clear
          </button>
        )}
        <span className="text-gray-500 text-xs">{isOpen ? '▼' : '▲'}</span>
      </div>
    </div>
  )
}

/** Scrollable log list */
function LogList({ logs }: { logs: DebugLogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div
      ref={scrollRef}
      className="h-48 overflow-y-auto bg-charcoal-950 border-t border-charcoal-800 p-3 space-y-1"
    >
      {logs.length === 0 ? (
        <p className="text-gray-600 text-xs font-mono">Waiting for activity...</p>
      ) : (
        logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function DebugPanel() {
  const { logs, isOpen, clearLogs, togglePanel } = useDebugStore()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <ToggleBar
        logCount={logs.length}
        isOpen={isOpen}
        onToggle={togglePanel}
        onClear={clearLogs}
      />
      {isOpen && <LogList logs={logs} />}
    </div>
  )
}
