// ============================================================
// IINVSYS SIS — SensorMarker.tsx
// React-Leaflet CircleMarker for a single SensorPayload
// ============================================================

import React from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import type { SensorPayload } from '../../types/sensors'
import { formatRelativeTime, formatQualityScore } from '../../utils/formatters'

// Derive a sensor family colour directly from the modality
function modalityColor(modality: SensorPayload['modality']): string {
  switch (modality) {
    case 'SEISMIC':
    case 'VIBRATION':
    case 'FIBRE_OPTIC':
      return '#8B5CF6' // --sensor-seismic
    case 'ACOUSTIC':
      return '#10B981' // --sensor-acoustic
    case 'EOTS':
    case 'THERMAL':
    case 'PTZ':
    case 'CCTV':
    case 'THERMAL_NV':
    case 'NIR_VISIBLE':
    case 'LIDAR':
      return '#0EA5E9' // --sensor-optical
    case 'MICROWAVE':
    case 'MMWAVE':
    case 'GMTI_RADAR':
    case 'GPR':
    case 'EMI':
      return '#F59E0B' // --sensor-radar
    case 'MAD':
    case 'MAGNETOMETER':
      return '#EC4899' // --sensor-magnetic
    case 'CHEMICAL':
    case 'PIR_IR':
      return '#84CC16' // --sensor-chemical
    default:
      return '#94A3B8'
  }
}

// Deterministic lat/lon offset from sensor_id so markers don't stack
function deterministicOffset(sensorId: string): [number, number] {
  const code = sensorId.charCodeAt(0) || 0
  const code2 = sensorId.charCodeAt(sensorId.length - 1) || 0
  return [code * 0.001, code2 * 0.001]
}

function statusLabel(status: SensorPayload['sensor_status']): string {
  switch (status) {
    case 'ONLINE':      return '🟢 Online'
    case 'DEGRADED':    return '🟡 Degraded'
    case 'OFFLINE':     return '🔴 Offline'
    case 'MAINTENANCE': return '⚙️ Maintenance'
    default:            return status
  }
}

// Summarise raw_value for popup display (max 3 keys)
function summariseRaw(raw: Record<string, unknown>): string {
  const keys = Object.keys(raw).slice(0, 3)
  return keys
    .map((k) => {
      const v = raw[k]
      if (v === null || v === undefined) return `${k}: —`
      if (typeof v === 'number') return `${k}: ${v.toFixed(2)}`
      if (typeof v === 'string') return `${k}: ${v.slice(0, 20)}`
      if (Array.isArray(v)) return `${k}: [${v.length} pts]`
      return `${k}: …`
    })
    .join(' | ')
}

// ─────────────────────────────────────────────────────────────
interface Props {
  sensor: SensorPayload
}

const SensorMarker: React.FC<Props> = ({ sensor }) => {
  const baseLat = sensor.lat ?? 21.9452
  const baseLon = sensor.lon ?? 88.1234
  const [dLat, dLon] = deterministicOffset(sensor.sensor_id)
  const position: [number, number] = [baseLat + dLat, baseLon + dLon]

  const color = modalityColor(sensor.modality)

  const popupStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '12px',
    color: 'var(--text-primary, #F8FAFC)',
    minWidth: '200px',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '2px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-secondary, #94A3B8)',
    fontWeight: 500,
    flexShrink: 0,
  }

  return (
    <CircleMarker
      center={position}
      radius={8}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1.5,
        opacity: 1,
      }}
    >
      <Popup>
        <div style={popupStyle}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '13px',
              marginBottom: '6px',
              color,
              borderBottom: `2px solid ${color}`,
              paddingBottom: '4px',
            }}
          >
            {sensor.sensor_id}
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Modality</span>
            <span>{sensor.modality}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Status</span>
            <span>{statusLabel(sensor.sensor_status)}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Quality</span>
            <span>{formatQualityScore(sensor.quality_score)}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Site</span>
            <span>{sensor.site_id}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Time</span>
            <span>{formatRelativeTime(sensor.timestamp)}</span>
          </div>
          {sensor.raw_value && Object.keys(sensor.raw_value).length > 0 && (
            <div
              style={{
                marginTop: '6px',
                padding: '4px 6px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                fontSize: '11px',
                color: 'var(--text-secondary, #94A3B8)',
              }}
            >
              {summariseRaw(sensor.raw_value)}
            </div>
          )}
        </div>
      </Popup>
    </CircleMarker>
  )
}

export default SensorMarker
