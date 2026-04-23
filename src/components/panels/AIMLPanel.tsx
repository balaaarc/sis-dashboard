import React, { useMemo, useState, useEffect } from 'react'
import { useSensorStore } from '@/store/sensorStore'
import { useAlertStore } from '@/store/alertStore'
import { useSettingsStore } from '@/store/settingsStore'
import { ThreatGauge } from '@/components/widgets/ThreatGauge'
import { RadarScope } from '@/components/widgets/RadarScope'
import { getThreatLevelColor, formatRelativeTime } from '@/utils/formatters'
import type { ThreatLevel } from '@/types/sensors'

// ── Fusion Event Log widget ──
interface FusionEvent {
  id: string
  timestamp: string
  scenario: string
  confidence: number
  tier: 'HIGH' | 'MEDIUM' | 'LOW'
  sensors: string[]
  decision: string
}

function useFusionEvents() {
  const [events, setEvents] = useState<FusionEvent[]>([])
  useEffect(() => {
    const SCENARIOS = ['INTRUSION_DETECTED', 'ANIMAL_CROSSING', 'VEHICLE_APPROACH', 'TUNNEL_VIBRATION', 'PERIMETER_BREACH']
    const DECISIONS = ['ESCALATE — alert QRT', 'MONITOR — continue surveillance', 'FALSE_ALARM — sensor noise', 'INVESTIGATE — dispatch patrol']
    const add = () => {
      if (Math.random() < 0.4) {
        const conf = 0.5 + Math.random() * 0.49
        setEvents((prev) => [{
          id: Math.random().toString(36).slice(2, 8).toUpperCase(),
          timestamp: new Date().toISOString(),
          scenario: SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)],
          confidence: conf,
          tier: (conf > 0.8 ? 'HIGH' : conf > 0.6 ? 'MEDIUM' : 'LOW') as FusionEvent['tier'],
          sensors: Array.from({ length: Math.ceil(Math.random() * 4) }, (_, i) => `S${String(Math.ceil(Math.random() * 20)).padStart(2, '0')}-${['GEO', 'ACU', 'THR', 'RAD'][i % 4]}`),
          decision: DECISIONS[Math.floor(Math.random() * DECISIONS.length)],
        }, ...prev].slice(0, 30))
      }
    }
    add()
    const iv = setInterval(add, 6000)
    return () => clearInterval(iv)
  }, [])
  return events
}

// ── Anomaly Score Gauge widget ──
function useAnomalyScores() {
  const [scores, setScores] = useState({ isolationForest: 0.12, lstm: 0.08, combined: 0.10 })
  useEffect(() => {
    const iv = setInterval(() => {
      setScores((prev) => {
        const iso = Math.max(0, Math.min(1, prev.isolationForest + (Math.random() * 0.06 - 0.03)))
        const lstm = Math.max(0, Math.min(1, prev.lstm + (Math.random() * 0.06 - 0.03)))
        return { isolationForest: iso, lstm, combined: (iso + lstm) / 2 }
      })
    }, 2000)
    return () => clearInterval(iv)
  }, [])
  return scores
}

