// ============================================================
// IINVSYS SIS — DeviceConfigPage.tsx
// SensiConnect hardware pin/port configuration view
// with CSS 3-D device diagram
// ============================================================

import { useState, useMemo } from 'react'
import { useSensorStore } from '../../store/sensorStore'
import { getSensorFamilyColor } from '../../utils/formatters'
import { useIsMobile } from '../../hooks/useIsMobile'
import type { SensorFamily, SensorModality } from '../../types/sensors'

// ── Port / sensor mapping ─────────────────────────────────────────────────────

type IfaceType = 'RJ45' | 'SMA-RF' | 'RS-485' | 'GPIO' | 'USB3-A'
type FaceId    = 'top' | 'mid' | 'bot' | 'rear'

interface SensiPort {
  port:     string
  iface:    IfaceType
  sensorId: string
  label:    string
  modality: SensorModality
  family:   SensorFamily
  face:     FaceId
  col:      number   // column position within its row
}

const SC_PORTS: SensiPort[] = [
  // ── Front-top row: Ethernet IP cameras ──────────────────────
  { port: 'ETH-01', iface: 'RJ45',   sensorId: 'S06-EOT-001', label: 'EOTS',       modality: 'EOTS',        family: 'Optical',  face: 'top',  col: 0 },
  { port: 'ETH-02', iface: 'RJ45',   sensorId: 'S07-THR-001', label: 'THERMAL',    modality: 'THERMAL',     family: 'Optical',  face: 'top',  col: 1 },
  { port: 'ETH-03', iface: 'RJ45',   sensorId: 'S08-PTZ-001', label: 'PTZ',        modality: 'PTZ',         family: 'Optical',  face: 'top',  col: 2 },
  { port: 'ETH-04', iface: 'RJ45',   sensorId: 'S10-CCV-001', label: 'CCTV',       modality: 'CCTV',        family: 'Optical',  face: 'top',  col: 3 },
  // ── Front-mid row: SMA-RF connectors ─────────────────────────
  { port: 'SMA-01', iface: 'SMA-RF', sensorId: 'S01-GPR-001', label: 'GPR',        modality: 'GPR',         family: 'Radar',    face: 'mid',  col: 0 },
  { port: 'SMA-02', iface: 'SMA-RF', sensorId: 'S11-MWB-001', label: 'MICROWAVE',  modality: 'MICROWAVE',   family: 'Radar',    face: 'mid',  col: 1 },
  { port: 'SMA-03', iface: 'SMA-RF', sensorId: 'S13-LID-001', label: 'LIDAR',      modality: 'LIDAR',       family: 'Radar',    face: 'mid',  col: 2 },
  { port: 'SMA-04', iface: 'SMA-RF', sensorId: 'S17-MMW-001', label: 'mmWAVE',     modality: 'MMWAVE',      family: 'Radar',    face: 'mid',  col: 3 },
  { port: 'SMA-05', iface: 'SMA-RF', sensorId: 'S18-GMT-001', label: 'GMTI',       modality: 'GMTI_RADAR',  family: 'Radar',    face: 'mid',  col: 4 },
  // ── Front-bot row: RS-485 serial ──────────────────────────────
  { port: 'RS485-01', iface: 'RS-485', sensorId: 'S02-GEO-001', label: 'SEISMIC',  modality: 'SEISMIC',     family: 'Seismic',  face: 'bot',  col: 0 },
  { port: 'RS485-02', iface: 'RS-485', sensorId: 'S09-VIB-001', label: 'VIB',      modality: 'VIBRATION',   family: 'Seismic',  face: 'bot',  col: 1 },
  { port: 'RS485-03', iface: 'RS-485', sensorId: 'S05-FIB-001', label: 'FIBRE',    modality: 'FIBRE_OPTIC', family: 'Seismic',  face: 'bot',  col: 2 },
  { port: 'RS485-04', iface: 'RS-485', sensorId: 'S03-ACU-001', label: 'ACOUSTIC', modality: 'ACOUSTIC',    family: 'Acoustic', face: 'bot',  col: 3 },
  // ── Rear I/O: GPIO + USB3 ─────────────────────────────────────
  { port: 'GPIO-01', iface: 'GPIO',   sensorId: 'S04-MAD-001', label: 'MAD',       modality: 'MAD',         family: 'Magnetic', face: 'rear', col: 0 },
  { port: 'GPIO-02', iface: 'GPIO',   sensorId: 'S14-MAG-001', label: 'MAG',       modality: 'MAGNETOMETER',family: 'Magnetic', face: 'rear', col: 1 },
  { port: 'GPIO-03', iface: 'GPIO',   sensorId: 'S19-EMI-001', label: 'EMI',       modality: 'EMI',         family: 'Radar',    face: 'rear', col: 2 },
  { port: 'GPIO-04', iface: 'GPIO',   sensorId: 'S20-CHM-001', label: 'CHEMICAL',  modality: 'CHEMICAL',    family: 'Chemical', face: 'rear', col: 3 },
  { port: 'GPIO-05', iface: 'GPIO',   sensorId: 'S12-PIR-001', label: 'PIR-IR',    modality: 'PIR_IR',      family: 'Chemical', face: 'rear', col: 4 },
  { port: 'USB3-01', iface: 'USB3-A', sensorId: 'S15-TNV-001', label: 'THERM-NV',  modality: 'THERMAL_NV',  family: 'Optical',  face: 'rear', col: 5 },
  { port: 'USB3-02', iface: 'USB3-A', sensorId: 'S16-NIR-001', label: 'NIR-VIS',   modality: 'NIR_VISIBLE', family: 'Optical',  face: 'rear', col: 6 },
]

