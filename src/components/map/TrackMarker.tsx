// ============================================================
// IINVSYS SIS — TrackMarker.tsx
// React-Leaflet Marker with custom DivIcon (heading arrow) for a Track
// ============================================================

import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Track } from '@/types/sensors'

// ── Colour per track class ──────────────────────────────────
function trackColor(cls: Track['class']): string {
  switch (cls) {
    case 'HUMAN':   return '#3B82F6'  // blue
    case 'VEHICLE': return '#F97316'  // orange
    case 'ANIMAL':  return '#10B981'  // green
    default:        return '#94A3B8'  // gray
  }
}

// ── Label / emoji per class ─────────────────────────────────
function trackLabel(cls: Track['class']): string {
  switch (cls) {
    case 'HUMAN':   return 'HUMAN'
    case 'VEHICLE': return 'VEHICLE'
    case 'ANIMAL':  return 'ANIMAL'
    default:        return 'UNKNOWN'
  }
}

// Build a Leaflet DivIcon with an SVG arrow rotated to `heading`
function buildArrowIcon(heading: number, color: string): L.DivIcon {
  // Arrow SVG: points north (up), rotated by heading degrees clockwise
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <g transform="rotate(${heading}, 12, 12)">
        <polygon points="12,2 18,22 12,17 6,22" fill="${color}" stroke="rgba(0,0,0,0.6)" stroke-width="1"/>
      </g>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

// ─────────────────────────────────────────────────────────────
interface Props {
  track: Track
}

export const TrackMarker: React.FC<Props> = ({ track }) => {
  const color = trackColor(track.class)
  const icon = buildArrowIcon(track.heading, color)
  const position: [number, number] = [track.lat, track.lon]

  const popupStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '12px',
    color: 'var(--text-primary, #F8FAFC)',
    minWidth: '180px',
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

  const confidencePct = Math.round(track.confidence * 100)

  return (
    <Marker position={position} icon={icon}>
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
            {track.track_id}
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Class</span>
            <span style={{ color, fontWeight: 600 }}>{trackLabel(track.class)}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Confidence</span>
            <span>{confidencePct}%</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Heading</span>
            <span>{track.heading.toFixed(1)}°</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Velocity</span>
            <span>{track.velocity.toFixed(1)} m/s</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Range</span>
            <span>{track.range_m.toFixed(0)} m</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Age</span>
            <span>{track.age_frames} frames</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>Position</span>
            <span>
              {track.lat.toFixed(4)}, {track.lon.toFixed(4)}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

