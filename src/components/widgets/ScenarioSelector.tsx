import { useSystemStore } from '../../store/systemStore'
import type { ScenarioType } from '../../types/sensors'

const REST_URL = import.meta.env.VITE_SSE_REST_URL ?? 'http://localhost:4001'

const SCENARIO_COLORS: Record<ScenarioType, string> = {
  NORMAL: '#64748B',
  ELEVATED: '#EAB308',
  INTRUSION: '#EF4444',
  TUNNEL_ACTIVITY: '#F97316',
  DRONE: '#3B82F6',
  VEHICLE_CONVOY: '#8B5CF6',
}

const ALL_SCENARIOS: ScenarioType[] = [
  'NORMAL',
  'ELEVATED',
  'INTRUSION',
  'TUNNEL_ACTIVITY',
  'DRONE',
  'VEHICLE_CONVOY',
]

export default function ScenarioSelector() {
  const scenario = useSystemStore((s) => s.scenario)
  const setScenario = useSystemStore((s) => s.setScenario)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as ScenarioType
    setScenario(next)
    try {
      await fetch(`${REST_URL}/api/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: next }),
      })
    } catch (err) {
      console.warn('[ScenarioSelector] Failed to POST scenario:', err)
    }
  }

  const color = SCENARIO_COLORS[scenario] ?? '#64748B'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', flexShrink: 0 }}>
        THREAT
      </span>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      <select
        value={scenario}
        onChange={handleChange}
        style={{
          background: 'var(--bg-secondary)',
          color: color,
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          padding: '0 8px',
          height: 32,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          cursor: 'pointer',
        }}
      >
        {ALL_SCENARIOS.map((s) => (
          <option key={s} value={s} style={{ color: SCENARIO_COLORS[s] }}>
            {s.replace('_', ' ')}
          </option>
        ))}
      </select>
    </div>
  )
}