function AnomalyArc({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 30, cx = 40, cy = 40
  const startAngle = -200, sweep = 220
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (a: number) => cx + r * Math.cos(toRad(a))
  const arcY = (a: number) => cy + r * Math.sin(toRad(a))
  const angle = startAngle + value * sweep
  const largeArc = value * sweep > 180 ? 1 : 0
  return (
    <div className="flex flex-col items-center">
      <svg width={80} height={72}>
        <path d={`M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(startAngle + sweep)} ${arcY(startAngle + sweep)}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} strokeLinecap="round" />
        {value > 0 && <path d={`M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${arcX(angle)} ${arcY(angle)}`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />}
        <text x={cx} y={cx - 2} textAnchor="middle" fill={color} fontSize={14} fontWeight={700} fontFamily="monospace">{(value * 100).toFixed(0)}</text>
        <text x={cx} y={cx + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={8}>/ 100</text>
      </svg>
      <span className="text-[10px] text-text-secondary -mt-2">{label}</span>
    </div>
  )
}

const TRACK_CLASS_COLORS: Record<string, string> = {
  HUMAN: '#3B82F6',
  VEHICLE: '#F97316',
  ANIMAL: '#10B981',
  UNKNOWN: '#94A3B8',
}

export function AIMLPanel() {
  const tracks = useSensorStore((s) => s.tracks)
  const threatAssessment = useAlertStore((s) => s.threatAssessment)
  const alerts = useAlertStore((s) => s.alerts)
  const [activeTab, setActiveTab] = useState<'intel' | 'fusion' | 'anomaly'>('intel')
  const fusionEvents = useFusionEvents()
  const anomalyScores = useAnomalyScores()
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)

  const recentAlerts = useMemo(() => alerts.slice(0, 5), [alerts])
  const threatScore = threatAssessment?.threat_score ?? 0
  const threatLevel: ThreatLevel = threatAssessment?.threat_level ?? 'CLEAR'
  const levelColor = getThreatLevelColor(threatLevel)

  const trackBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    tracks.forEach((t) => { counts[t.class] = (counts[t.class] ?? 0) + 1 })
    return counts
  }, [tracks])

  const showFusion   = isVisible('fusionEventLog')
  const showAnomaly  = isVisible('anomalyScoreGauge')
  const showTraj     = isVisible('trajectoryPrediction')

  const TABS = [
    { id: 'intel',   label: '🤖 Intel'  },
    ...(showFusion  ? [{ id: 'fusion',  label: `🔗 Fusion (${fusionEvents.length})` }] : []),
    ...(showAnomaly ? [{ id: 'anomaly', label: '📈 Anomaly' }] : []),
  ] as { id: typeof activeTab; label: string }[]

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="px-3 py-1 border-b border-border-color bg-bg-secondary flex items-center justify-end shrink-0 gap-2 text-[10px]">
        <span className="text-text-secondary">
          Tracks:{' '}
          <strong className="text-text-primary">{tracks.length}</strong>
        </span>
        {threatAssessment && (
          <span className="text-text-secondary">
            v{threatAssessment.model_version}
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      {TABS.length > 1 && (
        <div className="flex border-b border-border-color shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={[
                'flex-1 py-[5px] px-1 border-none bg-transparent cursor-pointer text-[10px] whitespace-nowrap',
                activeTab === t.id
                  ? 'border-b-2 border-accent-blue text-accent-blue font-bold'
                  : 'border-b-2 border-transparent text-text-secondary font-normal',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Fusion Event Log tab */}
      {activeTab === 'fusion' && showFusion && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-2">
            {fusionEvents.length === 0 ? (
              <div className="text-center py-6 text-text-secondary text-[11px]">Awaiting fusion events...</div>
            ) : fusionEvents.map((ev) => {
              const tierColor = ev.tier === 'HIGH' ? 'var(--alert-critical)' : ev.tier === 'MEDIUM' ? 'var(--alert-medium)' : 'var(--alert-low)'
              return (
                <div
                  key={ev.id}
                  className="bg-bg-secondary border border-border-color rounded mb-[5px] px-2 py-1.5"
                  style={{ borderLeft: `3px solid ${tierColor}` }}
                >
                  <div className="flex justify-between text-[10px] mb-[3px]">
                    <span className="font-bold" style={{ color: tierColor }}>{ev.scenario}</span>
                    <span className="text-text-secondary">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[10px] text-text-secondary mb-[3px]">
                    Sensors: {ev.sensors.join(', ')} · Conf: <strong className="text-text-primary">{(ev.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="text-[10px] font-semibold" style={{ color: tierColor }}>⚡ {ev.decision}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Anomaly Score Gauge tab */}
      {activeTab === 'anomaly' && showAnomaly && (
        <div className="flex-1 min-h-0 overflow-y-auto p-[10px]">
          <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-[10px]">
            Anomaly Detection Scores
          </div>
          <div className="flex justify-around mb-3">
            <AnomalyArc value={anomalyScores.isolationForest} label="Isolation Forest" color={anomalyScores.isolationForest > 0.5 ? 'var(--alert-critical)' : anomalyScores.isolationForest > 0.3 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'} />
            <AnomalyArc value={anomalyScores.lstm} label="LSTM" color={anomalyScores.lstm > 0.5 ? 'var(--alert-critical)' : anomalyScores.lstm > 0.3 ? 'var(--alert-medium)' : 'var(--accent-blue)'} />
            <AnomalyArc value={anomalyScores.combined} label="Combined" color={anomalyScores.combined > 0.5 ? 'var(--alert-critical)' : anomalyScores.combined > 0.3 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'} />
          </div>
          <div className="bg-bg-secondary border border-border-color rounded-md p-[10px] text-[10px]">
            <div className="flex justify-between mb-1.5 text-text-secondary">
              <span>Amber threshold</span>
              <span className="text-alert-medium font-mono">30</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Red threshold</span>
              <span className="text-alert-critical font-mono">50</span>
            </div>
          </div>
          {showTraj && tracks.length > 0 && (
            <div className="mt-[10px]">
              <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-1.5">
                Trajectory Predictions
              </div>
              {tracks.slice(0, 3).map((t) => (
                <div key={t.track_id} className="flex justify-between text-[10px] py-1 border-b border-[rgba(255,255,255,0.04)] text-text-secondary">
                  <span className="font-mono text-accent-teal">{t.track_id.slice(-8)}</span>
                  <span>{t.class} · {t.heading.toFixed(0)}° · {t.velocity.toFixed(1)} m/s</span>
                  <span className="text-accent-blue">→ {(t.range_m + t.velocity * 5).toFixed(0)}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Intelligence tab (existing content) */}
      {(activeTab === 'intel' || TABS.length === 1) && (
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {/* Top section: gauge + radar side by side */}
        <div className="flex gap-2 p-2 shrink-0">
          {/* Threat gauge */}
          <div className="flex flex-col items-center gap-1 flex-none w-40">
            <div className="text-[10px] text-text-secondary tracking-[0.1em] uppercase font-bold">
              Threat Score
            </div>
            <ThreatGauge score={threatScore} level={threatLevel} />
            {threatAssessment && (
              <div className="text-[10px] text-text-secondary text-center">
                {formatRelativeTime(threatAssessment.timestamp)}
              </div>
            )}
          </div>

          {/* Radar scope */}
          <div className="flex-1 flex flex-col items-center min-w-0">
            <div className="text-[10px] text-text-secondary tracking-[0.1em] uppercase font-bold mb-1">
              PPI Radar
            </div>
            <div className="w-full max-w-[220px]">
              <RadarScope tracks={tracks} maxRange={2000} size={220} />
            </div>
          </div>
        </div>

        {/* Track breakdown */}
        {tracks.length > 0 && (
          <div className="px-3 pb-2 pt-1 shrink-0">
            <div className="text-[10px] text-text-secondary tracking-[0.1em] uppercase font-bold mb-1.5">
              Track Classification
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(trackBreakdown).map(([cls, count]) => {
                const color = TRACK_CLASS_COLORS[cls] ?? '#94A3B8'
                const pct = ((count / tracks.length) * 100).toFixed(0)
                return (
                  <div key={cls} className="flex items-center gap-[5px]">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: color, boxShadow: `0 0 4px ${color}` }}
                    />
                    <span className="text-[10px] text-text-secondary">
                      {cls}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Track table */}
        {tracks.length > 0 && (
          <div className="px-2 pb-2 shrink-0">
            <div className="text-[10px] text-text-secondary tracking-[0.1em] uppercase font-bold mb-1">
              Active Tracks
            </div>
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-0 text-[10px] font-mono">
              {/* Header */}
              {['Track ID', 'Class', 'Hdg', 'Vel', 'Conf'].map((h) => (
                <div
                  key={h}
                  className="px-1.5 py-[3px] text-text-secondary font-bold tracking-[0.06em] border-b border-border-color uppercase"
                >
                  {h}
                </div>
              ))}
              {/* Rows */}
              {tracks.slice(0, 8).map((track) => {
                const color = TRACK_CLASS_COLORS[track.class] ?? '#94A3B8'
                return (
                  <React.Fragment key={track.track_id}>
                    <div className="px-1.5 py-[3px] text-accent-teal border-b border-bg-tertiary">
                      {track.track_id.slice(-8)}
                    </div>
                    <div className="px-1.5 py-[3px] font-bold border-b border-bg-tertiary" style={{ color }}>
                      {track.class.charAt(0)}
                    </div>
                    <div className="px-1.5 py-[3px] text-text-primary border-b border-bg-tertiary">
                      {track.heading.toFixed(0)}°
                    </div>
                    <div className="px-1.5 py-[3px] text-text-primary border-b border-bg-tertiary">
                      {track.velocity.toFixed(1)}
                    </div>
                    <div
                      className="px-1.5 py-[3px] border-b border-bg-tertiary"
                      style={{ color: track.confidence > 0.7 ? 'var(--sensor-acoustic)' : 'var(--alert-medium)' }}
                    >
                      {(track.confidence * 100).toFixed(0)}%
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
            {tracks.length > 8 && (
              <div className="text-[10px] text-text-secondary px-1.5 py-1">
                +{tracks.length - 8} more tracks
              </div>
            )}
          </div>
        )}

        {/* Threat details */}
        {threatAssessment && (
          <div
            className="mx-2 mb-2 p-[10px] rounded-md shrink-0"
            style={{
              background: `${levelColor}11`,
              border: `1px solid ${levelColor}33`,
            }}
          >
            <div className="text-[10px] font-bold tracking-[0.08em] uppercase mb-1.5" style={{ color: levelColor }}>
              Threat Assessment
            </div>
            <div className="text-[10px] text-text-secondary leading-[1.7]">
              <div>
                <span className="text-text-secondary">Location: </span>
                <span className="text-text-primary font-mono">
                  {threatAssessment.location.lat.toFixed(4)}°N, {threatAssessment.location.lon.toFixed(4)}°E
                </span>
                <span className="text-text-secondary ml-1.5">
                  ±{threatAssessment.location.accuracy_m}m
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Dominant: </span>
                <span className="text-accent-teal">{threatAssessment.dominant_modality}</span>
              </div>
              <div className="font-medium mt-1" style={{ color: levelColor }}>
                ⚡ {threatAssessment.recommended_action}
              </div>
            </div>
          </div>
        )}

        {/* Recent alerts mini-list */}
        {recentAlerts.length > 0 && (
          <div className="px-2 pb-2 flex-1 min-h-0 overflow-auto">
            <div className="text-[10px] text-text-secondary tracking-[0.1em] uppercase font-bold mb-1">
              Recent Events
            </div>
            {recentAlerts.map((alert) => {
              const color = getThreatLevelColor(alert.threat_level)
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 px-1.5 py-1 rounded mb-0.5"
                  style={{ background: alert.acknowledged ? 'transparent' : `${color}0A` }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-[10px] text-text-primary flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {alert.classification}
                  </span>
                  <span className="text-[10px] text-text-secondary shrink-0">
                    {formatRelativeTime(alert.timestamp)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {tracks.length === 0 && !threatAssessment && (
          <div className="no-data flex-1">
            <span className="no-data-icon">🤖</span>
            <span>Awaiting AI/ML data...</span>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
