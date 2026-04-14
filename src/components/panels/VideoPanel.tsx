// ============================================================
// IINVSYS SIS — VideoPanel.tsx
// Video/imaging panel with grid modes, detection overlays, PTZ
// ============================================================

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useSensorStore } from '../../store/sensorStore'
import type { SensorPayload, SensorModality } from '../../types/sensors'

const OPTICAL_MODALITIES: SensorModality[] = [
  'EOTS', 'THERMAL', 'PTZ', 'CCTV', 'THERMAL_NV', 'NIR_VISIBLE',
]

type GridMode = '1x1' | '2x2' | '3x3'

const GRID_COLS: Record<GridMode, number> = { '1x1': 1, '2x2': 2, '3x3': 3 }

// 1x1 grey placeholder JPEG (tiny base64)
const PLACEHOLDER =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB/8QAHhAAAQQCAwEAAAAAAAAAAAAAAQIDBAUREiEx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALtF1q/T5KIp+s/q6Xy1AaJASAAAB//Z'

function statusDotColor(sensor: SensorPayload): string {
  switch (sensor.sensor_status) {
    case 'ONLINE':      return '#10B981'
    case 'DEGRADED':    return '#EAB308'
    case 'OFFLINE':     return '#EF4444'
    case 'MAINTENANCE': return '#94A3B8'
    default:            return '#94A3B8'
  }
}

// ── Detection overlay SVG ─────────────────────────────────────
// Backend format: { bbox: [x, y, w, h] (normalised 0-1), class, confidence, track_id }
interface Detection {
  bbox: [number, number, number, number]
  class: string
  confidence: number
  track_id?: string
}

interface OverlayProps {
  detections: Detection[]
  frameWidth: number
  frameHeight: number
}

