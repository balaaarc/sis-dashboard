// ============================================================
// IINVSYS SIS — WaveformChart.tsx
// SVG waveform chart for seismic / acoustic sensor data
// ============================================================

import React, { useMemo } from 'react'

interface WaveformChartProps {
  data: number[]
  color?: string
  height?: number
  label?: string
}

export default function WaveformChart({
  data,
  color = 'var(--sensor-seismic)',
  height = 80,
  label,
}: WaveformChartProps) {
  const WIDTH = 400
  const HEIGHT = height

  const pathD = useMemo(() => {
    if (!data || data.length < 2) return ''
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 4

    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * WIDTH
        const y = HEIGHT - padding - ((v - min) / range) * (HEIGHT - padding * 2)
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [data, HEIGHT])

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 4,
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        No waveform data
      </div>
    )
  }

  return (
    <div
      className="canvas-container"
      style={{ height: HEIGHT + (label ? 18 : 0) }}
    >
      {label && (
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.65)',
            padding: '2px 6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </div>
      )}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: HEIGHT, display: 'block' }}
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            y1={HEIGHT * f}
            x2={WIDTH}
            y2={HEIGHT * f}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
        ))}
        {/* Zero line */}
        <line
          x1={0}
          y1={HEIGHT / 2}
          x2={WIDTH}
          y2={HEIGHT / 2}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {/* Waveform path */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        />
        {/* Glow fill */}
        <path
          d={`${pathD} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`}
          fill={color}
          fillOpacity={0.08}
        />
      </svg>
    </div>
  )
}
