import { useSystemStore } from '@/store/systemStore'
import type { ScenarioType } from '@/types/sensors'

const REST_URL = import.meta.env.VITE_SSE_REST_URL ?? 'http://localhost:4001'

const SCENARIO_COLORS: Record<ScenarioType, string> = {
  NORMAL:          '#64748B',
  ELEVATED:        '#EAB308',
  INTRUSION:       '#EF4444',
  TUNNEL_ACTIVITY: '#F97316',
  DRONE:           '#3B82F6',
  VEHICLE_CONVOY:  '#8B5CF6',
}

const ALL_SCENARIOS: ScenarioType[] = [
  'NORMAL',
  'ELEVATED',
  'INTRUSION',
  'TUNNEL_ACTIVITY',
  'DRONE',
  'VEHICLE_CONVOY',
]

export function ScenarioSelector() {
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
    } catch {
      // Failed to POST scenario to server — local state already updated
    }
  }

  const color = SCENARIO_COLORS[scenario] ?? '#64748B'

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold text-text-secondary tracking-[0.08em] shrink-0">
        THREAT
      </span>
      <span
        className="w-2 h-2 rounded-full shrink-0 inline-block"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <select
        value={scenario}
        onChange={handleChange}
        className="bg-bg-secondary border border-border-color rounded-md px-2 h-8 text-[11px] font-bold tracking-[0.06em] cursor-pointer"
        style={{ color }}
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
