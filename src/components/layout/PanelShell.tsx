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
        width: 28,
        height: 28,
        borderRadius: 4,
        border: active ? '1px solid var(--accent-blue)' : '1px solid transparent',
        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
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
            ? '1px solid var(--accent-blue)'
            : '1px solid var(--panel-border)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow:
          isExpanded || highlight
            ? '0 0 0 2px rgba(59,130,246,0.25), 0 4px 24px var(--shadow-color)'
            : '0 4px 24px var(--shadow-color)',
        backdropFilter: 'blur(8px)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.3s ease',
        minHeight: 0,
        ...style,
      }}
    >
      {/* ── Panel Header ─────────────────────────────────────────────── */}
      <div
        onClick={handleHeaderClick}
        style={{
          background: 'var(--panel-header-bg)',
          borderBottom: showMinimized ? 'none' : '1px solid var(--panel-border)',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: 40,
          cursor: isMinimized ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            flex: 1,
            minWidth: 0,
          }}
        >
          {icon && <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
          {isExpanded && (
            <span
              style={{
                fontSize: 10,
                background: 'rgba(59,130,246,0.2)',
                color: 'var(--accent-blue)',
                border: '1px solid rgba(59,130,246,0.4)',
                borderRadius: 3,
                padding: '0 4px',
                letterSpacing: '0.05em',
                flexShrink: 0,
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
              {isMinimized ? '⬜' : '▬'}
            </HeaderBtn>
          )}

          {/* Expand / Collapse button */}
          {!isMinimized && (
            <HeaderBtn
              title={isExpanded ? 'Collapse to normal' : 'Expand panel'}
              onClick={() => toggleExpand(panelId)}
              active={isExpanded}
            >
              {isExpanded ? '⊡' : '⤢'}
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
