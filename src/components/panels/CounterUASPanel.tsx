import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

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
    const DRONES = ['DJI-Phantom', 'Mavic-3', 'Unknown-RF', 'Autel-EVO', 'Parrot-Anafi']
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
    <svg width={size} height={size} style={{ display: 'block' }}>
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
    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  )
}

export default function CounterUASPanel() {
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
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
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
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: contacts.length > 0 ? 'var(--alert-critical)' : 'var(--sensor-acoustic)',
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: contacts.length > 0 ? 'var(--alert-critical)' : 'var(--sensor-acoustic)',
              animation: contacts.length > 0 ? 'pulse 1s infinite' : 'none',
            }}
          />
          {contacts.length} UAS Contact{contacts.length !== 1 ? 's' : ''}
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={() => setAlarmActive((a) => !a)}
          style={{
            padding: '2px 8px',
            background: alarmActive ? 'rgba(239,68,68,0.2)' : 'var(--bg-tertiary)',
            border: `1px solid ${alarmActive ? 'var(--alert-critical)' : 'var(--border-color)'}`,
            borderRadius: 4,
            color: alarmActive ? 'var(--alert-critical)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {alarmActive ? '🔔 ALARM ON' : '🔕 Alarm Off'}
        </button>
        <button
          style={{
            padding: '2px 8px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 4,
            color: 'var(--alert-critical)',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          ⚡ Notify QRT
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Counter-UAS Threat Display */}
        {showThreatDisplay && (
          <div style={{ padding: 10 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              🛸 Active UAS Contacts
            </div>

            {contacts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 12px',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  background: 'var(--bg-secondary)',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                No UAS contacts detected
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {contacts.map((c) => {
                  const clrColor = CLASS_COLOR[c.classification]
                  const age = Math.round((Date.now() - c.firstSeen) / 1000)
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${selectedId === c.id ? clrColor : 'var(--border-color)'}`,
                        borderLeft: `3px solid ${clrColor}`,
                        borderRadius: 6,
                        padding: '8px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: clrColor }}>
                          UAS-{c.id}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            background: `${clrColor}22`,
                            color: clrColor,
                            border: `1px solid ${clrColor}55`,
                            borderRadius: 3,
                            padding: '0 5px',
                            fontWeight: 700,
                          }}
                        >
                          {c.classification}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                          {c.confidence}% conf · {age}s
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 12, fontSize: 10, marginBottom: 6 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <BearingIndicator bearing={c.bearing_deg} label={`${c.bearing_deg}°`} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Range</span><strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{c.range_m} m</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Altitude</span><strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{c.altitude_m} m</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Elevation</span><strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{c.elevation_deg}°</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Speed</span><strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{c.velocity_ms} m/s</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        RF: {c.rfSignature}
                      </div>
                      <RFBar value={c.confidence} />

                      {selectedId === c.id && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                          <button
                            style={{
                              flex: 1,
                              padding: '4px 6px',
                              background: 'rgba(239,68,68,0.15)',
                              border: '1px solid rgba(239,68,68,0.4)',
                              borderRadius: 4,
                              color: 'var(--alert-critical)',
                              cursor: 'pointer',
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            ⚡ Engage QRT
                          </button>
                          <button
                            style={{
                              flex: 1,
                              padding: '4px 6px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 4,
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontSize: 10,
                            }}
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
          <div style={{ padding: '0 10px 10px' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              📼 Track History ({historyRef.current.length} points)
            </div>
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: 10,
                fontSize: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {(['1×', '2×', '4×'] as const).map((speed) => (
                  <button
                    key={speed}
                    style={{
                      padding: '2px 8px',
                      background: speed === '1×' ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      color: speed === '1×' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: 10,
                    }}
                  >
                    {speed}
                  </button>
                ))}
                <button
                  style={{
                    padding: '2px 8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 10,
                  }}
                >
                  ⬇ Export KML
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 100, overflowY: 'auto' }}>
                {historyRef.current.slice(-8).reverse().map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--alert-medium)' }}>{p.id}</span>
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