const UNITS = [
  { id: 'SC-001', siteId: 'BOP-ALPHA-01', bopId: 'BOP-001', lat: 21.9452, lon: 88.1234 },
  { id: 'SC-002', siteId: 'BOP-BETA-01',  bopId: 'BOP-002', lat: 21.9812, lon: 88.2156 },
]

// Interface type colours / shapes used on the 3D front face
const IFACE_COLOR: Record<IfaceType, string> = {
  'RJ45':   '#2563EB',
  'SMA-RF': '#9333EA',
  'RS-485': '#D97706',
  'GPIO':   '#059669',
  'USB3-A': '#0891B2',
}

const IFACE_SHAPE: Record<IfaceType, string> = {
  'RJ45':   'rect',
  'SMA-RF': 'circle',
  'RS-485': 'rect',
  'GPIO':   'sq',
  'USB3-A': 'usb',
}

// ── Utility ───────────────────────────────────────────────────────────────────

function isLive(sensorId: string, sensors: Map<string, { timestamp: string }>): boolean {
  const s = sensors.get(sensorId)
  if (!s) return false
  return (Date.now() - new Date(s.timestamp).getTime()) < 10_000
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IfaceBadge({ iface }: { iface: IfaceType }) {
  const color = IFACE_COLOR[iface]
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
      padding: '1px 5px', borderRadius: 3,
      background: `${color}22`, border: `1px solid ${color}55`,
      color, fontFamily: 'monospace',
    }}>
      {iface}
    </span>
  )
}

function StatusPill({ live }: { live: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700,
      color: live ? 'var(--sensor-acoustic)' : 'var(--text-secondary)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: live ? 'var(--sensor-acoustic)' : '#475569',
        boxShadow: live ? '0 0 6px var(--sensor-acoustic)' : 'none',
        flexShrink: 0,
        animation: live ? 'sensiPulse 2s ease-in-out infinite' : 'none',
      }} />
      {live ? 'LIVE' : 'NO SIG'}
    </span>
  )
}

// ── 3D SensiConnect device ────────────────────────────────────────────────────

