import { useSystemStore } from '../../store/systemStore'
import { useAlertStore } from '../../store/alertStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getSensorFamilyColor } from '../../utils/formatters'
import type { SensorFamily, ThreatLevel } from '../../types/sensors'

const CORE_PANELS = [
  { id: 'map',     label: 'Live Map',   icon: '🗺' },
  { id: 'alerts',  label: 'Alerts',     icon: '🔔' },
  { id: 'video',   label: 'Video Feed', icon: '📹' },
  { id: 'sensors', label: 'Sensors',    icon: '📡' },
  { id: 'aiml',    label: 'AI/ML',      icon: '🤖' },
  { id: 'health',  label: 'Sys Health', icon: '🖥' },
]

const NEW_PANELS = [
  { id: 'counteruas', label: 'Counter-UAS',   icon: '🛸' },
  { id: 'personnel',  label: 'Personnel',     icon: '👥' },
  { id: 'power',      label: 'Power/Vehicle', icon: '⚡' },
  { id: 'command',    label: 'Command',       icon: '📋' },
  { id: 'advancedai', label: 'Adv. AI',       icon: '🧠' },
  { id: 'weather',    label: 'Weather',       icon: '🌤' },
]

const SENSOR_FAMILIES: SensorFamily[] = [
  'Seismic',
  'Acoustic',
  'Optical',
  'Radar',
  'Magnetic',
  'Chemical',
]

const THREAT_LEVELS: { level: ThreatLevel; color: string }[] = [
  { level: 'CRITICAL', color: 'var(--alert-critical)' },
  { level: 'HIGH', color: 'var(--alert-high)' },
  { level: 'MEDIUM', color: 'var(--alert-medium)' },
  { level: 'LOW', color: 'var(--alert-low)' },
]

export default function LeftSidebar() {
  const collapsed     = useSystemStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useSystemStore((s) => s.toggleSidebar)
  const activePanel   = useSystemStore((s) => s.activePanel)
  const setActivePanel = useSystemStore((s) => s.setActivePanel)
  const alerts  = useAlertStore((s) => s.alerts)
  const setFilter = useAlertStore((s) => s.setFilter)
  const filter  = useAlertStore((s) => s.filter)
  const isPanelVisible = useSettingsStore((s) => s.isPanelVisible)

  const alertCountByLevel = (level: ThreatLevel) =>
    alerts.filter((a) => a.threat_level === level && !a.acknowledged).length

  const visibleNew = NEW_PANELS.filter((p) => isPanelVisible(p.id))

  function PanelBtn({ panel }: { panel: { id: string; label: string; icon: string }; isNew?: boolean }) {
    const active = activePanel === panel.id

    function handleClick() {
      setActivePanel(panel.id)
      // Scroll the main content area to the panel
      const el = document.getElementById(`panel-${panel.id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    return (
      <button
        onClick={handleClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 12px',
          border: 'none',
          background: active ? 'var(--bg-tertiary)' : 'transparent',
          borderLeft: `2px solid ${active ? 'var(--accent-blue)' : 'transparent'}`,
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: active ? 600 : 400,
          textAlign: 'left',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ fontSize: 14 }}>{panel.icon}</span>
        {panel.label}
      </button>
    )
  }

  return (
    <aside
      style={{
        width: collapsed ? 0 : 240,
        minWidth: collapsed ? 0 : 240,
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 200ms ease, min-width 200ms ease',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Collapse toggle — always visible via absolute positioning */}
      <button
        onClick={toggleSidebar}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          top: 8,
          right: collapsed ? -32 : 8,
          width: 24,
          height: 24,
          borderRadius: 4,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          zIndex: 10,
          transition: 'right 200ms ease',
          flexShrink: 0,
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, overflow: 'auto', paddingTop: 8 }}>
          {/* Panel Navigator */}
          <div style={{ padding: '0 0 8px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', padding: '4px 12px 6px', textTransform: 'uppercase' }}>
              Panels
            </div>
            {CORE_PANELS.map((panel) => (
              <PanelBtn key={panel.id} panel={panel} />
            ))}

            {visibleNew.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', padding: '8px 12px 4px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Additional
                  <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.15)', color: 'var(--sensor-acoustic)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 3, padding: '0 4px' }}>
                    {visibleNew.length}
                  </span>
                </div>
                {visibleNew.map((panel) => (
                  <PanelBtn key={panel.id} panel={panel} />
                ))}
              </>
            )}

            {/* Settings */}
            <div style={{ height: 1, background: 'var(--border-color)', margin: '6px 0' }} />
            <PanelBtn panel={{ id: 'settings', label: 'Settings', icon: '⚙' }} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

          {/* Sensor Family Quick Filters */}
          <div style={{ padding: '8px 0' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                padding: '4px 12px 6px',
                textTransform: 'uppercase',
              }}
            >
              Sensor Family
            </div>
            {SENSOR_FAMILIES.map((family) => {
              const color = getSensorFamilyColor(family)
              const isActive = filter.sensorFamily === family
              return (
                <button
                  key={family}
                  onClick={() =>
                    setFilter({ sensorFamily: isActive ? 'ALL' : family })
                  }
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px',
                    border: 'none',
                    background: isActive ? `${color}18` : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: isActive ? `0 0 6px ${color}` : 'none',
                      flexShrink: 0,
                    }}
                  />
                  {family}
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

          {/* Alert Summary */}
          <div style={{ padding: '8px 12px' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              Active Alerts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {THREAT_LEVELS.map(({ level, color }) => {
                const count = alertCountByLevel(level)
                return (
                  <div
                    key={level}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      setFilter({ threatLevel: filter.threatLevel === level ? 'ALL' : level })
                    }
                  >
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{level}</span>
                    <span
                      style={{
                        minWidth: 24,
                        height: 18,
                        borderRadius: 9,
                        background: count > 0 ? `${color}22` : 'var(--bg-tertiary)',
                        border: `1px solid ${count > 0 ? `${color}55` : 'transparent'}`,
                        color: count > 0 ? color : 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 6px',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
