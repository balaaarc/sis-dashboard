// ============================================================
// IINVSYS SIS — LiveMapPanel.tsx
// Live tactical map with sensor overlays, tracks, and alert zones
// ============================================================

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadow })

import React from 'react'
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Polygon,
  useMap,
} from 'react-leaflet'
import { useSensorStore } from '../../store/sensorStore'
import { useAlertStore } from '../../store/alertStore'
import SensorMarker from '../map/SensorMarker'
import TrackMarker from '../map/TrackMarker'

// ── Hardcoded alert zones ────────────────────────────────────
const ZONE_A: [number, number][] = [
  [21.95, 88.11],
  [21.95, 88.13],
  [21.93, 88.13],
  [21.93, 88.11],
]

const ZONE_B: [number, number][] = [
  [21.96, 88.15],
  [21.96, 88.17],
  [21.94, 88.17],
  [21.94, 88.15],
]

// ── Map bounds auto-fit helper ───────────────────────────────
const FIT_BOUNDS_PADDING: [number, number] = [20, 20]

// ── Panel styles ─────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  background: 'var(--panel-header-bg)',
}

const titleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const badgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  padding: '1px 7px',
  borderRadius: 9999,
  border: '1px solid',
}

// ── Inner component that reads stores (must be inside MapContainer tree sibling) ──
function MapOverlays() {
  const sensors = useSensorStore((s) => s.sensors)
  const tracks = useSensorStore((s) => s.tracks)
  const threatAssessment = useAlertStore((s) => s.threatAssessment)

  const sensorList = Array.from(sensors.values())

  // Zone A turns red if threat is CRITICAL
  const zoneAColor =
    threatAssessment?.threat_level === 'CRITICAL' ? '#EF4444' : '#10B981'

  return (
    <>
      {/* Alert zones */}
      <Polygon
        positions={ZONE_A}
        pathOptions={{
          color: zoneAColor,
          fillColor: zoneAColor,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '6 4',
        }}
      />
      <Polygon
        positions={ZONE_B}
        pathOptions={{
          color: '#F59E0B',
          fillColor: '#F59E0B',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '6 4',
        }}
      />

      {/* Sensor markers */}
      {sensorList.map((sensor) => (
        <SensorMarker key={sensor.sensor_id} sensor={sensor} />
      ))}

      {/* Track markers */}
      {tracks.map((track) => (
        <TrackMarker key={track.track_id} track={track} />
      ))}
    </>
  )
}

// ── Main panel component ─────────────────────────────────────
export default function LiveMapPanel() {
  const sensors = useSensorStore((s) => s.sensors)
  const tracks = useSensorStore((s) => s.tracks)

  const sensorCount = sensors.size
  const trackCount = tracks.length

  return (
    <div style={panelStyle}>
      {/* Stats bar */}
      <div style={{ ...headerStyle, padding: '4px 12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              ...badgeStyle,
              color: 'var(--sensor-optical)',
              borderColor: 'var(--sensor-optical)',
              background: 'rgba(14,165,233,0.1)',
            }}
          >
            {sensorCount} sensors
          </span>
          <span
            style={{
              ...badgeStyle,
              color: 'var(--alert-high)',
              borderColor: 'var(--alert-high)',
              background: 'rgba(249,115,22,0.1)',
            }}
          >
            {trackCount} tracks
          </span>
        </span>
        <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-secondary)' }}>
          <span style={{ color: '#10B981' }}>■ Zone A</span>
          <span style={{ color: '#F59E0B' }}>■ Zone B</span>
        </div>
      </div>

      {/* Map body */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapContainer
          center={[21.9452, 88.1234]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl
          attributionControl={false}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Esri Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
                maxZoom={18}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <MapOverlays />
        </MapContainer>
      </div>
    </div>
  )
}
