// ============================================================
// IINVSYS SIS — VideoPanel.tsx
// Video/imaging panel with grid modes, detection overlays, PTZ
// ============================================================

import React, { useCallback, useState } from 'react'
import { useSensorStore } from '@/store/sensorStore'
import { useSystemStore } from '@/store/systemStore'
import type { SensorPayload, SensorModality } from '@/types/sensors'

const OPTICAL_MODALITIES: SensorModality[] = [
  'EOTS', 'THERMAL', 'PTZ', 'CCTV', 'THERMAL_NV', 'NIR_VISIBLE',
]

type GridMode = '1x1' | '2x2' | '3x3'

const GRID_COLS: Record<GridMode, number> = { '1x1': 1, '2x2': 2, '3x3': 3 }

// 1x1 grey placeholder JPEG (tiny base64)
const PLACEHOLDER =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB/8QAHhAAAQQCAwEAAAAAAAAAAAAAAQIDBAUREiEx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALtF1q/T5KIp+s/q6Xy1AaJASAAAB//Z'

function statusDotClass(sensor: SensorPayload): string {
  switch (sensor.sensor_status) {
    case 'ONLINE':      return 'bg-[#10B981] shadow-[0_0_4px_#10B981]'
    case 'DEGRADED':    return 'bg-[#EAB308]'
    case 'OFFLINE':     return 'bg-[#EF4444]'
    case 'MAINTENANCE': return 'bg-[#94A3B8]'
    default:            return 'bg-[#94A3B8]'
  }
}

// ── Detection overlay SVG ─────────────────────────────────────
// Backend format: { bbox: [x, y, w, h] (normalised 0-1), class, confidence, track_id }
// Also supports legacy format: { x, y, width, height, label, confidence } (pixel values)
interface Detection {
  bbox?: [number, number, number, number]
  class?: string
  confidence: number
  track_id?: string
  // Legacy pixel-coordinate format
  x?: number
  y?: number
  width?: number
  height?: number
  label?: string
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
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${frameWidth} ${frameHeight}`}
      preserveAspectRatio="none"
    >
      {detections.map((det, i) => {
        let px: number, py: number, pw: number, ph: number
        if (det.bbox) {
          const [nx, ny, nw, nh] = det.bbox
          px = nx * frameWidth
          py = ny * frameHeight
          pw = nw * frameWidth
          ph = nh * frameHeight
        } else {
          // Legacy pixel format
          px = det.x ?? 0
          py = det.y ?? 0
          pw = det.width ?? 0
          ph = det.height ?? 0
        }
        const label = det.class ?? det.label ?? 'UNK'
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

  return (
    <div
      onClick={onClick}
      className={[
        'relative bg-black rounded-[4px] overflow-hidden cursor-pointer flex-1 min-h-0 flex flex-col',
        selected ? 'border-2 border-accent-blue' : 'border border-border-color',
      ].join(' ')}
    >
      {/* Video frame */}
      <div className="relative flex-1 overflow-hidden bg-[#0a0a0f]">
        <img
          src={hasFrame ? `data:image/jpeg;base64,${frameB64}` : `data:image/jpeg;base64,${PLACEHOLDER}`}
          alt={sensor.sensor_id}
          className="w-full h-full object-cover block"
          style={hasFrame ? undefined : { opacity: 0.25, filter: 'grayscale(1)' }}
        />
        {!hasFrame && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-text-secondary text-[10px] pointer-events-none">
            <span className="text-lg opacity-40">📷</span>
            <span className="opacity-50">Awaiting feed...</span>
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
        className={[
          'absolute bottom-0 left-0 right-0 bg-black/65 flex items-center gap-[5px]',
          compact ? 'py-[2px] px-[6px]' : 'py-[3px] px-[8px]',
        ].join(' ')}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass(sensor)}`} />
        <span
          className={[
            'overflow-hidden text-ellipsis whitespace-nowrap font-mono text-white/85',
            compact ? 'text-[9px]' : 'text-[10px]',
          ].join(' ')}
        >
          {sensor.sensor_id}
        </span>
        <span className="text-[10px] text-accent-teal ml-auto shrink-0">
          {sensor.modality}
        </span>
      </div>
    </div>
  )
}

