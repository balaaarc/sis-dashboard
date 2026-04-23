import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

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
    { id: 'BOP-ALPHA-01', location: 'Sector 1 NW', health: 94, threatLevel: 'CLEAR',  sensors: 8, sensorsOnline: 8, alerts: 0, uptime_h: 18, lastContact: Date.now(),         status: 'ONLINE' },
    { id: 'BOP-BETA-01',  location: 'Sector 2 NE', health: 78, threatLevel: 'LOW',    sensors: 7, sensorsOnline: 6, alerts: 2, uptime_h: 14, lastContact: Date.now() - 5000,  status: 'DEGRADED' },
    { id: 'BOP-GAMMA-01', location: 'Sector 3 SE', health: 99, threatLevel: 'CLEAR',  sensors: 6, sensorsOnline: 6, alerts: 0, uptime_h: 22, lastContact: Date.now(),         status: 'ONLINE' },
    { id: 'BOP-DELTA-01', location: 'Sector 4 SW', health: 45, threatLevel: 'MEDIUM', sensors: 5, sensorsOnline: 3, alerts: 4, uptime_h: 3,  lastContact: Date.now() - 30000, status: 'DEGRADED' },
    { id: 'BOP-ECHO-01',  location: 'Sector 5 C',  health: 0,  threatLevel: 'CLEAR',  sensors: 4, sensorsOnline: 0, alerts: 0, uptime_h: 0,  lastContact: Date.now() - 180000,status: 'OFFLINE' },
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
      className={`bg-bg-secondary rounded-md px-[10px] py-2 ${node.status === 'OFFLINE' ? 'opacity-60' : ''}`}
      style={{
        border: `1px solid ${node.status !== 'ONLINE' ? sc : 'var(--border-color)'}`,
        borderTop: `2px solid ${sc}`,
      }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold">{node.id}</span>
        <span className="text-[10px] font-bold" style={{ color: sc }}>{node.status}</span>
      </div>
      <div className="text-[10px] text-text-secondary mb-1.5">{node.location}</div>

      <div className="h-1 bg-[rgba(255,255,255,0.08)] rounded-[2px] mb-1.5">
        <div className="h-full rounded-[2px]" style={{ width: `${node.health}%`, background: sc }} />
      </div>

      <div className="grid grid-cols-2 gap-[3px] text-[10px] text-text-secondary">
        <span>Sensors: <strong className="text-text-primary">{node.sensorsOnline}/{node.sensors}</strong></span>
        <span className={node.threatLevel !== 'CLEAR' ? 'font-bold' : ''} style={{ color: tc }}>
          Threat: {node.threatLevel}
        </span>
        <span>Alerts: <strong style={{ color: node.alerts > 0 ? 'var(--alert-medium)' : 'var(--text-primary)' }}>{node.alerts}</strong></span>
        <span>Contact: {age < 60 ? `${age}s` : `${Math.floor(age / 60)}m`} ago</span>
      </div>
    </div>
  )
}

const textareaClass = 'w-full bg-bg-secondary border border-border-color rounded-md text-text-primary text-[11px] p-2 resize-y font-[inherit] box-border'

