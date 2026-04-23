import { useSensorStore } from '@/store/sensorStore'
import { formatQualityScore } from '@/utils/formatters'
import type { SensorStatus } from '@/types/sensors'

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

export function SensorStatusGrid() {
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
    <div className="grid grid-cols-4 gap-1 p-2">
      {entries.map((sensor) => {
        const sc = statusColor(sensor.sensor_status)
        const qc = qualityColor(sensor.quality_score)
        const isSelected = selectedId === sensor.sensor_id

        return (
          <div
            key={sensor.sensor_id}
            onClick={() => selectSensor(isSelected ? null : sensor.sensor_id)}
            className="rounded-[6px] px-2 py-1.5 cursor-pointer transition-all duration-150 flex flex-col gap-1"
            style={{
              background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
              border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
            }}
            title={`${sensor.sensor_id} — ${sensor.sensor_status}`}
          >
            {/* Status dot + name */}
            <div className="flex items-center gap-[5px]">
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{
                  background: sc,
                  boxShadow: sensor.sensor_status === 'ONLINE' ? `0 0 5px ${sc}` : 'none',
                }}
              />
              <span className="text-[10px] font-mono text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap">
                {shortName(sensor.sensor_id, sensor.modality)}
              </span>
            </div>

            {/* Quality bar */}
            <div className="progress-bar-track h-1">
              <div
                className="progress-bar-fill h-full"
                style={{
                  width: `${sensor.quality_score * 100}%`,
                  background: qc,
                }}
              />
            </div>

            <div data-testid="quality-score" className="text-[10px] font-bold text-right" style={{ color: qc }}>
              {formatQualityScore(sensor.quality_score)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
