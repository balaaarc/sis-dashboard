import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useAlertStore } from '../../store/alertStore'
import { useSensorStore } from '../../store/sensorStore'

interface HeatCell {
  x: number
  y: number
  value: number
}

interface ConfidenceBucket {
  range: string
  yolo: number
  lstm: number
  rf: number
}

function useHeatmap(timeWindow: '1h' | '6h' | '24h') {
  const [cells, setCells] = useState<HeatCell[]>(() => {
    const arr: HeatCell[] = []
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 8; y++) {
        arr.push({ x, y, value: Math.random() * 0.4 })
      }
    }
    // Hotspot near perimeter
    arr.find((c) => c.x === 2 && c.y === 1)!.value = 0.85
    arr.find((c) => c.x === 3 && c.y === 1)!.value = 0.72
    arr.find((c) => c.x === 7 && c.y === 6)!.value = 0.91
    return arr
  })

  useEffect(() => {
    const iv = setInterval(() => {
      setCells((prev) =>
        prev.map((c) => ({
          ...c,
          value: Math.max(0, Math.min(1, c.value + (Math.random() * 0.1 - 0.05))),
        }))
      )
    }, 2000)
    return () => clearInterval(iv)
  }, [timeWindow])

  return cells
}

function useFalseAlarmRates(sensors: string[]) {
  const [rates, setRates] = useState<Record<string, number>>(() =>
    Object.fromEntries(sensors.map((s) => [s, Math.random() * 0.25]))
  )
  useEffect(() => {
    const iv = setInterval(() => {
      setRates((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([k, v]) => [k, Math.max(0, Math.min(1, v + (Math.random() * 0.04 - 0.02)))])
        )
      )
    }, 5000)
    return () => clearInterval(iv)
  }, [sensors.join(',')])
  return rates
}

function useConfidence() {
  const [buckets, setBuckets] = useState<ConfidenceBucket[]>(() => [
    { range: '50-60%', yolo: 3,  lstm: 5,  rf: 2  },
    { range: '60-70%', yolo: 8,  lstm: 11, rf: 7  },
    { range: '70-80%', yolo: 14, lstm: 9,  rf: 12 },
    { range: '80-90%', yolo: 22, lstm: 18, rf: 20 },
    { range: '90-100%',yolo: 31, lstm: 24, rf: 28 },
  ])
  useEffect(() => {
    const iv = setInterval(() => {
      setBuckets((prev) =>
        prev.map((b) => ({
          ...b,
          yolo: Math.max(0, b.yolo + Math.floor(Math.random() * 5 - 2)),
          lstm: Math.max(0, b.lstm + Math.floor(Math.random() * 5 - 2)),
          rf:   Math.max(0, b.rf   + Math.floor(Math.random() * 5 - 2)),
        }))
      )
    }, 4000)
    return () => clearInterval(iv)
  }, [])
  return buckets
}

function heatColor(v: number): string {
  if (v < 0.2) return `rgba(16,185,129,${0.1 + v * 0.5})`
  if (v < 0.5) return `rgba(251,191,36,${0.2 + v * 0.6})`
  if (v < 0.75) return `rgba(249,115,22,${0.3 + v * 0.5})`
  return `rgba(239,68,68,${0.4 + v * 0.5})`
}

function Heatmap({ cells, timeWindow }: { cells: HeatCell[]; timeWindow: string }) {
  const COLS = 10, ROWS = 8
  const cellW = 22, cellH = 18

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
        <span>Activity density heatmap — {timeWindow} window</span>
        <span>W ← → E</span>
      </div>
      <svg
        width={COLS * cellW + 40}
        height={ROWS * cellH + 20}
        style={{ display: 'block' }}
      >
        {/* Y-axis labels */}
        {['N', '', '', '', '', '', '', 'S'].map((l, i) => (
          <text key={i} x={18} y={i * cellH + cellH / 2 + 8} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={7}>{l}</text>
        ))}
        {cells.map((c) => (
          <rect
            key={`${c.x}-${c.y}`}
            x={c.x * cellW + 24}
            y={c.y * cellH + 4}
            width={cellW - 1}
            height={cellH - 1}
            fill={heatColor(c.value)}
            rx={1}
          >
            <title>{(c.value * 100).toFixed(0)}% activity</title>
          </rect>
        ))}
        {/* Colour legend */}
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <rect key={i} x={24 + i * 44} y={ROWS * cellH + 6} width={40} height={8} fill={heatColor(v)} rx={2} />
        ))}
        <text x={24} y={ROWS * cellH + 20} fill="rgba(255,255,255,0.3)" fontSize={7}>Low</text>
        <text x={24 + 4 * 44 + 4} y={ROWS * cellH + 20} fill="rgba(255,255,255,0.3)" fontSize={7}>High</text>
      </svg>
    </div>
  )
}

