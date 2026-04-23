import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

interface DroneContact {
  id: string
  bearing_deg: number
  elevation_deg: number
  range_m: number
  rfSignature: string
  classification: 'COMMERCIAL' | 'MILITARY' | 'UNKNOWN'
  confidence: number
  firstSeen: number
  lastSeen: number
  altitude_m: number
  velocity_ms: number
}

function useDroneContacts() {
  const [contacts, setContacts] = useState<DroneContact[]>([])

  useEffect(() => {
    const RF_SIGS = ['2.4 GHz burst', '5.8 GHz FHSS', '900 MHz LR', '433 MHz OOK', 'Encrypted link']

    function nextContact(): DroneContact {
      return {
        id: Math.random().toString(36).slice(2, 8).toUpperCase(),
        bearing_deg: Math.round(Math.random() * 360),
        elevation_deg: Math.round(5 + Math.random() * 60),
        range_m: Math.round(200 + Math.random() * 1800),
        rfSignature: RF_SIGS[Math.floor(Math.random() * RF_SIGS.length)],
        classification: ['COMMERCIAL', 'COMMERCIAL', 'UNKNOWN', 'MILITARY'][Math.floor(Math.random() * 4)] as DroneContact['classification'],
        confidence: Math.round(70 + Math.random() * 29),
        firstSeen: Date.now() - Math.floor(Math.random() * 120000),
        lastSeen: Date.now(),
        altitude_m: Math.round(30 + Math.random() * 400),
        velocity_ms: parseFloat((1 + Math.random() * 18).toFixed(1)),
      }
    }

    // Start with 0-2 contacts
    const initial = Math.floor(Math.random() * 3)
    setContacts(Array.from({ length: initial }, nextContact))

    const interval = setInterval(() => {
      setContacts((prev) => {
        // Update last-seen for existing
        let updated = prev.map((c) => ({ ...c, lastSeen: Date.now(), bearing_deg: (c.bearing_deg + (Math.random() * 4 - 2) + 360) % 360 }))
        // Drop stale (> 60s)
        updated = updated.filter((c) => Date.now() - c.lastSeen < 60000)
        // Occasionally add new
        if (Math.random() < 0.15 && updated.length < 4) updated.push(nextContact())
        return updated
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return contacts
}

const CLASS_COLOR: Record<string, string> = {
  COMMERCIAL: 'var(--alert-medium)',
  MILITARY:   'var(--alert-critical)',
  UNKNOWN:    'var(--alert-high)',
}

function BearingIndicator({ bearing, label }: { bearing: number; label: string }) {
  const size = 80
  const cx = size / 2, cy = size / 2, r = 34
  const rad = ((bearing - 90) * Math.PI) / 180
  const x = cx + r * Math.cos(rad)
  const y = cy + r * Math.sin(rad)
  return (
    <svg width={size} height={size} className="block">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={2} fill="var(--accent-blue)" />
      {[0, 90, 180, 270].map((a) => {
        const ar = ((a - 90) * Math.PI) / 180
        return (
          <text
            key={a}
            x={cx + (r + 8) * Math.cos(ar)}
            y={cy + (r + 8) * Math.sin(ar)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize={7}
          >
            {['N', 'E', 'S', 'W'][a / 90]}
          </text>
        )
      })}
      <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--alert-critical)" strokeWidth={1.5} />
      <circle cx={x} cy={y} r={4} fill="var(--alert-critical)" />
      <text x={cx} y={cy + r + 20} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={8}>
        {label}
      </text>
    </svg>
  )
}

function RFBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct > 70 ? 'var(--alert-critical)' : pct > 40 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'
  return (
    <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-sm overflow-hidden">
      <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-sm" />
    </div>
  )
}

export function CounterUASPanel() {
  const contacts = useDroneContacts()
  const [alarmActive, setAlarmActive] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)

  const showThreatDisplay = isVisible('counterUasThreatDisplay')
  const showPlayback = isVisible('droneTrackPlayback')

  // Track history for playback widget
  const historyRef = useRef<{ id: string; bearing: number; ts: number }[]>([])
  useEffect(() => {
    contacts.forEach((c) => historyRef.current.push({ id: c.id, bearing: c.bearing_deg, ts: c.lastSeen }))
    if (historyRef.current.length > 200) historyRef.current = historyRef.current.slice(-200)
  }, [contacts])

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-[10px] py-1 border-b border-border-color bg-bg-secondary flex items-center gap-[10px] shrink-0 text-[10px]">
        <span
          className="flex items-center gap-1 font-bold"
          style={{ color: contacts.length > 0 ? 'var(--alert-critical)' : 'var(--sensor-acoustic)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: contacts.length > 0 ? 'var(--alert-critical)' : 'var(--sensor-acoustic)',
              animation: contacts.length > 0 ? 'pulse 1s infinite' : 'none',
            }}
          />
          {contacts.length} UAS Contact{contacts.length !== 1 ? 's' : ''}
        </span>
        <span className="flex-1" />
        <button
          onClick={() => setAlarmActive((a) => !a)}
          className="px-2 py-0.5 rounded cursor-pointer text-[10px] font-semibold"
          style={{
            background: alarmActive ? 'rgba(239,68,68,0.2)' : 'var(--bg-tertiary)',
            border: `1px solid ${alarmActive ? 'var(--alert-critical)' : 'var(--border-color)'}`,
            color: alarmActive ? 'var(--alert-critical)' : 'var(--text-secondary)',
          }}
        >
          {alarmActive ? '🔔 ALARM ON' : '🔕 Alarm Off'}
        </button>
        <button
          className="px-2 py-0.5 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.4)] rounded text-alert-critical cursor-pointer text-[10px] font-bold"
        >
          ⚡ Notify QRT
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Counter-UAS Threat Display */}
        {showThreatDisplay && (
          <div className="p-[10px]">
            <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-2">
              🛸 Active UAS Contacts
            </div>

            {contacts.length === 0 ? (
              <div className="text-center px-3 py-6 text-text-secondary text-[11px] bg-bg-secondary rounded-md border border-border-color">
                <div className="text-2xl mb-1.5">✅</div>
                No UAS contacts detected
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {contacts.map((c) => {
                  const clrColor = CLASS_COLOR[c.classification]
                  const age = Math.round((Date.now() - c.firstSeen) / 1000)
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                      className="bg-bg-secondary rounded-md px-[10px] py-2 cursor-pointer"
                      style={{
                        border: `1px solid ${selectedId === c.id ? clrColor : 'var(--border-color)'}`,
                        borderLeft: `3px solid ${clrColor}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold" style={{ color: clrColor }}>
                          UAS-{c.id}
                        </span>
                        <span
                          className="text-[10px] rounded-[3px] px-[5px] font-bold"
                          style={{
                            background: `${clrColor}22`,
                            color: clrColor,
                            border: `1px solid ${clrColor}55`,
                          }}
                        >
                          {c.classification}
                        </span>
                        <span className="text-[10px] text-text-secondary ml-auto">
                          {c.confidence}% conf · {age}s
                        </span>
                      </div>

                      <div className="flex gap-3 text-[10px] mb-1.5">
                        <div className="flex flex-col items-center gap-1">
                          <BearingIndicator bearing={c.bearing_deg} label={`${c.bearing_deg}°`} />
                        </div>
                        <div className="flex-1 flex flex-col gap-1 justify-center">
                          <div className="flex justify-between text-text-secondary">
                            <span>Range</span><strong className="text-text-primary font-mono">{c.range_m} m</strong>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span>Altitude</span><strong className="text-text-primary font-mono">{c.altitude_m} m</strong>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span>Elevation</span><strong className="text-text-primary font-mono">{c.elevation_deg}°</strong>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span>Speed</span><strong className="text-text-primary font-mono">{c.velocity_ms} m/s</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-text-secondary mb-1">
                        RF: {c.rfSignature}
                      </div>
                      <RFBar value={c.confidence} />

                      {selectedId === c.id && (
                        <div className="mt-2 flex gap-1.5">
                          <button
                            className="flex-1 py-1 px-1.5 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.4)] rounded text-alert-critical cursor-pointer text-[10px] font-semibold"
                          >
                            ⚡ Engage QRT
                          </button>
                          <button
                            className="flex-1 py-1 px-1.5 bg-bg-tertiary border border-border-color rounded text-text-secondary cursor-pointer text-[10px]"
                          >
                            📝 Log Engagement
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Drone Track Playback */}
        {showPlayback && (
          <div className="px-[10px] pb-[10px]">
            <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-2">
              📼 Track History ({historyRef.current.length} points)
            </div>
            <div className="bg-bg-secondary border border-border-color rounded-md p-[10px] text-[10px]">
              <div className="flex gap-2 mb-2 flex-wrap">
                {(['1×', '2×', '4×'] as const).map((speed) => (
                  <button
                    key={speed}
                    className="px-2 py-0.5 border border-border-color rounded cursor-pointer text-[10px]"
                    style={{
                      background: speed === '1×' ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                      color: speed === '1×' ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {speed}
                  </button>
                ))}
                <button
                  className="px-2 py-0.5 bg-bg-tertiary border border-border-color rounded text-text-secondary cursor-pointer text-[10px]"
                >
                  ⬇ Export KML
                </button>
              </div>
              <div className="flex flex-col gap-[3px] max-h-[100px] overflow-y-auto">
                {historyRef.current.slice(-8).reverse().map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-text-secondary py-0.5 border-b border-[rgba(255,255,255,0.04)]"
                  >
                    <span className="font-mono text-alert-medium">{p.id}</span>
                    <span>{p.bearing.toFixed(0)}° bearing</span>
                    <span>{new Date(p.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
