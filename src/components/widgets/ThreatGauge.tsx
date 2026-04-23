import type { ThreatLevel } from '@/types/sensors'
import { getThreatLevelColor } from '@/utils/formatters'

interface ThreatGaugeProps {
  score: number
  level: ThreatLevel
}

// Arc parameters
const CX = 200
const CY = 200
const R = 160
const START_ANGLE = 135  // degrees
const ARC_SPAN = 270     // degrees total

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, endDeg)
  const end = polarToCartesian(cx, cy, r, startDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function getArcColor(score: number): string {
  if (score <= 30) return 'var(--sensor-acoustic)'
  if (score <= 70) return 'var(--alert-medium)'
  return 'var(--alert-critical)'
}

export function ThreatGauge({ score, level }: ThreatGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const endAngle = START_ANGLE + (clampedScore / 100) * ARC_SPAN
  const fullEnd = START_ANGLE + ARC_SPAN

  // Background arc path
  const bgArcPath = describeArc(CX, CY, R, START_ANGLE, fullEnd)
  // Colored arc path
  const arcColor = getArcColor(clampedScore)
  const colorArcPath = clampedScore > 0
    ? describeArc(CX, CY, R, START_ANGLE, endAngle)
    : ''

  // Needle
  const needleAngle = START_ANGLE + (clampedScore / 100) * ARC_SPAN
  const needleEnd = polarToCartesian(CX, CY, R - 20, needleAngle)
  const needleBase1 = polarToCartesian(CX, CY, 12, needleAngle - 90)
  const needleBase2 = polarToCartesian(CX, CY, 12, needleAngle + 90)

  const levelColor = getThreatLevelColor(level)

  return (
    <div className="gauge-container w-full">
      <svg viewBox="0 0 400 400" className="w-full max-w-[240px] h-auto">
        {/* Background arc */}
        <path
          d={bgArcPath}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={18}
          strokeLinecap="round"
        />

        {/* Colored progress arc */}
        {clampedScore > 0 && (
          <path
            d={colorArcPath}
            fill="none"
            stroke={arcColor}
            strokeWidth={18}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${arcColor})` }}
          />
        )}

        {/* Tick marks every 27 degrees (10 points) */}
        {Array.from({ length: 11 }, (_, i) => {
          const tickAngle = START_ANGLE + (i / 10) * ARC_SPAN
          const outer = polarToCartesian(CX, CY, R + 12, tickAngle)
          const inner = polarToCartesian(CX, CY, R + 5, tickAngle)
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--border-color)"
              strokeWidth={1.5}
            />
          )
        })}

        {/* Needle */}
        <polygon
          points={`${needleEnd.x},${needleEnd.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={arcColor}
          opacity={0.9}
        />

        {/* Needle center hub */}
        <circle cx={CX} cy={CY} r={10} fill="var(--bg-tertiary)" stroke={arcColor} strokeWidth={2} />

        {/* Score text */}
        <text
          x={CX}
          y={CY - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-primary)"
          fontSize={52}
          fontWeight={700}
          fontFamily="'JetBrains Mono', monospace"
        >
          {Math.round(clampedScore)}
        </text>

        {/* Level label */}
        <text
          x={CX}
          y={CY + 32}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={levelColor}
          fontSize={14}
          fontWeight={700}
          letterSpacing={2}
        >
          {level}
        </text>

        {/* Min/Max labels */}
        {(() => {
          const minPt = polarToCartesian(CX, CY, R + 22, START_ANGLE)
          const maxPt = polarToCartesian(CX, CY, R + 22, fullEnd)
          return (
            <>
              <text x={minPt.x} y={minPt.y} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>0</text>
              <text x={maxPt.x} y={maxPt.y} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>100</text>
            </>
          )
        })()}
      </svg>
    </div>
  )
}
