import { useState, useEffect } from 'react'
import { useAlertStore } from '@/store/alertStore'
import { useSystemStore } from '@/store/systemStore'
import { ConnectionBadge } from '@/components/widgets/ConnectionBadge'
import { ThemeToggle } from '@/components/widgets/ThemeToggle'
import { ScenarioSelector } from '@/components/widgets/ScenarioSelector'

const SITES = ['BOP-ALPHA-01', 'BOP-BETA-01']

function formatUTCTime(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss} UTC`
}

export function TopNavBar() {
  const [time, setTime] = useState(() => formatUTCTime(new Date()))
  const [site, setSite] = useState(SITES[0])
  const alerts = useAlertStore((s) => s.alerts)
  const unackedCount = alerts.filter((a) => !a.acknowledged).length
  const toggleMobileSidebar = useSystemStore((s) => s.toggleMobileSidebar)
  const mobileSidebarOpen = useSystemStore((s) => s.mobileSidebarOpen)

  useEffect(() => {
    const id = setInterval(() => {
      setTime(formatUTCTime(new Date()))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header
      className="flex items-center px-[14px] gap-2 shrink-0 z-[100]"
      style={{
        height: 'var(--topbar-height, 52px)',
        background: 'var(--panel-header-bg)',
        borderBottom: '1px solid var(--panel-border)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="topbar-hamburger w-[34px] h-[34px] rounded-[6px] border border-border-color text-text-secondary cursor-pointer flex items-center justify-center text-[15px] shrink-0 transition-all duration-150"
        onClick={toggleMobileSidebar}
        aria-label={mobileSidebarOpen ? 'Close menu' : 'Open menu'}
        style={{ background: mobileSidebarOpen ? 'var(--bg-tertiary)' : 'transparent' }}
      >
        {mobileSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Logo */}
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className="text-[17px] font-black text-accent-blue tracking-[-0.02em] leading-none">
          SIS
        </span>
        <span className="text-[9px] text-text-muted tracking-[0.14em] font-bold uppercase">
          IINVSYS
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border-color shrink-0" />

      {/* Site selector — hidden on mobile */}
      <div className="topbar-site contents">
        <div className="relative shrink-0">
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="text-[12px] font-semibold pl-[10px] pr-6 h-[30px] rounded-[6px] border border-border-color bg-bg-tertiary text-text-primary cursor-pointer appearance-none outline-none"
          >
            {SITES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="absolute right-[7px] top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[9px]">▾</span>
        </div>
      </div>

      {/* Scenario selector — hidden on tablet/mobile */}
      <div className="topbar-scenario contents">
        <ScenarioSelector />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* UTC Clock — hidden on mobile */}
      <div
        className="topbar-clock font-mono text-[12px] text-text-secondary tracking-[0.05em] shrink-0 py-1 px-2 bg-bg-tertiary rounded-[5px] border border-border-subtle"
      >
        {time}
      </div>

      {/* Connection Badge */}
      <div className="topbar-connection-badge contents">
        <ConnectionBadge />
      </div>

      {/* Unacked alert count */}
      {unackedCount > 0 && (
        <div className="flex items-center gap-[5px] py-[3px] pr-2 pl-[7px] rounded-full bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-alert-critical shrink-0" style={{ boxShadow: '0 0 5px var(--alert-critical)' }} />
          <span className="text-[11px] font-bold text-alert-critical font-mono">
            {unackedCount > 99 ? '99+' : unackedCount}
          </span>
        </div>
      )}

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User badge */}
      <div className="flex items-center gap-1.5 py-1 px-[10px] rounded-[6px] bg-bg-tertiary border border-border-color shrink-0">
        <span
          className="w-[7px] h-[7px] rounded-full bg-sensor-acoustic shrink-0"
          style={{ boxShadow: '0 0 5px var(--sensor-acoustic)' }}
        />
        <span className="topbar-user-label text-[11px] text-text-primary font-semibold">
          Operator
        </span>
      </div>
    </header>
  )
}
