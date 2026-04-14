import { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useSystemStore } from '../../store/systemStore'
import { useViewStore } from '../../store/viewStore'

const CATEGORY_ICONS: Record<string, string> = {
  'Video & Imaging':            '📹',
  'Mapping & Geospatial':       '🗺',
  'Alerts & Prioritisation':    '🔔',
  'Radar, LiDAR & Active':      '📡',
  'Acoustic & Seismic':         '〰',
  'Sensor & System Health':     '🖥',
  'AI Analytics & Prediction':  '🤖',
  'Specialist Detection':       '🔬',
  'Utility & Configuration':    '🔧',
  'Counter-UAS':                '🛸',
  'Subsurface Detection':       '⛏',
  'Communications & Personnel': '👥',
  'Vehicle & Power Management': '🚗',
  'Command & Reporting':        '📋',
  'Advanced AI Monitoring':     '🧠',
  'Weather & Terrain':          '🌤',
  'Interoperability':           '🔗',
}

type Tab = 'widgets' | 'panels' | 'display' | 'layout' | 'thresholds'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        background: checked ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          display: 'block',
        }}
      />
    </button>
  )
}

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('widgets')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const widgetsByCategory = useSettingsStore((s) => s.widgetsByCategory())
  const toggleWidget = useSettingsStore((s) => s.toggleWidget)
  const setWidgetOption = useSettingsStore((s) => s.setWidgetOption)
  const panels = useSettingsStore((s) => s.panels)
  const togglePanel = useSettingsStore((s) => s.togglePanel)
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults)

  const theme = useSystemStore((s) => s.theme)
  const toggleTheme = useSystemStore((s) => s.toggleTheme)

  const defaultExpandedPanel    = useSettingsStore((s) => s.defaultExpandedPanel)
  const setDefaultExpandedPanel = useSettingsStore((s) => s.setDefaultExpandedPanel)
  const toggleExpand            = useViewStore((s) => s.toggleExpand)
  const setPanelView            = useViewStore((s) => s.setPanelView)
  const expandedPanel           = useViewStore((s) => s.expandedPanel)

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'widgets',    label: 'Widgets',    icon: '⊞' },
    { id: 'panels',     label: 'Panels',     icon: '▣' },
    { id: 'display',    label: 'Display',    icon: '🎨' },
    { id: 'layout',     label: 'Layout',     icon: '⤢' },
    { id: 'thresholds', label: 'Thresholds', icon: '⚡' },
  ]

  const PANEL_LABELS: Record<string, { label: string; icon: string; isNew?: boolean }> = {
    map:        { label: 'Live Tactical Map',         icon: '🗺'  },
    alerts:     { label: 'Alert Management',          icon: '🔔'  },
    video:      { label: 'Video / Imaging',           icon: '📹'  },
    sensors:    { label: 'Sensor Families',           icon: '📡'  },
    aiml:       { label: 'AI / ML Intelligence',      icon: '🤖'  },
    health:     { label: 'System Health',             icon: '🖥'  },
    counteruas: { label: 'Counter-UAS',               icon: '🛸',  isNew: true },
    personnel:  { label: 'Personnel & NavIC',         icon: '👥',  isNew: true },
    power:      { label: 'Power & Vehicle Health',    icon: '⚡',  isNew: true },
    command:    { label: 'Command & Reporting',       icon: '📋',  isNew: true },
    advancedai: { label: 'Advanced AI Monitoring',    icon: '🧠',  isNew: true },
    weather:    { label: 'Weather & Terrain',         icon: '🌤',  isNew: true },
  }

  const categories = Object.keys(widgetsByCategory)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: activeTab === tab.id ? 700 : 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>

        {/* ── WIDGETS TAB ── */}
        {activeTab === 'widgets' && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Toggle individual widgets on or off. Changes take effect immediately. Disabled widgets stop rendering but retain their data connections.
            </div>

            {categories.map((cat) => {
              const widgets = widgetsByCategory[cat]
              const icon = CATEGORY_ICONS[cat] ?? '■'
              const isExpanded = expandedCategory === cat
              const allVisible = widgets.every((w) => w.visible)
              const someVisible = widgets.some((w) => w.visible)

              return (
                <div key={cat} style={{ marginBottom: 8 }}>
                  {/* Category header */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: isExpanded ? '6px 6px 0 0' : 6,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <span>{icon}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{cat}</span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 10,
                        padding: '1px 6px',
                      }}
                    >
                      {widgets.filter((w) => w.visible).length}/{widgets.length}
                    </span>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: allVisible
                          ? 'var(--sensor-acoustic)'
                          : someVisible
                          ? 'var(--alert-medium)'
                          : 'var(--alert-critical)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Widget rows */}
                  {isExpanded && (
                    <div
                      style={{
                        border: '1px solid var(--border-color)',
                        borderTop: 'none',
                        borderRadius: '0 0 6px 6px',
                        overflow: 'hidden',
                      }}
                    >
                      {widgets.map((widget, i) => (
                        <div
                          key={widget.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderTop: i > 0 ? '1px solid var(--border-color)' : 'none',
                            background: 'var(--panel-bg)',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                              <span style={{ color: widget.visible ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {widget.label}
                              </span>
                              {widget.isNew && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: 'rgba(34,197,94,0.15)',
                                    color: 'var(--sensor-acoustic)',
                                    border: '1px solid rgba(34,197,94,0.3)',
                                    borderRadius: 4,
                                    padding: '0 4px',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>
                          <Toggle checked={widget.visible} onChange={() => toggleWidget(widget.id)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── PANELS TAB ── */}
        {activeTab === 'panels' && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Show or hide entire panel sections from the dashboard grid. Hidden panels are removed from the layout to reclaim screen space.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(PANEL_LABELS).map(([id, meta]) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{meta.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: panels[id] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {meta.label}
                      </span>
                      {meta.isNew && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: 'rgba(34,197,94,0.15)',
                            color: 'var(--sensor-acoustic)',
                            border: '1px solid rgba(34,197,94,0.3)',
                            borderRadius: 4,
                            padding: '0 4px',
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                  <Toggle checked={panels[id] ?? true} onChange={() => togglePanel(id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISPLAY TAB ── */}
        {activeTab === 'display' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                Theme
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12 }}>
                    {theme === 'dark' ? '🌙 Dark Mode' : '☀ Light Mode'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Switch between dark tactical view and light operational view
                  </div>
                </div>
                <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                Widget Catalogue Info
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>Total widgets</span><strong style={{ color: 'var(--text-primary)' }}>37</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>Original catalogue</span><strong style={{ color: 'var(--text-primary)' }}>20</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>New additions</span>
                  <strong style={{ color: 'var(--sensor-acoustic)' }}>17</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>Categories</span><strong style={{ color: 'var(--text-primary)' }}>17</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Catalogue version</span><strong style={{ color: 'var(--text-primary)' }}>Section 9.3 (Updated)</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                New Widget Categories
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {['Counter-UAS', 'Subsurface Detection', 'Communications & Personnel', 'Vehicle & Power Management', 'Command & Reporting', 'Advanced AI Monitoring', 'Weather & Terrain', 'Interoperability'].map((cat) => (
                  <div key={cat} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '2px 0' }}>
                    <span style={{ color: 'var(--sensor-acoustic)', fontSize: 10 }}>✓</span>
                    <span>{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LAYOUT TAB ── */}
        {activeTab === 'layout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Configure how panels are displayed. Each panel supports three view modes:
              <ul style={{ marginTop: 8, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li><strong style={{ color: 'var(--text-primary)' }}>Normal</strong> — default, shows full panel content</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Minimized ▬</strong> — compact strip showing only priority data</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Expanded ⤢</strong> — panel fills entire view, others collapse to strip</li>
              </ul>
            </div>

            {/* Default expanded panel */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                Default Expanded Panel
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                This panel opens in expanded view automatically when the dashboard loads. All other panels collapse to a compact strip below it.
              </div>
              <select
                value={defaultExpandedPanel ?? ''}
                onChange={(e) => {
                  const val = e.target.value || null
                  setDefaultExpandedPanel(val)
                  // Apply immediately: collapse current then expand new
                  if (expandedPanel) setPanelView(expandedPanel, 'normal')
                  if (val) toggleExpand(val)
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <option value="">— None (grid layout on load) —</option>
                {Object.entries(PANEL_LABELS).map(([id, meta]) => (
                  <option key={id} value={id}>
                    {meta.icon} {meta.label}
                  </option>
                ))}
              </select>
              {defaultExpandedPanel && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--sensor-acoustic)' }}>
                  ✓ On next load: <strong>{PANEL_LABELS[defaultExpandedPanel]?.icon} {PANEL_LABELS[defaultExpandedPanel]?.label}</strong> will open expanded
                </div>
              )}
            </div>

            {/* Live view controls */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                Quick View Controls
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(PANEL_LABELS).map(([id, meta]) => (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: 6 }}>
                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>{meta.label}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => setPanelView(id, 'normal')}
                        title="Restore to normal"
                        style={{
                          padding: '3px 8px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 4,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: 10,
                        }}
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => setPanelView(id, 'minimized')}
                        title="Minimize"
                        style={{
                          padding: '3px 8px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 4,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: 10,
                        }}
                      >
                        ▬ Min
                      </button>
                      <button
                        onClick={() => {
                          if (expandedPanel) setPanelView(expandedPanel, 'normal')
                          toggleExpand(id)
                        }}
                        title="Expand"
                        style={{
                          padding: '3px 8px',
                          background: expandedPanel === id ? 'rgba(59,130,246,0.2)' : 'var(--bg-tertiary)',
                          border: `1px solid ${expandedPanel === id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                          borderRadius: 4,
                          color: expandedPanel === id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: 10,
                          fontWeight: expandedPanel === id ? 700 : 400,
                        }}
                      >
                        ⤢ Expand
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How-to tip */}
            <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 700, marginBottom: 4 }}>💡 Usage Tips</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                • Click <strong>⤢</strong> on any panel header to expand it<br />
                • Click <strong>▬</strong> on any panel header to minimize it to a strip<br />
                • When expanded, all other panels collapse to a compact strip at the bottom<br />
                • Click <strong>⊡</strong> on the expanded panel (or the ✕ Collapse button) to return to grid view<br />
                • Minimized panels show only priority metrics — click to restore
              </div>
            </div>
          </div>
        )}

        {/* ── THRESHOLDS TAB ── */}
        {activeTab === 'thresholds' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>
              Configure alert thresholds and update rates per widget. Higher update rates consume more bandwidth.
            </div>

            {(['Acoustic & Seismic', 'AI Analytics & Prediction', 'Sensor & System Health', 'Counter-UAS', 'Advanced AI Monitoring'] as const).map((cat) => {
              const widgets = widgetsByCategory[cat] ?? []
              return (
                <div key={cat}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </div>
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 6,
                        padding: '10px 12px',
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{widget.label}</div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          Update rate (Hz)
                          <input
                            type="number"
                            min={0.1}
                            max={25}
                            step={0.5}
                            value={widget.updateRateHz ?? 1}
                            onChange={(e) => setWidgetOption(widget.id, 'updateRateHz', Number(e.target.value))}
                            style={{
                              width: 80,
                              padding: '3px 6px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 4,
                              color: 'var(--text-primary)',
                              fontSize: 11,
                            }}
                          />
                        </label>
                        <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          Alert threshold
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={widget.threshold ?? 50}
                            onChange={(e) => setWidgetOption(widget.id, 'threshold', Number(e.target.value))}
                            style={{
                              width: 80,
                              padding: '3px 6px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 4,
                              color: 'var(--text-primary)',
                              fontSize: 11,
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Footer actions */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          Settings saved automatically to localStorage
        </span>
        <button
          onClick={resetToDefaults}
          style={{
            padding: '5px 12px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 4,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
