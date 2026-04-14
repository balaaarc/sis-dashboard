import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

interface NodePower {
  nodeId: string
  solar_w: number
  battery_pct: number
  battery_v: number
  generator: 'ON' | 'OFF' | 'FAULT'
  load_w: number
  gridConnected: boolean
  lowBattery: boolean
}

interface Vehicle {
  id: string
  callsign: string
  type: string
  fuel_pct: number
  battery_v: number
  engine_temp_c: number
  tyre_pressure_psi: number[]
  fault_codes: string[]
  odometer_km: number
  status: 'OPERATIONAL' | 'WARNING' | 'FAULT'
}

function usePowerNodes() {
  const [nodes, setNodes] = useState<NodePower[]>(() =>
    ['BOP-ALPHA-01', 'BOP-BETA-01', 'BOP-GAMMA-01', 'BOP-DELTA-01'].map((id) => ({
      nodeId: id,
      solar_w: Math.round(80 + Math.random() * 320),
      battery_pct: Math.round(40 + Math.random() * 55),
      battery_v: parseFloat((11.5 + Math.random() * 2.5).toFixed(1)),
      generator: (Math.random() < 0.3 ? 'ON' : 'OFF') as NodePower['generator'],
      load_w: Math.round(60 + Math.random() * 180),
      gridConnected: Math.random() < 0.6,
      lowBattery: false,
    })).map((n) => ({ ...n, lowBattery: n.battery_pct < 25 }))
  )

  useEffect(() => {
    const iv = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => {
          const solar = Math.max(0, n.solar_w + (Math.random() * 40 - 20))
          const battery = Math.max(5, Math.min(100, n.battery_pct + (solar > n.load_w ? 0.1 : -0.15)))
          return {
            ...n,
            solar_w: Math.round(solar),
            battery_pct: parseFloat(battery.toFixed(1)),
            battery_v: parseFloat((10.5 + (battery / 100) * 3).toFixed(1)),
            load_w: Math.round(n.load_w + (Math.random() * 20 - 10)),
            lowBattery: battery < 25,
          }
        })
      )
    }, 3000)
    return () => clearInterval(iv)
  }, [])
  return nodes
}

function useVehicles() {
  const [vehicles] = useState<Vehicle[]>([
    {
      id: 'VH-01', callsign: 'Gypsy Alpha', type: 'Gypsy 4×4',
      fuel_pct: 72, battery_v: 13.2, engine_temp_c: 88, tyre_pressure_psi: [32, 31, 33, 32],
      fault_codes: [], odometer_km: 12450, status: 'OPERATIONAL',
    },
    {
      id: 'VH-02', callsign: 'Stallion Bravo', type: 'TATA Xenon',
      fuel_pct: 38, battery_v: 11.8, engine_temp_c: 102, tyre_pressure_psi: [30, 31, 29, 31],
      fault_codes: ['P0300 - Misfire', 'P0113 - IAT Sensor'], odometer_km: 34870, status: 'WARNING',
    },
    {
      id: 'VH-03', callsign: 'Rover Charlie', type: 'Mahindra Bolero',
      fuel_pct: 91, battery_v: 12.9, engine_temp_c: 79, tyre_pressure_psi: [33, 33, 32, 33],
      fault_codes: [], odometer_km: 7820, status: 'OPERATIONAL',
    },
  ])
  return vehicles
}

function RadialGauge({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const pct = Math.min(value / max, 1)
  const r = 28, cx = 36, cy = 36
  const startAngle = -220
  const sweep = 260
  const angle = startAngle + pct * sweep
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (a: number) => cx + r * Math.cos(toRad(a))
  const arcY = (a: number) => cy + r * Math.sin(toRad(a))
  const largeArc = pct * sweep > 180 ? 1 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={72} height={72}>
        <path
          d={`M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(startAngle + sweep)} ${arcY(startAngle + sweep)}`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} strokeLinecap="round"
        />
        {pct > 0 && (
          <path
            d={`M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${arcX(angle)} ${arcY(angle)}`}
            fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          />
        )}
        <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize={13} fontWeight={700} fontFamily="monospace">
          {Math.round(value)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={8}>
          {unit}
        </text>
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: -4 }}>{label}</span>
    </div>
  )
}

