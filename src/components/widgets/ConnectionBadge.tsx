import { useEffect, useRef, useState } from 'react'
import { useSystemStore } from '../../store/systemStore'

const dotBase: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'inline-block',
}

const RETRY_SECONDS = 10

export default function ConnectionBadge() {
  const status = useSystemStore((s) => s.connectionStatus)
  const reconnect = useSystemStore((s) => s.reconnect)
  const [countdown, setCountdown] = useState(RETRY_SECONDS)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  // Auto-retry countdown when disconnected
  useEffect(() => {
    if (status !== 'disconnected') {
      setCountdown(RETRY_SECONDS)
      clearInterval(intervalRef.current)
      return
    }

    setCountdown(RETRY_SECONDS)
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          reconnect()
          return RETRY_SECONDS
        }
        return c - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [status, reconnect])

  let color: string
  let label: string
  let animated = false

  switch (status) {
    case 'connected':
      color = 'var(--sensor-acoustic)'
      label = 'Connected'
      break
    case 'reconnecting':
      color = 'var(--alert-medium)'
      label = 'Reconnecting…'
      animated = true
      break
    case 'disconnected':
      color = 'var(--alert-critical)'
      label = 'Disconnected'
      break
    case 'connecting':
    default:
      color = 'var(--alert-medium)'
      label = 'Connecting…'
      animated = true
      break
  }

  const isDisconnected = status === 'disconnected'

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 10px',
          height: 32,
          borderRadius: 9999,
          background: 'var(--bg-tertiary)',
          border: `1px solid ${isDisconnected ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}`,
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            ...dotBase,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            ...(animated ? { animation: 'pulse 1.4s ease-in-out infinite' } : {}),
          }}
        />
        <span style={{ color: isDisconnected ? 'var(--alert-critical)' : 'var(--text-primary)' }}>
          {label}
        </span>

        {isDisconnected && (
          <>
            <span style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 400 }}>
              — retry in {countdown}s
            </span>
            <button
              onClick={() => { reconnect(); setCountdown(RETRY_SECONDS) }}
              style={{
                marginLeft: 2,
                padding: '0 8px',
                height: 22,
                borderRadius: 4,
                border: '1px solid rgba(239,68,68,0.5)',
                background: 'rgba(239,68,68,0.12)',
                color: 'var(--alert-critical)',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.04em',
                transition: 'background 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Connect Now
            </button>
          </>
        )}
      </div>
    </>
  )
}
