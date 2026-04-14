import { useSensorStore } from '../../store/sensorStore'
import { formatRelativeTime, formatQualityScore } from '../../utils/formatters'
import type { SensorStatus } from '../../types/sensors'

interface SensorCardProps {
  sensorId: string
}

function getStatusColor(status: SensorStatus): string {
  switch (status) {
    case 'ONLINE':
      return 'var(--sensor-acoustic)'
    case 'DEGRADED':
      return 'var(--alert-medium)'
    case 'OFFLINE':
      return 'var(--alert-critical)'
    case 'MAINTENANCE':
      return 'var(--text-secondary)'
    default:
      return 'var(--text-secondary)'
  }
}

function getQualityColor(score: number): string {
  if (score > 0.8) return 'var(--sensor-acoustic)'
  if (score >= 0.4) return 'var(--alert-medium)'
  return 'var(--alert-critical)'
}

const SKIP_DISPLAY_KEYS = new Set(['frame_width', 'frame_height'])

function getFirstNumericValue(raw: Record<string, unknown>): string {
  // Optical sensors: show detection count
  if (Array.isArray(raw.detections)) {
    return `detections: ${(raw.detections as unknown[]).length}`
  }
  for (const [key, val] of Object.entries(raw)) {
    if (SKIP_DISPLAY_KEYS.has(key)) continue
    if (typeof val === 'number') {
      return `${key}: ${Number.isInteger(val) ? val : val.toFixed(3)}`
    }
  }
  return '—'
}

export default function SensorCard({ sensorId }: SensorCardProps) {
  const sensor = useSensorStore((s) => s.sensors.get(sensorId))
  const selectedId = useSensorStore((s) => s.selectedSensorId)
  const selectSensor = useSensorStore((s) => s.selectSensor)

  if (!sensor) {
    return (
      <div className="sensor-card" style={{ opacity: 0.5 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sensorId}</div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>No data</div>
      </div>
    )
  }

  const qualityColor = getQualityColor(sensor.quality_score)
  const statusColor = getStatusColor(sensor.sensor_status)
  const isSelected = selectedId === sensorId

  return (
    <div
      className={`sensor-card${isSelected ? ' selected' : ''}`}
      onClick={() => selectSensor(isSelected ? null : sensorId)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'monospace',
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '60%',
          }}
          title={sensor.sensor_id}
        >
          {sensor.sensor_id.length > 14
            ? `...${sensor.sensor_id.slice(-11)}`
            : sensor.sensor_id}
        </span>
        {/* Modality badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '1px 5px',
            borderRadius: 4,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            color: 'var(--accent-teal)',
            flexShrink: 0,
          }}
        >
          {sensor.modality}
        </span>
      </div>

      {/* Quality score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="progress-bar-track" style={{ flex: 1 }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${sensor.quality_score * 100}%`,
              background: qualityColor,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: qualityColor,
            flexShrink: 0,
            minWidth: 30,
            textAlign: 'right',
          }}
        >
          {formatQualityScore(sensor.quality_score)}
        </span>
      </div>

      {/* Status + last seen */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: statusColor,
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusColor,
              display: 'inline-block',
              boxShadow: sensor.sensor_status === 'ONLINE' ? `0 0 5px ${statusColor}` : 'none',
            }}
          />
          {sensor.sensor_status}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {formatRelativeTime(sensor.timestamp)}
        </span>
      </div>

      {/* Key value */}
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
        {getFirstNumericValue(sensor.raw_value)}
      </div>
    </div>
  )
}
