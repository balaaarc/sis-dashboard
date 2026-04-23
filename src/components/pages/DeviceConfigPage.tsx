// ============================================================
// IINVSYS SIS — DeviceConfigPage.tsx
// SensiConnect hardware configuration — 4 tabs:
//   Overview | Port Configuration | Data & Periodicity | Deployment Topology
// ============================================================

import { useState, useMemo } from 'react'
import { useSensorStore } from '@/store/sensorStore'
import { getSensorFamilyColor } from '@/utils/formatters'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { SensorFamily, SensorModality } from '@/types/sensors'

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
  col:      number
}

const SC_PORTS: SensiPort[] = [
  { port: 'ETH-01',   iface: 'RJ45',   sensorId: 'S06-EOT-001', label: 'EOTS',     modality: 'EOTS',        family: 'Optical',  face: 'top',  col: 0 },
  { port: 'ETH-02',   iface: 'RJ45',   sensorId: 'S07-THR-001', label: 'THERMAL',  modality: 'THERMAL',     family: 'Optical',  face: 'top',  col: 1 },
  { port: 'ETH-03',   iface: 'RJ45',   sensorId: 'S08-PTZ-001', label: 'PTZ',      modality: 'PTZ',         family: 'Optical',  face: 'top',  col: 2 },
  { port: 'ETH-04',   iface: 'RJ45',   sensorId: 'S10-CCV-001', label: 'CCTV',     modality: 'CCTV',        family: 'Optical',  face: 'top',  col: 3 },
  { port: 'SMA-01',   iface: 'SMA-RF', sensorId: 'S01-GPR-001', label: 'GPR',      modality: 'GPR',         family: 'Radar',    face: 'mid',  col: 0 },
  { port: 'SMA-02',   iface: 'SMA-RF', sensorId: 'S11-MWB-001', label: 'MICROWAVE',modality: 'MICROWAVE',   family: 'Radar',    face: 'mid',  col: 1 },
  { port: 'SMA-03',   iface: 'SMA-RF', sensorId: 'S13-LID-001', label: 'LIDAR',    modality: 'LIDAR',       family: 'Radar',    face: 'mid',  col: 2 },
  { port: 'SMA-04',   iface: 'SMA-RF', sensorId: 'S17-MMW-001', label: 'mmWAVE',   modality: 'MMWAVE',      family: 'Radar',    face: 'mid',  col: 3 },
  { port: 'SMA-05',   iface: 'SMA-RF', sensorId: 'S18-GMT-001', label: 'GMTI',     modality: 'GMTI_RADAR',  family: 'Radar',    face: 'mid',  col: 4 },
  { port: 'RS485-01', iface: 'RS-485', sensorId: 'S02-GEO-001', label: 'SEISMIC',  modality: 'SEISMIC',     family: 'Seismic',  face: 'bot',  col: 0 },
  { port: 'RS485-02', iface: 'RS-485', sensorId: 'S09-VIB-001', label: 'VIB',      modality: 'VIBRATION',   family: 'Seismic',  face: 'bot',  col: 1 },
  { port: 'RS485-03', iface: 'RS-485', sensorId: 'S05-FIB-001', label: 'FIBRE',    modality: 'FIBRE_OPTIC', family: 'Seismic',  face: 'bot',  col: 2 },
  { port: 'RS485-04', iface: 'RS-485', sensorId: 'S03-ACU-001', label: 'ACOUSTIC', modality: 'ACOUSTIC',    family: 'Acoustic', face: 'bot',  col: 3 },
  { port: 'GPIO-01',  iface: 'GPIO',   sensorId: 'S04-MAD-001', label: 'MAD',      modality: 'MAD',         family: 'Magnetic', face: 'rear', col: 0 },
  { port: 'GPIO-02',  iface: 'GPIO',   sensorId: 'S14-MAG-001', label: 'MAG',      modality: 'MAGNETOMETER',family: 'Magnetic', face: 'rear', col: 1 },
  { port: 'GPIO-03',  iface: 'GPIO',   sensorId: 'S19-EMI-001', label: 'EMI',      modality: 'EMI',         family: 'Radar',    face: 'rear', col: 2 },
  { port: 'GPIO-04',  iface: 'GPIO',   sensorId: 'S20-CHM-001', label: 'CHEMICAL', modality: 'CHEMICAL',    family: 'Chemical', face: 'rear', col: 3 },
  { port: 'GPIO-05',  iface: 'GPIO',   sensorId: 'S12-PIR-001', label: 'PIR-IR',   modality: 'PIR_IR',      family: 'Chemical', face: 'rear', col: 4 },
  { port: 'USB3-01',  iface: 'USB3-A', sensorId: 'S15-TNV-001', label: 'THERM-NV', modality: 'THERMAL_NV',  family: 'Optical',  face: 'rear', col: 5 },
  { port: 'USB3-02',  iface: 'USB3-A', sensorId: 'S16-NIR-001', label: 'NIR-VIS',  modality: 'NIR_VISIBLE', family: 'Optical',  face: 'rear', col: 6 },
]

const UNITS = [
  { id: 'SC-001', siteId: 'BOP-ALPHA-01', bopId: 'BOP-001', lat: 21.9452, lon: 88.1234, temp: '42°C', cpu: 'AMD Versal VE2802', uptime: '99.7%', rate: '190 MB/s', sensors: 9 },
  { id: 'SC-002', siteId: 'BOP-BETA-01',  bopId: 'BOP-002', lat: 21.9812, lon: 88.2156, temp: '51°C', cpu: 'AMD Versal VE2802', uptime: '98.1%', rate: '52 MB/s',  sensors: 8 },
]

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

// ── Port configuration table data (from reference) ───────────────────────────

type PortStatus = 'ok' | 'warn' | 'free'

interface PortDef {
  id:       string
  iface:    string
  sensor:   string
  cat:      string
  proto:    string
  status:   PortStatus
  rate:     number
  rateUnit: string
  period:   string
  color:    string
}

