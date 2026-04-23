import { lazy, Suspense, useEffect, useRef } from 'react'
import { PanelShell } from '@/components/layout/PanelShell'
import { PanelMiniView } from '@/components/panels/MinimizedViews'
import { useSystemStore } from '@/store/systemStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useViewStore } from '@/store/viewStore'
import { useIsMobile } from '@/hooks/useIsMobile'

const LiveMapPanel      = lazy(() => import('@/components/panels/LiveMapPanel').then((m) => ({ default: m.LiveMapPanel })))
const AlertPanel        = lazy(() => import('@/components/panels/AlertPanel').then((m) => ({ default: m.AlertPanel })))
const VideoPanel        = lazy(() => import('@/components/panels/VideoPanel').then((m) => ({ default: m.VideoPanel })))
const SensorFamilyPanel = lazy(() => import('@/components/panels/SensorFamilyPanel').then((m) => ({ default: m.SensorFamilyPanel })))
const AIMLPanel         = lazy(() => import('@/components/panels/AIMLPanel').then((m) => ({ default: m.AIMLPanel })))
const SystemHealthPanel = lazy(() => import('@/components/panels/SystemHealthPanel').then((m) => ({ default: m.SystemHealthPanel })))
const CounterUASPanel   = lazy(() => import('@/components/panels/CounterUASPanel').then((m) => ({ default: m.CounterUASPanel })))
const PersonnelPanel    = lazy(() => import('@/components/panels/PersonnelPanel').then((m) => ({ default: m.PersonnelPanel })))
const PowerPanel        = lazy(() => import('@/components/panels/PowerPanel').then((m) => ({ default: m.PowerPanel })))
const CommandPanel      = lazy(() => import('@/components/panels/CommandPanel').then((m) => ({ default: m.CommandPanel })))
const AdvancedAIPanel   = lazy(() => import('@/components/panels/AdvancedAIPanel').then((m) => ({ default: m.AdvancedAIPanel })))
const WeatherPanel      = lazy(() => import('@/components/panels/WeatherPanel').then((m) => ({ default: m.WeatherPanel })))
const SettingsPanel     = lazy(() => import('@/components/panels/SettingsPanel').then((m) => ({ default: m.SettingsPanel })))
const DeviceConfigPage  = lazy(() => import('@/components/pages/DeviceConfigPage').then((m) => ({ default: m.DeviceConfigPage })))

function PanelFallback({ name }: { name: string }) {
  return (
    <div className="h-full flex items-center justify-center flex-col gap-2 text-text-secondary text-[12px]">
      <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      <span>Loading {name}…</span>
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

// Banner shown above the strip when a panel is expanded
function ExpandedBanner({ panelTitle, onClose }: { panelTitle: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-2 py-[3px] px-2 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.25)] rounded-[6px] text-[10px] text-accent-blue shrink-0">
      <span>⤢ Expanded: <strong>{panelTitle}</strong></span>
      <span className="flex-1" />
      <button
        onClick={onClose}
        title="Collapse back to grid"
        className="border-none bg-transparent text-accent-blue cursor-pointer text-[11px] px-[2px]"
      >
        ✕ Collapse
      </button>
    </div>
  )
}

export function PanelGrid() {
  const activePanel          = useSystemStore((s) => s.activePanel)
  const isPanelVisible       = useSettingsStore((s) => s.isPanelVisible)
  const defaultExpandedPanel = useSettingsStore((s) => s.defaultExpandedPanel)
  const expandedPanel        = useViewStore((s) => s.expandedPanel)
  const toggleExpand         = useViewStore((s) => s.toggleExpand)
  const setPanelView         = useViewStore((s) => s.setPanelView)
  const panelViews           = useViewStore((s) => s.panelViews)
  const getView              = (id: string) => panelViews[id] ?? 'normal'
  const isMobile             = useIsMobile()

  // Initialise default-expanded once on mount
  const didInit = useRef(false)
  useEffect(() => {
    if (!didInit.current && defaultExpandedPanel) {
      didInit.current = true
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
      <main
        className="flex-1 flex overflow-hidden min-h-0"
        style={{ padding: isMobile ? 2 : 4 }}
      >
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
      <main
        className="flex-1 flex overflow-hidden min-h-0"
        style={{ padding: isMobile ? 2 : 4 }}
      >
        <PanelShell panelId="device" title="SensiConnect — Device Configuration" icon="🔌" style={{ flex: 1 }}>
          <Suspense fallback={<PanelFallback name="Device Config" />}>
            <DeviceConfigPage />
          </Suspense>
        </PanelShell>
      </main>
    )
  }

  const visiblePanels = ALL_PANELS.filter((p) => isPanelVisible(p.id))
  const corePanels    = visiblePanels.filter((p) => CORE_IDS.includes(p.id))
  const extraPanels   = visiblePanels.filter((p) => !CORE_IDS.includes(p.id))
  const hasAllCore    = corePanels.length === 6
  const isActive      = (panelId: string) => SIDEBAR_TO_PANEL[activePanel] === panelId

  // ── Expanded layout ──────────────────────────────────────────────────────
  if (expandedPanel) {
    const expDef     = ALL_PANELS.find((p) => p.id === expandedPanel || p.sidebarId === expandedPanel)
    const stripPanels = visiblePanels.filter(
      (p) => p.id !== expandedPanel && p.sidebarId !== expandedPanel
    )

    return (
      <main
        className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0"
        style={{ padding: 4, gap: 4 }}
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
            <div className="flex-1 min-h-0 overflow-hidden">
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
            className="panel-strip-mobile h-[76px] shrink-0 flex overflow-x-auto overflow-y-hidden"
            style={{ gap: 4 }}
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
                  forceMinimized={!isMin}
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
      className="flex-1 min-h-0 min-w-0 flex flex-col overflow-x-hidden"
      style={{
        overflowY: extraPanels.length === 0 ? 'hidden' : 'auto',
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
            gridTemplateRows: (hasAllCore && !isMobile) ? 'repeat(3, minmax(200px, 1fr))' : undefined,
            gridAutoRows: isMobile ? 'minmax(260px, auto)' : undefined,
            gap: 4,
            flex: extraPanels.length > 0 ? '0 0 auto' : 1,
            minHeight: extraPanels.length > 0 ? (isMobile ? 200 : 260) : 0,
            maxHeight: (hasAllCore && !isMobile && extraPanels.length === 0) ? '1208px' : undefined,
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
