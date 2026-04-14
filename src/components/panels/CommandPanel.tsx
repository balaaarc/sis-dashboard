import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

interface NodeStatus {
  id: string
  location: string
  health: number
  threatLevel: 'CLEAR' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  sensors: number
  sensorsOnline: number
  alerts: number
  uptime_h: number
  lastContact: number
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'
}

function useNodes() {
  const [nodes, setNodes] = useState<NodeStatus[]>(() => [
    { id: 'BOP-ALPHA-01', location: 'Sector 1 NW', health: 94, threatLevel: 'CLEAR', sensors: 8, sensorsOnline: 8, alerts: 0, uptime_h: 18, lastContact: Date.now(), status: 'ONLINE' },
    { id: 'BOP-BETA-01',  location: 'Sector 2 NE', health: 78, threatLevel: 'LOW',   sensors: 7, sensorsOnline: 6, alerts: 2, uptime_h: 14, lastContact: Date.now() - 5000, status: 'DEGRADED' },
    { id: 'BOP-GAMMA-01', location: 'Sector 3 SE', health: 99, threatLevel: 'CLEAR', sensors: 6, sensorsOnline: 6, alerts: 0, uptime_h: 22, lastContact: Date.now(), status: 'ONLINE' },
    { id: 'BOP-DELTA-01', location: 'Sector 4 SW', health: 45, threatLevel: 'MEDIUM',sensors: 5, sensorsOnline: 3, alerts: 4, uptime_h: 3,  lastContact: Date.now() - 30000, status: 'DEGRADED' },
    { id: 'BOP-ECHO-01',  location: 'Sector 5 C',  health: 0,  threatLevel: 'CLEAR', sensors: 4, sensorsOnline: 0, alerts: 0, uptime_h: 0,  lastContact: Date.now() - 180000, status: 'OFFLINE' },
  ])

  useEffect(() => {
    const iv = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          health: n.status === 'OFFLINE' ? 0 : Math.max(0, Math.min(100, n.health + (Math.random() * 4 - 2))),
          lastContact: n.status !== 'OFFLINE' ? Date.now() : n.lastContact,
          alerts: n.status !== 'OFFLINE' ? Math.max(0, n.alerts + (Math.random() < 0.05 ? 1 : Math.random() < 0.1 ? -1 : 0)) : n.alerts,
        }))
      )
    }, 3000)
    return () => clearInterval(iv)
  }, [])
  return nodes
}

const THREAT_COLOR: Record<string, string> = {
  CLEAR:    'var(--sensor-acoustic)',
  LOW:      'var(--alert-low)',
  MEDIUM:   'var(--alert-medium)',
  HIGH:     'var(--alert-high)',
  CRITICAL: 'var(--alert-critical)',
}

const STATUS_COLOR: Record<string, string> = {
  ONLINE:   'var(--sensor-acoustic)',
  DEGRADED: 'var(--alert-medium)',
  OFFLINE:  'var(--alert-critical)',
}

