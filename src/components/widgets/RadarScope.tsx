// ============================================================
// IINVSYS SIS — RadarScope.tsx
// Animated PPI radar scope showing tracks
// ============================================================

import { useEffect, useRef } from 'react'
import type { Track } from '@/types/sensors'

interface RadarScopeProps {
  tracks: Track[]
  maxRange?: number   // metres — tracks beyond this are clamped at edge
  size?: number       // px diameter
}

function trackColor(cls: Track['class']): string {
  switch (cls) {
    case 'HUMAN':   return '#3B82F6'
    case 'VEHICLE': return '#F97316'
    case 'ANIMAL':  return '#10B981'
    default:        return '#94A3B8'
  }
}

// Convert track range/heading into (x, y) on scope relative to centre
function trackToXY(track: Track, cx: number, cy: number, r: number, maxRange: number): [number, number] {
  const normRange = Math.min(track.range_m, maxRange) / maxRange
  const headingRad = (track.heading - 90) * (Math.PI / 180) // 0° = north = top
  const x = cx + normRange * r * Math.cos(headingRad)
  const y = cy + normRange * r * Math.sin(headingRad)
  return [x, y]
}

export function RadarScope({ tracks, maxRange = 1000, size = 260 }: RadarScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sweepAngleRef = useRef(0)
  const animRef = useRef<number>()

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 10

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    const draw = () => {
      if (!running) return

      sweepAngleRef.current = (sweepAngleRef.current + 1.2) % 360
      const sweep = sweepAngleRef.current
      const sweepRad = (sweep - 90) * (Math.PI / 180)

      ctx.clearRect(0, 0, size, size)

      // Background
      ctx.fillStyle = '#040d1a'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()

      // Range rings
      for (let i = 1; i <= 4; i++) {
        const ringR = (r * i) / 4
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(16,185,129,0.15)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      // Cardinal lines
      ctx.strokeStyle = 'rgba(16,185,129,0.1)'
      ctx.lineWidth = 0.8
      for (let a = 0; a < 360; a += 45) {
        const rad = (a - 90) * (Math.PI / 180)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + r * Math.cos(rad), cy + r * Math.sin(rad))
        ctx.stroke()
      }

      // Sweep trail (gradient sector)
      const trailSpan = 60 * (Math.PI / 180)
      const sweepStart = sweepRad - trailSpan
      // No conical gradient in Canvas2D — simulate with arc + fill

      // Simulate sweep trail with multiple arcs
      const TRAIL_STEPS = 20
      for (let i = 0; i < TRAIL_STEPS; i++) {
        const frac = i / TRAIL_STEPS
        const alpha = frac * 0.18
        const aStart = sweepStart + frac * trailSpan
        const aEnd = sweepStart + (frac + 1 / TRAIL_STEPS) * trailSpan
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, aStart, aEnd)
        ctx.closePath()
        ctx.fillStyle = `rgba(16,185,129,${alpha})`
        ctx.fill()
      }

      // Sweep line
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + r * Math.cos(sweepRad), cy + r * Math.sin(sweepRad))
      ctx.strokeStyle = 'rgba(16,185,129,0.9)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Outer ring border
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(16,185,129,0.4)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Tracks
      tracks.forEach((track) => {
        const [tx, ty] = trackToXY(track, cx, cy, r, maxRange)
        const color = trackColor(track.class)

        // Blip glow
        ctx.beginPath()
        ctx.arc(tx, ty, 6, 0, Math.PI * 2)
        ctx.fillStyle = color + '40'
        ctx.fill()

        // Blip core
        ctx.beginPath()
        ctx.arc(tx, ty, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.shadowBlur = 8
        ctx.shadowColor = color
        ctx.fill()
        ctx.shadowBlur = 0

        // Velocity vector (small line in heading direction)
        const headingRad = (track.heading - 90) * (Math.PI / 180)
        const vecLen = Math.min(track.velocity * 0.6, 20)
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(tx + vecLen * Math.cos(headingRad), ty + vecLen * Math.sin(headingRad))
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Centre dot
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#10B981'
      ctx.fill()

      // Compass labels
      ctx.fillStyle = 'rgba(16,185,129,0.6)'
      ctx.font = '10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('N', cx, cy - r + 12)
      ctx.fillText('S', cx, cy + r - 4)
      ctx.textAlign = 'left'
      ctx.fillText('E', cx + r - 10, cy + 4)
      ctx.textAlign = 'right'
      ctx.fillText('W', cx - r + 10, cy + 4)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      running = false
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [tracks, maxRange, size, cx, cy, r])

  return (
    <div
      className="radar-container shrink-0"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full block"
      />
    </div>
  )
}