export default function AdvancedAIPanel() {
  const [tab, setTab] = useState<'heatmap' | 'falseAlarm' | 'confidence'>('heatmap')
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h'>('1h')
  const alerts = useAlertStore((s) => s.alerts)
  const sensors = useSensorStore((s) => Array.from(s.sensors.keys()).slice(0, 6))
  const heatCells = useHeatmap(timeWindow)
  const falseAlarmRates = useFalseAlarmRates(sensors.length > 0 ? sensors : ['S01', 'S02', 'S03', 'S04', 'S05'])
  const confidenceBuckets = useConfidence()
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)

  const showHeatmap    = isVisible('behaviouralPatternHeatmap')
  const showFAR        = isVisible('falseAlarmRateTracker')
  const showConfidence = isVisible('aiModelConfidenceMonitor')

  const rejectedCount = useRef(Math.floor(Math.random() * 30 + 10))

  const avgFAR = Object.values(falseAlarmRates).reduce((s, v) => s + v, 0) / Math.max(1, Object.keys(falseAlarmRates).length)
  const maxBucket = Math.max(...confidenceBuckets.flatMap((b) => [b.yolo, b.lstm, b.rf]))

  const TABS = [
    ...(showHeatmap    ? [{ id: 'heatmap',    label: '🔥 Heatmap'   }] : []),
    ...(showFAR        ? [{ id: 'falseAlarm', label: '📊 False Alarm'}] : []),
    ...(showConfidence ? [{ id: 'confidence', label: '🧠 Confidence' }] : []),
  ] as { id: typeof tab; label: string }[]

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats bar */}
      <div
        style={{
          padding: '4px 10px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          fontSize: 10,
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          FAR avg: <strong style={{ color: avgFAR > 0.15 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)' }}>
            {(avgFAR * 100).toFixed(1)}%
          </strong>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Rejected: <strong style={{ color: 'var(--text-primary)' }}>{rejectedCount.current}</strong>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Alerts (7d): <strong style={{ color: 'var(--text-primary)' }}>{alerts.length + 47}</strong>
        </span>
      </div>

      {/* Sub-tabs */}
      {TABS.length > 1 && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '6px 4px',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                background: 'transparent',
                color: tab === t.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: tab === t.id ? 700 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* Heatmap tab */}
        {(tab === 'heatmap' || TABS.length === 0) && showHeatmap && (
          <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(['1h', '6h', '24h'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setTimeWindow(w)}
                  style={{
                    padding: '2px 10px',
                    background: timeWindow === w ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    color: timeWindow === w ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 10,
                  }}
                >
                  {w}
                </button>
              ))}
              <button
                style={{
                  marginLeft: 'auto',
                  padding: '2px 8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 10,
                }}
              >
                ⬇ Export PNG
              </button>
            </div>
            <Heatmap cells={heatCells} timeWindow={timeWindow} />

            {/* High-activity zones */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                High-activity zones
              </div>
              {heatCells
                .filter((c) => c.value > 0.7)
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((c) => (
                  <div key={`${c.x}-${c.y}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                    <span>Grid ({c.x},{c.y})</span>
                    <span
                      style={{
                        color: c.value > 0.85 ? 'var(--alert-critical)' : 'var(--alert-medium)',
                        fontWeight: 700,
                      }}
                    >
                      {(c.value * 100).toFixed(0)}% activity
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* False Alarm Rate tab */}
        {tab === 'falseAlarm' && showFAR && (
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
              Per-sensor false alarm rate — rolling 7 days
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(falseAlarmRates)
                .sort(([, a], [, b]) => b - a)
                .map(([sensorId, rate]) => {
                  const pct = rate * 100
                  const color = pct > 20 ? 'var(--alert-critical)' : pct > 10 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'
                  return (
                    <div key={sensorId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, width: 80, color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {sensorId}
                      </span>
                      <div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            height: '100%',
                            background: color,
                            borderRadius: 3,
                            transition: 'width 0.5s',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10, width: 40, textAlign: 'right', fontFamily: 'monospace', color, fontWeight: pct > 10 ? 700 : 400, flexShrink: 0 }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
            </div>

            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              <button style={{ flex: 1, padding: '5px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10 }}>
                📄 Rejected Alerts Log
              </button>
              <button style={{ flex: 1, padding: '5px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10 }}>
                ⬇ Export Audit CSV
              </button>
            </div>
          </div>
        )}

        {/* Confidence Monitor tab */}
        {tab === 'confidence' && showConfidence && (
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
              Model inference confidence distribution
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 10 }}>
              {[
                { label: 'YOLOv9', color: 'var(--accent-blue)' },
                { label: 'LSTM',   color: 'var(--alert-medium)' },
                { label: 'RF/Bay', color: 'var(--sensor-acoustic)' },
              ].map((m) => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: m.color, display: 'inline-block' }} />
                  {m.label}
                </div>
              ))}
            </div>

            {/* Grouped bar chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {confidenceBuckets.map((b) => (
                <div key={b.range}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3 }}>{b.range}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                      { val: b.yolo, color: 'var(--accent-blue)',    label: 'YOLOv9' },
                      { val: b.lstm, color: 'var(--alert-medium)',   label: 'LSTM'   },
                      { val: b.rf,   color: 'var(--sensor-acoustic)',label: 'RF/Bay' },
                    ].map(({ val, color, label }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${(val / maxBucket) * 100}%`,
                              height: '100%',
                              background: color,
                              borderRadius: 2,
                              transition: 'width 0.5s',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 10, width: 20, textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Model status */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                Model status
              </div>
              {[
                { name: 'YOLOv9 (detection)', version: 'vyolov9-v1.2', ok: true  },
                { name: 'ByteTrack (tracking)',version: 'vbytetrack-v2.0', ok: true  },
                { name: 'Bayesian (threat)',   version: 'vbayesian-v3.1', ok: true  },
                { name: 'LSTM (anomaly)',       version: 'vlstm-v1.4',    ok: false },
              ].map((m) => (
                <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{m.version}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: m.ok ? 'var(--sensor-acoustic)' : 'var(--alert-medium)', fontWeight: 700, fontSize: 9 }}>
                      {m.ok ? '● OK' : '⚠ DEGRADED'}
                    </span>
                    {!m.ok && (
                      <button style={{ padding: '2px 6px', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.4)', borderRadius: 3, color: 'var(--alert-medium)', cursor: 'pointer', fontSize: 9 }}>
                        Recalibrate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