function ConnectorDot({
  port, live, family, iface, selected,
  onClick,
}: {
  port: SensiPort; live: boolean; family: SensorFamily
  iface: IfaceType; selected: boolean; onClick: () => void
}) {
  const fc = getSensorFamilyColor(family)
  const ic = IFACE_COLOR[iface]
  const shape = IFACE_SHAPE[iface]
  const isCircle = shape === 'circle'

  return (
    <button
      onClick={onClick}
      title={`${port.port} · ${port.label} · ${live ? 'LIVE' : 'NO SIG'}`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
      }}
    >
      {/* Connector body */}
      <div style={{
        width: isCircle ? 22 : 26,
        height: isCircle ? 22 : shape === 'usb' ? 14 : 20,
        borderRadius: isCircle ? '50%' : shape === 'usb' ? 3 : 4,
        background: selected
          ? `linear-gradient(135deg, ${ic}cc, ${ic}88)`
          : 'linear-gradient(135deg, #1a2535, #0f1a27)',
        border: `2px solid ${selected ? ic : '#2a3d52'}`,
        boxShadow: live
          ? `0 0 8px ${fc}88, inset 0 1px 0 rgba(255,255,255,0.08)`
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        position: 'relative',
        transition: 'all 0.15s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Inner pin-hole / detail */}
        {isCircle && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: live ? fc : '#1e2d3d',
            border: `1px solid ${live ? fc : '#2a3a4a'}`,
            boxShadow: live ? `0 0 4px ${fc}` : 'none',
          }} />
        )}
        {!isCircle && shape === 'rect' && (
          <div style={{
            width: 12, height: 4, borderRadius: 1,
            background: live ? `${ic}88` : '#1e2d3d',
            border: `1px solid ${live ? ic : '#2a3a4a'}`,
          }} />
        )}
        {/* Status LED top-right */}
        <div style={{
          position: 'absolute', top: -3, right: -3,
          width: 6, height: 6, borderRadius: '50%',
          background: live ? 'var(--sensor-acoustic)' : '#475569',
          border: '1px solid var(--bg-primary)',
          boxShadow: live ? '0 0 5px var(--sensor-acoustic)' : 'none',
        }} />
      </div>
      {/* Port label */}
      <span style={{
        fontSize: 8, color: selected ? ic : 'var(--text-secondary)',
        letterSpacing: '0.03em', fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        transition: 'color 0.15s ease',
      }}>
        {port.label}
      </span>
    </button>
  )
}

