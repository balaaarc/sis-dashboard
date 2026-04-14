import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

interface Personnel {
  id: string
  name: string
  role: string
  lat: number
  lon: number
  cep_m: number
  battery: number
  lastCheckIn: number
  status: 'ACTIVE' | 'MISSED_CHECKIN' | 'EMERGENCY'
  geofence: 'INSIDE' | 'OUTSIDE'
}

interface GPREvent {
  id: string
  depth_m: number
  anomalyType: string
  confidence: number
  lat: number
  lon: number
  timestamp: number
}

interface MADReading {
  sensorId: string
  fieldDelta_nT: number
  metalMassKg: number
  alert: boolean
  timestamp: number
}

const PATROL_NAMES = [
  { name: 'Cpl. Sharma', role: 'Patrol Alpha' },
  { name: 'Sgt. Verma', role: 'Patrol Bravo' },
  { name: 'Pvt. Singh', role: 'Patrol Charlie' },
  { name: 'Cpl. Kumar', role: 'QRT Lead' },
  { name: 'Sgt. Rao', role: 'Perimeter Watch' },
]

const BASE_LAT = 21.94
const BASE_LON = 88.12

function usePersonnel() {
  const [personnel, setPersonnel] = useState<Personnel[]>(() =>
    PATROL_NAMES.map((p, i) => ({
      id: `P${String(i + 1).padStart(2, '0')}`,
      name: p.name,
      role: p.role,
      lat: BASE_LAT + (Math.random() - 0.5) * 0.04,
      lon: BASE_LON + (Math.random() - 0.5) * 0.04,
      cep_m: Math.round(3 + Math.random() * 15),
      battery: Math.round(40 + Math.random() * 60),
      lastCheckIn: Date.now() - Math.floor(Math.random() * 600000),
      status: 'ACTIVE',
      geofence: 'INSIDE',
    }))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setPersonnel((prev) =>
        prev.map((p) => {
          const newLat = p.lat + (Math.random() - 0.5) * 0.001
          const newLon = p.lon + (Math.random() - 0.5) * 0.001
          const missedCheckIn = Date.now() - p.lastCheckIn > 600000
          const outside = Math.abs(newLat - BASE_LAT) > 0.025 || Math.abs(newLon - BASE_LON) > 0.025
          return {
            ...p,
            lat: newLat,
            lon: newLon,
            battery: Math.max(5, p.battery - 0.02),
            lastCheckIn: Math.random() < 0.05 ? Date.now() : p.lastCheckIn,
            status: missedCheckIn ? 'MISSED_CHECKIN' : 'ACTIVE',
            geofence: outside ? 'OUTSIDE' : 'INSIDE',
          }
        })
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return personnel
}

function useGPREvents() {
  const [events, setEvents] = useState<GPREvent[]>([])
  useEffect(() => {
    const TYPES = ['Tunnel void', 'Metallic object', 'Pipe/conduit', 'Utility cable', 'Natural void']
    const add = () => {
      if (Math.random() < 0.3) {
        setEvents((prev) => [
          {
            id: Math.random().toString(36).slice(2, 8).toUpperCase(),
            depth_m: parseFloat((0.5 + Math.random() * 4).toFixed(2)),
            anomalyType: TYPES[Math.floor(Math.random() * TYPES.length)],
            confidence: Math.round(60 + Math.random() * 39),
            lat: BASE_LAT + (Math.random() - 0.5) * 0.04,
            lon: BASE_LON + (Math.random() - 0.5) * 0.04,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, 10))
      }
    }
    add()
    const iv = setInterval(add, 8000)
    return () => clearInterval(iv)
  }, [])
  return events
}

function useMAD() {
  const [readings, setReadings] = useState<MADReading[]>(() =>
    Array.from({ length: 4 }, (_, i) => ({
      sensorId: `MAD-${String(i + 1).padStart(2, '0')}`,
      fieldDelta_nT: Math.random() * 80,
      metalMassKg: Math.random() * 5,
      alert: false,
      timestamp: Date.now(),
    }))
  )
  useEffect(() => {
    const iv = setInterval(() => {
      setReadings((prev) =>
        prev.map((r) => {
          const delta = r.fieldDelta_nT + (Math.random() * 40 - 20)
          const clamped = Math.max(0, Math.min(500, delta))
          return {
            ...r,
            fieldDelta_nT: clamped,
            metalMassKg: clamped / 50,
            alert: clamped > 200,
            timestamp: Date.now(),
          }
        })
      )
    }, 2000)
    return () => clearInterval(iv)
  }, [])
  return readings
}

function MiniMap({ personnel }: { personnel: Personnel[] }) {
  const size = 180
  const padding = 16
  const toX = (lon: number) => padding + ((lon - (BASE_LON - 0.04)) / 0.08) * (size - padding * 2)
  const toY = (lat: number) => padding + (1 - (lat - (BASE_LAT - 0.04)) / 0.08) * (size - padding * 2)

  return (
    <svg
      width={size}
      height={size}
      style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 6, border: '1px solid var(--border-color)', display: 'block' }}
    >
      {/* Grid */}
      {[0.25, 0.5, 0.75].map((f) => (
        <g key={f}>
          <line x1={padding + f * (size - padding * 2)} y1={padding} x2={padding + f * (size - padding * 2)} y2={size - padding} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          <line x1={padding} y1={padding + f * (size - padding * 2)} x2={size - padding} y2={padding + f * (size - padding * 2)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        </g>
      ))}
      {/* Geofence circle */}
      <circle cx={size / 2} cy={size / 2} r={(size - padding * 2) / 2} fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth={1} strokeDasharray="4,3" />
      {/* Personnel dots */}
      {personnel.map((p) => {
        const x = toX(p.lon)
        const y = toY(p.lat)
        const color = p.status === 'EMERGENCY' ? '#ef4444' : p.status === 'MISSED_CHECKIN' ? '#f97316' : '#10b981'
        return (
          <g key={p.id}>
            <circle cx={x} cy={y} r={5} fill={color} opacity={0.9} />
            <text x={x + 7} y={y + 4} fill={color} fontSize={7} fontWeight={700}>{p.id}</text>
          </g>
        )
      })}
      <text x={size / 2} y={size - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={7}>
        Geofence boundary
      </text>
    </svg>
  )
}

export default function PersonnelPanel() {
  const personnel = usePersonnel()
  const gprEvents = useGPREvents()
  const madReadings = useMAD()
  const [tab, setTab] = useState<'personnel' | 'gpr' | 'mad'>('personnel')
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)

  const showNavic = isVisible('navicGpsBoard')
  const showPersonnel = isVisible('personnelTracker')
  const showGPR = isVisible('gprScanViewer')
  const showMAD = isVisible('madFieldStrengthMap')
  const showEmergency = isVisible('emergencyAlertDispatcher')

  const missedCount = personnel.filter((p) => p.status === 'MISSED_CHECKIN').length
  const outsideCount = personnel.filter((p) => p.geofence === 'OUTSIDE').length

  const TABS = [
    ...(showNavic || showPersonnel ? [{ id: 'personnel', label: `👥 Personnel (${personnel.length})` }] : []),
    ...(showGPR ? [{ id: 'gpr', label: `⛏ GPR (${gprEvents.length})` }] : []),
    ...(showMAD ? [{ id: 'mad', label: `🧲 MAD` }] : []),
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
          Personnel: <strong style={{ color: 'var(--text-primary)' }}>{personnel.length}</strong>
        </span>
        {missedCount > 0 && (
          <span style={{ color: 'var(--alert-high)', fontWeight: 700 }}>
            ⚠ {missedCount} missed check-in
          </span>
        )}
        {outsideCount > 0 && (
          <span style={{ color: 'var(--alert-medium)', fontWeight: 700 }}>
            ⚡ {outsideCount} outside fence
          </span>
        )}
        {showEmergency && (
          <button
            style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: 4,
              color: 'var(--alert-critical)',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            🚨 Emergency Broadcast
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      {TABS.length > 1 && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 12px',
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
        {/* Personnel / NavIC tab */}
        {(tab === 'personnel' || TABS.length === 0) && (showNavic || showPersonnel) && (
          <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <MiniMap personnel={personnel} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {personnel.map((p) => {
                  const age = Math.round((Date.now() - p.lastCheckIn) / 1000)
                  const color = p.status === 'EMERGENCY' ? 'var(--alert-critical)' : p.status === 'MISSED_CHECKIN' ? 'var(--alert-high)' : 'var(--sensor-acoustic)'
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${p.status !== 'ACTIVE' ? color : 'var(--border-color)'}`,
                        borderRadius: 4,
                        padding: '5px 8px',
                        fontSize: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color }}>{p.id}: {p.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 9 }}>{p.role}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)', marginTop: 2 }}>
                        <span>CEP: {p.cep_m}m</span>
                        <span>🔋 {p.battery.toFixed(0)}%</span>
                        <span>Check-in: {age < 60 ? `${age}s` : `${Math.floor(age / 60)}m`} ago</span>
                        {p.geofence === 'OUTSIDE' && <span style={{ color: 'var(--alert-medium)', fontWeight: 700 }}>⚡ OOB</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* GPR tab */}
        {tab === 'gpr' && showGPR && (
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
              Ground Penetrating Radar — B-Scan Anomalies
            </div>
            {gprEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 11 }}>
                No GPR anomalies detected
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {gprEvents.map((ev) => {
                  const isCritical = ev.anomalyType.includes('Tunnel') || ev.anomalyType.includes('Metallic')
                  const color = isCritical ? 'var(--alert-critical)' : 'var(--alert-medium)'
                  return (
                    <div key={ev.id} style={{ background: 'var(--bg-secondary)', border: `1px solid var(--border-color)`, borderLeft: `3px solid ${color}`, borderRadius: 4, padding: '7px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, color }}>{ev.anomalyType}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-secondary)' }}>
                        <span>Depth: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{ev.depth_m} m</strong></span>
                        <span>Conf: <strong style={{ color: 'var(--text-primary)' }}>{ev.confidence}%</strong></span>
                        <span style={{ fontFamily: 'monospace', fontSize: 9 }}>{ev.lat.toFixed(4)}N {ev.lon.toFixed(4)}E</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* MAD tab */}
        {tab === 'mad' && showMAD && (
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
              Magnetic Anomaly Detection — Field Distortion
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {madReadings.map((r) => {
                const pct = Math.min((r.fieldDelta_nT / 500) * 100, 100)
                const color = r.alert ? 'var(--alert-critical)' : r.fieldDelta_nT > 100 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'
                return (
                  <div key={r.sensorId} style={{ background: 'var(--bg-secondary)', border: `1px solid ${r.alert ? 'var(--alert-critical)' : 'var(--border-color)'}`, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700 }}>{r.sensorId}</span>
                      {r.alert && <span style={{ color: 'var(--alert-critical)', fontWeight: 700, fontSize: 9 }}>⚠ ANOMALY</span>}
                      <span style={{ fontFamily: 'monospace', color }}>Δ{r.fieldDelta_nT.toFixed(0)} nT</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s', boxShadow: r.alert ? `0 0 8px ${color}` : 'none' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      Est. metal mass: {r.metalMassKg.toFixed(2)} kg equiv · Threshold: 200 nT
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
