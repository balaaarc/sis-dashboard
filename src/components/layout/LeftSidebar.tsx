import React from 'react'
import { useSystemStore } from '@/store/systemStore'
import { useAlertStore } from '@/store/alertStore'
import { useSettingsStore } from '@/store/settingsStore'
import { getSensorFamilyColor } from '@/utils/formatters'
import type { SensorFamily, ThreatLevel } from '@/types/sensors'

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

export function LeftSidebar() {
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
        className="w-full flex items-center gap-[9px] py-2 px-[14px] border-none text-[12px] text-left transition-[color,background,border-color] duration-150 cursor-pointer"
        style={{
          borderLeft: `2px solid ${active ? 'var(--accent-blue)' : 'transparent'}`,
          background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: active ? 600 : 400,
        }}
        onMouseEnter={(e) => {
          if (!active) {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
          }
        }}
      >
        <span className="text-[14px] shrink-0">{panel.icon}</span>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {panel.label}
        </span>
      </button>
    )
  }

  const SectionHeader = ({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) => (
    <div className="text-[9px] font-black tracking-[0.12em] text-text-muted py-[10px] px-[14px] pb-[5px] uppercase flex items-center justify-between">
      {children}
      {extra}
    </div>
  )

  const Divider = () => (
    <div className="h-px bg-border-subtle my-1" />
  )

  return (
    <aside
      className={`sis-sidebar${mobileSidebarOpen ? ' mobile-open' : ''} h-full flex flex-col overflow-hidden relative shrink-0`}
      style={{
        width: collapsed ? 0 : 232,
        minWidth: collapsed ? 0 : 232,
        background: 'var(--panel-header-bg)',
        borderRight: '1px solid var(--panel-border)',
        transition: 'width 200ms ease, min-width 200ms ease',
      }}
    >
      {/* Collapse toggle — desktop only */}
      <button
        className="sidebar-collapse-btn absolute top-[9px] w-[22px] h-[22px] rounded border border-border-color bg-bg-tertiary text-text-secondary cursor-pointer flex items-center justify-center text-[11px] z-10 shrink-0 transition-[right] duration-200"
        onClick={toggleSidebar}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{ right: collapsed ? -30 : 8 }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {!collapsed && (
        <div className="flex flex-col flex-1 overflow-auto pt-1">
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
                    <span className="text-[9px] bg-[rgba(59,130,246,0.15)] text-accent-blue border border-[rgba(59,130,246,0.25)] rounded-[3px] py-[1px] px-[5px] font-bold">
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
                  className="w-full flex items-center gap-[9px] py-[7px] px-[14px] border-none text-[12px] text-left transition-[color,background,border-color] duration-150 cursor-pointer"
                  style={{
                    borderLeft: `2px solid ${isActive ? color : 'transparent'}`,
                    background: isActive ? `${color}14` : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
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
                    className="w-2 h-2 rounded-full shrink-0 transition-shadow duration-150"
                    style={{
                      background: color,
                      boxShadow: isActive ? `0 0 7px ${color}` : 'none',
                    }}
                  />
                  {family}
                </button>
              )
            })}
          </div>

          <Divider />

          {/* Alert Summary */}
          <div className="py-2 px-[14px] pb-3">
            <SectionHeader>Active Alerts</SectionHeader>
            <div className="flex flex-col gap-[5px] mt-1">
              {THREAT_LEVELS.map(({ level, color }) => {
                const count = alertCountByLevel(level)
                const isFiltered = filter.threatLevel === level
                return (
                  <div
                    key={level}
                    onClick={() =>
                      setFilter({ threatLevel: isFiltered ? 'ALL' : level })
                    }
                    className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded-[5px] transition-[background] duration-150"
                    style={{ background: isFiltered ? `${color}12` : 'transparent' }}
                  >
                    <span
                      className="text-[11px] transition-colors duration-150"
                      style={{ color: isFiltered ? color : 'var(--text-secondary)', fontWeight: isFiltered ? 600 : 400 }}
                    >
                      {level}
                    </span>
                    <span
                      className="min-w-[22px] h-[18px] rounded-[9px] text-[10px] font-bold flex items-center justify-center px-[5px] font-mono"
                      style={{
                        background: count > 0 ? `${color}20` : 'var(--bg-tertiary)',
                        border: `1px solid ${count > 0 ? `${color}40` : 'transparent'}`,
                        color: count > 0 ? color : 'var(--text-muted)',
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
