/**
 * MinimizedViews — compact priority-data strips shown in the panel strip
 * when another panel is expanded or when a panel is manually minimized.
 *
 * Each component reads only the minimum state needed to render key metrics.
 */
import { useState, useEffect } from 'react'
import { useSensorStore } from '../../store/sensorStore'
import { useAlertStore }  from '../../store/alertStore'
import { useSystemStore } from '../../store/systemStore'

// ── shared style helpers ─────────────────────────────────────────────────────
const Kpi = ({ label, value, color }: { label?: string; value: string; color?: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
    {label && <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{label}</span>}
    <strong style={{ color: color ?? 'var(--text-primary)', fontSize: 11, fontFamily: 'monospace' }}>
      {value}
    </strong>
  </span>
)

const Sep = () => (
  <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>·</span>
)

// ── LiveMap ──────────────────────────────────────────────────────────────────
function MapMini() {
  const sensorCount = useSensorStore((s) => s.sensors.size)
  const trackCount  = useSensorStore((s) => s.tracks.length)
  return (
    <>
      <Kpi label="📡" value={`${sensorCount} sensors`} />
      <Sep />
      <Kpi label="🎯" value={`${trackCount} tracks`} color={trackCount > 0 ? 'var(--alert-high)' : undefined} />
    </>
  )
}

// ── Alerts ───────────────────────────────────────────────────────────────────
function AlertsMini() {
  const alerts = useAlertStore((s) => s.alerts)
  const unacked = alerts.filter((a) => !a.acknowledged)
  const c = (lvl: string) => unacked.filter((a) => a.threat_level === lvl).length
  return (
    <>
      <Kpi value={`${c('CRITICAL')}`} color="var(--alert-critical)" label="🔴" />
      <Sep />
      <Kpi value={`${c('HIGH')}`} color="var(--alert-high)" label="🟠" />
      <Sep />
      <Kpi value={`${c('MEDIUM')}`} color="var(--alert-medium)" label="🟡" />
      <Sep />
      <Kpi value={`${c('LOW')}`} color="var(--alert-low)" label="🟢" />
    </>
  )
}

// ── Video ────────────────────────────────────────────────────────────────────
function VideoMini() {
  return <Kpi value="Video feeds active" label="📹" />
}

// ── Sensors ──────────────────────────────────────────────────────────────────
function SensorsMini() {
  const sensors = useSensorStore((s) => s.sensors)
  const arr = Array.from(sensors.values())
  const online = arr.filter((s) => s.sensor_status === 'ONLINE').length
  const avgQ = arr.length > 0
    ? Math.round(arr.reduce((sum, s) => sum + s.quality_score, 0) / arr.length)
    : 0
  return (
    <>
      <Kpi label="Online" value={`${online}/${arr.length}`} color="var(--sensor-acoustic)" />
      <Sep />
      <Kpi label="Avg Q" value={`${avgQ}%`} color={avgQ > 70 ? 'var(--sensor-acoustic)' : 'var(--alert-medium)'} />
    </>
  )
}

// ── AI/ML ────────────────────────────────────────────────────────────────────
function AimlMini() {
  const tracks = useSensorStore((s) => s.tracks)
  const ta = useAlertStore((s) => s.threatAssessment)
  return (
    <>
      <Kpi label="🎯" value={`${tracks.length} tracks`} color={tracks.length > 0 ? 'var(--alert-high)' : undefined} />
      {ta && (
        <>
          <Sep />
          <Kpi label="Threat" value={ta.overall_threat_level} color={
            ta.overall_threat_level === 'CRITICAL' ? 'var(--alert-critical)' :
            ta.overall_threat_level === 'HIGH' ? 'var(--alert-high)' : 'var(--sensor-acoustic)'
          } />
        </>
      )}
    </>
  )
}

// ── System Health ─────────────────────────────────────────────────────────────
function HealthMini() {
  const health = useSystemStore((s) => s.health)
  if (!health) return <Kpi value="Waiting…" />
  const temp = health.hardware?.temperature_c ?? 0
  const cpu  = health.hardware?.cpu_percent ?? 0
  const tempColor = temp > 70 ? 'var(--alert-critical)' : temp > 50 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'
  return (
    <>
      <Kpi value={health.node_id} />
      <Sep />
      <Kpi label="🌡" value={`${temp.toFixed(1)}°C`} color={tempColor} />
      <Sep />
      <Kpi label="CPU" value={`${cpu.toFixed(0)}%`} color={cpu > 80 ? 'var(--alert-critical)' : undefined} />
    </>
  )
}

// ── Counter-UAS ───────────────────────────────────────────────────────────────
function useContactCountMini() {
  const [count, setCount] = useState(() => Math.floor(Math.random() * 4))
  const [hasMilitary, setHasMilitary] = useState(false)
  useEffect(() => {
    const iv = setInterval(() => {
      const n = Math.floor(Math.random() * 4)
      setCount(n)
      setHasMilitary(n > 0 && Math.random() < 0.3)
    }, 4000)
    return () => clearInterval(iv)
  }, [])
  return { count, hasMilitary }
}
function CounterUASMini() {
  const { count, hasMilitary } = useContactCountMini()
  return (
    <>
      <Kpi label="🛸" value={`${count} UAS`} color={count > 0 ? 'var(--alert-high)' : undefined} />
      {hasMilitary && (
        <>
          <Sep />
          <Kpi value="MILITARY" color="var(--alert-critical)" />
        </>
      )}
      {count === 0 && (
        <>
          <Sep />
          <Kpi value="Clear" color="var(--sensor-acoustic)" />
        </>
      )}
    </>
  )
}

// ── Personnel ─────────────────────────────────────────────────────────────────
function usePersonnelMini() {
  const [missed, setMissed] = useState(0)
  const [outside, setOutside] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => {
      setMissed(Math.random() < 0.2 ? 1 : 0)
      setOutside(Math.random() < 0.15 ? 1 : 0)
    }, 6000)
    return () => clearInterval(iv)
  }, [])
  return { total: 5, missed, outside }
}
function PersonnelMini() {
  const { total, missed, outside } = usePersonnelMini()
  return (
    <>
      <Kpi label="👥" value={`${total} personnel`} color="var(--sensor-acoustic)" />
      {missed > 0 && (
        <>
          <Sep />
          <Kpi value={`⚠ ${missed} missed`} color="var(--alert-high)" />
        </>
      )}
      {outside > 0 && (
        <>
          <Sep />
          <Kpi value={`⚡ ${outside} OOB`} color="var(--alert-medium)" />
        </>
      )}
    </>
  )
}

