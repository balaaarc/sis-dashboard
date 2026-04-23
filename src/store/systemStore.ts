import { create } from 'zustand'
import type { SystemHealth, ScenarioType } from '@/types/sensors'

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface SystemState {
  health: SystemHealth | null
  theme: 'dark' | 'light'
  scenario: ScenarioType
  connectionStatus: ConnectionStatus
  activePanel: string
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  reconnectFn: (() => void) | null
  sendMessageFn: ((msg: object) => void) | null
  setHealth: (h: SystemHealth) => void
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void
  setScenario: (s: ScenarioType) => void
  setConnectionStatus: (s: ConnectionStatus) => void
  setActivePanel: (p: string) => void
  toggleSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
  setReconnectFn: (fn: () => void) => void
  reconnect: () => void
  setSendMessageFn: (fn: (msg: object) => void) => void
  sendMessage: (msg: object) => void
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
  mobileSidebarOpen: false,
  reconnectFn: null,
  sendMessageFn: null,

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

  setMobileSidebarOpen: (open: boolean) => {
    set({ mobileSidebarOpen: open })
  },

  toggleMobileSidebar: () => {
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen }))
  },

  setReconnectFn: (fn: () => void) => {
    set({ reconnectFn: fn })
  },

  reconnect: () => {
    get().reconnectFn?.()
  },

  setSendMessageFn: (fn: (msg: object) => void) => {
    set({ sendMessageFn: fn })
  },

  sendMessage: (msg: object) => {
    get().sendMessageFn?.(msg)
  },
}))