export function CommandPanel() {
  const nodes = useNodes()
  const [tab, setTab] = useState<'nodes' | 'incident' | 'handover'>('nodes')
  const [incidentText, setIncidentText] = useState('')
  const [handoverNotes, setHandoverNotes] = useState('')
  const [sortBy, setSortBy] = useState<'status' | 'threat' | 'alerts'>('status')
  const isVisible = useSettingsStore((s) => s.isWidgetVisible)

  const showNodes    = isVisible('multiNodeOverview')
  const showIncident = isVisible('incidentReportGenerator')
  const showHandover = isVisible('shiftHandoverSummary')
  const showCibms    = isVisible('cibmsNatgridFeedMonitor')

  const totalAlerts  = nodes.reduce((s, n) => s + n.alerts, 0)
  const offlineCount = nodes.filter((n) => n.status === 'OFFLINE').length

  const sorted = [...nodes].sort((a, b) => {
    if (sortBy === 'status') return a.status.localeCompare(b.status)
    if (sortBy === 'threat') {
      const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, CLEAR: 4 }
      return (order[a.threatLevel] ?? 5) - (order[b.threatLevel] ?? 5)
    }
    return b.alerts - a.alerts
  })

  const TABS = [
    ...(showNodes    ? [{ id: 'nodes',    label: '▣ Nodes'    }] : []),
    ...(showIncident ? [{ id: 'incident', label: '📋 Incident' }] : []),
    ...(showHandover ? [{ id: 'handover', label: '📝 Handover' }] : []),
  ] as { id: typeof tab; label: string }[]

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="py-1 px-[10px] border-b border-border-color bg-bg-secondary flex items-center gap-[10px] shrink-0 text-[10px]">
        <span className="text-text-secondary">
          Nodes: <strong className="text-text-primary">{nodes.filter((n) => n.status === 'ONLINE').length}/{nodes.length}</strong>
        </span>
        {offlineCount > 0 && (
          <span className="text-alert-critical font-bold">⚠ {offlineCount} OFFLINE</span>
        )}
        {totalAlerts > 0 && (
          <span className="text-alert-medium font-bold">🔔 {totalAlerts} active alerts</span>
        )}
        {showCibms && (
          <span className="ml-auto text-[9px] text-sensor-acoustic">● CIBMS LINK ACTIVE</span>
        )}
      </div>

      {/* Sub-tabs */}
      {TABS.length > 1 && (
        <div className="flex border-b border-border-color shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 py-1.5 px-2 border-none bg-transparent cursor-pointer text-[10px]',
                tab === t.id
                  ? 'border-b-2 border-accent-blue text-accent-blue font-bold'
                  : 'border-b-2 border-transparent text-text-secondary font-normal',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Nodes tab */}
        {(tab === 'nodes' || TABS.length === 0) && showNodes && (
          <div className="p-[10px]">
            <div className="flex gap-1.5 mb-2 text-[10px]">
              <span className="text-text-secondary leading-6">Sort:</span>
              {(['status', 'threat', 'alerts'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={[
                    'py-[2px] px-2 border border-border-color rounded cursor-pointer text-[10px]',
                    sortBy === s ? 'bg-accent-blue text-white' : 'bg-bg-tertiary text-text-secondary',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {sorted.map((node) => <NodeCard key={node.id} node={node} />)}
            </div>

            {/* CIBMS status */}
            {showCibms && (
              <div className="mt-[10px] bg-bg-secondary border border-border-color rounded-md px-[10px] py-2 text-[10px]">
                <div className="font-bold mb-1.5">🔗 CIBMS / NATGRID Feed</div>
                <div className="grid grid-cols-2 gap-1 text-text-secondary">
                  <span>Queue depth: <strong className="text-text-primary">3 msgs</strong></span>
                  <span>Last push: <strong className="text-sensor-acoustic">2s ago</strong></span>
                  <span>Errors (24h): <strong className="text-text-primary">0</strong></span>
                  <span>Schema: <strong className="text-sensor-acoustic">COMPLIANT</strong></span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <button className="py-[3px] px-2 bg-bg-tertiary border border-border-color rounded text-text-secondary cursor-pointer text-[9px]">
                    ↺ Resync
                  </button>
                  <span className="text-[10px] text-text-secondary leading-5">STANAG 4607/4609</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Incident Report tab */}
        {tab === 'incident' && showIncident && (
          <div className="p-[10px]">
            <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-2">
              Incident Report Generator
            </div>
            <div className="bg-bg-secondary border border-border-color rounded-md p-[10px] mb-2 text-[10px] text-text-secondary">
              <div className="font-bold text-text-primary mb-1.5">Auto-populated from live data</div>
              <div>Date/Time: {new Date().toLocaleString()}</div>
              <div>Node: BOP-ALPHA-01 | Operator: —</div>
              <div>Active alerts: {totalAlerts} | Nodes online: {nodes.filter((n) => n.status === 'ONLINE').length}/{nodes.length}</div>
              <div>Threat level: {nodes.some((n) => n.threatLevel === 'HIGH') ? 'HIGH' : 'CLEAR/LOW'}</div>
            </div>
            <textarea
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="Add narrative description of the incident..."
              className={`${textareaClass} h-[100px]`}
            />
            <div className="flex gap-1.5 mt-2">
              <button className="flex-1 py-1.5 bg-accent-blue border-none rounded text-white cursor-pointer text-[10px] font-bold">
                ⬇ Export PDF → BHQN
              </button>
              <button className="py-1.5 px-[10px] bg-bg-tertiary border border-border-color rounded text-text-secondary cursor-pointer text-[10px]">
                📎 Attach Snapshot
              </button>
            </div>
          </div>
        )}

        {/* Shift Handover tab */}
        {tab === 'handover' && showHandover && (
          <div className="p-[10px]">
            <div className="text-[10px] font-bold tracking-[0.1em] text-text-secondary uppercase mb-2">
              Shift Handover Summary
            </div>
            <div className="flex gap-1.5 mb-[10px]">
              {(['8h', '12h', '24h'] as const).map((r) => (
                <button
                  key={r}
                  className={[
                    'py-[3px] px-[10px] border border-border-color rounded cursor-pointer text-[10px]',
                    r === '12h' ? 'bg-accent-blue text-white' : 'bg-bg-tertiary text-text-secondary',
                  ].join(' ')}
                >
                  Last {r}
                </button>
              ))}
            </div>
            <div className="bg-bg-secondary border border-border-color rounded-md p-[10px] mb-2 text-[10px] text-text-secondary leading-[1.7]">
              <div className="font-bold text-text-primary mb-1">Period Summary (Last 12h)</div>
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
              className={`${textareaClass} h-[80px]`}
            />
            <div className="flex gap-1.5 mt-2">
              <button className="flex-1 py-1.5 bg-accent-blue border-none rounded text-white cursor-pointer text-[10px] font-bold">
                ✍ Sign &amp; Export PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