const PORT_DEFS: PortDef[] = [
  { id:'GE-01',    iface:'GigE Vision',  sensor:'PTZ Camera',        cat:'video',    proto:'ONVIF/RTSP',    status:'ok',   rate:85,    rateUnit:'Mbps',  period:'30 fps',      color:'#378ADD' },
  { id:'GE-02',    iface:'GigE Vision',  sensor:'Thermal Imager',    cat:'video',    proto:'GigE Vision',   status:'ok',   rate:72,    rateUnit:'Mbps',  period:'25 fps',      color:'#378ADD' },
  { id:'GE-03',    iface:'GigE Vision',  sensor:'EOTS',              cat:'video',    proto:'STANAG 4609',   status:'ok',   rate:48,    rateUnit:'Mbps',  period:'25 fps',      color:'#378ADD' },
  { id:'GE-04',    iface:'GigE Vision',  sensor:'—',                 cat:'—',        proto:'—',             status:'free', rate:0,     rateUnit:'',      period:'—',           color:'#555' },
  { id:'USB-01',   iface:'USB 3.2',      sensor:'LiDAR',             cat:'radar',    proto:'Ethernet UDP',  status:'ok',   rate:950,   rateUnit:'MB/s',  period:'20 Hz',       color:'#1D9E75' },
  { id:'USB-02',   iface:'USB 3.2',      sensor:'GPR Sensor',        cat:'sub',      proto:'USB 3.2',       status:'ok',   rate:18,    rateUnit:'MB/s',  period:'100 trace/s', color:'#E24B4A' },
  { id:'USB-03',   iface:'USB 3.2',      sensor:'ETD Sensor',        cat:'alarm',    proto:'USB/RS-232',    status:'ok',   rate:0.1,   rateUnit:'kB/s',  period:'on event',    color:'#EF9F27' },
  { id:'USB-04',   iface:'USB 3.2',      sensor:'—',                 cat:'—',        proto:'—',             status:'free', rate:0,     rateUnit:'',      period:'—',           color:'#555' },
  { id:'RS-01',    iface:'RS-485',        sensor:'Seismic Geophone', cat:'sub',      proto:'Modbus RTU',    status:'ok',   rate:25,    rateUnit:'kB/s',  period:'500 Hz',      color:'#E24B4A' },
  { id:'RS-02',    iface:'RS-485',        sensor:'Seismic Geophone', cat:'sub',      proto:'Modbus RTU',    status:'ok',   rate:25,    rateUnit:'kB/s',  period:'500 Hz',      color:'#E24B4A' },
  { id:'RS-03',    iface:'RS-485',        sensor:'Vibration Sensor', cat:'analogue', proto:'Modbus RTU',    status:'ok',   rate:12,    rateUnit:'kB/s',  period:'1 kHz',       color:'#7F77DD' },
  { id:'RS-04',    iface:'RS-485',        sensor:'MAD Sensor',       cat:'analogue', proto:'RS-485',        status:'ok',   rate:5,     rateUnit:'kB/s',  period:'50 Hz',       color:'#7F77DD' },
  { id:'RS-05',    iface:'RS-485',        sensor:'Microwave Barrier',cat:'alarm',    proto:'RS-485',        status:'ok',   rate:0.5,   rateUnit:'kB/s',  period:'on alarm',    color:'#EF9F27' },
  { id:'RS-06',    iface:'RS-485',        sensor:'PIR Sensor',       cat:'alarm',    proto:'Relay+RS-485',  status:'warn', rate:0.1,   rateUnit:'kB/s',  period:'on alarm',    color:'#EF9F27' },
  { id:'RS-07',    iface:'RS-485',        sensor:'—',                cat:'—',        proto:'—',             status:'free', rate:0,     rateUnit:'',      period:'—',           color:'#555' },
  { id:'RS-08',    iface:'RS-485',        sensor:'—',                cat:'—',        proto:'—',             status:'free', rate:0,     rateUnit:'',      period:'—',           color:'#555' },
  { id:'CAN-01',   iface:'CAN Bus',       sensor:'FMCW Radar',       cat:'radar',    proto:'CAN 2.0B',      status:'warn', rate:800,   rateUnit:'kB/s',  period:'30 fps',      color:'#1D9E75' },
  { id:'CAN-02',   iface:'CAN Bus',       sensor:'MAD Sensor',       cat:'analogue', proto:'CAN Bus',       status:'ok',   rate:3,     rateUnit:'kB/s',  period:'100 Hz',      color:'#7F77DD' },
  { id:'PCIe-01',  iface:'PCIe Gen4',     sensor:'mmWave Radar',     cat:'radar',    proto:'PCIe×4',        status:'ok',   rate:1200,  rateUnit:'MB/s',  period:'30 fps',      color:'#1D9E75' },
  { id:'ELAN-01',  iface:'Ethernet LAN',  sensor:'AI Camera',        cat:'video',    proto:'ONVIF/MQTT',    status:'ok',   rate:14,    rateUnit:'Mbps',  period:'20 fps',      color:'#378ADD' },
  { id:'ELAN-02',  iface:'Ethernet LAN',  sensor:'GMTI Radar',       cat:'radar',    proto:'STANAG 4607',   status:'ok',   rate:4,     rateUnit:'Mbps',  period:'1 Hz',        color:'#1D9E75' },
  { id:'ANA-01',   iface:'Analogue In',   sensor:'Acoustic Array',   cat:'sub',      proto:'ADC 16-bit',    status:'ok',   rate:2,     rateUnit:'MB/s',  period:'48 kHz',      color:'#E24B4A' },
  { id:'ANA-02',   iface:'Analogue In',   sensor:'Acoustic Array',   cat:'sub',      proto:'ADC 16-bit',    status:'ok',   rate:2,     rateUnit:'MB/s',  period:'48 kHz',      color:'#E24B4A' },
  { id:'REL-01',   iface:'Relay I/O',     sensor:'Microwave Barrier',cat:'alarm',    proto:'Dry contact',   status:'ok',   rate:0,     rateUnit:'',      period:'on alarm',    color:'#EF9F27' },
  { id:'REL-02',   iface:'Relay I/O',     sensor:'Metal Detector',   cat:'alarm',    proto:'Dry contact',   status:'ok',   rate:0,     rateUnit:'',      period:'on alarm',    color:'#EF9F27' },
  { id:'REL-03',   iface:'Relay I/O',     sensor:'PIR Sensor',       cat:'alarm',    proto:'Dry contact',   status:'ok',   rate:0,     rateUnit:'',      period:'on alarm',    color:'#EF9F27' },
]

const NODE_DETAILS: Record<string, { title: string; body: string }> = {
  'SC-01': { title: 'SC-01 — BOP Alpha', body: 'Connected sensors: PTZ, Thermal, EOTS, LiDAR, GPR, Seismic ×2, ETD, AI Camera. Total data rate: 190 MB/s. Uptime: 99.7%. Last sync: 2s ago. AMD Versal AI Edge VE2802 @ 42°C. All ports nominal.' },
  'SC-02': { title: 'SC-02 — BOP Bravo', body: 'Connected sensors: FMCW Radar, mmWave, MAD×2, Acoustic×2, PIR, Microwave Barrier. Total: 52 MB/s. ⚠ FMCW Radar degraded — CAN bus jitter detected. PIR Sensor intermittent. Temperature: 51°C — check cooling.' },
  'SC-03': { title: 'SC-03 — COB Command', body: 'Aggregation node. Ingests fused data from SC-01 and SC-02. Runs JPDA track fusion, anomaly scoring, STANAG 4607 formatting. Uplinks to CIBMS via LTE primary + SATCOM standby. All systems nominal.' },
  'A': { title: 'Cluster A — BOP Alpha perimeter (north)', body: 'Sensors: PTZ Camera (GE-01), Thermal Imager (GE-02), Seismic Geophone ×3 (RS-01,02,03). All feeding SC-01. Seismic array detects underground movement at 50–100m range. Thermal+PTZ provide DRI coverage to 3 km.' },
  'B': { title: 'Cluster B — GMTI + LiDAR post', body: 'GMTI Radar feeds SC-01 via ETH-02 (STANAG 4607). LiDAR ×2 on USB-01 generating 300K pts/sec each. Tracks 100+ simultaneous targets at 3–15 km range. GMTI scan rate: 1 Hz dwell.' },
  'C': { title: 'Cluster C — Subsurface detection zone', body: 'GPR on USB-02 (tunnel detection to 30m depth). Fibre DAS on ETH-03 (50 km optical sensing, 1–10m spatial resolution, GB/s raw → compressed). MAD on RS-04 detecting metallic objects in nanoTesla resolution.' },
  'D': { title: 'Cluster D — Acoustic & alarm perimeter', body: 'Acoustic array ×4 on ANA-01/02 (MFCC spectrogram, 48 kHz sampling). PIR on REL-03 + Microwave Barrier on REL-01 (bistatic, 50–500m). On-alarm data burst triggered automatically.' },
  'E': { title: 'Cluster E — Active alert ⚠', body: 'AI Camera (ETH-01) flagged anomaly event 3m 42s ago. Person-class confidence 94%. ETD sensor (USB-03) co-located — no explosive signature detected. Alert level: AMBER. Track ID: T-0042, velocity 1.2 m/s bearing 042°.' },
}


