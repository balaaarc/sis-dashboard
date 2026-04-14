import React from 'react'
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
  const collapsed            = useSystemStore((s) => s.sidebarCollapsed)
  const toggleSidebar        = useSystemStore((s) => s.toggleSidebar)
  const activePanel          = useSystemStore((s) => s.activePanel)
  const setActivePanel       = useSystemStore((s) => s.setActivePanel)
  const mobileSidebarOpen    = useSystemStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useSystemStore((s) => s.setMobileSidebarOpen)
  const alerts               = useAlertStore((s) => s.alerts)
  const setFilter            = useAlertStore((s) => s.setFilter)
  const filter               = useAlertStore((s) => s.filter)
  const isPanelVisible       = useSettingsStore((s) => s.isPanelVisible)

  const alertCountByLevel = (level: ThreatLevel) =>
    alerts.filter((a) => a.threat_level === level && !a.acknowledged).length

  const visibleNew = NEW_PANELS.filter((p) => isPanelVisible(p.id))

  function PanelBtn({ panel }: { panel: { id: string; label: string; icon: string } }) {
    const active = activePanel === panel.id

    function handleClick() {
      setActivePanel(panel.id)
      setMobileSidebarOpen(false)
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
          gap: 9,
          padding: '8px 14px',
          border: 'none',
          borderLeft: `2px solid ${active ? 'var(--accent-blue)' : 'transparent'}`,
          background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: active ? 600 : 400,
          textAlign: 'left',
          transition: 'color 0.15s ease, background 0.15s ease, border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
          }
        }}
      >
        <span style={{ fontSize: 14, flexShrink: 0 }}>{panel.icon}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {panel.label}
        </span>
      </button>
    )
  }

  const SectionHeader = ({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) => (
    <div style={{
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: '0.12em',
      color: 'var(--text-muted)',
      padding: '10px 14px 5px',
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {children}
      {extra}
    </div>
  )

  const Divider = () => (
    <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
  )

  return (
    <aside
      className={`sis-sidebar${mobileSidebarOpen ? ' mobile-open' : ''}`}
      style={{
        width: collapsed ? 0 : 232,
        minWidth: collapsed ? 0 : 232,
        height: '100%',
        background: 'var(--panel-header-bg)',
        borderRight: '1px solid var(--panel-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 200ms ease, min-width 200ms ease',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Collapse toggle — desktop only */}
      <button
        className="sidebar-collapse-btn"
        onClick={toggleSidebar}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          top: 9,
          right: collapsed ? -30 : 8,
          width: 22,
          height: 22,
          borderRadius: 4,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          zIndex: 10,
          transition: 'right 200ms ease',
          flexShrink: 0,
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, overflow: 'auto', paddingTop: 4 }}>
          {/* Panel Navigator */}
          <div>
            <SectionHeader>Panels</SectionHeader>
            {CORE_PANELS.map((panel) => (
              <PanelBtn key={panel.id} panel={panel} />
            ))}

            {visibleNew.length > 0 && (
              <>
                <SectionHeader
                  extra={
                    <span style={{
                      fontSize: 9,
                      background: 'rgba(59,130,246,0.15)',
                      color: 'var(--accent-blue)',
                      border: '1px solid rgba(59,130,246,0.25)',
                      borderRadius: 3,
                      padding: '1px 5px',
                      fontWeight: 700,
                    }}>
                      {visibleNew.length}
                    </span>
                  }
                >
                  Additional
                </SectionHeader>
                {visibleNew.map((panel) => (
                  <PanelBtn key={panel.id} panel={panel} />
                ))}
              </>
            )}

            {/* Device Config + Settings */}
            <Divider />
            <PanelBtn panel={{ id: 'device',   label: 'Device Config', icon: '🔌' }} />
            <PanelBtn panel={{ id: 'settings', label: 'Settings',      icon: '⚙' }} />
          </div>

          <Divider />

          {/* Sensor Family Quick Filters */}
          <div>
            <SectionHeader>Sensor Family</SectionHeader>
            {SENSOR_FAMILIES.map((family) => {
              const color = getSensorFamilyColor(family)
              const isActive = filter.sensorFamily === family
              return (
                <button
                  key={family}
                  onClick={() => {
                    setFilter({ sensorFamily: isActive ? 'ALL' : family })
                    setMobileSidebarOpen(false)
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 14px',
                    border: 'none',
                    borderLeft: `2px solid ${isActive ? color : 'transparent'}`,
                    background: isActive ? `${color}14` : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    textAlign: 'left',
                    transition: 'color 0.15s ease, background 0.15s ease, border-color 0.15s ease',
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'
                      ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                      ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: isActive ? `0 0 7px ${color}` : 'none',
                      flexShrink: 0,
                      transition: 'box-shadow 0.15s ease',
                    }}
                  />
                  {family}
                </button>
              )
            })}
          </div>

          <Divider />

          {/* Alert Summary */}
          <div style={{ padding: '8px 14px 12px' }}>
            <SectionHeader>Active Alerts</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
              {THREAT_LEVELS.map(({ level, color }) => {
                const count = alertCountByLevel(level)
                const isFiltered = filter.threatLevel === level
                return (
                  <div
                    key={level}
                    onClick={() =>
                      setFilter({ threatLevel: isFiltered ? 'ALL' : level })
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: 5,
                      background: isFiltered ? `${color}12` : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: 11, color: isFiltered ? color : 'var(--text-secondary)', fontWeight: isFiltered ? 600 : 400, transition: 'color 0.15s ease' }}>{level}</span>
                    <span
                      style={{
                        minWidth: 22,
                        height: 18,
                        borderRadius: 9,
                        background: count > 0 ? `${color}20` : 'var(--bg-tertiary)',
                        border: `1px solid ${count > 0 ? `${color}40` : 'transparent'}`,
                        color: count > 0 ? color : 'var(--text-muted)',
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        fontFamily: 'monospace',
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
