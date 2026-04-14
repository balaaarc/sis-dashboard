import React, { useMemo, useState, useEffect } from 'react'
import { useSensorStore } from '../../store/sensorStore'
import { useAlertStore } from '../../store/alertStore'
import { useSettingsStore } from '../../store/settingsStore'
import ThreatGauge from '../widgets/ThreatGauge'
import RadarScope from '../widgets/RadarScope'
import { getThreatLevelColor, formatRelativeTime } from '../../utils/formatters'
import type { ThreatLevel } from '../../types/sensors'

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
          tier: conf > 0.8 ? 'HIGH' : conf > 0.6 ? 'MEDIUM' : 'LOW',
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={80} height={72}>
        <path d={`M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(startAngle + sweep)} ${arcY(startAngle + sweep)}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} strokeLinecap="round" />
        {value > 0 && <path d={`M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${arcX(angle)} ${arcY(angle)}`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />}
        <text x={cx} y={cx - 2} textAnchor="middle" fill={color} fontSize={14} fontWeight={700} fontFamily="monospace">{(value * 100).toFixed(0)}</text>
        <text x={cx} y={cx + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={8}>/ 100</text>
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: -8 }}>{label}</span>
    </div>
  )
}

const TRACK_CLASS_COLORS: Record<string, string> = {
  HUMAN: '#3B82F6',
  VEHICLE: '#F97316',
  ANIMAL: '#10B981',
  UNKNOWN: '#94A3B8',
}

export default function AIMLPanel() {
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
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats bar */}
      <div
        style={{
          padding: '4px 12px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexShrink: 0,
          gap: 8,
          fontSize: 10,
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          Tracks:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{tracks.length}</strong>
        </span>
        {threatAssessment && (
          <span style={{ color: 'var(--text-secondary)' }}>
            v{threatAssessment.model_version}
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      {TABS.length > 1 && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                padding: '5px 4px',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === t.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: activeTab === t.id ? 700 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Fusion Event Log tab */}
      {activeTab === 'fusion' && showFusion && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div style={{ padding: 8 }}>
            {fusionEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 11 }}>Awaiting fusion events...</div>
            ) : fusionEvents.map((ev) => {
              const tierColor = ev.tier === 'HIGH' ? 'var(--alert-critical)' : ev.tier === 'MEDIUM' ? 'var(--alert-medium)' : 'var(--alert-low)'
              return (
                <div key={ev.id} style={{ background: 'var(--bg-secondary)', border: `1px solid var(--border-color)`, borderLeft: `3px solid ${tierColor}`, borderRadius: 4, padding: '6px 8px', marginBottom: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: tierColor }}>{ev.scenario}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3 }}>
                    Sensors: {ev.sensors.join(', ')} · Conf: <strong style={{ color: 'var(--text-primary)' }}>{(ev.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div style={{ fontSize: 10, color: tierColor, fontWeight: 600 }}>⚡ {ev.decision}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Anomaly Score Gauge tab */}
      {activeTab === 'anomaly' && showAnomaly && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10 }}>
            Anomaly Detection Scores
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
            <AnomalyArc value={anomalyScores.isolationForest} label="Isolation Forest" color={anomalyScores.isolationForest > 0.5 ? 'var(--alert-critical)' : anomalyScores.isolationForest > 0.3 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'} />
            <AnomalyArc value={anomalyScores.lstm} label="LSTM" color={anomalyScores.lstm > 0.5 ? 'var(--alert-critical)' : anomalyScores.lstm > 0.3 ? 'var(--alert-medium)' : 'var(--accent-blue)'} />
            <AnomalyArc value={anomalyScores.combined} label="Combined" color={anomalyScores.combined > 0.5 ? 'var(--alert-critical)' : anomalyScores.combined > 0.3 ? 'var(--alert-medium)' : 'var(--sensor-acoustic)'} />
          </div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 10, fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--text-secondary)' }}>
              <span>Amber threshold</span>
              <span style={{ color: 'var(--alert-medium)', fontFamily: 'monospace' }}>30</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Red threshold</span>
              <span style={{ color: 'var(--alert-critical)', fontFamily: 'monospace' }}>50</span>
            </div>
          </div>
          {showTraj && tracks.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                Trajectory Predictions
              </div>
              {tracks.slice(0, 3).map((t) => (
                <div key={t.track_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                  <span style={{ fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{t.track_id.slice(-8)}</span>
                  <span>{t.class} · {t.heading.toFixed(0)}° · {t.velocity.toFixed(1)} m/s</span>
                  <span style={{ color: 'var(--accent-blue)' }}>→ {(t.range_m + t.velocity * 5).toFixed(0)}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Intelligence tab (existing content) */}
      {(activeTab === 'intel' || TABS.length === 1) && (
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Top section: gauge + radar side by side */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: 8,
            flexShrink: 0,
          }}
        >
          {/* Threat gauge */}
          <div
            style={{
              flex: '0 0 160px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
              Threat Score
            </div>
            <ThreatGauge score={threatScore} level={threatLevel} />
            {threatAssessment && (
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>
                {formatRelativeTime(threatAssessment.timestamp)}
              </div>
            )}
          </div>

          {/* Radar scope */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 0,
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
              PPI Radar
            </div>
            <div style={{ width: '100%', maxWidth: 220 }}>
              <RadarScope tracks={tracks} maxRange={2000} size={220} />
            </div>
          </div>
        </div>

        {/* Track breakdown */}
        {tracks.length > 0 && (
          <div style={{ padding: '4px 12px 8px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
              Track Classification
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(trackBreakdown).map(([cls, count]) => {
                const color = TRACK_CLASS_COLORS[cls] ?? '#94A3B8'
                const pct = ((count / tracks.length) * 100).toFixed(0)
                return (
                  <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: color,
                        display: 'inline-block',
                        boxShadow: `0 0 4px ${color}`,
                      }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      {cls}
                    </span>
                    <span style={{ fontSize: 10, color, fontWeight: 700 }}>
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
          <div style={{ padding: '0 8px 8px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
              Active Tracks
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                gap: 0,
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            >
              {/* Header */}
              {['Track ID', 'Class', 'Hdg', 'Vel', 'Conf'].map((h) => (
                <div
                  key={h}
                  style={{
                    padding: '3px 6px',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    borderBottom: '1px solid var(--border-color)',
                    textTransform: 'uppercase',
                  }}
                >
                  {h}
                </div>
              ))}
              {/* Rows */}
              {tracks.slice(0, 8).map((track, i) => {
                const color = TRACK_CLASS_COLORS[track.class] ?? '#94A3B8'
                return (
                  <React.Fragment key={track.track_id}>
                    <div style={{ padding: '3px 6px', color: 'var(--accent-teal)', borderBottom: '1px solid var(--bg-tertiary)' }}>
                      {track.track_id.slice(-8)}
                    </div>
                    <div style={{ padding: '3px 6px', color, fontWeight: 700, borderBottom: '1px solid var(--bg-tertiary)' }}>
                      {track.class.charAt(0)}
                    </div>
                    <div style={{ padding: '3px 6px', color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-tertiary)' }}>
                      {track.heading.toFixed(0)}°
                    </div>
                    <div style={{ padding: '3px 6px', color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-tertiary)' }}>
                      {track.velocity.toFixed(1)}
                    </div>
                    <div style={{ padding: '3px 6px', color: track.confidence > 0.7 ? 'var(--sensor-acoustic)' : 'var(--alert-medium)', borderBottom: '1px solid var(--bg-tertiary)' }}>
                      {(track.confidence * 100).toFixed(0)}%
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
            {tracks.length > 8 && (
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', padding: '4px 6px' }}>
                +{tracks.length - 8} more tracks
              </div>
            )}
          </div>
        )}

        {/* Threat details */}
        {threatAssessment && (
          <div
            style={{
              margin: '0 8px 8px',
              padding: 10,
              background: `${levelColor}11`,
              border: `1px solid ${levelColor}33`,
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 10, color: levelColor, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Threat Assessment
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Location: </span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {threatAssessment.location.lat.toFixed(4)}°N, {threatAssessment.location.lon.toFixed(4)}°E
                </span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>
                  ±{threatAssessment.location.accuracy_m}m
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Dominant: </span>
                <span style={{ color: 'var(--accent-teal)' }}>{threatAssessment.dominant_modality}</span>
              </div>
              <div style={{ color: levelColor, fontWeight: 500, marginTop: 4 }}>
                ⚡ {threatAssessment.recommended_action}
              </div>
            </div>
          </div>
        )}

        {/* Recent alerts mini-list */}
        {recentAlerts.length > 0 && (
          <div style={{ padding: '0 8px 8px', flex: 1, minHeight: 0, overflow: 'auto' }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
              Recent Events
            </div>
            {recentAlerts.map((alert) => {
              const color = getThreatLevelColor(alert.threat_level)
              return (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 6px',
                    borderRadius: 4,
                    marginBottom: 2,
                    background: alert.acknowledged ? 'transparent' : `${color}0A`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {alert.classification}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {formatRelativeTime(alert.timestamp)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {tracks.length === 0 && !threatAssessment && (
          <div className="no-data" style={{ flex: 1 }}>
            <span className="no-data-icon">🤖</span>
            <span>Awaiting AI/ML data...</span>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