export default function PowerPanel() {
  const nodes = usePowerNodes()
  const vehicles = useVehicles()
  const [tab, setTab] = useState<'power' | 'vehicle'>('power')
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)

  const showPower = isVisible('powerEnergyMonitor')
  const showVehicle = isVisible('vehicleHealthMonitor')

  const lowBattCount = nodes.filter((n) => n.lowBattery).length

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
          Nodes: <strong style={{ color: 'var(--text-primary)' }}>{nodes.length}</strong>
        </span>
        {lowBattCount > 0 && (
          <span style={{ color: 'var(--alert-critical)', fontWeight: 700 }}>🔋 {lowBattCount} low battery</span>
        )}
        {vehicles.some((v) => v.status !== 'OPERATIONAL') && (
          <span style={{ color: 'var(--alert-medium)', fontWeight: 700 }}>
            🚗 {vehicles.filter((v) => v.status !== 'OPERATIONAL').length} vehicle fault
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      {showPower && showVehicle && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          {(['power', 'vehicle'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '6px 12px',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--accent-blue)' : '2px solid transparent',
                background: 'transparent',
                color: tab === t ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: tab === t ? 700 : 400,
              }}
            >
              {t === 'power' ? '⚡ Power & Energy' : '🚗 Vehicle Health'}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Power tab */}
        {(tab === 'power' || !showVehicle) && showPower && (
          <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {nodes.map((node) => {
                const netW = node.solar_w - node.load_w
                const netColor = netW >= 0 ? 'var(--sensor-acoustic)' : 'var(--alert-medium)'
                return (
                  <div
                    key={node.nodeId}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${node.lowBattery ? 'var(--alert-critical)' : 'var(--border-color)'}`,
                      borderRadius: 6,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 11 }}>{node.nodeId}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 10, background: node.gridConnected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: node.gridConnected ? 'var(--sensor-acoustic)' : 'var(--text-secondary)', border: '1px solid currentColor' }}>
                          {node.gridConnected ? 'GRID' : 'OFF-GRID'}
                        </span>
                        <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 10, background: node.generator === 'ON' ? 'rgba(251,191,36,0.15)' : 'transparent', color: node.generator === 'ON' ? '#fbbf24' : 'var(--text-secondary)', border: '1px solid currentColor' }}>
                          GEN {node.generator}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 4, justifyContent: 'space-around', marginBottom: 8 }}>
                      <RadialGauge value={node.battery_pct} max={100} label="Battery" unit="%" color={node.lowBattery ? 'var(--alert-critical)' : 'var(--sensor-acoustic)'} />
                      <RadialGauge value={node.solar_w} max={500} label="Solar" unit="W" color="#fbbf24" />
                      <RadialGauge value={node.load_w} max={500} label="Load" unit="W" color="var(--accent-blue)" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
                      <span>{node.battery_v}V</span>
                      <span style={{ color: netColor, fontWeight: 700 }}>
                        Net: {netW >= 0 ? '+' : ''}{netW} W
                      </span>
                      {node.lowBattery && <span style={{ color: 'var(--alert-critical)', fontWeight: 700 }}>LOW BATTERY</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Vehicle tab */}
        {(tab === 'vehicle' || !showPower) && showVehicle && (
          <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {vehicles.map((v) => {
                const statusColor = v.status === 'OPERATIONAL' ? 'var(--sensor-acoustic)' : v.status === 'WARNING' ? 'var(--alert-medium)' : 'var(--alert-critical)'
                return (
                  <div key={v.id}>
                    <button
                      onClick={() => setSelectedVehicle(selectedVehicle === v.id ? null : v.id)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${v.status !== 'OPERATIONAL' ? statusColor : 'var(--border-color)'}`,
                        borderLeft: `3px solid ${statusColor}`,
                        borderRadius: selectedVehicle === v.id ? '6px 6px 0 0' : 6,
                        padding: '8px 10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v.callsign}</span>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{v.type}</span>
                        </div>
                        <span style={{ color: statusColor, fontWeight: 700, fontSize: 9 }}>{v.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                        <span>⛽ {v.fuel_pct}%</span>
                        <span>🔋 {v.battery_v}V</span>
                        <span>🌡 {v.engine_temp_c}°C</span>
                        {v.fault_codes.length > 0 && <span style={{ color: statusColor }}>⚠ {v.fault_codes.length} fault{v.fault_codes.length > 1 ? 's' : ''}</span>}
                      </div>
                    </button>

                    {selectedVehicle === v.id && (
                      <div
                        style={{
                          border: '1px solid var(--border-color)',
                          borderTop: 'none',
                          borderRadius: '0 0 6px 6px',
                          padding: '8px 10px',
                          background: 'var(--panel-bg)',
                          fontSize: 10,
                        }}
                      >
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Tyre pressure (PSI)</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                            {v.tyre_pressure_psi.map((p, i) => {
                              const ok = p >= 28 && p <= 35
                              return (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: 3 }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>T{i + 1}</span>
                                  <span style={{ color: ok ? 'var(--sensor-acoustic)' : 'var(--alert-medium)', fontWeight: 700, fontFamily: 'monospace' }}>{p} PSI</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        {v.fault_codes.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ color: 'var(--alert-medium)', marginBottom: 4, fontWeight: 700 }}>Fault Codes</div>
                            {v.fault_codes.map((fc) => (
                              <div key={fc} style={{ padding: '2px 0', color: 'var(--alert-medium)', fontSize: 9 }}>⚠ {fc}</div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ flex: 1, padding: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10 }}>
                            ⬇ Export Report
                          </button>
                          <span style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: 'var(--text-secondary)' }}>
                            ODO: {v.odometer_km.toLocaleString()} km
                          </span>
                        </div>
                      </div>
                    )}
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
