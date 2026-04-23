// ============================================================
// IINVSYS SIS — WaveformChart.tsx
// SVG waveform chart for seismic / acoustic sensor data
// ============================================================

import { useMemo } from 'react'

interface WaveformChartProps {
  data: number[]
  color?: string
  height?: number
  label?: string
}

export function WaveformChart({
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
        className="flex items-center justify-center bg-black/20 rounded text-[11px] text-text-secondary"
        style={{ height: HEIGHT }}
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
        <div className="text-[10px] text-white/[0.65] py-[2px] px-1.5 uppercase tracking-[0.05em]">
          {label}
        </div>
      )}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: HEIGHT }}
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