// ── Power & Vehicle ────────────────────────────────────────────────────────────
function usePowerMini() {
  const [avgBat, setAvgBat] = useState(68)
  const [faults, setFaults] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => {
      setAvgBat((p) => Math.max(20, Math.min(98, p + (Math.random() * 2 - 1))))
      setFaults(Math.random() < 0.25 ? 1 : 0)
    }, 5000)
    return () => clearInterval(iv)
  }, [])
  return { avgBat, faults }
}
function PowerMini() {
  const { avgBat, faults } = usePowerMini()
  const batColor = avgBat < 30 ? 'var(--alert-critical)' : avgBat < 50 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'
  return (
    <>
      <Kpi label="⚡" value="4 BOP nodes" />
      <Sep />
      <Kpi label="Avg bat" value={`${avgBat.toFixed(0)}%`} color={batColor} />
      {faults > 0 && (
        <>
          <Sep />
          <Kpi value={`${faults} fault`} color="var(--alert-critical)" />
        </>
      )}
    </>
  )
}

// ── Command ───────────────────────────────────────────────────────────────────
function useCommandMini() {
  const [offline, setOffline] = useState(1)
  const [alerts, setAlerts] = useState(1)
  useEffect(() => {
    const iv = setInterval(() => {
      setOffline(Math.random() < 0.3 ? 1 : 0)
      setAlerts(Math.floor(Math.random() * 3))
    }, 7000)
    return () => clearInterval(iv)
  }, [])
  return { total: 5, offline, alerts }
}
function CommandMini() {
  const { total, offline, alerts } = useCommandMini()
  return (
    <>
      <Kpi label="📋" value={`${total - offline}/${total} online`} color={offline > 0 ? 'var(--alert-high)' : 'var(--sensor-acoustic)'} />
      {alerts > 0 && (
        <>
          <Sep />
          <Kpi value={`${alerts} alert${alerts > 1 ? 's' : ''}`} color="var(--alert-medium)" />
        </>
      )}
    </>
  )
}

