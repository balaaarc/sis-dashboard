import { Component, type ReactNode } from 'react'
import { useViewStore } from '../../store/viewStore'

// ── Error boundary so a crashing panel doesn't take down the whole app ────────
class PanelErrorBoundary extends Component<
  { children: ReactNode; name: string },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, fontSize: 11, color: 'var(--alert-high)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <strong>⚠ {this.props.name} error</strong>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 10 }}>
            {(this.state.error as Error).message}
          </span>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ alignSelf: 'flex-start', padding: '3px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10 }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface PanelShellProps {
  panelId: string
  title: string
  icon?: string
  children: ReactNode
  /** Compact priority content shown when panel is minimized or force-collapsed in strip */
  minimizedContent?: ReactNode
  gridArea?: string
  style?: React.CSSProperties
  headerExtra?: ReactNode
  highlight?: boolean
  /** Set by PanelGrid when another panel is expanded — forces compact strip display */
  forceMinimized?: boolean
  /** DOM id for scroll-to-panel navigation */
  id?: string
}

// SVG icon components for crisp cross-platform rendering
function IconMinimize() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="9" x2="10" y2="9"/>
    </svg>
  )
}
function IconRestore() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="1"/>
    </svg>
  )
}
function IconExpand() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7.5,2 10,2 10,4.5"/>
      <polyline points="4.5,10 2,10 2,7.5"/>
      <line x1="10" y1="2" x2="6.5" y2="5.5"/>
      <line x1="2" y1="10" x2="5.5" y2="6.5"/>
    </svg>
  )
}
function IconCollapse() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,5.5 4.5,5.5 4.5,3"/>
      <polyline points="10,6.5 7.5,6.5 7.5,9"/>
      <line x1="5.5" y1="5.5" x2="2" y2="2"/>
      <line x1="6.5" y1="6.5" x2="10" y2="10"/>
    </svg>
  )
}

function HeaderBtn({
  children,
  title,
  onClick,
  active,
}: {
  children: ReactNode
  title: string
  onClick: (e: React.MouseEvent) => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: 5,
        border: active ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        }
      }}
    >
      {children}
    </button>
  )
}

export default function PanelShell({
  panelId,
  title,
  icon,
  children,
  minimizedContent,
  gridArea,
  style,
  headerExtra,
  highlight = false,
  forceMinimized = false,
  id,
}: PanelShellProps) {
  // Subscribe directly to the value so the component re-renders on change
  const view         = useViewStore((s) => s.panelViews[panelId] ?? 'normal')
  const toggleExpand   = useViewStore((s) => s.toggleExpand)
  const toggleMinimize = useViewStore((s) => s.toggleMinimize)
  const setPanelView   = useViewStore((s) => s.setPanelView)
  const isMinimized = view === 'minimized'
  const isExpanded  = view === 'expanded'

  // forceMinimized = another panel is in expanded state, this one sits in the strip
  const showMinimized = forceMinimized || isMinimized

  const handleHeaderClick = () => {
    if (forceMinimized) return // clicking the strip header does nothing (use expand button)
    if (isMinimized) setPanelView(panelId, 'normal')
  }

  return (
    <div
      id={id}
      style={{
        gridArea: gridArea,
        background: 'var(--panel-bg)',
        border:
          isExpanded || highlight
            ? '1px solid rgba(59,130,246,0.45)'
            : '1px solid var(--panel-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow:
          isExpanded || highlight
            ? '0 0 0 1px rgba(59,130,246,0.2), var(--shadow-panel)'
            : 'var(--shadow-panel)',
        backdropFilter: 'blur(12px)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.3s ease',
        minHeight: 0,
        ...style,
      }}
    >
      {/* ── Active accent line ──────────────────────────────────────── */}
      {(isExpanded || highlight) && (
        <div style={{
          height: 2,
          background: 'linear-gradient(90deg, var(--accent-blue), rgba(59,130,246,0.3))',
          flexShrink: 0,
        }} />
      )}

      {/* ── Panel Header ─────────────────────────────────────────────── */}
      <div
        onClick={handleHeaderClick}
        style={{
          background: 'var(--panel-header-bg)',
          borderBottom: showMinimized ? 'none' : '1px solid var(--panel-border)',
          padding: '0 10px 0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: 'var(--panel-header-height)',
          cursor: isMinimized ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: (isExpanded || highlight) ? 'var(--text-primary)' : 'rgba(232,240,248,0.7)',
            flex: 1,
            minWidth: 0,
            transition: 'color 0.2s ease',
          }}
        >
          {icon && <span style={{ fontSize: 14, flexShrink: 0, opacity: 0.9 }}>{icon}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
          {isExpanded && (
            <span
              style={{
                fontSize: 9,
                background: 'rgba(59,130,246,0.18)',
                color: 'var(--accent-blue)',
                border: '1px solid rgba(59,130,246,0.35)',
                borderRadius: 3,
                padding: '1px 5px',
                letterSpacing: '0.08em',
                flexShrink: 0,
                fontWeight: 700,
              }}
            >
              EXPANDED
            </span>
          )}
        </div>

        {/* Controls */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {headerExtra}

          {/* Minimize / Restore button — not shown in forceMinimized strip */}
          {!forceMinimized && (
            <HeaderBtn
              title={isMinimized ? 'Restore panel' : 'Minimize panel'}
              onClick={() => toggleMinimize(panelId)}
            >
              {isMinimized ? <IconRestore /> : <IconMinimize />}
            </HeaderBtn>
          )}

          {/* Expand / Collapse button */}
          {!isMinimized && (
            <HeaderBtn
              title={isExpanded ? 'Collapse to normal' : 'Expand panel'}
              onClick={() => toggleExpand(panelId)}
              active={isExpanded}
            >
              {isExpanded ? <IconCollapse /> : <IconExpand />}
            </HeaderBtn>
          )}
        </div>
      </div>

      {/* ── Minimized strip: priority data only ──────────────────────── */}
      {showMinimized && (
        <div
          style={{
            padding: '5px 10px',
            fontSize: 11,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'nowrap',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          <PanelErrorBoundary name={title}>
            {minimizedContent ?? (
              <span style={{ opacity: 0.5, fontSize: 10 }}>Click ⤢ to expand</span>
            )}
          </PanelErrorBoundary>
        </div>
      )}

      {/* ── Full body ────────────────────────────────────────────────── */}
      {!showMinimized && (
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <PanelErrorBoundary name={title}>
            {children}
          </PanelErrorBoundary>
        </div>
      )}
    </div>
  )
}
