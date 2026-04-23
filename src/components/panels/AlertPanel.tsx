// ============================================================
// IINVSYS SIS — AlertPanel.tsx
// Full alert management panel with filtering, sparkline, ack flow
// ============================================================

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useAlertStore } from '@/store/alertStore'
import { AlertRow } from '@/components/widgets/AlertRow'
import type { ThreatLevel, SensorFamily } from '@/types/sensors'

// ── Threat level filter chips ─────────────────────────────────
const THREAT_LEVELS: (ThreatLevel | 'ALL')[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const FAMILIES: (SensorFamily | 'ALL')[] = [
  'ALL', 'Seismic', 'Acoustic', 'Optical', 'Radar', 'Magnetic', 'Chemical',
]

const LEVEL_COLORS: Record<string, string> = {
  CRITICAL: 'var(--alert-critical)',
  HIGH:     'var(--alert-high)',
  MEDIUM:   'var(--alert-medium)',
  LOW:      'var(--alert-low)',
  ALL:      'var(--text-secondary)',
}

// ── Audio alert helper ────────────────────────────────────────
function playBeep() {
  try {
    const audioCtx = new AudioContext()
    const osc = audioCtx.createOscillator()
    osc.connect(audioCtx.destination)
    osc.frequency.value = 880
    osc.start()
    osc.stop(audioCtx.currentTime + 0.3)
  } catch {
    // AudioContext not available (e.g. test environment)
  }
}

// ── Alert rate sparkline (last 24 "buckets") ─────────────────
interface SparklineProps {
  data: number[]
}

function AlertSparkline({ data }: SparklineProps) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const W = 120
  const H = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - 2 - ((v / max) * (H - 4))
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="block"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="var(--alert-high)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Fill area */}
      <polyline
        points={`0,${H} ${pts} ${W},${H}`}
        fill="var(--alert-high)"
        fillOpacity={0.12}
        stroke="none"
      />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────
export function AlertPanel() {
  const allAlerts = useAlertStore((s) => s.alerts)
  const filter = useAlertStore((s) => s.filter)
  const setFilter = useAlertStore((s) => s.setFilter)
  const filteredAlerts = useAlertStore((s) => s.filteredAlerts)
  const acknowledgeAlert = useAlertStore((s) => s.acknowledgeAlert)

  const prevCountRef = useRef(0)

  // Alert rate: build 24-point rolling history of alert counts per second
  const [sparkData, setSparkData] = useState<number[]>(Array(24).fill(0))
  const tickRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    tickRef.current = setInterval(() => {
      const cnt = allAlerts.filter((a) => {
        const age = Date.now() - new Date(a.timestamp).getTime()
        return age < 1000
      }).length
      setSparkData((prev) => [...prev.slice(1), cnt])
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [allAlerts])

  // Audible alert on new CRITICAL/HIGH
  useEffect(() => {
    const critHigh = allAlerts.filter(
      (a) => !a.acknowledged && (a.threat_level === 'CRITICAL' || a.threat_level === 'HIGH')
    ).length
    if (critHigh > prevCountRef.current) {
      playBeep()
    }
    prevCountRef.current = critHigh
  }, [allAlerts])

  const displayed = useMemo(() => filteredAlerts(), [filteredAlerts, filter, allAlerts])

  const handleAck = (id: string) => {
    acknowledgeAlert(id, '')
  }

  const critCount = allAlerts.filter(
    (a) => !a.acknowledged && a.threat_level === 'CRITICAL'
  ).length

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Header — just the sparkline + critical badge */}
      <div className="py-1 px-3 border-b border-border-color text-[13px] font-semibold text-text-secondary bg-panel-header-bg flex items-center justify-between shrink-0">
        <span className="flex items-center gap-2">
          {critCount > 0 && (
            <span
              className="badge badge-critical"
              style={{ animation: 'pulse-ring 1.5s ease-out infinite' }}
            >
              {critCount} CRITICAL
            </span>
          )}
        </span>
        <AlertSparkline data={sparkData} />
      </div>

      {/* Filter bar */}
      <div className="py-1.5 px-3 border-b border-border-color flex flex-wrap gap-1.5 items-center shrink-0 bg-bg-secondary">
        {/* Threat level chips */}
        <div className="flex gap-1 flex-wrap">
          {THREAT_LEVELS.map((lvl) => {
            const active = filter.threatLevel === lvl
            const color = LEVEL_COLORS[lvl] ?? 'var(--text-secondary)'
            return (
              <button
                key={lvl}
                onClick={() => setFilter({ threatLevel: lvl })}
                className="text-[10px] font-bold px-[10px] h-7 rounded-full cursor-pointer tracking-[0.05em] transition-all duration-150 inline-flex items-center"
                style={{
                  border: `1px solid ${active ? color : 'var(--border-color)'}`,
                  background: active ? `${color}22` : 'transparent',
                  color: active ? color : 'var(--text-secondary)',
                }}
              >
                {lvl}
              </button>
            )
          })}
        </div>

        <div className="w-px h-[18px] bg-border-color shrink-0" />

        {/* Family dropdown */}
        <select
          value={filter.sensorFamily}
          onChange={(e) => setFilter({ sensorFamily: e.target.value as SensorFamily | 'ALL' })}
          className="text-[11px] px-1.5 h-7"
        >
          {FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Ack status */}
        <select
          value={filter.acknowledged}
          onChange={(e) =>
            setFilter({ acknowledged: e.target.value as 'ALL' | 'UNACKED' | 'ACKED' })
          }
          className="text-[11px] px-1.5 h-7"
        >
          <option value="ALL">All</option>
          <option value="UNACKED">Unacknowledged</option>
          <option value="ACKED">Acknowledged</option>
        </select>

        <span className="ml-auto text-[10px] text-text-secondary">
          {displayed.length} shown
        </span>
      </div>

      {/* Alert list — scrollable, never grows beyond its shell */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {displayed.length === 0 ? (
          <div className="no-data">
            <span className="no-data-icon">🔕</span>
            <span>No alerts match current filters</span>
          </div>
        ) : (
          displayed.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onAck={handleAck} />
          ))
        )}
      </div>
    </div>
  )
}