// ── PTZ Controls ──────────────────────────────────────────────
interface PTZProps {
  sensorId: string
  sendMessage: (msg: object) => void
}

function PTZControls({ sensorId, sendMessage }: PTZProps) {
  const sendPTZ = useCallback(
    (command: string) => {
      sendMessage({
        type: 'PTZ_CONTROL',
        payload: { sensor_id: sensorId, command, speed: 1.0 },
      })
    },
    [sensorId, sendMessage]
  )

  const btnCls = 'w-8 h-8 flex items-center justify-center bg-bg-tertiary border border-border-color rounded cursor-pointer text-text-primary text-sm transition-all duration-100 select-none'

  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-bg-secondary border-t border-border-color shrink-0">
      <div className="text-[10px] text-text-secondary mb-0.5">PTZ: {sensorId}</div>
      <div className="grid gap-1" style={{ gridTemplateColumns: '32px 32px 32px' }}>
        <div />
        <button className={btnCls} onClick={() => sendPTZ('TILT_UP')} title="Tilt Up">↑</button>
        <div />
        <button className={btnCls} onClick={() => sendPTZ('PAN_LEFT')} title="Pan Left">←</button>
        <button className={btnCls} onClick={() => sendPTZ('STOP')} title="Stop" aria-label="Stop">■</button>
        <button className={btnCls} onClick={() => sendPTZ('PAN_RIGHT')} title="Pan Right">→</button>
        <div />
        <button className={btnCls} onClick={() => sendPTZ('TILT_DOWN')} title="Tilt Down">↓</button>
        <div />
      </div>
      <div className="flex gap-1 mt-0.5">
        <button className={btnCls} onClick={() => sendPTZ('ZOOM_IN')} title="Zoom In">+</button>
        <button className={btnCls} onClick={() => sendPTZ('ZOOM_OUT')} title="Zoom Out">−</button>
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
export function VideoPanel() {
  const sensors = useSensorStore((s) => s.sensors)
  const sendMessage = useSystemStore((s) => s.sendMessage)
  const [gridMode, setGridMode] = useState<GridMode>('2x2')
  const [selectedIdx, setSelectedIdx] = useState(0)

  const opticalSensors = Array.from(sensors.values()).filter((s) =>
    OPTICAL_MODALITIES.includes(s.modality)
  )

  const cols = GRID_COLS[gridMode]
  const visibleSensors =
    gridMode === '1x1'
      ? [opticalSensors[selectedIdx]].filter(Boolean)
      : opticalSensors.slice(0, cols * cols)

  const selectedSensor = opticalSensors[selectedIdx]

  const modeBtn = (mode: GridMode) => (
    <button
      key={mode}
      onClick={() => setGridMode(mode)}
      className={[
        'text-[10px] py-[2px] px-[7px] rounded cursor-pointer font-semibold border transition-colors',
        gridMode === mode
          ? 'border-accent-blue bg-accent-blue-dim text-accent-blue'
          : 'border-border-color bg-transparent text-text-secondary',
      ].join(' ')}
    >
      {mode}
    </button>
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="py-1 px-2 border-b border-border-color bg-bg-secondary flex items-center justify-end shrink-0 gap-1">
        <div className="flex gap-1 items-center">
          {(['1x1', '2x2', '3x3'] as GridMode[]).map(modeBtn)}
          {selectedSensor && (
            <button
              className="btn btn-ghost text-[10px] py-[2px] px-2 ml-1"
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
        className="flex-1 grid gap-[2px] p-1 overflow-hidden min-h-0"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${cols}, 1fr)`,
        }}
      >
        {opticalSensors.length === 0 ? (
          <div className="col-span-full row-span-full flex items-center justify-center flex-col gap-2 text-text-secondary text-[13px]">
            <span className="text-3xl opacity-40">📷</span>
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
        <PTZControls sensorId={selectedSensor.sensor_id} sendMessage={sendMessage} />
      )}
    </div>
  )
}
