import { create } from 'zustand'

export interface WidgetDef {
  id: string
  label: string
  category: string
  isNew?: boolean
  panelId: string
  visible: boolean
  updateRateHz?: number
  threshold?: number
}

const DEFAULT_WIDGETS: WidgetDef[] = [
  // Video & Imaging
  { id: 'liveVideoViewer',        label: 'Live Video Viewer',           category: 'Video & Imaging',            panelId: 'video',       visible: true  },
  { id: 'thermalOverlayViewer',   label: 'Thermal Overlay Viewer',      category: 'Video & Imaging',            panelId: 'video',       visible: true  },
  // Mapping
  { id: 'tacticalMap2D',          label: '2D Tactical Map',             category: 'Mapping & Geospatial',       panelId: 'map',         visible: true  },
  { id: 'terrainView3D',          label: '3D Terrain View',             category: 'Mapping & Geospatial',       panelId: 'map',         visible: false },
  // Alerts
  { id: 'alertQueue',             label: 'Alert Queue',                 category: 'Alerts & Prioritisation',   panelId: 'alerts',      visible: true  },
  // Radar / LiDAR
  { id: 'gmtiRadarTrack',         label: 'GMTI Radar Track Display',    category: 'Radar, LiDAR & Active',     panelId: 'sensors',     visible: true  },
  { id: 'lidarPointCloud',        label: 'LiDAR Point Cloud Viewer',    category: 'Radar, LiDAR & Active',     panelId: 'sensors',     visible: false },
  // Acoustic / Seismic
  { id: 'seismicTimeline',        label: 'Seismic / Vibration Timeline',category: 'Acoustic & Seismic',        panelId: 'sensors',     visible: true  },
  { id: 'acousticSpectrogram',    label: 'Acoustic Spectrogram',        category: 'Acoustic & Seismic',        panelId: 'sensors',     visible: true  },
  // Sensor & System Health
  { id: 'sensorHealthDashboard',  label: 'Sensor Health Dashboard',     category: 'Sensor & System Health',    panelId: 'health',      visible: true  },
  { id: 'communicationStatus',    label: 'Communication Status',        category: 'Sensor & System Health',    panelId: 'health',      visible: true  },
  { id: 'environmentalMonitor',   label: 'Environmental Monitor',       category: 'Sensor & System Health',    panelId: 'health',      visible: true  },
  // AI Analytics
  { id: 'aiAnalyticsSummary',     label: 'AI Analytics Summary',       category: 'AI Analytics & Prediction', panelId: 'aiml',        visible: true  },
  { id: 'fusionEventLog',         label: 'Fusion Event Log',            category: 'AI Analytics & Prediction', panelId: 'aiml',        visible: true  },
  { id: 'trajectoryPrediction',   label: 'Trajectory Prediction Panel', category: 'AI Analytics & Prediction', panelId: 'aiml',        visible: true  },
  { id: 'anomalyScoreGauge',      label: 'Anomaly Score Gauge',        category: 'AI Analytics & Prediction', panelId: 'aiml',        visible: true  },
  // Specialist Detection
  { id: 'etdChemicalAlert',       label: 'ETD / Chemical Alert Panel',  category: 'Specialist Detection',      panelId: 'sensors',     visible: true  },
  { id: 'satelliteImageOverlay',  label: 'Satellite / Archive Image',   category: 'Specialist Detection',      panelId: 'map',         visible: false },
  // Utility
  { id: 'customChart',            label: 'Custom Chart Widget',         category: 'Utility & Configuration',   panelId: 'health',      visible: false },
  { id: 'operatorNotes',          label: 'Operator Notes / Annotations',category: 'Utility & Configuration',   panelId: 'alerts',      visible: true  },
  // Counter-UAS (NEW)
  { id: 'counterUasThreatDisplay',label: 'Counter-UAS Threat Display',  category: 'Counter-UAS',               panelId: 'counteruas',  visible: true,  isNew: true },
  { id: 'droneTrackPlayback',     label: 'Drone Track Playback',        category: 'Counter-UAS',               panelId: 'counteruas',  visible: true,  isNew: true },
  // Subsurface (NEW)
  { id: 'gprScanViewer',          label: 'GPR Scan Viewer',             category: 'Subsurface Detection',      panelId: 'personnel',   visible: true,  isNew: true },
  { id: 'madFieldStrengthMap',    label: 'MAD Field Strength Map',      category: 'Subsurface Detection',      panelId: 'personnel',   visible: true,  isNew: true },
  // Comms & Personnel (NEW)
  { id: 'navicGpsBoard',          label: 'NavIC / GPS Position Board',  category: 'Communications & Personnel',panelId: 'personnel',   visible: true,  isNew: true },
  { id: 'emergencyAlertDispatcher',label:'Emergency Alert Dispatcher',  category: 'Communications & Personnel',panelId: 'personnel',   visible: true,  isNew: true },
  { id: 'personnelTracker',       label: 'Personnel Tracker',           category: 'Communications & Personnel',panelId: 'personnel',   visible: true,  isNew: true },
  // Vehicle & Power (NEW)
  { id: 'vehicleHealthMonitor',   label: 'Vehicle Health Monitor',      category: 'Vehicle & Power Management',panelId: 'power',       visible: true,  isNew: true },
  { id: 'powerEnergyMonitor',     label: 'Power & Energy Monitor',      category: 'Vehicle & Power Management',panelId: 'power',       visible: true,  isNew: true },
  // Command & Reporting (NEW)
  { id: 'incidentReportGenerator',label: 'Incident Report Generator',   category: 'Command & Reporting',       panelId: 'command',     visible: true,  isNew: true },
  { id: 'shiftHandoverSummary',   label: 'Shift Handover Summary',      category: 'Command & Reporting',       panelId: 'command',     visible: true,  isNew: true },
  { id: 'multiNodeOverview',      label: 'Multi-Node Overview Panel',   category: 'Command & Reporting',       panelId: 'command',     visible: true,  isNew: true },
  // Advanced AI Monitoring (NEW)
  { id: 'behaviouralPatternHeatmap',label:'Behavioural Pattern Heatmap',category: 'Advanced AI Monitoring',    panelId: 'advancedai',  visible: true,  isNew: true },
  { id: 'falseAlarmRateTracker',  label: 'False Alarm Rate Tracker',    category: 'Advanced AI Monitoring',    panelId: 'advancedai',  visible: true,  isNew: true },
  { id: 'aiModelConfidenceMonitor',label:'AI Model Confidence Monitor', category: 'Advanced AI Monitoring',    panelId: 'advancedai',  visible: true,  isNew: true },
  // Weather (NEW)
  { id: 'visibilityWeatherForecast',label:'Visibility & Weather Forecast',category:'Weather & Terrain',         panelId: 'weather',     visible: true,  isNew: true },
  // Interoperability (NEW)
  { id: 'cibmsNatgridFeedMonitor',label: 'CIBMS / NATGRID Feed Monitor',category: 'Interoperability',         panelId: 'command',     visible: true,  isNew: true },
]