function SensiConnect3D({
  ports, liveSet, selectedPort, onSelect,
}: {
  ports: SensiPort[]
  liveSet: Set<string>
  selectedPort: string | null
  onSelect: (portId: string) => void
}) {
  const byFace = (face: FaceId) => ports.filter(p => p.face === face).sort((a, b) => a.col - b.col)

  const rowStyle = (accent: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'flex-end', gap: 8,
    padding: '6px 10px',
    borderBottom: `1px solid ${accent}33`,
    background: `linear-gradient(90deg, ${accent}08 0%, transparent 100%)`,
  })

  const rowLabel = (text: string, color: string) => (
    <div style={{
      fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
      color, writingMode: 'vertical-lr', transform: 'rotate(180deg)',
      padding: '0 2px', borderRight: `2px solid ${color}44`,
      marginRight: 4, minWidth: 14, textAlign: 'center',
    }}>
      {text}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* CSS 3D container */}
      <div style={{ perspective: '900px', perspectiveOrigin: '50% 30%' }}>
        <div style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(18deg) rotateY(-10deg)',
          width: 580,
        }}>

          {/* ── Top face ──────────────────────────────────────── */}
          <div style={{
            width: '100%', height: 52,
            background: 'linear-gradient(90deg, #1a2840 0%, #0f1e2e 60%, #162436 100%)',
            border: '1px solid #253a50',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            transformOrigin: 'bottom center',
            transform: 'rotateX(50deg) translateY(-2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 18px',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, #1e3a5f, #0f2035)',
                border: '1px solid #2a4a6a',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>📡</div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#60a5fa' }}>
                  SENSICONNECT
                </div>
                <div style={{ fontSize: 7, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                  EDGE NODE · REV 3.2
                </div>
              </div>
            </div>
            {/* Status LEDs */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {['PWR', 'NET', 'AI'].map((l, i) => (
                <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i === 0 ? '#22c55e' : i === 1 ? '#60a5fa' : '#a855f7',
                    boxShadow: `0 0 6px ${i === 0 ? '#22c55e' : i === 1 ? '#60a5fa' : '#a855f7'}`,
                    animation: `sensiPulse ${1.5 + i * 0.4}s ease-in-out infinite`,
                  }} />
                  <span style={{ fontSize: 6, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Front face ────────────────────────────────────── */}
          <div style={{
            width: '100%',
            background: 'linear-gradient(180deg, #131f2e 0%, #0d1824 100%)',
            border: '1px solid #1e3047',
            borderTop: '1px solid #2a4060',
            borderRadius: '0 0 6px 6px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            {/* Row: Ethernet */}
            <div style={rowStyle('#2563EB')}>
              {rowLabel('ETH', '#2563EB')}
              {byFace('top').map(p => (
                <ConnectorDot key={p.port} port={p} live={liveSet.has(p.sensorId)}
                  family={p.family} iface={p.iface}
                  selected={selectedPort === p.port} onClick={() => onSelect(p.port)} />
              ))}
              <div style={{ marginLeft: 'auto', fontSize: 8, color: '#2563EB88', fontFamily: 'monospace' }}>
                PoE+ · 1Gbps
              </div>
            </div>

            {/* Row: RF / SMA */}
            <div style={rowStyle('#9333EA')}>
              {rowLabel('RF', '#9333EA')}
              {byFace('mid').map(p => (
                <ConnectorDot key={p.port} port={p} live={liveSet.has(p.sensorId)}
                  family={p.family} iface={p.iface}
                  selected={selectedPort === p.port} onClick={() => onSelect(p.port)} />
              ))}
              <div style={{ marginLeft: 'auto', fontSize: 8, color: '#9333EA88', fontFamily: 'monospace' }}>
                SMA · 50Ω
              </div>
            </div>

            {/* Row: RS-485 */}
            <div style={rowStyle('#D97706')}>
              {rowLabel('SER', '#D97706')}
              {byFace('bot').map(p => (
                <ConnectorDot key={p.port} port={p} live={liveSet.has(p.sensorId)}
                  family={p.family} iface={p.iface}
                  selected={selectedPort === p.port} onClick={() => onSelect(p.port)} />
              ))}
              <div style={{ marginLeft: 'auto', fontSize: 8, color: '#D9770688', fontFamily: 'monospace' }}>
                RS-485 · 4Mbps
              </div>
            </div>

            {/* Row: GPIO + USB */}
            <div style={rowStyle('#059669')}>
              {rowLabel('I/O', '#059669')}
              {byFace('rear').map(p => (
                <ConnectorDot key={p.port} port={p} live={liveSet.has(p.sensorId)}
                  family={p.family} iface={p.iface}
                  selected={selectedPort === p.port} onClick={() => onSelect(p.port)} />
              ))}
              <div style={{ marginLeft: 'auto', fontSize: 8, color: '#05966988', fontFamily: 'monospace' }}>
                GPIO / USB3
              </div>
            </div>

            {/* Bottom strip: specs */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 14px',
              background: '#080f18',
              borderTop: '1px solid #1a2a3a',
            }}>
              {['24V DC · 60W', 'ARM Cortex-A78AE', '16GB LPDDR5', '4G/LTE · WiFi6 · BT5'].map(s => (
                <span key={s} style={{ fontSize: 7, color: '#334155', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right-side depth face ─────────────────────────── */}
          <div style={{
            position: 'absolute', top: 52, right: 0,
            width: 22, height: 'calc(100% - 52px)',
            background: 'linear-gradient(90deg, #0a131e, #060e17)',
            border: '1px solid #1a2a3a',
            borderLeft: 'none',
            borderRadius: '0 0 6px 0',
            transformOrigin: 'left center',
            transform: 'rotateY(90deg) translateX(11px)',
          }} />
        </div>
      </div>
    </div>
  )
}

// ── Pin configuration table ───────────────────────────────────────────────────

function PinTable({
  ports, liveSet, selectedPort, onSelect,
}: {
  ports: SensiPort[]
  liveSet: Set<string>
  selectedPort: string | null
  onSelect: (portId: string) => void
}) {
  const FACE_LABEL: Record<FaceId, string> = {
    top: 'Ethernet (PoE+)', mid: 'RF / SMA', bot: 'Serial (RS-485)', rear: 'GPIO / USB3'
  }

  const groups: FaceId[] = ['top', 'mid', 'bot', 'rear']

  return (
    <div style={{ minWidth: 480 }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: 11, tableLayout: 'fixed',
      }}>
        <colgroup>
          <col style={{ width: 80 }} />
          <col style={{ width: 70 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 80 }} />
          <col style={{ width: 70 }} />
          <col />
        </colgroup>
        <thead>
          <tr style={{
            position: 'sticky', top: 0, zIndex: 2,
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
          }}>
            {['Port', 'Iface', 'Sensor ID', 'Modality', 'Family', 'Status', 'Signal'].map(h => (
              <th key={h} style={{
                padding: '6px 10px', textAlign: 'left',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-secondary)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(face => {
            const rows = ports.filter(p => p.face === face).sort((a, b) => a.col - b.col)
            return (
              <>
                {/* Section header */}
                <tr key={`hdr-${face}`}>
                  <td colSpan={7} style={{
                    padding: '4px 10px',
                    background: 'var(--bg-tertiary)',
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border-color)',
                  }}>
                    {FACE_LABEL[face]}
                  </td>
                </tr>
                {rows.map(p => {
                  const live = liveSet.has(p.sensorId)
                  const fc = getSensorFamilyColor(p.family)
                  const ic = IFACE_COLOR[p.iface]
                  const isSelected = selectedPort === p.port

                  return (
                    <tr
                      key={p.port}
                      onClick={() => onSelect(p.port)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? `${ic}12` : 'transparent',
                        borderLeft: isSelected ? `2px solid ${ic}` : '2px solid transparent',
                        transition: 'background 0.12s',
                      }}
                    >
                      {/* Port */}
                      <td style={{ padding: '5px 10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: ic, fontWeight: 600 }}>
                          {p.port}
                        </span>
                      </td>
                      {/* Iface */}
                      <td style={{ padding: '5px 10px' }}>
                        <IfaceBadge iface={p.iface} />
                      </td>
                      {/* Sensor ID */}
                      <td style={{ padding: '5px 10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-primary)' }}>
                          {p.sensorId}
                        </span>
                      </td>
                      {/* Modality */}
                      <td style={{ padding: '5px 10px' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                          {p.modality}
                        </span>
                      </td>
                      {/* Family */}
                      <td style={{ padding: '5px 10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: fc, flexShrink: 0,
                            boxShadow: live ? `0 0 4px ${fc}` : 'none',
                          }} />
                          <span style={{ fontSize: 10, color: fc }}>{p.family}</span>
                        </span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '5px 10px' }}>
                        <StatusPill live={live} />
                      </td>
                      {/* Signal bar */}
                      <td style={{ padding: '5px 10px' }}>
                        <div style={{
                          width: '100%', height: 4,
                          background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden',
                        }}>
                          <div style={{
                            width: live ? `${60 + Math.random() * 40}%` : '0%',
                            height: '100%',
                            background: live ? fc : 'transparent',
                            borderRadius: 2,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeviceConfigPage() {
  const [activeUnit, setActiveUnit]   = useState(0)
  const [selectedPort, setSelectedPort] = useState<string | null>(null)

  const sensors  = useSensorStore(s => s.sensors)
  const isMobile = useIsMobile()

  const unit = UNITS[activeUnit]

  // Determine live sensor IDs (data within last 10 s)
  const liveSet = useMemo(() => {
    const s = new Set<string>()
    for (const [id, payload] of sensors.entries()) {
      if ((Date.now() - new Date((payload as { timestamp: string }).timestamp).getTime()) < 10_000) {
        s.add(id)
      }
    }
    return s
  }, [sensors])

  const liveCount  = SC_PORTS.filter(p => liveSet.has(p.sensorId)).length
  const totalCount = SC_PORTS.length

  function handleSelect(portId: string) {
    setSelectedPort(prev => prev === portId ? null : portId)
  }

  const selectedDef = SC_PORTS.find(p => p.port === selectedPort)

  return (
    <div style={{
      flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: 'var(--bg-primary)',
    }}>
      <style>{`
        @keyframes sensiPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.45; }
        }
      `}</style>

      {/* ── Top bar ────────────────────────────────────────────── */}
      <div
        className="device-config-meta"
        style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
          flexWrap: 'wrap',
          padding: isMobile ? '6px 10px' : '6px 14px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}
      >
        {/* Unit selector tabs */}
        <div className="device-config-unit-tabs" style={{ display: 'flex', gap: 4 }}>
          {UNITS.map((u, i) => (
            <button
              key={u.id}
              onClick={() => { setActiveUnit(i); setSelectedPort(null) }}
              style={{
                padding: '4px 12px', border: 'none', cursor: 'pointer',
                borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                background: activeUnit === i ? 'rgba(59,130,246,0.2)' : 'var(--bg-tertiary)',
                color: activeUnit === i ? 'var(--accent-blue)' : 'var(--text-secondary)',
                border: activeUnit === i ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                transition: 'all 0.12s',
              }}
            >
              {u.id}
            </button>
          ))}
        </div>

        {/* Unit info */}
        <div style={{
          display: 'flex', gap: isMobile ? 8 : 16,
          fontSize: 10, color: 'var(--text-secondary)',
          flexWrap: 'wrap',
        }}>
          <span>Site: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{unit.siteId}</strong></span>
          <span>BOP: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{unit.bopId}</strong></span>
          {!isMobile && <>
            <span>Lat: <strong style={{ color: 'var(--accent-teal)', fontFamily: 'monospace' }}>{unit.lat}</strong></span>
            <span>Lon: <strong style={{ color: 'var(--accent-teal)', fontFamily: 'monospace' }}>{unit.lon}</strong></span>
          </>}
        </div>

        <div style={{ flex: 1 }} />

        {/* Live port count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Ports active:</span>
          <span style={{
            fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
            color: liveCount > 0 ? 'var(--sensor-acoustic)' : 'var(--text-secondary)',
          }}>
            {liveCount}<span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: 10 }}>/{totalCount}</span>
          </span>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div
        className="device-config-layout"
        style={{
          flex: 1, minHeight: 0,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'column',
          overflow: isMobile ? 'auto' : 'hidden',
        }}
      >

        {/* 3D device + selected port detail */}
        <div style={{
          flexShrink: 0, padding: isMobile ? '10px 8px 8px' : '20px 14px 10px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(30,58,92,0.25) 0%, transparent 70%)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', gap: 16, alignItems: 'flex-start',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}>
          {/* Scrollable wrapper for 3D device on mobile */}
          <div
            className="device-3d-scroll"
            style={{
              overflowX: isMobile ? 'auto' : 'visible',
              overflowY: 'visible',
              flex: '1 1 auto',
              minWidth: 0,
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties}
          >
          <SensiConnect3D
            ports={SC_PORTS}
            liveSet={liveSet}
            selectedPort={selectedPort}
            onSelect={handleSelect}
          />
          </div>

          {/* Selected port detail card */}
          {selectedDef ? (
            <div style={{
              width: isMobile ? '100%' : undefined,
              minWidth: isMobile ? undefined : 200,
              maxWidth: isMobile ? '100%' : 240,
              background: 'var(--bg-secondary)',
              border: `1px solid ${IFACE_COLOR[selectedDef.iface]}55`,
              borderRadius: 8, padding: 14,
              boxShadow: `0 0 20px ${IFACE_COLOR[selectedDef.iface]}22`,
              flexShrink: isMobile ? 0 : 0,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase' }}>
                Port Detail
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : '1fr', gap: '0 16px' }}>
                {[
                  ['Port',     selectedDef.port],
                  ['Sensor',   selectedDef.sensorId],
                  ['Label',    selectedDef.label],
                  ['Modality', selectedDef.modality],
                  ['Family',   selectedDef.family],
                  ['Iface',    selectedDef.iface],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{k}</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Status</span>
                <StatusPill live={liveSet.has(selectedDef.sensorId)} />
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: liveSet.has(selectedDef.sensorId) ? '78%' : '0%',
                    height: '100%',
                    background: getSensorFamilyColor(selectedDef.family),
                    borderRadius: 3,
                    boxShadow: `0 0 8px ${getSensorFamilyColor(selectedDef.family)}`,
                  }} />
                </div>
              </div>
            </div>
          ) : !isMobile ? (
            <div style={{
              minWidth: 200, maxWidth: 240, flexShrink: 0,
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)',
              borderRadius: 8, padding: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 6, color: 'var(--text-secondary)',
              fontSize: 11, textAlign: 'center', minHeight: 120,
            }}>
              <span style={{ fontSize: 20 }}>🔌</span>
              <span>Click a port on the<br />device to inspect it</span>
            </div>
          ) : null}
        </div>

        {/* Pin table */}
        <div style={{
          flex: isMobile ? undefined : 1,
          minHeight: isMobile ? 300 : 0,
          overflowX: 'auto',
          overflowY: isMobile ? 'visible' : 'auto',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}>
          <PinTable
            ports={SC_PORTS}
            liveSet={liveSet}
            selectedPort={selectedPort}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  )
}
