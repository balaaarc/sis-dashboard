import { useState, useEffect } from 'react'
import { useAlertStore } from '../../store/alertStore'
import { useSystemStore } from '../../store/systemStore'
import ConnectionBadge from '../widgets/ConnectionBadge'
import ThemeToggle from '../widgets/ThemeToggle'
import ScenarioSelector from '../widgets/ScenarioSelector'

const SITES = ['BOP-ALPHA-01', 'BOP-BETA-01']

function formatUTCTime(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss} UTC`
}

export default function TopNavBar() {
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
      style={{
        height: 'var(--topbar-height, 52px)',
        background: 'var(--panel-header-bg)',
        borderBottom: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 8,
        flexShrink: 0,
        zIndex: 100,
        boxShadow: '0 1px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="topbar-hamburger"
        onClick={toggleMobileSidebar}
        aria-label={mobileSidebarOpen ? 'Close menu' : 'Open menu'}
        style={{
          width: 34,
          height: 34,
          borderRadius: 6,
          border: '1px solid var(--border-color)',
          background: mobileSidebarOpen ? 'var(--bg-tertiary)' : 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        {mobileSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--accent-blue)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          SIS
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>
          IINVSYS
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: 'var(--border-color)', flexShrink: 0 }} />

      {/* Site selector — hidden on mobile */}
      <div className="topbar-site" style={{ display: 'contents' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '0 24px 0 10px',
              height: 30,
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              outline: 'none',
            }}
          >
            {SITES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)', fontSize: 9 }}>▾</span>
        </div>
      </div>

      {/* Scenario selector — hidden on tablet/mobile */}
      <div className="topbar-scenario" style={{ display: 'contents' }}>
        <ScenarioSelector />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* UTC Clock — hidden on mobile */}
      <div
        className="topbar-clock"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: 'var(--text-secondary)',
          letterSpacing: '0.05em',
          flexShrink: 0,
          padding: '4px 8px',
          background: 'var(--bg-tertiary)',
          borderRadius: 5,
          border: '1px solid var(--border-subtle)',
        }}
      >
        {time}
      </div>

      {/* Connection Badge */}
      <div className="topbar-connection-badge" style={{ display: 'contents' }}>
        <ConnectionBadge />
      </div>

      {/* Unacked alert count */}
      {unackedCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px 3px 7px',
            borderRadius: 99,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--alert-critical)', boxShadow: '0 0 5px var(--alert-critical)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--alert-critical)', fontFamily: 'monospace' }}>
            {unackedCount > 99 ? '99+' : unackedCount}
          </span>
        </div>
      )}

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 6,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--sensor-acoustic)',
            boxShadow: '0 0 5px var(--sensor-acoustic)',
            flexShrink: 0,
          }}
        />
        <span
          className="topbar-user-label"
          style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}
        >
          Operator
        </span>
      </div>
    </header>
  )
}
