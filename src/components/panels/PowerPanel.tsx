import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

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
    <div className="flex flex-col items-center">
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
      <span className="text-[10px] text-text-secondary -mt-1">{label}</span>
    </div>
  )
}

export function PowerPanel() {
  const nodes = usePowerNodes()
  const vehicles = useVehicles()
  const [tab, setTab] = useState<'power' | 'vehicle'>('power')
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)

  const showPower   = isVisible('powerEnergyMonitor')
  const showVehicle = isVisible('vehicleHealthMonitor')

  const lowBattCount = nodes.filter((n) => n.lowBattery).length

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="py-1 px-[10px] border-b border-border-color bg-bg-secondary flex items-center gap-[10px] shrink-0 text-[10px]">
        <span className="text-text-secondary">
          Nodes: <strong className="text-text-primary">{nodes.length}</strong>
        </span>
        {lowBattCount > 0 && (
          <span className="text-alert-critical font-bold">🔋 {lowBattCount} low battery</span>
        )}
        {vehicles.some((v) => v.status !== 'OPERATIONAL') && (
          <span className="text-alert-medium font-bold">
            🚗 {vehicles.filter((v) => v.status !== 'OPERATIONAL').length} vehicle fault
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      {showPower && showVehicle && (
        <div className="flex border-b border-border-color shrink-0">
          {(['power', 'vehicle'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-1.5 px-3 border-none bg-transparent cursor-pointer text-[10px]',
                tab === t
                  ? 'border-b-2 border-accent-blue text-accent-blue font-bold'
                  : 'border-b-2 border-transparent text-text-secondary font-normal',
              ].join(' ')}
            >
              {t === 'power' ? '⚡ Power & Energy' : '🚗 Vehicle Health'}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Power tab */}
        {(tab === 'power' || !showVehicle) && showPower && (
          <div className="p-[10px]">
            <div className="flex flex-col gap-2">
              {nodes.map((node) => {
                const netW = node.solar_w - node.load_w
                const netColor = netW >= 0 ? 'var(--sensor-acoustic)' : 'var(--alert-medium)'
                return (
                  <div
                    key={node.nodeId}
                    className="bg-bg-secondary rounded-md px-[10px] py-2"
                    style={{ border: `1px solid ${node.lowBattery ? 'var(--alert-critical)' : 'var(--border-color)'}` }}
                  >
                    <div className="flex justify-between items-center mb-2 text-[10px]">
                      <span className="font-bold text-[11px]">{node.nodeId}</span>
                      <div className="flex gap-1.5">
                        <span
                          className="py-[1px] px-1.5 rounded-[3px] text-[10px] border"
                          style={{
                            background: node.gridConnected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                            color: node.gridConnected ? 'var(--sensor-acoustic)' : 'var(--text-secondary)',
                            borderColor: 'currentColor',
                          }}
                        >
                          {node.gridConnected ? 'GRID' : 'OFF-GRID'}
                        </span>
                        <span
                          className="py-[1px] px-1.5 rounded-[3px] text-[10px] border"
                          style={{
                            background: node.generator === 'ON' ? 'rgba(251,191,36,0.15)' : 'transparent',
                            color: node.generator === 'ON' ? '#fbbf24' : 'var(--text-secondary)',
                            borderColor: 'currentColor',
                          }}
                        >
                          GEN {node.generator}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1 justify-around mb-2">
                      <RadialGauge value={node.battery_pct} max={100} label="Battery" unit="%" color={node.lowBattery ? 'var(--alert-critical)' : 'var(--sensor-acoustic)'} />
                      <RadialGauge value={node.solar_w} max={500} label="Solar" unit="W" color="#fbbf24" />
                      <RadialGauge value={node.load_w} max={500} label="Load" unit="W" color="var(--accent-blue)" />
                    </div>

                    <div className="flex justify-between text-[10px] text-text-secondary">
                      <span>{node.battery_v}V</span>
                      <span className="font-bold" style={{ color: netColor }}>
                        Net: {netW >= 0 ? '+' : ''}{netW} W
                      </span>
                      {node.lowBattery && <span className="text-alert-critical font-bold">LOW BATTERY</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Vehicle tab */}
        {(tab === 'vehicle' || !showPower) && showVehicle && (
          <div className="p-[10px]">
            <div className="flex flex-col gap-1.5">
              {vehicles.map((v) => {
                const statusColor = v.status === 'OPERATIONAL' ? 'var(--sensor-acoustic)' : v.status === 'WARNING' ? 'var(--alert-medium)' : 'var(--alert-critical)'
                const isSelected = selectedVehicle === v.id
                return (
                  <div key={v.id}>
                    <button
                      onClick={() => setSelectedVehicle(isSelected ? null : v.id)}
                      className={`w-full bg-bg-secondary cursor-pointer text-left px-[10px] py-2 ${isSelected ? 'rounded-t-md' : 'rounded-md'}`}
                      style={{
                        border: `1px solid ${v.status !== 'OPERATIONAL' ? statusColor : 'var(--border-color)'}`,
                        borderLeft: `3px solid ${statusColor}`,
                      }}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-bold text-text-primary">{v.callsign}</span>
                          <span className="text-text-secondary ml-2">{v.type}</span>
                        </div>
                        <span className="font-bold text-[9px]" style={{ color: statusColor }}>{v.status}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-text-secondary mt-1">
                        <span>⛽ {v.fuel_pct}%</span>
                        <span>🔋 {v.battery_v}V</span>
                        <span>🌡 {v.engine_temp_c}°C</span>
                        {v.fault_codes.length > 0 && (
                          <span style={{ color: statusColor }}>⚠ {v.fault_codes.length} fault{v.fault_codes.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </button>

                    {isSelected && (
                      <div className="border border-t-0 border-border-color rounded-b-md px-[10px] py-2 bg-panel-bg text-[10px]">
                        <div className="mb-1.5">
                          <div className="text-text-secondary mb-1">Tyre pressure (PSI)</div>
                          <div className="grid grid-cols-2 gap-1">
                            {v.tyre_pressure_psi.map((p, i) => {
                              const ok = p >= 28 && p <= 35
                              return (
                                <div key={i} className="flex justify-between py-[2px] px-1.5 bg-bg-secondary rounded-[3px]">
                                  <span className="text-text-secondary">T{i + 1}</span>
                                  <span className={`font-bold font-mono ${ok ? 'text-sensor-acoustic' : 'text-alert-medium'}`}>{p} PSI</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        {v.fault_codes.length > 0 && (
                          <div className="mb-1.5">
                            <div className="text-alert-medium mb-1 font-bold">Fault Codes</div>
                            {v.fault_codes.map((fc) => (
                              <div key={fc} className="py-[2px] text-alert-medium text-[9px]">⚠ {fc}</div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <button className="flex-1 py-1 bg-bg-tertiary border border-border-color rounded text-text-secondary cursor-pointer text-[10px]">
                            ⬇ Export Report
                          </button>
                          <span className="flex items-center text-[10px] text-text-secondary">
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
