import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useAlertStore } from '@/store/alertStore'
import { useSensorStore } from '@/store/sensorStore'

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
      <div className="flex justify-between text-[10px] text-text-secondary mb-1">
        <span>Activity density heatmap — {timeWindow} window</span>
        <span>W ← → E</span>
      </div>
      <svg
        width={COLS * cellW + 40}
        height={ROWS * cellH + 20}
        className="block"
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

export function AdvancedAIPanel() {
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
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="py-1 px-[10px] border-b border-border-color bg-bg-secondary flex items-center gap-[10px] shrink-0 text-[10px]">
        <span className="text-text-secondary">
          FAR avg: <strong style={{ color: avgFAR > 0.15 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)' }}>
            {(avgFAR * 100).toFixed(1)}%
          </strong>
        </span>
        <span className="text-text-secondary">
          Rejected: <strong className="text-text-primary">{rejectedCount.current}</strong>
        </span>
        <span className="text-text-secondary">
          Alerts (7d): <strong className="text-text-primary">{alerts.length + 47}</strong>
        </span>
      </div>

      {/* Sub-tabs */}
      {TABS.length > 1 && (
        <div className="flex border-b border-border-color shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 py-1.5 px-1 border-none bg-transparent cursor-pointer text-[10px] whitespace-nowrap',
                tab === t.id
                  ? 'border-b-2 border-accent-blue text-accent-blue font-bold'
                  : 'border-b-2 border-transparent text-text-secondary font-normal',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* Heatmap tab */}
        {(tab === 'heatmap' || TABS.length === 0) && showHeatmap && (
          <div className="p-[10px]">
            <div className="flex gap-1.5 mb-[10px]">
              {(['1h', '6h', '24h'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setTimeWindow(w)}
                  className="py-[2px] px-[10px] border border-border-color rounded text-[10px] cursor-pointer"
                  style={{
                    background: timeWindow === w ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                    color: timeWindow === w ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {w}
                </button>
              ))}
              <button className="ml-auto py-[2px] px-2 bg-bg-tertiary border border-border-color rounded text-text-secondary cursor-pointer text-[10px]">
                ⬇ Export PNG
              </button>
            </div>
            <Heatmap cells={heatCells} timeWindow={timeWindow} />

            {/* High-activity zones */}
            <div className="mt-[10px]">
              <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-1.5">
                High-activity zones
              </div>
              {heatCells
                .filter((c) => c.value > 0.7)
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((c) => (
                  <div
                    key={`${c.x}-${c.y}`}
                    className="flex justify-between text-[10px] py-[3px] border-b border-white/[0.04] text-text-secondary"
                  >
                    <span>Grid ({c.x},{c.y})</span>
                    <span
                      className="font-bold"
                      style={{ color: c.value > 0.85 ? 'var(--alert-critical)' : 'var(--alert-medium)' }}
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
          <div className="p-[10px]">
            <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-2">
              Per-sensor false alarm rate — rolling 7 days
            </div>
            <div className="flex flex-col gap-1.5">
              {Object.entries(falseAlarmRates)
                .sort(([, a], [, b]) => b - a)
                .map(([sensorId, rate]) => {
                  const pct = rate * 100
                  const color = pct > 20 ? 'var(--alert-critical)' : pct > 10 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'
                  return (
                    <div key={sensorId} className="flex items-center gap-2">
                      <span className="text-[10px] w-20 text-text-secondary shrink-0">
                        {sensorId}
                      </span>
                      <div className="flex-1 h-3.5 bg-white/[0.06] rounded-[3px] overflow-hidden">
                        <div
                          className="h-full rounded-[3px] transition-[width] duration-500"
                          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                        />
                      </div>
                      <span
                        className="text-[10px] w-10 text-right font-mono shrink-0"
                        style={{ color, fontWeight: pct > 10 ? 700 : 400 }}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
            </div>

            <div className="mt-[10px] flex gap-1.5">
              <button className="flex-1 py-[5px] bg-bg-tertiary border border-border-color rounded text-text-secondary cursor-pointer text-[10px]">
                📄 Rejected Alerts Log
              </button>
              <button className="flex-1 py-[5px] bg-bg-tertiary border border-border-color rounded text-text-secondary cursor-pointer text-[10px]">
                ⬇ Export Audit CSV
              </button>
            </div>
          </div>
        )}

        {/* Confidence Monitor tab */}
        {tab === 'confidence' && showConfidence && (
          <div className="p-[10px]">
            <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-2">
              Model inference confidence distribution
            </div>

            {/* Legend */}
            <div className="flex gap-3 mb-[10px] text-[10px]">
              {[
                { label: 'YOLOv9', color: 'var(--accent-blue)' },
                { label: 'LSTM',   color: 'var(--alert-medium)' },
                { label: 'RF/Bay', color: 'var(--sensor-acoustic)' },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-1 text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-[2px] inline-block" style={{ background: m.color }} />
                  {m.label}
                </div>
              ))}
            </div>

            {/* Grouped bar chart */}
            <div className="flex flex-col gap-2">
              {confidenceBuckets.map((b) => (
                <div key={b.range}>
                  <div className="text-[10px] text-text-secondary mb-[3px]">{b.range}</div>
                  <div className="flex flex-col gap-[2px]">
                    {[
                      { val: b.yolo, color: 'var(--accent-blue)',    label: 'YOLOv9' },
                      { val: b.lstm, color: 'var(--alert-medium)',   label: 'LSTM'   },
                      { val: b.rf,   color: 'var(--sensor-acoustic)',label: 'RF/Bay' },
                    ].map(({ val, color, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className="flex-1 h-2.5 bg-white/[0.06] rounded-[2px] overflow-hidden">
                          <div
                            className="h-full rounded-[2px] transition-[width] duration-500"
                            style={{ width: `${(val / maxBucket) * 100}%`, background: color }}
                          />
                        </div>
                        <span className="text-[10px] w-5 text-right font-mono text-text-secondary">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Model status */}
            <div className="mt-3">
              <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-1.5">
                Model status
              </div>
              {[
                { name: 'YOLOv9 (detection)', version: 'vyolov9-v1.2', ok: true  },
                { name: 'ByteTrack (tracking)',version: 'vbytetrack-v2.0', ok: true  },
                { name: 'Bayesian (threat)',   version: 'vbayesian-v3.1', ok: true  },
                { name: 'LSTM (anomaly)',       version: 'vlstm-v1.4',    ok: false },
              ].map((m) => (
                <div
                  key={m.name}
                  className="flex justify-between items-center text-[10px] py-1 border-b border-white/[0.04]"
                >
                  <div>
                    <div className="text-text-primary">{m.name}</div>
                    <div className="text-[10px] text-text-secondary">{m.version}</div>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <span
                      className="font-bold text-[9px]"
                      style={{ color: m.ok ? 'var(--sensor-acoustic)' : 'var(--alert-medium)' }}
                    >
                      {m.ok ? '● OK' : '⚠ DEGRADED'}
                    </span>
                    {!m.ok && (
                      <button className="py-[2px] px-1.5 bg-[rgba(249,115,22,0.15)] border border-[rgba(249,115,22,0.4)] rounded-[3px] text-alert-medium cursor-pointer text-[9px]">
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
