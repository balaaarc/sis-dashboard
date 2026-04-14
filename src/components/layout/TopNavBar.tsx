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
        height: 56,
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 10,
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="topbar-hamburger"
        onClick={toggleMobileSidebar}
        aria-label={mobileSidebarOpen ? 'Close menu' : 'Open menu'}
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          border: '1px solid var(--border-color)',
          background: mobileSidebarOpen ? 'var(--bg-tertiary)' : 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        {mobileSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: 'var(--accent-blue)',
            letterSpacing: '-0.02em',
          }}
        >
          SIS
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', fontWeight: 600 }}>
          IINVSYS
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 32, background: 'var(--border-color)', flexShrink: 0 }} />

      {/* Site selector — hidden on mobile */}
      <div className="topbar-site" style={{ display: 'contents' }}>
        <select
          value={site}
          onChange={(e) => setSite(e.target.value)}
          style={{ fontSize: 12, padding: '0 8px', height: 32, flexShrink: 0 }}
        >
          {SITES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
          fontSize: 13,
          color: 'var(--text-secondary)',
          letterSpacing: '0.04em',
          flexShrink: 0,
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
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              background: 'var(--alert-critical)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
              boxShadow: '0 0 8px var(--alert-critical)',
            }}
          >
            {unackedCount > 99 ? '99+' : unackedCount}
          </div>
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
          padding: '3px 10px',
          borderRadius: 9999,
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
