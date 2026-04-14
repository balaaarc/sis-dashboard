import { useSensorStore } from '../../store/sensorStore'
import { formatQualityScore } from '../../utils/formatters'
import type { SensorStatus } from '../../types/sensors'

function statusColor(status: SensorStatus): string {
  switch (status) {
    case 'ONLINE': return 'var(--sensor-acoustic)'
    case 'DEGRADED': return 'var(--alert-medium)'
    case 'OFFLINE': return 'var(--alert-critical)'
    case 'MAINTENANCE': return 'var(--text-secondary)'
    default: return 'var(--text-secondary)'
  }
}

function qualityColor(score: number): string {
  if (score > 0.8) return 'var(--sensor-acoustic)'
  if (score >= 0.4) return 'var(--alert-medium)'
  return 'var(--alert-critical)'
}

function shortName(sensorId: string, modality: string): string {
  return `${modality.slice(0, 4)} ${sensorId.slice(-3)}`
}

export default function SensorStatusGrid() {
  const sensors = useSensorStore((s) => s.sensors)
  const selectSensor = useSensorStore((s) => s.selectSensor)
  const selectedId = useSensorStore((s) => s.selectedSensorId)

  const entries = Array.from(sensors.values())

  if (entries.length === 0) {
    return (
      <div className="no-data">
        <span className="no-data-icon">📡</span>
        <span>Awaiting sensor data...</span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4,
        padding: 8,
      }}
    >
      {entries.map((sensor) => {
        const sc = statusColor(sensor.sensor_status)
        const qc = qualityColor(sensor.quality_score)
        const isSelected = selectedId === sensor.sensor_id

        return (
          <div
            key={sensor.sensor_id}
            onClick={() => selectSensor(isSelected ? null : sensor.sensor_id)}
            style={{
              background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
              border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              borderRadius: 6,
              padding: '6px 8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
            title={`${sensor.sensor_id} — ${sensor.sensor_status}`}
          >
            {/* Status dot + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: sc,
                  flexShrink: 0,
                  boxShadow: sensor.sensor_status === 'ONLINE' ? `0 0 5px ${sc}` : 'none',
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {shortName(sensor.sensor_id, sensor.modality)}
              </span>
            </div>

            {/* Quality bar */}
            <div className="progress-bar-track" style={{ height: 4 }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${sensor.quality_score * 100}%`,
                  background: qc,
                  height: '100%',
                }}
              />
            </div>

            <div style={{ fontSize: 10, color: qc, fontWeight: 700, textAlign: 'right' }}>
              {formatQualityScore(sensor.quality_score)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
