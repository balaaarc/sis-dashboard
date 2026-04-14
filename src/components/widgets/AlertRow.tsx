import { useState } from 'react'
import type { Alert } from '../../types/sensors'
import { formatRelativeTime, getThreatLevelColor } from '../../utils/formatters'

interface AlertRowProps {
  alert: Alert
  onAck: (id: string) => void
}

const LEVEL_INITIAL: Record<string, string> = {
  CRITICAL: 'C',
  HIGH: 'H',
  MEDIUM: 'M',
  LOW: 'L',
  CLEAR: '—',
}

export default function AlertRow({ alert, onAck }: AlertRowProps) {
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
      className={`alert-row ${alert.threat_level.toLowerCase()}${alert.acknowledged ? ' acknowledged' : ''} animate-mount`}
      style={{ flexDirection: 'column', gap: 0, padding: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px' }}>
        {/* Severity badge */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            background: `${levelColor}22`,
            border: `1px solid ${levelColor}66`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 900,
            color: levelColor,
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {initial}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {alert.classification}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 1,
            }}
            title={alert.description}
          >
            {alert.description}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 4,
              flexWrap: 'wrap',
            }}
          >
            {alert.source_sensors.slice(0, 3).map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: 'var(--accent-teal)',
                  background: 'var(--bg-primary)',
                  padding: '1px 4px',
                  borderRadius: 3,
                  border: '1px solid var(--border-color)',
                }}
              >
                {s}
              </span>
            ))}
            {alert.source_sensors.length > 3 && (
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                +{alert.source_sensors.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            {formatRelativeTime(alert.timestamp)}
          </span>
          {!alert.acknowledged ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleAckClick() }}
              className="btn btn-ghost"
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4 }}
            >
              {showAckInput ? 'Confirm' : 'ACK'}
            </button>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--sensor-acoustic)', fontWeight: 600 }}>
              ACKED
            </span>
          )}
        </div>
      </div>

      {/* Ack comment input */}
      {showAckInput && !alert.acknowledged && (
        <div style={{ padding: '0 12px 8px 12px', display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={ackComment}
            onChange={(e) => setAckComment(e.target.value)}
            placeholder="Comment (optional)..."
            style={{ flex: 1, fontSize: 11 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAckClick()
              if (e.key === 'Escape') { setShowAckInput(false); setAckComment('') }
            }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setShowAckInput(false); setAckComment('') }}
            className="btn btn-ghost"
            style={{ fontSize: 10, padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Annotation */}
      {alert.acknowledged && alert.annotation && (
        <div style={{ padding: '0 12px 6px 44px', fontSize: 10, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{alert.annotation}"
        </div>
      )}
    </div>
  )
}