// Panel-level visibility (each panel can be shown/hidden independently)
const DEFAULT_PANELS: Record<string, boolean> = {
  map:         true,
  alerts:      true,
  video:       true,
  sensors:     true,
  aiml:        true,
  health:      true,
  counteruas:  true,
  personnel:   true,
  power:       true,
  command:     true,
  advancedai:  true,
  weather:     true,
}

function loadFromStorage(): { widgets: WidgetDef[]; panels: Record<string, boolean>; defaultExpandedPanel: string | null } {
  try {
    const raw = localStorage.getItem('sis-settings')
    if (!raw) return { widgets: DEFAULT_WIDGETS, panels: DEFAULT_PANELS, defaultExpandedPanel: null }
    const saved = JSON.parse(raw)

    // Merge saved visibility into defaults (new widgets added later get default visible)
    const widgets = DEFAULT_WIDGETS.map((w) => ({
      ...w,
      visible: saved.widgets?.[w.id]?.visible ?? w.visible,
      updateRateHz: saved.widgets?.[w.id]?.updateRateHz ?? w.updateRateHz,
      threshold: saved.widgets?.[w.id]?.threshold ?? w.threshold,
    }))
    const panels = { ...DEFAULT_PANELS, ...saved.panels }
    const defaultExpandedPanel = saved.defaultExpandedPanel ?? null
    return { widgets, panels, defaultExpandedPanel }
  } catch {
    return { widgets: DEFAULT_WIDGETS, panels: DEFAULT_PANELS, defaultExpandedPanel: null }
  }
}

