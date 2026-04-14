import { create } from 'zustand'
import type { SystemHealth, ScenarioType } from '../types/sensors'

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface SystemState {
  health: SystemHealth | null
  theme: 'dark' | 'light'
  scenario: ScenarioType
  connectionStatus: ConnectionStatus
  activePanel: string
  sidebarCollapsed: boolean
  reconnectFn: (() => void) | null
  setHealth: (h: SystemHealth) => void
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void
  setScenario: (s: ScenarioType) => void
  setConnectionStatus: (s: ConnectionStatus) => void
  setActivePanel: (p: string) => void
  toggleSidebar: () => void
  setReconnectFn: (fn: () => void) => void
  reconnect: () => void
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme)
}

const storedTheme = (localStorage.getItem('sis-theme') as 'dark' | 'light') ?? 'dark'
applyTheme(storedTheme)

export const useSystemStore = create<SystemState>()((set, get) => ({
  health: null,
  theme: storedTheme,
  scenario: 'NORMAL',
  connectionStatus: 'connecting',
  activePanel: 'map',
  sidebarCollapsed: false,
  reconnectFn: null,

  setHealth: (h: SystemHealth) => {
    set({ health: h })
  },

  setTheme: (t: 'dark' | 'light') => {
    localStorage.setItem('sis-theme', t)
    applyTheme(t)
    set({ theme: t })
  },

  toggleTheme: () => {
    const { theme } = get()
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('sis-theme', newTheme)
    applyTheme(newTheme)
    set({ theme: newTheme })
  },

  setScenario: (s: ScenarioType) => {
    set({ scenario: s })
  },

  setConnectionStatus: (s: ConnectionStatus) => {
    set({ connectionStatus: s })
  },

  setActivePanel: (p: string) => {
    set({ activePanel: p })
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  setReconnectFn: (fn: () => void) => {
    set({ reconnectFn: fn })
  },

  reconnect: () => {
    get().reconnectFn?.()
  },
}))
