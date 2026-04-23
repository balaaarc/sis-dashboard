import { useState } from 'react'
import type { Alert } from '@/types/sensors'
import { formatRelativeTime, getThreatLevelColor } from '@/utils/formatters'

interface AlertRowProps {
  alert: Alert
  onAck: (id: string) => void
}

const LEVEL_INITIAL: Record<string, string> = {
  CRITICAL: 'C',
  HIGH:     'H',
  MEDIUM:   'M',
  LOW:      'L',
  CLEAR:    '—',
}

export function AlertRow({ alert, onAck }: AlertRowProps) {
  const [ackComment, setAckComment] = useState('')
  const [showAckInput, setShowAckInput] = useState(false)

  const levelColor = getThreatLevelColor(alert.threat_level)
  const initial = LEVEL_INITIAL[alert.threat_level] ?? '?'

  const handleAckClick = () => {
    if (alert.acknowledged) return
    if (showAckInput) {
      onAck(alert.id)
      setShowAckInput(false)
      setAckComment('')
    } else {
      setShowAckInput(true)
    }
  }

  return (
    <div
      className={`alert-row ${alert.threat_level.toLowerCase()}${alert.acknowledged ? ' acknowledged' : ''} animate-mount flex-col gap-0 p-0`}
    >
      <div className="flex items-start gap-2 py-2 px-3">
        {/* Severity badge */}
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-black shrink-0 mt-[1px]"
          style={{
            background: `${levelColor}22`,
            border: `1px solid ${levelColor}66`,
            color: levelColor,
          }}
        >
          {initial}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
            {alert.classification}
          </div>
          <div
            className="text-[11px] text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap mt-[1px]"
            title={alert.description}
          >
            {alert.description}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            {alert.source_sensors.slice(0, 3).map((s) => (
              <span
                key={s}
                className="text-[10px] font-mono text-accent-teal bg-bg-primary py-[1px] px-1 rounded-[3px] border border-border-color"
              >
                {s}
              </span>
            ))}
            {alert.source_sensors.length > 3 && (
              <span className="text-[10px] text-text-secondary">
                +{alert.source_sensors.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] text-text-secondary">
            {formatRelativeTime(alert.timestamp)}
          </span>
          {!alert.acknowledged ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleAckClick() }}
              className="btn btn-ghost text-[10px] py-[2px] px-2 rounded"
            >
              {showAckInput ? 'Confirm' : 'ACK'}
            </button>
          ) : (
            <span className="text-[10px] text-sensor-acoustic font-semibold">ACKED</span>
          )}
        </div>
      </div>

      {/* Ack comment input */}
      {showAckInput && !alert.acknowledged && (
        <div className="px-3 pb-2 flex gap-1.5">
          <input
            autoFocus
            value={ackComment}
            onChange={(e) => setAckComment(e.target.value)}
            placeholder="Comment (optional)..."
            className="flex-1 text-[11px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAckClick()
              if (e.key === 'Escape') { setShowAckInput(false); setAckComment('') }
            }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setShowAckInput(false); setAckComment('') }}
            className="btn btn-ghost text-[10px] py-[2px] px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Annotation */}
      {alert.acknowledged && alert.annotation && (
        <div className="px-3 pb-1.5 pl-11 text-[10px] text-text-secondary italic">
          "{alert.annotation}"
        </div>
      )}
    </div>
  )
}
