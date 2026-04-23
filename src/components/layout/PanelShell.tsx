import { Component, type ReactNode } from 'react'
import { useViewStore } from '@/store/viewStore'

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
        <div className="p-4 text-[11px] text-alert-high flex flex-col gap-1.5">
          <strong>⚠ {this.props.name} error</strong>
          <span className="text-text-secondary font-mono text-[10px]">
            {(this.state.error as Error).message}
          </span>
          <button
            onClick={() => this.setState({ error: null })}
            className="self-start py-[3px] px-2 bg-bg-tertiary border border-border-color rounded text-text-secondary cursor-pointer text-[10px]"
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
      className="w-[26px] h-[26px] rounded-[5px] cursor-pointer flex items-center justify-center transition-all duration-150 shrink-0"
      style={{
        border: active ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
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

export function PanelShell({
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
  const view           = useViewStore((s) => s.panelViews[panelId] ?? 'normal')
  const toggleExpand   = useViewStore((s) => s.toggleExpand)
  const toggleMinimize = useViewStore((s) => s.toggleMinimize)
  const setPanelView   = useViewStore((s) => s.setPanelView)
  const isMinimized = view === 'minimized'
  const isExpanded  = view === 'expanded'
  const showMinimized = forceMinimized || isMinimized

  const handleHeaderClick = () => {
    if (forceMinimized) return
    if (isMinimized) setPanelView(panelId, 'normal')
  }

  const accentActive = isExpanded || highlight

  return (
    <div
      id={id}
      className="flex flex-col overflow-hidden min-h-0 transition-[border-color,box-shadow,background] duration-200 ease-[ease]"
      style={{
        gridArea,
        background: 'var(--panel-bg)',
        border: accentActive
          ? '1px solid rgba(59,130,246,0.45)'
          : '1px solid var(--panel-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: accentActive
          ? '0 0 0 1px rgba(59,130,246,0.2), var(--shadow-panel)'
          : 'var(--shadow-panel)',
        backdropFilter: 'blur(12px)',
        ...style,
      }}
    >
      {/* ── Active accent line ──────────────────────────────────────── */}
      {accentActive && (
        <div
          className="h-[2px] shrink-0"
          style={{ background: 'linear-gradient(90deg, var(--accent-blue), rgba(59,130,246,0.3))' }}
        />
      )}

      {/* ── Panel Header ─────────────────────────────────────────────── */}
      <div
        onClick={handleHeaderClick}
        className="flex items-center justify-between shrink-0 pr-[10px] pl-3 select-none"
        style={{
          background: 'var(--panel-header-bg)',
          borderBottom: showMinimized ? 'none' : '1px solid var(--panel-border)',
          minHeight: 'var(--panel-header-height)',
          cursor: isMinimized ? 'pointer' : 'default',
        }}
      >
        {/* Title */}
        <div
          className="flex items-center gap-[7px] text-[11px] font-bold tracking-[0.07em] uppercase flex-1 min-w-0 transition-colors duration-200"
          style={{ color: accentActive ? 'var(--text-primary)' : 'rgba(232,240,248,0.7)' }}
        >
          {icon && <span className="text-[14px] shrink-0 opacity-90">{icon}</span>}
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {title}
          </span>
          {isExpanded && (
            <span className="text-[9px] bg-[rgba(59,130,246,0.18)] text-accent-blue border border-[rgba(59,130,246,0.35)] rounded-[3px] py-[1px] px-[5px] tracking-[0.08em] shrink-0 font-bold">
              EXPANDED
            </span>
          )}
        </div>

        {/* Controls */}
        <div
          className="flex items-center gap-[2px]"
          onClick={(e) => e.stopPropagation()}
        >
          {headerExtra}

          {/* Minimize / Restore button — not shown in forceMinimized strip */}
          {!forceMinimized && (
            <HeaderBtn
              title={isMinimized ? 'Maximize' : 'Minimize'}
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
        <div className="py-[5px] px-[10px] text-[11px] text-text-secondary flex items-center gap-[10px] flex-nowrap overflow-hidden flex-1">
          <PanelErrorBoundary name={title}>
            {minimizedContent ?? (
              <span className="opacity-50 text-[10px]">Click ⤢ to expand</span>
            )}
          </PanelErrorBoundary>
        </div>
      )}

      {/* ── Full body ────────────────────────────────────────────────── */}
      {!showMinimized && (
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
          <PanelErrorBoundary name={title}>
            {children}
          </PanelErrorBoundary>
        </div>
      )}
    </div>
  )
}