// ── Advanced AI ───────────────────────────────────────────────────────────────
function useAdvancedAIMini() {
  const [far, setFar] = useState(13.8)
  const [alertCount, setAlertCount] = useState(47)
  useEffect(() => {
    const iv = setInterval(() => {
      setFar((p) => Math.max(0, Math.min(50, parseFloat((p + (Math.random() * 2 - 1)).toFixed(1)))))
      setAlertCount((p) => Math.max(0, p + Math.floor(Math.random() * 3 - 1)))
    }, 6000)
    return () => clearInterval(iv)
  }, [])
  return { far, alertCount }
}
function AdvancedAIMini() {
  const { far, alertCount } = useAdvancedAIMini()
  const farColor = far > 30 ? 'var(--alert-critical)' : far > 15 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'
  return (
    <>
      <Kpi label="🧠 FAR" value={`${far.toFixed(1)}%`} color={farColor} />
      <Sep />
      <Kpi label="Alerts 7d" value={`${alertCount}`} />
    </>
  )
}

// ── Weather ───────────────────────────────────────────────────────────────────
const COND_ICON: Record<string, string> = {
  Clear: '☀', 'Partly Cloudy': '⛅', Overcast: '☁', Fog: '🌫', Rain: '🌧', Drizzle: '🌦',
}
function useWeatherMini() {
  const [wx, setWx] = useState({ temp_c: 28.4, condition: 'Overcast', visibility_km: 8.2, wind_kmh: 14 })
  useEffect(() => {
    const iv = setInterval(() => {
      setWx((p) => ({
        ...p,
        temp_c: parseFloat((p.temp_c + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        visibility_km: parseFloat((Math.max(0.1, p.visibility_km + (Math.random() * 0.4 - 0.2))).toFixed(1)),
        wind_kmh: Math.max(0, Math.round(p.wind_kmh + (Math.random() * 4 - 2))),
      }))
    }, 6000)
    return () => clearInterval(iv)
  }, [])
  return wx
}
function WeatherMini() {
  const wx = useWeatherMini()
  const visColor = wx.visibility_km < 2 ? 'var(--alert-critical)' : wx.visibility_km < 5 ? 'var(--alert-medium)' : undefined
  return (
    <>
      <Kpi value={`${COND_ICON[wx.condition] ?? '🌤'} ${wx.temp_c}°C`} />
      <Sep />
      <Kpi label="Vis" value={`${wx.visibility_km}km`} color={visColor} />
      <Sep />
      <Kpi label="Wind" value={`${wx.wind_kmh}km/h`} />
    </>
  )
}

// ── Public router ─────────────────────────────────────────────────────────────
const MINI_MAP: Record<string, () => JSX.Element> = {
  map:        MapMini,
  alerts:     AlertsMini,
  video:      VideoMini,
  sensors:    SensorsMini,
  aiml:       AimlMini,
  health:     HealthMini,
  counteruas: CounterUASMini,
  personnel:  PersonnelMini,
  power:      PowerMini,
  command:    CommandMini,
  advancedai: AdvancedAIMini,
  weather:    WeatherMini,
}

export default function PanelMiniView({ panelId }: { panelId: string }) {
  const Comp = MINI_MAP[panelId]
  if (!Comp) return null
  return <Comp />
}
