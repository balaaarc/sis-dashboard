import { lazy, Suspense, useEffect, useRef } from 'react'
import PanelShell from './PanelShell'
import PanelMiniView from '../panels/MinimizedViews'
import { useSystemStore } from '../../store/systemStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useViewStore } from '../../store/viewStore'
import { useIsMobile } from '../../hooks/useIsMobile'

const LiveMapPanel      = lazy(() => import('../panels/LiveMapPanel'))
const AlertPanel        = lazy(() => import('../panels/AlertPanel'))
const VideoPanel        = lazy(() => import('../panels/VideoPanel'))
const SensorFamilyPanel = lazy(() => import('../panels/SensorFamilyPanel'))
const AIMLPanel         = lazy(() => import('../panels/AIMLPanel'))
const SystemHealthPanel = lazy(() => import('../panels/SystemHealthPanel'))
const CounterUASPanel   = lazy(() => import('../panels/CounterUASPanel'))
const PersonnelPanel    = lazy(() => import('../panels/PersonnelPanel'))
const PowerPanel        = lazy(() => import('../panels/PowerPanel'))
const CommandPanel      = lazy(() => import('../panels/CommandPanel'))
const AdvancedAIPanel   = lazy(() => import('../panels/AdvancedAIPanel'))
const WeatherPanel      = lazy(() => import('../panels/WeatherPanel'))
const SettingsPanel     = lazy(() => import('../panels/SettingsPanel'))
const DeviceConfigPage  = lazy(() => import('../pages/DeviceConfigPage'))

function PanelFallback({ name }: { name: string }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 8,
        color: 'var(--text-secondary)',
        fontSize: 12,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          border: '2px solid var(--accent-blue)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span>Loading {name}…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

type PanelComponent = React.ComponentType

interface PanelDef {
  id: string
  title: string
  icon: string
  sidebarId: string
  component: PanelComponent
}

const ALL_PANELS: PanelDef[] = [
  { id: 'map',        title: 'Live Tactical Map',      icon: '🗺',  sidebarId: 'map',        component: LiveMapPanel      },
  { id: 'alerts',     title: 'Alert Management',       icon: '🔔',  sidebarId: 'alerts',     component: AlertPanel        },
  { id: 'video',      title: 'Video / Imaging',        icon: '📹',  sidebarId: 'video',      component: VideoPanel        },
  { id: 'sensors',    title: 'Sensor Families',        icon: '📡',  sidebarId: 'sensors',    component: SensorFamilyPanel },
  { id: 'aiml',       title: 'AI / ML Intelligence',   icon: '🤖',  sidebarId: 'aiml',       component: AIMLPanel         },
  { id: 'health',     title: 'System Health',          icon: '🖥',  sidebarId: 'health',     component: SystemHealthPanel },
  { id: 'counteruas', title: 'Counter-UAS',            icon: '🛸',  sidebarId: 'counteruas', component: CounterUASPanel   },
  { id: 'personnel',  title: 'Personnel & NavIC',      icon: '👥',  sidebarId: 'personnel',  component: PersonnelPanel    },
  { id: 'power',      title: 'Power & Vehicle Health', icon: '⚡',  sidebarId: 'power',      component: PowerPanel        },
  { id: 'command',    title: 'Command & Reporting',    icon: '📋',  sidebarId: 'command',    component: CommandPanel      },
  { id: 'advancedai', title: 'Advanced AI Monitoring', icon: '🧠',  sidebarId: 'advancedai', component: AdvancedAIPanel   },
  { id: 'weather',    title: 'Weather & Terrain',      icon: '🌤',  sidebarId: 'weather',    component: WeatherPanel      },
]

const SIDEBAR_TO_PANEL: Record<string, string> = Object.fromEntries(
  ALL_PANELS.map((p) => [p.sidebarId, p.id])
)

const CORE_IDS = ['map', 'alerts', 'video', 'sensors', 'aiml', 'health']
const CORE_GRID_AREA: Record<string, string> = {
  map: 'map', alerts: 'alert', video: 'video', sensors: 'sensors', aiml: 'aiml', health: 'health',
}

// Tooltip shown above the strip when a panel is expanded
function ExpandedBanner({ panelTitle, onClose }: { panelTitle: string; onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '3px 8px',
        background: 'rgba(59,130,246,0.1)',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: 6,
        fontSize: 10,
        color: 'var(--accent-blue)',
        flexShrink: 0,
      }}
    >
      <span>⤢ Expanded: <strong>{panelTitle}</strong></span>
      <span style={{ flex: 1 }} />
      <button
        onClick={onClose}
        title="Collapse back to grid"
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--accent-blue)',
          cursor: 'pointer',
          fontSize: 11,
          padding: '0 2px',
        }}
      >
        ✕ Collapse
      </button>
    </div>
  )
}

