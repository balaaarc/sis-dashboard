import { useEffect, useRef, useState } from 'react'
import { useSystemStore } from '@/store/systemStore'

const RETRY_SECONDS = 10

export function ConnectionBadge() {
  const status = useSystemStore((s) => s.connectionStatus)
  const reconnect = useSystemStore((s) => s.reconnect)
  const [countdown, setCountdown] = useState(RETRY_SECONDS)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

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

  let dotColor: string
  let label: string
  let animated = false

  switch (status) {
    case 'connected':
      dotColor = 'var(--sensor-acoustic)'
      label = 'Connected'
      break
    case 'reconnecting':
      dotColor = 'var(--alert-medium)'
      label = 'Reconnecting...'
      animated = true
      break
    case 'disconnected':
      dotColor = 'var(--alert-critical)'
      label = 'Disconnected'
      break
    case 'connecting':
    default:
      dotColor = 'var(--alert-medium)'
      label = 'Connecting...'
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
        className="flex items-center gap-1.5 px-[10px] h-8 rounded-full bg-bg-tertiary text-[11px] font-semibold text-text-secondary tracking-[0.04em] shrink-0"
        style={{ border: `1px solid ${isDisconnected ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}` }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0 inline-block"
          style={{
            background: dotColor,
            boxShadow: `0 0 6px ${dotColor}`,
            ...(animated ? { animation: 'pulse 1.4s ease-in-out infinite' } : {}),
          }}
        />
        <span style={{ color: isDisconnected ? 'var(--alert-critical)' : 'var(--text-primary)' }}>
          {label}
        </span>

        {isDisconnected && (
          <>
            <span className="text-text-secondary text-[10px] font-normal">
              — retry in {countdown}s
            </span>
            <button
              onClick={() => { reconnect(); setCountdown(RETRY_SECONDS) }}
              className="ml-0.5 px-2 h-[22px] rounded border border-[rgba(239,68,68,0.5)] bg-[rgba(239,68,68,0.12)] text-alert-critical cursor-pointer text-[10px] font-bold tracking-[0.04em] transition-[background] duration-150 inline-flex items-center"
            >
              Connect Now
            </button>
          </>
        )}
      </div>
    </>
  )
}