function DetectionOverlay({ detections, frameWidth, frameHeight }: OverlayProps) {
  if (!detections || detections.length === 0) return null
  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox={`0 0 ${frameWidth} ${frameHeight}`}
      preserveAspectRatio="none"
    >
      {detections.map((det, i) => {
        const [nx, ny, nw, nh] = det.bbox ?? [0, 0, 0, 0]
        const px = nx * frameWidth
        const py = ny * frameHeight
        const pw = nw * frameWidth
        const ph = nh * frameHeight
        const label = det.class ?? 'UNK'
        const labelW = Math.max(label.length * 6 + 32, 60)
        return (
          <g key={det.track_id ?? i}>
            <rect x={px} y={py} width={pw} height={ph}
              fill="none" stroke="#3B82F6" strokeWidth={2} />
            <rect x={px} y={py - 14} width={labelW} height={14}
              fill="rgba(59,130,246,0.8)" />
            <text x={px + 3} y={py - 3} fill="white" fontSize={10}
              fontFamily="Inter, sans-serif">
              {label} {Math.round(det.confidence * 100)}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Camera cell ───────────────────────────────────────────────
interface CameraProps {
  sensor: SensorPayload
  selected: boolean
  onClick: () => void
  compact?: boolean
}

function CameraCell({ sensor, selected, onClick, compact = false }: CameraProps) {
  const raw = sensor.raw_value as Record<string, unknown>
  const frameB64 = raw?.frame_jpeg_b64 as string | undefined
  const hasFrame = !!frameB64 && frameB64.length > 100
  const detections = (raw?.detections as Detection[]) || []
  const frameWidth = (raw?.frame_width as number) || 320
  const frameHeight = (raw?.frame_height as number) || 180

  const dotColor = statusDotColor(sensor)

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: '#000',
        border: selected ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
        borderRadius: 4,
        overflow: 'hidden',
        cursor: 'pointer',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Video frame */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: '#0a0a0f' }}>
        {hasFrame ? (
          <img
            src={`data:image/jpeg;base64,${frameB64}`}
            alt={sensor.sensor_id}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            color: 'var(--text-secondary)', fontSize: 10,
          }}>
            <span style={{ fontSize: 18, opacity: 0.4 }}>📷</span>
            <span style={{ opacity: 0.5 }}>Awaiting feed…</span>
          </div>
        )}
        <DetectionOverlay
          detections={detections}
          frameWidth={frameWidth}
          frameHeight={frameHeight}
        />
      </div>
      {/* Label bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.65)',
          padding: compact ? '2px 6px' : '3px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            boxShadow: sensor.sensor_status === 'ONLINE' ? `0 0 4px ${dotColor}` : 'none',
          }}
        />
        <span
          style={{
            fontSize: compact ? 9 : 10,
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sensor.sensor_id}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--accent-teal)',
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          {sensor.modality}
        </span>
      </div>
    </div>
  )
}

// ── PTZ Controls ──────────────────────────────────────────────
interface PTZProps {
  sensorId: string
  wsRef: React.RefObject<WebSocket | null>
}

function PTZControls({ sensorId, wsRef }: PTZProps) {
  const sendPTZ = useCallback(
    (command: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'PTZ_CONTROL',
            payload: { sensor_id: sensorId, command, speed: 1.0 },
          })
        )
      }
    },
    [sensorId, wsRef]
  )

  const btnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 4,
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontSize: 14,
    transition: 'all 0.1s',
    userSelect: 'none',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: 8,
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>
        PTZ: {sensorId}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '32px 32px 32px', gap: 4 }}>
        <div />
        <button style={btnStyle} onClick={() => sendPTZ('TILT_UP')} title="Tilt Up">↑</button>
        <div />
        <button style={btnStyle} onClick={() => sendPTZ('PAN_LEFT')} title="Pan Left">←</button>
        <button style={btnStyle} onClick={() => sendPTZ('STOP')} title="Stop" aria-label="Stop">■</button>
        <button style={btnStyle} onClick={() => sendPTZ('PAN_RIGHT')} title="Pan Right">→</button>
        <div />
        <button style={btnStyle} onClick={() => sendPTZ('TILT_DOWN')} title="Tilt Down">↓</button>
        <div />
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        <button style={btnStyle} onClick={() => sendPTZ('ZOOM_IN')} title="Zoom In">+</button>
        <button style={btnStyle} onClick={() => sendPTZ('ZOOM_OUT')} title="Zoom Out">−</button>
      </div>
    </div>
  )
}

// ── Frame capture ─────────────────────────────────────────────
function captureFrame(sensorId: string, b64: string) {
  const canvas = document.createElement('canvas')
  const img = new Image()
  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(img, 0, 0)
    const link = document.createElement('a')
    link.download = `${sensorId}_${Date.now()}.jpg`
    link.href = canvas.toDataURL('image/jpeg', 0.95)
    link.click()
  }
  img.src = `data:image/jpeg;base64,${b64}`
}

// ── Main panel ────────────────────────────────────────────────
export default function VideoPanel() {
  const sensors = useSensorStore((s) => s.sensors)
  const [gridMode, setGridMode] = useState<GridMode>('2x2')
  const [selectedIdx, setSelectedIdx] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const url = (import.meta.env.VITE_WS_URL as string) ?? 'ws://localhost:4000'
    try {
      wsRef.current = new WebSocket(url)
    } catch {
      // WS not available
    }
    return () => wsRef.current?.close()
  }, [])

  const opticalSensors = Array.from(sensors.values()).filter((s) =>
    OPTICAL_MODALITIES.includes(s.modality)
  )

  const cols = GRID_COLS[gridMode]
  const visibleSensors =
    gridMode === '1x1'
      ? [opticalSensors[selectedIdx]].filter(Boolean)
      : opticalSensors.slice(0, cols * cols)

  const selectedSensor = opticalSensors[selectedIdx]
  const isPTZ = selectedSensor?.modality === 'PTZ'

  const modeBtn = (mode: GridMode) => (
    <button
      key={mode}
      onClick={() => setGridMode(mode)}
      style={{
        fontSize: 10,
        padding: '2px 7px',
        borderRadius: 4,
        border: `1px solid ${gridMode === mode ? 'var(--accent-blue)' : 'var(--border-color)'}`,
        background: gridMode === mode ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: gridMode === mode ? 'var(--accent-blue)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      {mode}
    </button>
  )

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: '4px 8px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexShrink: 0,
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {(['1x1', '2x2', '3x3'] as GridMode[]).map(modeBtn)}
          {selectedSensor && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: 10, padding: '2px 8px', marginLeft: 4 }}
              onClick={() => {
                const raw = selectedSensor.raw_value as Record<string, unknown>
                const b64 = (raw?.frame_jpeg_b64 as string) || PLACEHOLDER
                captureFrame(selectedSensor.sensor_id, b64)
              }}
            >
              ⬇ Capture
            </button>
          )}
        </div>
      </div>

      {/* Camera grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${cols}, 1fr)`,
          gap: 2,
          padding: 4,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {opticalSensors.length === 0 ? (
          <div
            style={{
              gridColumn: `1 / -1`,
              gridRow: `1 / -1`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 8,
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 32, opacity: 0.4 }}>📷</span>
            <span>Awaiting sensor data...</span>
          </div>
        ) : (
          visibleSensors.map((sensor, i) => (
            <CameraCell
              key={sensor.sensor_id}
              sensor={sensor}
              selected={i === selectedIdx && gridMode !== '1x1'}
              onClick={() => setSelectedIdx(opticalSensors.indexOf(sensor))}
              compact={gridMode === '3x3'}
            />
          ))
        )}
      </div>

      {/* PTZ controls (1x1 mode only) */}
      {gridMode === '1x1' && selectedSensor && (
        <PTZControls sensorId={selectedSensor.sensor_id} wsRef={wsRef} />
      )}
    </div>
  )
}
