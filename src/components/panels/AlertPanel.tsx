// ============================================================
// IINVSYS SIS — AlertPanel.tsx
// Full alert management panel with filtering, sparkline, ack flow
// ============================================================

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useAlertStore } from '../../store/alertStore'
import AlertRow from '../widgets/AlertRow'
import type { ThreatLevel, SensorFamily } from '../../types/sensors'

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
      style={{ width: W, height: H, display: 'block' }}
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

// ── Panel styles ──────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--border-color)',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  background: 'var(--panel-header-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
}

// ── Main component ────────────────────────────────────────────
export default function AlertPanel() {
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
    <div style={panelStyle}>
      {/* Header — just the sparkline + critical badge */}
      <div style={{ ...headerStyle, padding: '4px 12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
      <div
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center',
          flexShrink: 0,
          background: 'var(--bg-secondary)',
        }}
      >
        {/* Threat level chips */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {THREAT_LEVELS.map((lvl) => {
            const active = filter.threatLevel === lvl
            const color = LEVEL_COLORS[lvl] ?? 'var(--text-secondary)'
            return (
              <button
                key={lvl}
                onClick={() => setFilter({ threatLevel: lvl })}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '0 10px',
                  height: 28,
                  borderRadius: 9999,
                  border: `1px solid ${active ? color : 'var(--border-color)'}`,
                  background: active ? `${color}22` : 'transparent',
                  color: active ? color : 'var(--text-secondary)',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {lvl}
              </button>
            )
          })}
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border-color)', flexShrink: 0 }} />

        {/* Family dropdown */}
        <select
          value={filter.sensorFamily}
          onChange={(e) => setFilter({ sensorFamily: e.target.value as SensorFamily | 'ALL' })}
          style={{ fontSize: 11, padding: '0 6px', height: 28 }}
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
          style={{ fontSize: 11, padding: '0 6px', height: 28 }}
        >
          <option value="ALL">All</option>
          <option value="UNACKED">Unacknowledged</option>
          <option value="ACKED">Acknowledged</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-secondary)' }}>
          {displayed.length} shown
        </span>
      </div>

      {/* Alert list */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: 0,
        }}
      >
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