export default function PanelGrid() {
  const activePanel   = useSystemStore((s) => s.activePanel)
  const isPanelVisible  = useSettingsStore((s) => s.isPanelVisible)
  const defaultExpandedPanel = useSettingsStore((s) => s.defaultExpandedPanel)
  const expandedPanel = useViewStore((s) => s.expandedPanel)
  const toggleExpand  = useViewStore((s) => s.toggleExpand)
  const setPanelView  = useViewStore((s) => s.setPanelView)
  const panelViews    = useViewStore((s) => s.panelViews)
  const getView       = (id: string) => panelViews[id] ?? 'normal'
  const isMobile      = useIsMobile()

  // Initialise default-expanded once on mount
  const didInit = useRef(false)
  useEffect(() => {
    if (!didInit.current && defaultExpandedPanel) {
      didInit.current = true
      // Only expand if the panel is visible
      if (isPanelVisible(defaultExpandedPanel)) {
        toggleExpand(defaultExpandedPanel)
      }
    } else {
      didInit.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Full-screen panels ────────────────────────────────────────────────────
  if (activePanel === 'settings') {
    return (
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: isMobile ? 2 : 4, minHeight: 0 }}>
        <PanelShell panelId="settings" title="Dashboard Settings" icon="⚙" style={{ flex: 1 }}>
          <Suspense fallback={<PanelFallback name="Settings" />}>
            <SettingsPanel />
          </Suspense>
        </PanelShell>
      </main>
    )
  }

  if (activePanel === 'device') {
    return (
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: isMobile ? 2 : 4, minHeight: 0 }}>
        <PanelShell panelId="device" title="SensiConnect — Device Configuration" icon="🔌" style={{ flex: 1 }}>
          <Suspense fallback={<PanelFallback name="Device Config" />}>
            <DeviceConfigPage />
          </Suspense>
        </PanelShell>
      </main>
    )
  }

  const visiblePanels = ALL_PANELS.filter((p) => isPanelVisible(p.id))
  const corePanels  = visiblePanels.filter((p) => CORE_IDS.includes(p.id))
  const extraPanels = visiblePanels.filter((p) => !CORE_IDS.includes(p.id))
  const hasAllCore  = corePanels.length === 6
  const isActive    = (panelId: string) => SIDEBAR_TO_PANEL[activePanel] === panelId

  // ── Expanded layout ──────────────────────────────────────────────────────
  if (expandedPanel) {
    const expDef = ALL_PANELS.find((p) => p.id === expandedPanel || p.sidebarId === expandedPanel)
    const stripPanels = visiblePanels.filter(
      (p) => p.id !== expandedPanel && p.sidebarId !== expandedPanel
    )

    return (
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          minWidth: 0,
          padding: 4,
          gap: 4,
        }}
      >
        {/* ── Info banner ─────────────────────────────────────────────── */}
        <ExpandedBanner
          panelTitle={expDef?.title ?? expandedPanel}
          onClose={() => setPanelView(expandedPanel, 'normal')}
        />

        {/* ── Expanded panel — fills remaining space ───────────────────── */}
        {expDef && (() => {
          const Comp = expDef.component
          return (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <PanelShell
                panelId={expDef.id}
                title={expDef.title}
                icon={expDef.icon}
                highlight
                style={{ height: '100%' }}
                minimizedContent={<PanelMiniView panelId={expDef.id} />}
              >
                <Suspense fallback={<PanelFallback name={expDef.title} />}>
                  <Comp />
                </Suspense>
              </PanelShell>
            </div>
          )
        })()}

        {/* ── Minimised strip ─────────────────────────────────────────── */}
        {stripPanels.length > 0 && (
          <div
            className="panel-strip-mobile"
            style={{
              height: 76,
              flexShrink: 0,
              display: 'flex',
              gap: 4,
              overflowX: 'auto',
              overflowY: 'hidden',
            }}
          >
            {stripPanels.map((panel) => {
              const Comp = panel.component
              const isMin = getView(panel.id) === 'minimized'
              return (
                <PanelShell
                  key={panel.id}
                  panelId={panel.id}
                  title={panel.title}
                  icon={panel.icon}
                  forceMinimized={!isMin}  // strip mode unless user explicitly minimized
                  minimizedContent={<PanelMiniView panelId={panel.id} />}
                  highlight={isActive(panel.id)}
                  style={{ minWidth: 200, flex: '1 0 auto', height: '100%' }}
                >
                  <Suspense fallback={null}>
                    <Comp />
                  </Suspense>
                </PanelShell>
              )
            })}
          </div>
        )}
      </main>
    )
  }

  // ── Normal grid layout ────────────────────────────────────────────────────
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
        minHeight: 0,
        minWidth: 0,
        padding: isMobile ? 2 : 4,
        gap: isMobile ? 2 : 4,
      }}
    >
      {/* Core panels */}
      {corePanels.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateAreas: (hasAllCore && !isMobile)
              ? `"map map alert" "map map video" "sensors aiml health"`
              : undefined,
            gridTemplateColumns: isMobile
              ? '1fr'
              : hasAllCore ? '2fr 1.5fr 1.5fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gridTemplateRows: (hasAllCore && !isMobile) ? 'repeat(3, minmax(300px, 1fr))' : undefined,
            gridAutoRows: isMobile ? 'minmax(280px, auto)' : undefined,
            gap: 4,
            flex: extraPanels.length > 0 ? '0 0 auto' : 1,
            minHeight: extraPanels.length > 0 ? (isMobile ? 200 : 300) : 0,
          }}
        >
          {corePanels.map((panel) => {
            const Comp = panel.component
            const view = getView(panel.id)
            const isMin = view === 'minimized'
            return (
              <PanelShell
                key={panel.id}
                id={`panel-${panel.id}`}
                panelId={panel.id}
                title={panel.title}
                icon={panel.icon}
                gridArea={hasAllCore ? CORE_GRID_AREA[panel.id] : undefined}
                highlight={isActive(panel.id)}
                minimizedContent={<PanelMiniView panelId={panel.id} />}
                style={isMin ? { alignSelf: 'start' } : undefined}
              >
                <Suspense fallback={<PanelFallback name={panel.title} />}>
                  <Comp />
                </Suspense>
              </PanelShell>
            )
          })}
        </div>
      )}

      {/* Extra new panels */}
      {extraPanels.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gridAutoRows: isMobile ? 'minmax(320px, auto)' : 'minmax(400px, auto)',
            gap: 4,
            flex: '0 0 auto',
            overflow: 'visible',
            alignContent: 'start',
          }}
        >
          {extraPanels.map((panel) => {
            const Comp = panel.component
            const view = getView(panel.id)
            const isMin = view === 'minimized'
            return (
              <PanelShell
                key={panel.id}
                id={`panel-${panel.id}`}
                panelId={panel.id}
                title={panel.title}
                icon={panel.icon}
                highlight={isActive(panel.id)}
                minimizedContent={<PanelMiniView panelId={panel.id} />}
                style={isMin ? { alignSelf: 'start' } : undefined}
              >
                <Suspense fallback={<PanelFallback name={panel.title} />}>
                  <Comp />
                </Suspense>
              </PanelShell>
            )
          })}
        </div>
      )}
    </main>
  )
}
