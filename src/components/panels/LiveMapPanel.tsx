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
} from 'react-leaflet'
import { useSensorStore } from '@/store/sensorStore'
import { useAlertStore } from '@/store/alertStore'
import { SensorMarker } from '@/components/map/SensorMarker'
import { TrackMarker } from '@/components/map/TrackMarker'

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

const badgeCls = 'text-[10px] font-bold py-[1px] px-[7px] rounded-full border'

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
export function LiveMapPanel() {
  const sensors = useSensorStore((s) => s.sensors)
  const tracks = useSensorStore((s) => s.tracks)

  const sensorCount = sensors.size
  const trackCount = tracks.length

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <span className="sr-only">Live Tactical Map</span>
      {/* Stats bar */}
      <div className="py-1 px-3 border-b border-border-color flex items-center justify-between shrink-0 bg-panel-header-bg">
        <span className="flex items-center gap-1.5">
          <span
            className={badgeCls}
            style={{ color: 'var(--sensor-optical)', borderColor: 'var(--sensor-optical)', background: 'rgba(14,165,233,0.1)' }}
          >
            {sensorCount} sensors
          </span>
          <span
            className={badgeCls}
            style={{ color: 'var(--alert-high)', borderColor: 'var(--alert-high)', background: 'rgba(249,115,22,0.1)' }}
          >
            {trackCount} tracks
          </span>
        </span>
        <div className="flex gap-2 text-[10px] text-text-secondary">
          <span className="text-[#10B981]">■ Zone A</span>
          <span className="text-[#F59E0B]">■ Zone B</span>
        </div>
      </div>

      {/* Map body */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer
          center={[21.9452, 88.1234]}
          zoom={12}
          className="h-full w-full"
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