// ── Small sub-components ──────────────────────────────────────────────────────

function IfaceBadge({ iface }: { iface: IfaceType }) {
  const color = IFACE_COLOR[iface]
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', padding: '1px 5px', borderRadius: 3, background: `${color}22`, border: `1px solid ${color}55`, color, fontFamily: 'monospace' }}>
      {iface}
    </span>
  )
}

function StatusPill({ live }: { live: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: live ? 'var(--sensor-acoustic)' : 'var(--text-secondary)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: live ? 'var(--sensor-acoustic)' : '#475569', boxShadow: live ? '0 0 6px var(--sensor-acoustic)' : 'none', flexShrink: 0, animation: live ? 'sensiPulse 2s ease-in-out infinite' : 'none' }} />
      {live ? 'LIVE' : 'NO SIG'}
    </span>
  )
}

function StatusChip({ status }: { status: PortStatus }) {
  const map: Record<PortStatus, { label: string; bg: string; color: string; dot: string }> = {
    ok:   { label: 'Active',   bg: 'rgba(16,185,129,0.12)', color: 'var(--sensor-acoustic)', dot: 'var(--sensor-acoustic)' },
    warn: { label: 'Degraded', bg: 'rgba(234,179,8,0.12)',  color: 'var(--alert-medium)',    dot: 'var(--alert-medium)' },
    free: { label: 'Free',     bg: 'var(--bg-tertiary)',    color: 'var(--text-secondary)',  dot: '#475569' },
  }
  const s = map[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

// ── ConnectorDot ─────────────────────────────────────────────────────────────

function ConnectorDot({ port, live, family, iface, selected, onClick }: { port: SensiPort; live: boolean; family: SensorFamily; iface: IfaceType; selected: boolean; onClick: () => void }) {
  const fc = getSensorFamilyColor(family)
  const ic = IFACE_COLOR[iface]
  const shape = IFACE_SHAPE[iface]
  const isCircle = shape === 'circle'

  return (
    <button onClick={onClick} title={`${port.port} · ${port.label} · ${live ? 'LIVE' : 'NO SIG'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
      <div style={{ width: isCircle ? 22 : 26, height: isCircle ? 22 : shape === 'usb' ? 14 : 20, borderRadius: isCircle ? '50%' : shape === 'usb' ? 3 : 4, background: selected ? `linear-gradient(135deg, ${ic}cc, ${ic}88)` : 'linear-gradient(135deg, #1a2535, #0f1a27)', border: `2px solid ${selected ? ic : '#2a3d52'}`, boxShadow: live ? `0 0 8px ${fc}88, inset 0 1px 0 rgba(255,255,255,0.08)` : 'inset 0 1px 0 rgba(255,255,255,0.04)', position: 'relative', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isCircle && <div style={{ width: 8, height: 8, borderRadius: '50%', background: live ? fc : '#1e2d3d', border: `1px solid ${live ? fc : '#2a3a4a'}`, boxShadow: live ? `0 0 4px ${fc}` : 'none' }} />}
        {!isCircle && shape === 'rect' && <div style={{ width: 12, height: 4, borderRadius: 1, background: live ? `${ic}88` : '#1e2d3d', border: `1px solid ${live ? ic : '#2a3a4a'}` }} />}
        <div style={{ position: 'absolute', top: -3, right: -3, width: 6, height: 6, borderRadius: '50%', background: live ? 'var(--sensor-acoustic)' : '#475569', border: '1px solid var(--bg-primary)', boxShadow: live ? '0 0 5px var(--sensor-acoustic)' : 'none' }} />
      </div>
      <span style={{ fontSize: 8, color: selected ? ic : 'var(--text-secondary)', letterSpacing: '0.03em', fontFamily: 'monospace', whiteSpace: 'nowrap', transition: 'color 0.15s ease' }}>{port.label}</span>
    </button>
  )
}

// ── SensiConnect 3D device ────────────────────────────────────────────────────

function SensiConnect3D({ ports, liveSet, selectedPort, onSelect }: { ports: SensiPort[]; liveSet: Set<string>; selectedPort: string | null; onSelect: (p: string) => void }) {
  const byFace = (face: FaceId) => ports.filter(p => p.face === face).sort((a, b) => a.col - b.col)
  const rowStyle = (accent: string): React.CSSProperties => ({ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '6px 10px', borderBottom: `1px solid ${accent}33`, background: `linear-gradient(90deg, ${accent}08 0%, transparent 100%)` })
  const rowLabel = (text: string, color: string) => (
    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, writingMode: 'vertical-lr', transform: 'rotate(180deg)', padding: '0 2px', borderRight: `2px solid ${color}44`, marginRight: 4, minWidth: 14, textAlign: 'center' }}>{text}</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ perspective: '900px', perspectiveOrigin: '50% 30%' }}>
        <div style={{ position: 'relative', transformStyle: 'preserve-3d', transform: 'rotateX(18deg) rotateY(-10deg)', width: 580 }}>
          {/* Top face */}
          <div style={{ width: '100%', height: 52, background: 'linear-gradient(90deg, #1a2840 0%, #0f1e2e 60%, #162436 100%)', border: '1px solid #253a50', borderBottom: 'none', borderRadius: '8px 8px 0 0', transformOrigin: 'bottom center', transform: 'rotateX(50deg) translateY(-2px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', boxShadow: '0 -4px 16px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1e3a5f, #0f2035)', border: '1px solid #2a4a6a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📡</div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#60a5fa' }}>SENSICONNECT</div>
                <div style={{ fontSize: 7, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>EDGE NODE · REV 3.2</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {['PWR', 'NET', 'AI'].map((l, i) => (
                <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#22c55e' : i === 1 ? '#60a5fa' : '#a855f7', boxShadow: `0 0 6px ${i === 0 ? '#22c55e' : i === 1 ? '#60a5fa' : '#a855f7'}`, animation: `sensiPulse ${1.5 + i * 0.4}s ease-in-out infinite` }} />
                  <span style={{ fontSize: 6, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Front face */}
          <div style={{ width: '100%', background: 'linear-gradient(180deg, #131f2e 0%, #0d1824 100%)', border: '1px solid #1e3047', borderTop: '1px solid #2a4060', borderRadius: '0 0 6px 6px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
            <div style={rowStyle('#2563EB')}>{rowLabel('ETH','#2563EB')}{byFace('top').map(p=><ConnectorDot key={p.port} port={p} live={liveSet.has(p.sensorId)} family={p.family} iface={p.iface} selected={selectedPort===p.port} onClick={()=>onSelect(p.port)}/>)}<div style={{marginLeft:'auto',fontSize:8,color:'#2563EB88',fontFamily:'monospace'}}>PoE+ · 1Gbps</div></div>
            <div style={rowStyle('#9333EA')}>{rowLabel('RF','#9333EA')}{byFace('mid').map(p=><ConnectorDot key={p.port} port={p} live={liveSet.has(p.sensorId)} family={p.family} iface={p.iface} selected={selectedPort===p.port} onClick={()=>onSelect(p.port)}/>)}<div style={{marginLeft:'auto',fontSize:8,color:'#9333EA88',fontFamily:'monospace'}}>SMA · 50Ω</div></div>
            <div style={rowStyle('#D97706')}>{rowLabel('SER','#D97706')}{byFace('bot').map(p=><ConnectorDot key={p.port} port={p} live={liveSet.has(p.sensorId)} family={p.family} iface={p.iface} selected={selectedPort===p.port} onClick={()=>onSelect(p.port)}/>)}<div style={{marginLeft:'auto',fontSize:8,color:'#D9770688',fontFamily:'monospace'}}>RS-485 · 4Mbps</div></div>
            <div style={rowStyle('#059669')}>{rowLabel('I/O','#059669')}{byFace('rear').map(p=><ConnectorDot key={p.port} port={p} live={liveSet.has(p.sensorId)} family={p.family} iface={p.iface} selected={selectedPort===p.port} onClick={()=>onSelect(p.port)}/>)}<div style={{marginLeft:'auto',fontSize:8,color:'#05966988',fontFamily:'monospace'}}>GPIO / USB3</div></div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 14px', background:'#080f18', borderTop:'1px solid #1a2a3a' }}>
              {['24V DC · 60W','ARM Cortex-A78AE','16GB LPDDR5','4G/LTE · WiFi6 · BT5'].map(s=><span key={s} style={{fontSize:7,color:'#334155',letterSpacing:'0.05em',fontFamily:'monospace'}}>{s}</span>)}
            </div>
          </div>
          {/* Right depth face */}
          <div style={{ position:'absolute', top:52, right:0, width:22, height:'calc(100% - 52px)', background:'linear-gradient(90deg, #0a131e, #060e17)', border:'1px solid #1a2a3a', borderLeft:'none', borderRadius:'0 0 6px 0', transformOrigin:'left center', transform:'rotateY(90deg) translateX(11px)' }} />
        </div>
      </div>
    </div>
  )
}

// ── Pin table ─────────────────────────────────────────────────────────────────

function PinTable({ ports, liveSet, selectedPort, onSelect }: { ports: SensiPort[]; liveSet: Set<string>; selectedPort: string | null; onSelect: (p: string) => void }) {
  const FACE_LABEL: Record<FaceId, string> = { top:'Ethernet (PoE+)', mid:'RF / SMA', bot:'Serial (RS-485)', rear:'GPIO / USB3' }
  return (
    <div style={{ minWidth: 480 }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, tableLayout:'fixed' }}>
        <colgroup><col style={{width:80}}/><col style={{width:70}}/><col style={{width:130}}/><col style={{width:90}}/><col style={{width:80}}/><col style={{width:70}}/><col/></colgroup>
        <thead>
          <tr style={{ position:'sticky', top:0, zIndex:2, background:'var(--bg-secondary)', borderBottom:'1px solid var(--border-color)' }}>
            {['Port','Iface','Sensor ID','Modality','Family','Status','Signal'].map(h=>(
              <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-secondary)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(['top','mid','bot','rear'] as FaceId[]).map(face=>{
            const rows = ports.filter(p=>p.face===face).sort((a,b)=>a.col-b.col)
            return (
              <>
                <tr key={`hdr-${face}`}><td colSpan={7} style={{ padding:'4px 10px', background:'var(--bg-tertiary)', fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-secondary)', borderTop:'1px solid var(--border-color)' }}>{FACE_LABEL[face]}</td></tr>
                {rows.map(p=>{
                  const live=liveSet.has(p.sensorId); const fc=getSensorFamilyColor(p.family); const ic=IFACE_COLOR[p.iface]; const isSel=selectedPort===p.port
                  return (
                    <tr key={p.port} onClick={()=>onSelect(p.port)} style={{ cursor:'pointer', background:isSel?`${ic}12`:'transparent', borderLeft:isSel?`2px solid ${ic}`:'2px solid transparent', transition:'background 0.12s' }}>
                      <td style={{padding:'5px 10px'}}><span style={{fontFamily:'monospace',fontSize:11,color:ic,fontWeight:600}}>{p.port}</span></td>
                      <td style={{padding:'5px 10px'}}><IfaceBadge iface={p.iface}/></td>
                      <td style={{padding:'5px 10px'}}><span style={{fontFamily:'monospace',fontSize:10,color:'var(--text-primary)'}}>{p.sensorId}</span></td>
                      <td style={{padding:'5px 10px'}}><span style={{fontSize:10,color:'var(--text-secondary)',letterSpacing:'0.04em'}}>{p.modality}</span></td>
                      <td style={{padding:'5px 10px'}}><span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:fc,flexShrink:0,boxShadow:live?`0 0 4px ${fc}`:'none'}}/><span style={{fontSize:10,color:fc}}>{p.family}</span></span></td>
                      <td style={{padding:'5px 10px'}}><StatusPill live={live}/></td>
                      <td style={{padding:'5px 10px'}}><div style={{width:'100%',height:4,background:'var(--bg-tertiary)',borderRadius:2,overflow:'hidden'}}><div style={{width:live?`${60+Math.random()*40}%`:'0%',height:'100%',background:live?fc:'transparent',borderRadius:2,transition:'width 0.6s ease'}}/></div></td>
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

// ── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ ports, liveSet, selectedPort, onSelect, unit }: {
  ports: SensiPort[]; liveSet: Set<string>; selectedPort: string | null; onSelect: (p: string) => void
  unit: typeof UNITS[0]
}) {
  const isMobile = useIsMobile()
  const liveCount = ports.filter(p => liveSet.has(p.sensorId)).length
  const selectedDef = ports.find(p => p.port === selectedPort)

  const METRICS = [
    { val: `${liveCount}/20`, label: 'Sensors connected' },
    { val: '3',               label: 'SensiConnect nodes' },
    { val: '247 MB/s',        label: 'Aggregate data rate' },
    { val: '99.3%',           label: 'Port uptime (24h)' },
  ]

  const IFACE_UTIL = [
    { label: 'GigE Vision ×4',   used: 3, total: 4,  color: '#378ADD' },
    { label: 'USB 3.2 ×4',       used: 3, total: 4,  color: '#1D9E75' },
    { label: 'RS-485 ×8',        used: 6, total: 8,  color: '#E24B4A' },
    { label: 'Relay I/O ×16',    used: 9, total: 16, color: '#EF9F27' },
    { label: 'Analogue In ×8',   used: 4, total: 8,  color: '#7F77DD' },
    { label: 'Ethernet LAN ×4',  used: 2, total: 4,  color: '#185FA5' },
  ]

  const COMMS = [
    { label: 'LTE — 45 Mbps',    ok: true  },
    { label: 'LoRa — mesh active',ok: true  },
    { label: 'SATCOM — standby',  ok: false },
    { label: 'VHF — signal low',  ok: false },
  ]

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: isMobile ? '10px' : '16px' }}>
      {/* Metrics strip */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {METRICS.map((m, i) => {
          const accentColors = ['var(--sensor-acoustic)', 'var(--accent-blue)', 'var(--sensor-radar)', 'var(--accent-teal)']
          const color = accentColors[i] || 'var(--accent-blue)'
          return (
            <div key={m.label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '14px 16px', border: '1px solid var(--panel-border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.7 }} />
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color, fontFamily: 'monospace', lineHeight: 1 }}>{m.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 5, fontWeight: 500, letterSpacing: '0.04em' }}>{m.label}</div>
            </div>
          )
        })}
      </div>

      {/* 3D device + right panel */}
      <div style={{ display: 'flex', gap: 16, flexWrap: isMobile ? 'wrap' : 'nowrap', alignItems: 'flex-start', marginBottom: 16 }}>
        {/* 3D device card */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden', flexShrink: 0, minWidth: isMobile ? '100%' : 400, width: isMobile ? '100%' : 'auto' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--panel-header-bg)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{unit.id} — {unit.siteId}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, padding: '2px 9px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: 'var(--sensor-acoustic)', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sensor-acoustic)', animation: 'sensiPulse 2s ease-in-out infinite' }} />
              Online
            </span>
          </div>
          <div style={{ padding: '16px', overflowX: 'auto' }}>
            <SensiConnect3D ports={ports} liveSet={liveSet} selectedPort={selectedPort} onSelect={onSelect} />
          </div>
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[['Model','SC-EDN-2025A'],['Processor',unit.cpu],['Node ID',`${unit.id} / ${unit.siteId}`],['Temp',unit.temp]].map(([k,v])=>(
              <div key={k} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{k}: <span style={{ color: 'var(--text-primary)' }}>{v}</span></div>
            ))}
          </div>
        </div>

        {/* Right: utilisation + comms */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Selected port detail */}
          {selectedDef && (
            <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${IFACE_COLOR[selectedDef.iface]}55`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase' }}>Port Detail</div>
              {[['Port',selectedDef.port],['Sensor',selectedDef.sensorId],['Label',selectedDef.label],['Modality',selectedDef.modality],['Family',selectedDef.family],['Interface',selectedDef.iface]].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'1px solid var(--bg-tertiary)' }}>
                  <span style={{ fontSize:10, color:'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:600, color:'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Status</span>
                <StatusPill live={liveSet.has(selectedDef.sensorId)} />
              </div>
              <div style={{ marginTop: 8, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: liveSet.has(selectedDef.sensorId) ? '78%' : '0%', height: '100%', background: getSensorFamilyColor(selectedDef.family), borderRadius: 3 }} />
              </div>
            </div>
          )}

          {/* Interface utilisation */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Interface utilisation</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
              {IFACE_UTIL.map(u => (
                <div key={u.label}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 5 }}>{u.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(u.used/u.total)*100}%`, height: '100%', background: u.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', minWidth: 40, textAlign: 'right' }}>{u.used}/{u.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active comms links */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Active comms links</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COMMS.map(c => (
                <span key={c.label} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: c.ok ? 'rgba(16,185,129,0.12)' : 'rgba(234,179,8,0.12)', color: c.ok ? 'var(--sensor-acoustic)' : 'var(--alert-medium)' }}>{c.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Port Configuration tab ────────────────────────────────────────────────────

function PortConfigTab({ onEditPort }: { onEditPort: (idx: number) => void }) {
  const [filter, setFilter] = useState<'all'|'active'|'free'|'warn'>('all')
  const isMobile = useIsMobile()

  const filtered = PORT_DEFS.filter(p =>
    filter === 'all'    ? true :
    filter === 'active' ? p.status === 'ok' :
    filter === 'free'   ? p.status === 'free' :
    p.status === 'warn'
  )

  const SENSOR_ABBR: Record<string, string> = {
    'PTZ Camera':'PTZ','Thermal Imager':'THR','EOTS':'EO','AI Camera':'AIC','NIR Camera':'NIR',
    'GMTI Radar':'GMR','LiDAR':'LDR','mmWave Radar':'MMW','FMCW Radar':'FCW','GPR Sensor':'GPR',
    'Seismic Geophone':'SES','Fibre DAS':'DAS','Vibration Sensor':'VIB','MAD Sensor':'MAD',
    'Acoustic Array':'ACO','Microwave Barrier':'MWB','PIR Sensor':'PIR','Metal Detector':'MTL',
    'ETD Sensor':'ETD','EMI Sensor':'EMI',
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: isMobile ? '8px' : '16px' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Node:</span>
        <select style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
          <option>SC-001 — BOP Alpha</option>
          <option>SC-002 — BOP Bravo</option>
          <option>SC-003 — COB Command</option>
        </select>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(['all','active','free','warn'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: '1px solid var(--border-color)', background: filter === f ? 'rgba(59,130,246,0.2)' : 'transparent', color: filter === f ? 'var(--accent-blue)' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
              {f === 'all' ? 'All ports' : f === 'active' ? 'Active' : f === 'free' ? 'Free' : 'Degraded'}
            </button>
          ))}
        </div>
      </div>

      {/* Port table */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                {['Port ID','Interface','Sensor','Category','Protocol','Status','Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const abbr = SENSOR_ABBR[p.sensor] ?? '?'
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.12s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-tertiary)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.12)', padding: '2px 7px', borderRadius: 4 }}>{p.id}</span>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.iface}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {p.sensor !== '—'
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 20, height: 20, borderRadius: 4, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{abbr}</div>
                            <span style={{ fontSize: 12 }}>{p.sensor}</span>
                          </div>
                        : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-secondary)' }}>{p.cat}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.proto}</td>
                    <td style={{ padding: '8px 12px' }}><StatusChip status={p.status} /></td>
                    <td style={{ padding: '8px 12px' }}>
                      {p.status !== 'free' && (
                        <button onClick={() => onEditPort(PORT_DEFS.indexOf(p))} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Config
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Data & Periodicity tab ────────────────────────────────────────────────────

function DataFlowTab({ onEditPort }: { onEditPort: (idx: number) => void }) {
  const isMobile = useIsMobile()
  const active = PORT_DEFS.filter(p => p.status !== 'free')
  const maxRate = Math.max(...active.map(p => p.rate))

  const DATA_TYPES: Record<string, string> = {
    video:'Video stream (H.265)', radar:'Point cloud / range-doppler',
    sub:'Waveform / B-scan', alarm:'Event / relay', analogue:'ADC samples', '—':'data',
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: isMobile ? '8px' : '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 16, alignItems: 'start' }}>
        {/* Periodicity table */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Sensor data transfer &amp; periodicity — Node SC-001</div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: 460, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 2 }}>
                    {['Sensor','Data type','Rate / bandwidth','Flow','Periodicity','Edit'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-secondary)', whiteSpace:'nowrap', borderBottom:'1px solid var(--border-color)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.map((p, i) => {
                    const barW = Math.max(4, Math.min(100, (p.rate / maxRate) * 100))
                    const dur = (1 + (i % 3) * 0.3).toFixed(1)
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-tertiary)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <td style={{ padding: '7px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 20, height: 20, borderRadius: 4, background: p.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff', flexShrink:0 }}>
                              {p.sensor.split(' ').map(w=>w[0]).join('').slice(0,3)}
                            </div>
                            <div>
                              <div style={{ fontSize: 12 }}>{p.sensor}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{p.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'7px 12px', fontSize:11, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{DATA_TYPES[p.cat] ?? 'data'}</td>
                        <td style={{ padding:'7px 12px', minWidth:120 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1, height:4, background:'var(--bg-tertiary)', borderRadius:2, overflow:'hidden', minWidth:60 }}>
                              <div style={{ width:`${barW}%`, height:'100%', background:p.color, borderRadius:2 }}/>
                            </div>
                            <span style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-secondary)', minWidth:60, textAlign:'right' }}>{p.rate} {p.rateUnit}</span>
                          </div>
                        </td>
                        <td style={{ padding:'7px 12px' }}>
                          <svg viewBox="0 0 60 20" width={60} height={20}>
                            <line x1="0" y1="10" x2="55" y2="10" stroke={p.color} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7">
                              <animate attributeName="stroke-dashoffset" from="0" to="-16" dur={`${dur}s`} repeatCount="indefinite"/>
                            </line>
                            <polygon points="50,6 60,10 50,14" fill={p.color} opacity="0.8"/>
                          </svg>
                        </td>
                        <td style={{ padding:'7px 12px' }}>
                          <span onClick={() => onEditPort(PORT_DEFS.indexOf(p))} style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-primary)', background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:4, padding:'2px 8px', cursor:'pointer' }}>{p.period}</span>
                        </td>
                        <td style={{ padding:'7px 12px' }}>
                          <span onClick={() => onEditPort(PORT_DEFS.indexOf(p))} style={{ fontSize:10, color:'var(--text-secondary)', cursor:'pointer', padding:'2px 5px', borderRadius:3, border:'1px solid transparent' }}>✎ edit</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pipeline SVG */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Aggregate pipeline throughput</div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 14 }}>
            <svg viewBox="0 0 340 480" width="100%">
              <defs>
                <marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </marker>
              </defs>
              {/* Sensor group boxes */}
              {[
                { y:10,  stroke:'#185FA5', fill:'#0C447C', text:'Video sensors',    color:'#378ADD' },
                { y:46,  stroke:'#1D9E75', fill:'#085041', text:'Radar / LiDAR',   color:'#1D9E75' },
                { y:82,  stroke:'#E24B4A', fill:'#442010', text:'RS-485 sensors',  color:'#E24B4A' },
                { y:118, stroke:'#EF9F27', fill:'#3B3400', text:'Subsurface',       color:'#EF9F27' },
                { y:154, stroke:'#7F77DD', fill:'#2a1a40', text:'Analogue sensors', color:'#7F77DD' },
                { y:190, stroke:'#639922', fill:'#0a1a0a', text:'Alarm/trigger',    color:'#639922' },
              ].map((g, i) => (
                <g key={g.text}>
                  <rect x="10" y={g.y} width="100" height="26" rx="5" fill={g.fill} opacity="0.2" stroke={g.stroke} strokeWidth="0.5"/>
                  <text x="60" y={g.y+17} textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill={g.color} fontWeight="500">{g.text}</text>
                  <line x1="110" y1={g.y+13} x2="155" y2={105+i*3} stroke={g.color} strokeWidth={[2.5,2.5,1,1,0.8,0.5][i]} opacity="0.6" strokeDasharray="5 3" markerEnd="url(#arr2)">
                    <animate attributeName="stroke-dashoffset" from="0" to="-40" dur={`${1.2+i*0.3}s`} repeatCount="indefinite"/>
                  </line>
                </g>
              ))}
              {/* Ingestion box */}
              <rect x="155" y="90" width="80" height="50" rx="8" fill="#1a2030" stroke="#2a3a50" strokeWidth="0.5"/>
              <text x="195" y="111" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#5a9ad0" fontWeight="500">Ingestion</text>
              <text x="195" y="128" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill="#3a6080">Manager</text>
              {/* Arrow to processing */}
              <line x1="195" y1="140" x2="195" y2="175" stroke="#4a6a8a" strokeWidth="1.5" markerEnd="url(#arr2)">
                <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite"/>
              </line>
              <text x="220" y="160" fontFamily="sans-serif" fontSize="9" fill="#4a6a8a">247 MB/s</text>
              {/* AI/ML Engine */}
              <rect x="145" y="175" width="100" height="40" rx="8" fill="#1a2a1a" stroke="#1D9E75" strokeWidth="0.5" opacity="0.8"/>
              <text x="195" y="191" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#1D9E75" fontWeight="500">AI/ML Engine</text>
              <text x="195" y="205" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill="#0F6E56">AMD ROCm + MIGraphX</text>
              {/* Arrow to storage + comms */}
              <line x1="195" y1="215" x2="195" y2="248" stroke="#1D9E75" strokeWidth="1.5" markerEnd="url(#arr2)"/>
              <line x1="245" y1="195" x2="295" y2="195" stroke="#1D9E75" strokeWidth="1" markerEnd="url(#arr2)" strokeDasharray="4 3"/>
              <text x="270" y="188" fontFamily="sans-serif" fontSize="9" fill="#3a6a3a">Events</text>
              {/* COMMS */}
              <rect x="255" y="175" width="75" height="40" rx="8" fill="#0a1820" stroke="#185FA5" strokeWidth="0.5" opacity="0.8"/>
              <text x="292" y="191" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#378ADD" fontWeight="500">COMMS</text>
              <text x="292" y="205" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill="#2a5a80">LTE/LoRa</text>
              {/* Edge Storage */}
              <rect x="145" y="248" width="100" height="40" rx="8" fill="#201a10" stroke="#EF9F27" strokeWidth="0.5" opacity="0.8"/>
              <text x="195" y="264" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#EF9F27" fontWeight="500">Edge Storage</text>
              <text x="195" y="278" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill="#8a6010">2 TB NVMe</text>
              {/* Bandwidth breakdown */}
              <rect x="10" y="310" width="320" height="160" rx="8" fill="#0a0a0a" opacity="0.4" stroke="#222" strokeWidth="0.5"/>
              <text x="170" y="330" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#666" fontWeight="500">Bandwidth breakdown</text>
              {[
                { y:340, w:140, fill:'#185FA5', color:'#378ADD', text:'Video — 190 MB/s (77%)' },
                { y:356, w:36,  fill:'#1D9E75', color:'#1D9E75', text:'Radar/LiDAR — 44 MB/s (18%)' },
                { y:372, w:8,   fill:'#E24B4A', color:'#E24B4A', text:'RS-485 — 8 MB/s (3%)' },
                { y:388, w:5,   fill:'#EF9F27', color:'#EF9F27', text:'Subsurface — 4 MB/s (1.5%)' },
                { y:404, w:2,   fill:'#7F77DD', color:'#7F77DD', text:'Analogue/other — 1 MB/s (<1%)' },
              ].map(b => (
                <g key={b.text}>
                  <rect x="20" y={b.y} width={b.w} height="8" rx="2" fill={b.fill} opacity="0.6"/>
                  <text x="168" y={b.y+8} fontFamily="monospace" fontSize="9" fill={b.color}>{b.text}</text>
                </g>
              ))}
              <text x="170" y="455" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#aaa" fontWeight="500">Total: 247 MB/s  ·  2.1 TB/day</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Deployment Topology tab ───────────────────────────────────────────────────

function DeploymentTab() {
  const [nodeDetail, setNodeDetail] = useState<{ title: string; body: string } | null>(null)
  const isMobile = useIsMobile()

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: isMobile ? '8px' : '16px' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Legend header */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Full deployment — border sector topology</span>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['#1D9E75','SensiConnect node'],['#378ADD','Comms link'],['#EF9F27','Sensor cluster'],['#E24B4A','Alert']].map(([c,l])=>(
              <span key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-secondary)' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:c, flexShrink:0 }}/>
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Topology SVG */}
        <div style={{ padding: 12, overflowX: 'auto' }}>
          <svg viewBox="0 0 680 560" width="100%" style={{ minWidth: 560 }}>
            <defs>
              <marker id="arr3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>

            {/* Zone backgrounds */}
            <rect x="20" y="20"  width="640" height="90"  rx="8" fill="#1a1008" opacity="0.4"/>
            <text x="340" y="38"  textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#5a4020">BORDER PERIMETER — SENSOR LAYER</text>
            <rect x="20" y="130" width="640" height="200" rx="8" fill="#080e18" opacity="0.35"/>
            <text x="340" y="148" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#1a3a5a">EDGE COMPUTING — SENSICONNECT NODES</text>
            <rect x="20" y="350" width="640" height="90"  rx="8" fill="#0a100a" opacity="0.35"/>
            <text x="340" y="368" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#1a3a1a">COMMS BACKBONE</text>
            <rect x="20" y="460" width="640" height="80"  rx="8" fill="#080808" opacity="0.35"/>
            <text x="340" y="478" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#3a3a3a">COMMAND CENTRE — COB</text>

            {/* Sensor clusters */}
            {[
              { id:'A', x:30,  stroke:'#EF9F27', alert:false, lines:['PTZ+Thermal','Seismic×3'],  cx:116 },
              { id:'B', x:150, stroke:'#EF9F27', alert:false, lines:['GMTI Radar','LiDAR ×2'],   cx:236 },
              { id:'C', x:280, stroke:'#EF9F27', alert:false, lines:['GPR + MAD','Fibre DAS'],   cx:366 },
              { id:'D', x:400, stroke:'#EF9F27', alert:false, lines:['Acoustic ×4','PIR/Microwave'],cx:486 },
              { id:'E', x:550, stroke:'#E24B4A', alert:true,  lines:['AI Camera','ETD sensor'],  cx:636 },
            ].map(cl => (
              <g key={cl.id} style={{ cursor: 'pointer' }} onClick={() => setNodeDetail(NODE_DETAILS[cl.id])}>
                <rect x={cl.x} y="45" width="80" height="55" rx="6" fill="#1a0f00" stroke={cl.stroke} strokeWidth={cl.alert ? 1 : 0.8}/>
                <text x={cl.x+40} y="62" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill={cl.stroke} fontWeight="500">Cluster {cl.id}{cl.alert?' ⚠':''}</text>
                {cl.lines.map((l, i) => <text key={i} x={cl.x+40} y={74+i*12} textAnchor="middle" fontFamily="sans-serif" fontSize="8" fill={cl.alert?'#8a4040':'#8a6010'}>{l}</text>)}
                {cl.alert && <circle cx={cl.x+40} cy="58" r="5" fill="#E24B4A" opacity="0.3"><animate attributeName="r" values="5;10;5" dur="1.5s" repeatCount="indefinite"/></circle>}
              </g>
            ))}

            {/* Cluster → SC-01 lines */}
            <line x1="70"  y1="100" x2="130" y2="165" stroke="#EF9F27" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.6" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite"/></line>
            <line x1="190" y1="100" x2="165" y2="165" stroke="#EF9F27" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.6" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.2s" repeatCount="indefinite"/></line>
            <line x1="320" y1="100" x2="185" y2="165" stroke="#EF9F27" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.4s" repeatCount="indefinite"/></line>
            {/* Cluster → SC-02 lines */}
            <line x1="440" y1="100" x2="400" y2="165" stroke="#EF9F27" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.6" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.6s" repeatCount="indefinite"/></line>
            <line x1="590" y1="100" x2="445" y2="165" stroke="#E24B4A" strokeWidth="1"   strokeDasharray="4 3" opacity="0.7" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="0.8s" repeatCount="indefinite"/></line>

            {/* SC Node boxes */}
            {[
              { id:'SC-01', x:100, label:'SC-01', sub:'BOP Alpha',       info:'9 sensors · 190 MB/s', hw:'VE2802 · 42°C ✓', stroke:'#1D9E75', dot:'#1D9E75', dur:'2.5s' },
              { id:'SC-02', x:335, label:'SC-02', sub:'BOP Bravo',       info:'8 sensors · 52 MB/s',  hw:'VE2802 · 51°C !', stroke:'#1D9E75', dot:'#EF9F27', dur:'1.8s' },
              { id:'SC-03', x:555, label:'SC-03', sub:'COB Command',     info:'Aggregation node',     hw:'VE2802 · 38°C ✓', stroke:'#7F77DD', dot:'#7F77DD', dur:'3s' },
            ].map(n => (
              <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => setNodeDetail(NODE_DETAILS[n.id])}>
                <rect x={n.x} y="162" width="130" height="80" rx="8" fill="#060e1a" stroke={n.stroke} strokeWidth="1.5"/>
                <text x={n.x+65} y="177" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fill={n.stroke} fontWeight="600">{n.label}</text>
                <text x={n.x+65} y="192" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill={n.stroke} opacity="0.6">{n.sub}</text>
                <text x={n.x+65} y="207" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#2a5a3a">{n.info}</text>
                <text x={n.x+65} y="220" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#2a5a3a">{n.hw}</text>
                <circle cx={n.x+118} cy="170" r="4" fill={n.dot}><animate attributeName="opacity" values="1;0.2;1" dur={n.dur} repeatCount="indefinite"/></circle>
              </g>
            ))}

            {/* Node → comms backbone */}
            <line x1="165" y1="242" x2="165" y2="368" stroke="#378ADD" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1s" repeatCount="indefinite"/></line>
            <line x1="400" y1="242" x2="340" y2="368" stroke="#378ADD" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.2s" repeatCount="indefinite"/></line>
            <line x1="610" y1="242" x2="520" y2="368" stroke="#7F77DD" strokeWidth="1"   strokeDasharray="5 4" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.4s" repeatCount="indefinite"/></line>

            {/* Comms backbone nodes */}
            {[
              { x:80,  label:'LTE / 5G',   sub:'45 Mbps',    stroke:'#185FA5', color:'#378ADD' },
              { x:200, label:'LoRa Mesh',  sub:'50 kbps',    stroke:'#185FA5', color:'#378ADD' },
              { x:320, label:'VHF/UHF SDR',sub:'MANET',      stroke:'#185FA5', color:'#378ADD' },
              { x:450, label:'SATCOM',     sub:'Standby',    stroke:'#7F77DD', color:'#7F77DD' },
            ].map(c => (
              <g key={c.label}>
                <rect x={c.x} y="370" width="80" height="36" rx="6" fill="#0a1520" stroke={c.stroke} strokeWidth="0.8"/>
                <text x={c.x+40} y="385" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill={c.color} fontWeight="500">{c.label}</text>
                <text x={c.x+40} y="398" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fill={c.color} opacity="0.5">{c.sub}</text>
              </g>
            ))}

            {/* Comms → COB */}
            <line x1="120" y1="406" x2="240" y2="480" stroke="#378ADD" strokeWidth="1.5" opacity="0.7" strokeDasharray="5 4" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1s" repeatCount="indefinite"/></line>
            <line x1="360" y1="406" x2="305" y2="480" stroke="#378ADD" strokeWidth="1.5" opacity="0.7" strokeDasharray="5 4" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.3s" repeatCount="indefinite"/></line>
            <line x1="490" y1="406" x2="420" y2="480" stroke="#7F77DD" strokeWidth="1"   opacity="0.6" strokeDasharray="5 4" markerEnd="url(#arr3)"><animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.6s" repeatCount="indefinite"/></line>

            {/* COB command centre */}
            <rect x="180" y="475" width="280" height="55" rx="10" fill="#0a080a" stroke="#534AB7" strokeWidth="1.5"/>
            <text x="320" y="496" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fill="#7F77DD" fontWeight="600">COB Command Centre</text>
            <text x="320" y="512" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill="#3C3489">SIS Dashboard · CIBMS C2 · NATGRID uplink</text>
            <text x="320" y="524" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#26215C">AES-256  ·  STANAG 4607/4609  ·  PTP sync</text>

            <text x="28" y="548" fontFamily="sans-serif" fontSize="10" fill="#444">Click any node or cluster for details</text>
          </svg>
        </div>

        {/* Node/cluster detail */}
        {nodeDetail && (
          <div style={{ margin: '0 12px 12px', padding: 14, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{nodeDetail.title}</div>
              <button onClick={() => setNodeDetail(null)} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{nodeDetail.body}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Periodicity edit modal ────────────────────────────────────────────────────

function PeriodicityModal({ portIdx, onClose, onSave }: { portIdx: number; onClose: () => void; onSave: (idx: number, period: string) => void }) {
  const p = PORT_DEFS[portIdx]
  const [periodVal, setPeriodVal] = useState(10)
  const [burstVal, setBurstVal]   = useState(25)
  const [alertOverride, setAlertOverride] = useState(true)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 24, width: 380, maxWidth: '92vw', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Edit periodicity — {p.sensor}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 18 }}>Port: {p.id} · {p.iface}</div>

        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Sampling interval</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input type="range" min={1} max={60} value={periodVal} onChange={e=>setPeriodVal(+e.target.value)} style={{ flex: 1 }}/>
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', minWidth: 60 }}>{periodVal < 1 ? `${periodVal*1000}ms` : `${periodVal} s`}</span>
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Max burst rate</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input type="range" min={1} max={60} value={burstVal} onChange={e=>setBurstVal(+e.target.value)} style={{ flex: 1 }}/>
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', minWidth: 60 }}>{burstVal} fps</span>
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Alert-triggered rate override</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <input type="checkbox" checked={alertOverride} onChange={e=>setAlertOverride(e.target.checked)} style={{ width: 14, height: 14 }}/>
          <span style={{ fontSize: 12 }}>On alert → max rate until cleared</span>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 6, fontSize: 12, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { onSave(portIdx, `${periodVal}s interval`); onClose() }} style={{ padding: '7px 16px', borderRadius: 6, fontSize: 12, border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Apply changes</button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'ports' | 'dataflow' | 'deployment'

export function DeviceConfigPage() {
  const [activeTab,    setActiveTab]    = useState<TabId>('overview')
  const [activeUnit,   setActiveUnit]   = useState(0)
  const [selectedPort, setSelectedPort] = useState<string | null>(null)
  const [modalPortIdx, setModalPortIdx] = useState<number | null>(null)
  const [, setPortPeriods]  = useState<Record<number, string>>({})

  const sensors  = useSensorStore(s => s.sensors)
  const isMobile = useIsMobile()
  const unit     = UNITS[activeUnit]

  const liveSet = useMemo(() => {
    const s = new Set<string>()
    for (const [id, payload] of sensors.entries()) {
      if ((Date.now() - new Date((payload as { timestamp: string }).timestamp).getTime()) < 10_000)
        s.add(id)
    }
    return s
  }, [sensors])

  const liveCount = SC_PORTS.filter(p => liveSet.has(p.sensorId)).length

  function handleSelect(portId: string) {
    setSelectedPort(prev => prev === portId ? null : portId)
  }

  function handleSavePeriod(idx: number, period: string) {
    setPortPeriods(prev => ({ ...prev, [idx]: period }))
  }

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview',    label: 'Overview',          icon: '📊' },
    { id: 'ports',       label: 'Port Configuration', icon: '🔌' },
    { id: 'dataflow',    label: 'Data & Periodicity', icon: '📈' },
    { id: 'deployment',  label: 'Deployment Topology',icon: '🗂' },
  ]

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <style>{`
        @keyframes sensiPulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
      `}</style>

      {/* ── Top header bar ─────────────────────────────────────────── */}
      <div className="device-config-meta" style={{ display:'flex', alignItems:'center', gap: isMobile ? 8 : 12, flexWrap:'wrap', padding: isMobile ? '7px 10px' : '7px 14px', borderBottom:'1px solid var(--panel-border)', background:'var(--panel-header-bg)', flexShrink:0 }}>
        {/* Unit selector */}
        <div className="device-config-unit-tabs" style={{ display:'flex', gap:4 }}>
          {UNITS.map((u, i) => (
            <button key={u.id} onClick={() => { setActiveUnit(i); setSelectedPort(null) }}
              style={{ padding:'4px 12px', cursor:'pointer', borderRadius:5, fontSize:11, fontWeight:700, letterSpacing:'0.06em',
                background: activeUnit===i ? 'rgba(59,130,246,0.18)' : 'var(--bg-tertiary)',
                color: activeUnit===i ? 'var(--accent-blue)' : 'var(--text-secondary)',
                border: activeUnit===i ? '1px solid rgba(59,130,246,0.35)' : '1px solid var(--border-color)',
                transition:'all 0.12s' }}>
              {u.id}
            </button>
          ))}
        </div>
        {/* Meta info */}
        <div style={{ display:'flex', gap: isMobile ? 8 : 14, fontSize:11, color:'var(--text-secondary)', flexWrap:'wrap' }}>
          <span>Site: <strong style={{ color:'var(--text-primary)', fontFamily:'monospace', fontSize:10 }}>{unit.siteId}</strong></span>
          <span>BOP: <strong style={{ color:'var(--text-primary)', fontFamily:'monospace', fontSize:10 }}>{unit.bopId}</strong></span>
          {!isMobile && <>
            <span>Lat: <strong style={{ color:'var(--accent-teal)', fontFamily:'monospace', fontSize:10 }}>{unit.lat}</strong></span>
            <span>Lon: <strong style={{ color:'var(--accent-teal)', fontFamily:'monospace', fontSize:10 }}>{unit.lon}</strong></span>
          </>}
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:6, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)' }}>
          <span style={{ fontSize:10, color:'var(--text-secondary)' }}>Ports active</span>
          <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:13, color: liveCount > 0 ? 'var(--sensor-acoustic)' : 'var(--text-muted)' }}>
            {liveCount}<span style={{ fontWeight:400, color:'var(--text-muted)', fontSize:10 }}>/{SC_PORTS.length}</span>
          </span>
        </div>
      </div>

      {/* ── Tab nav bar ────────────────────────────────────────────── */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--panel-border)', background:'var(--bg-secondary)', flexShrink:0, overflowX:'auto', scrollbarWidth:'none' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: isMobile ? '9px 12px' : '11px 20px',
                border: 'none',
                background: isActive ? 'rgba(59,130,246,0.07)' : 'transparent',
                cursor: 'pointer',
                fontSize: isMobile ? 11 : 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                transition: 'color 0.15s, background 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                flexShrink: 0,
              }}>
              <span style={{ opacity: isActive ? 1 : 0.7 }}>{tab.icon}</span>
              {!isMobile && tab.label}
              {isMobile && tab.label.split(' ')[0]}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ────────────────────────────────────────────── */}
      <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {activeTab === 'overview' && (
          <OverviewTab ports={SC_PORTS} liveSet={liveSet} selectedPort={selectedPort} onSelect={handleSelect} unit={unit} />
        )}
        {activeTab === 'ports' && (
          <PortConfigTab onEditPort={setModalPortIdx} />
        )}
        {activeTab === 'dataflow' && (
          <DataFlowTab onEditPort={setModalPortIdx} />
        )}
        {activeTab === 'deployment' && (
          <DeploymentTab />
        )}
      </div>

      {/* ── Pin table (always shown below Overview) ─────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ flexShrink:0, borderTop:'1px solid var(--border-color)', maxHeight: isMobile ? 260 : 300, overflowX:'auto', overflowY:'auto' }}>
          <PinTable ports={SC_PORTS} liveSet={liveSet} selectedPort={selectedPort} onSelect={handleSelect} />
        </div>
      )}

      {/* ── Periodicity modal ──────────────────────────────────────── */}
      {modalPortIdx !== null && (
        <PeriodicityModal portIdx={modalPortIdx} onClose={() => setModalPortIdx(null)} onSave={handleSavePeriod} />
      )}
    </div>
  )
}