interface SettingsState {
  widgets: WidgetDef[]
  panels: Record<string, boolean>
  defaultExpandedPanel: string | null
  settingsOpen: boolean

  toggleWidget: (id: string) => void
  setWidgetOption: (id: string, key: 'updateRateHz' | 'threshold', value: number) => void
  togglePanel: (panelId: string) => void
  setDefaultExpandedPanel: (id: string | null) => void
  setSettingsOpen: (open: boolean) => void
  resetToDefaults: () => void
  isWidgetVisible: (id: string) => boolean
  isPanelVisible: (panelId: string) => boolean
  widgetsByCategory: () => Record<string, WidgetDef[]>
}

function persist(state: Pick<SettingsState, 'widgets' | 'panels' | 'defaultExpandedPanel'>) {
  const data = {
    widgets: Object.fromEntries(state.widgets.map((w) => [w.id, { visible: w.visible, updateRateHz: w.updateRateHz, threshold: w.threshold }])),
    panels: state.panels,
    defaultExpandedPanel: state.defaultExpandedPanel,
  }
  localStorage.setItem('sis-settings', JSON.stringify(data))
}

const initial = loadFromStorage()

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  widgets: initial.widgets,
  panels: initial.panels,
  defaultExpandedPanel: initial.defaultExpandedPanel,
  settingsOpen: false,

  toggleWidget: (id) => {
    set((s) => {
      const widgets = s.widgets.map((w) => w.id === id ? { ...w, visible: !w.visible } : w)
      persist({ widgets, panels: s.panels, defaultExpandedPanel: s.defaultExpandedPanel })
      return { widgets }
    })
  },

  setWidgetOption: (id, key, value) => {
    set((s) => {
      const widgets = s.widgets.map((w) => w.id === id ? { ...w, [key]: value } : w)
      persist({ widgets, panels: s.panels, defaultExpandedPanel: s.defaultExpandedPanel })
      return { widgets }
    })
  },

  togglePanel: (panelId) => {
    set((s) => {
      const panels = { ...s.panels, [panelId]: !s.panels[panelId] }
      persist({ widgets: s.widgets, panels, defaultExpandedPanel: s.defaultExpandedPanel })
      return { panels }
    })
  },

  setDefaultExpandedPanel: (id) => {
    set((s) => {
      persist({ widgets: s.widgets, panels: s.panels, defaultExpandedPanel: id })
      return { defaultExpandedPanel: id }
    })
  },

  setSettingsOpen: (open) => set({ settingsOpen: open }),

  resetToDefaults: () => {
    localStorage.removeItem('sis-settings')
    set({ widgets: DEFAULT_WIDGETS, panels: DEFAULT_PANELS, defaultExpandedPanel: null })
  },

  isWidgetVisible: (id) => get().widgets.find((w) => w.id === id)?.visible ?? true,

  isPanelVisible: (panelId) => get().panels[panelId] ?? true,

  widgetsByCategory: () => {
    const { widgets } = get()
    return widgets.reduce<Record<string, WidgetDef[]>>((acc, w) => {
      if (!acc[w.category]) acc[w.category] = []
      acc[w.category].push(w)
      return acc
    }, {})
  },
}))