function NodeCard({ node }: { node: NodeStatus }) {
  const sc = STATUS_COLOR[node.status]
  const tc = THREAT_COLOR[node.threatLevel]
  const age = Math.round((Date.now() - node.lastContact) / 1000)
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${node.status !== 'ONLINE' ? sc : 'var(--border-color)'}`,
        borderTop: `2px solid ${sc}`,
        borderRadius: 6,
        padding: '8px 10px',
        opacity: node.status === 'OFFLINE' ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700 }}>{node.id}</span>
        <span style={{ fontSize: 10, color: sc, fontWeight: 700 }}>{node.status}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>{node.location}</div>

      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 6 }}>
        <div style={{ width: `${node.health}%`, height: '100%', background: sc, borderRadius: 2 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, fontSize: 10, color: 'var(--text-secondary)' }}>
        <span>Sensors: <strong style={{ color: 'var(--text-primary)' }}>{node.sensorsOnline}/{node.sensors}</strong></span>
        <span style={{ color: tc, fontWeight: node.threatLevel !== 'CLEAR' ? 700 : 400 }}>
          Threat: {node.threatLevel}
        </span>
        <span>Alerts: <strong style={{ color: node.alerts > 0 ? 'var(--alert-medium)' : 'var(--text-primary)' }}>{node.alerts}</strong></span>
        <span>Contact: {age < 60 ? `${age}s` : `${Math.floor(age / 60)}m`} ago</span>
      </div>
    </div>
  )
}

export default function CommandPanel() {
  const nodes = useNodes()
  const [tab, setTab] = useState<'nodes' | 'incident' | 'handover'>('nodes')
  const [incidentText, setIncidentText] = useState('')
  const [handoverNotes, setHandoverNotes] = useState('')
  const [sortBy, setSortBy] = useState<'status' | 'threat' | 'alerts'>('status')
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)

  const showNodes = isVisible('multiNodeOverview')
  const showIncident = isVisible('incidentReportGenerator')
  const showHandover = isVisible('shiftHandoverSummary')
  const showCibms = isVisible('cibmsNatgridFeedMonitor')

  const totalAlerts = nodes.reduce((s, n) => s + n.alerts, 0)
  const offlineCount = nodes.filter((n) => n.status === 'OFFLINE').length

  const sorted = [...nodes].sort((a, b) => {
    if (sortBy === 'status') return a.status.localeCompare(b.status)
    if (sortBy === 'threat') {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, CLEAR: 4 }
      return (order[a.threatLevel] ?? 5) - (order[b.threatLevel] ?? 5)
    }
    return b.alerts - a.alerts
  })

  const TABS = [
    ...(showNodes ? [{ id: 'nodes', label: '▣ Nodes' }] : []),
    ...(showIncident ? [{ id: 'incident', label: '📋 Incident' }] : []),
    ...(showHandover ? [{ id: 'handover', label: '📝 Handover' }] : []),
  ] as { id: typeof tab; label: string }[]

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats bar */}
      <div
        style={{
          padding: '4px 10px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          fontSize: 10,
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          Nodes: <strong style={{ color: 'var(--text-primary)' }}>{nodes.filter((n) => n.status === 'ONLINE').length}/{nodes.length}</strong>
        </span>
        {offlineCount > 0 && (
          <span style={{ color: 'var(--alert-critical)', fontWeight: 700 }}>⚠ {offlineCount} OFFLINE</span>
        )}
        {totalAlerts > 0 && (
          <span style={{ color: 'var(--alert-medium)', fontWeight: 700 }}>🔔 {totalAlerts} active alerts</span>
        )}
        {showCibms && (
          <span style={{ marginLeft: 'auto', color: 'var(--sensor-acoustic)', fontSize: 9 }}>
            ● CIBMS LINK ACTIVE
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      {TABS.length > 1 && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                background: 'transparent',
                color: tab === t.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: tab === t.id ? 700 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Nodes tab */}
        {(tab === 'nodes' || TABS.length === 0) && showNodes && (
          <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, fontSize: 10 }}>
              <span style={{ color: 'var(--text-secondary)', lineHeight: '24px' }}>Sort:</span>
              {(['status', 'threat', 'alerts'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  style={{
                    padding: '2px 8px',
                    background: sortBy === s ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    color: sortBy === s ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 10,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {sorted.map((node) => <NodeCard key={node.id} node={node} />)}
            </div>

            {/* CIBMS status */}
            {showCibms && (
              <div style={{ marginTop: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '8px 10px', fontSize: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>🔗 CIBMS / NATGRID Feed</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, color: 'var(--text-secondary)' }}>
                  <span>Queue depth: <strong style={{ color: 'var(--text-primary)' }}>3 msgs</strong></span>
                  <span>Last push: <strong style={{ color: 'var(--sensor-acoustic)' }}>2s ago</strong></span>
                  <span>Errors (24h): <strong style={{ color: 'var(--text-primary)' }}>0</strong></span>
                  <span>Schema: <strong style={{ color: 'var(--sensor-acoustic)' }}>COMPLIANT</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button style={{ padding: '3px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 9 }}>
                    ↺ Resync
                  </button>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: '20px' }}>STANAG 4607/4609</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Incident Report tab */}
        {tab === 'incident' && showIncident && (
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
              Incident Report Generator
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 10, marginBottom: 8, fontSize: 10, color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Auto-populated from live data</div>
              <div>Date/Time: {new Date().toLocaleString()}</div>
              <div>Node: BOP-ALPHA-01 | Operator: —</div>
              <div>Active alerts: {totalAlerts} | Nodes online: {nodes.filter((n) => n.status === 'ONLINE').length}/{nodes.length}</div>
              <div>Threat level: {nodes.some((n) => n.threatLevel === 'HIGH') ? 'HIGH' : 'CLEAR/LOW'}</div>
            </div>
            <textarea
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="Add narrative description of the incident..."
              style={{
                width: '100%',
                height: 100,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 11,
                padding: 8,
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button style={{ flex: 1, padding: '6px', background: 'var(--accent-blue)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>
                ⬇ Export PDF → BHQN
              </button>
              <button style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10 }}>
                📎 Attach Snapshot
              </button>
            </div>
          </div>
        )}

        {/* Shift Handover tab */}
        {tab === 'handover' && showHandover && (
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
              Shift Handover Summary
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(['8h', '12h', '24h'] as const).map((r) => (
                <button
                  key={r}
                  style={{
                    padding: '3px 10px',
                    background: r === '12h' ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    color: r === '12h' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 10,
                  }}
                >
                  Last {r}
                </button>
              ))}
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 10, marginBottom: 8, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Period Summary (Last 12h)</div>
              <div>• Total alerts: {totalAlerts + 12} (8 acknowledged, {totalAlerts + 4} pending)</div>
              <div>• Sensor faults: 2 (BOP-BETA-01: ACOUSTIC S04, BOP-DELTA-01: RADAR S12)</div>
              <div>• Tracks detected: 7 (5 ANIMAL, 1 HUMAN, 1 UNKNOWN)</div>
              <div>• UAS contacts: 1 (commercial, 450m range, logged)</div>
              <div>• GPR anomalies: 3 flagged for field verification</div>
            </div>
            <textarea
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="Key incidents and handover notes for next shift..."
              style={{
                width: '100%',
                height: 80,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 11,
                padding: 8,
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button style={{ flex: 1, padding: '6px', background: 'var(--accent-blue)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>
                ✍ Sign & Export PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
