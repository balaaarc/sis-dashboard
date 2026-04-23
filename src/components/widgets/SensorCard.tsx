import { useSensorStore } from '@/store/sensorStore'
import { formatRelativeTime, formatQualityScore } from '@/utils/formatters'
import type { SensorStatus } from '@/types/sensors'

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

export function SensorCard({ sensorId }: SensorCardProps) {
  const sensor = useSensorStore((s) => s.sensors.get(sensorId))
  const selectedId = useSensorStore((s) => s.selectedSensorId)
  const selectSensor = useSensorStore((s) => s.selectSensor)

  if (!sensor) {
    return (
      <div className="sensor-card opacity-50">
        <div className="text-[11px] text-text-secondary">{sensorId}</div>
        <div className="text-[10px] text-text-secondary">No data</div>
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
      <div className="flex items-center justify-between gap-1">
        <span
          className="text-[10px] font-mono text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap max-w-[60%]"
          title={sensor.sensor_id}
        >
          {sensor.sensor_id.length > 14
            ? `...${sensor.sensor_id.slice(-11)}`
            : sensor.sensor_id}
        </span>
        {/* Modality badge */}
        <span className="text-[10px] font-bold tracking-[0.05em] py-[1px] px-[5px] rounded bg-bg-primary border border-border-color text-accent-teal shrink-0">
          {sensor.modality}
        </span>
      </div>

      {/* Quality score */}
      <div className="flex items-center gap-1.5">
        <div className="progress-bar-track flex-1">
          <div
            className="progress-bar-fill"
            style={{
              width: `${sensor.quality_score * 100}%`,
              background: qualityColor,
            }}
          />
        </div>
        <span
          className="text-[10px] font-bold shrink-0 min-w-[30px] text-right"
          style={{ color: qualityColor }}
        >
          {formatQualityScore(sensor.quality_score)}
        </span>
      </div>

      {/* Status + last seen */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold tracking-[0.05em] flex items-center gap-1"
          style={{ color: statusColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
            style={{
              background: statusColor,
              boxShadow: sensor.sensor_status === 'ONLINE' ? `0 0 5px ${statusColor}` : 'none',
            }}
          />
          {sensor.sensor_status}
        </span>
        <span className="text-[10px] text-text-secondary">
          {formatRelativeTime(sensor.timestamp)}
        </span>
      </div>

      {/* Key value */}
      <div className="text-[10px] text-text-secondary font-mono">
        {getFirstNumericValue(sensor.raw_value)}
      </div>
    </div>
  )
}
