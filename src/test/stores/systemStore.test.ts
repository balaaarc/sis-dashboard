import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useSystemStore } from '../../store/systemStore'
import type { SystemHealth, ScenarioType } from '../../types/sensors'

function mockSystemHealth(overrides?: Partial<SystemHealth>): SystemHealth {
  return {
    timestamp: '2026-04-11T10:00:00.000Z',
    node_id: 'NODE-01',
    hardware: {
      cpu_percent: 34,
      gpu_percent: 61,
      ram_percent: 52,
      nvme_percent: 28,
      temperature_c: 47,
      uptime_hours: 72,
    },
    comms: {
      satellite: { active: true, signal_quality: 0.91 },
    },
    aiml: {
      inference_fps: 25,
      gpu_memory_percent: 48,
      model_versions: { detector: '2.1.0' },
    },
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
  useSystemStore.setState({
    theme: 'dark',
    scenario: 'NORMAL',
    connectionStatus: 'connecting',
    health: null,
    sidebarCollapsed: false,
    activePanel: 'map',
  })
})

describe('useSystemStore', () => {
  describe('theme', () => {
    it('default theme is dark', () => {
      expect(useSystemStore.getState().theme).toBe('dark')
    })

    it('toggleTheme switches dark to light', () => {
      act(() => {
        useSystemStore.getState().toggleTheme()
      })
      expect(useSystemStore.getState().theme).toBe('light')
    })

    it('toggleTheme switches light back to dark', () => {
      act(() => {
        useSystemStore.setState({ theme: 'light' })
        useSystemStore.getState().toggleTheme()
      })
      expect(useSystemStore.getState().theme).toBe('dark')
    })

    it('toggleTheme saves the new theme to localStorage under the sis-theme key', () => {
      act(() => {
        useSystemStore.getState().toggleTheme()
      })
      expect(localStorage.getItem('sis-theme')).toBe('light')
    })

    it('toggleTheme sets the data-theme attribute on document.documentElement', () => {
      act(() => {
        useSystemStore.getState().toggleTheme()
      })
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('setTheme sets the theme directly to light', () => {
      act(() => {
        useSystemStore.getState().setTheme('light')
      })
      expect(useSystemStore.getState().theme).toBe('light')
    })

    it('setTheme sets the theme directly to dark', () => {
      act(() => {
        useSystemStore.setState({ theme: 'light' })
        useSystemStore.getState().setTheme('dark')
      })
      expect(useSystemStore.getState().theme).toBe('dark')
    })
  })

  describe('scenario', () => {
    it('setScenario updates the scenario to INTRUSION', () => {
      act(() => {
        useSystemStore.getState().setScenario('INTRUSION')
      })
      expect(useSystemStore.getState().scenario).toBe('INTRUSION')
    })

    it('all valid scenario types can be set without error', () => {
      const scenarios: ScenarioType[] = [
        'NORMAL',
        'ELEVATED',
        'INTRUSION',
        'TUNNEL_ACTIVITY',
        'DRONE',
        'VEHICLE_CONVOY',
      ]
      for (const s of scenarios) {
        act(() => {
          useSystemStore.getState().setScenario(s)
        })
        expect(useSystemStore.getState().scenario).toBe(s)
      }
    })
  })

  describe('connectionStatus', () => {
    it('setConnectionStatus updates connectionStatus to connected', () => {
      act(() => {
        useSystemStore.getState().setConnectionStatus('connected')
      })
      expect(useSystemStore.getState().connectionStatus).toBe('connected')
    })

    it('all valid connection statuses can be set without error', () => {
      const statuses = ['connecting', 'connected', 'reconnecting', 'disconnected'] as const
      for (const s of statuses) {
        act(() => {
          useSystemStore.getState().setConnectionStatus(s)
        })
        expect(useSystemStore.getState().connectionStatus).toBe(s)
      }
    })
  })

  describe('sidebarCollapsed', () => {
    it('toggleSidebar flips sidebarCollapsed from false to true', () => {
      act(() => {
        useSystemStore.getState().toggleSidebar()
      })
      expect(useSystemStore.getState().sidebarCollapsed).toBe(true)
    })

    it('toggleSidebar flips sidebarCollapsed from true back to false', () => {
      act(() => {
        useSystemStore.setState({ sidebarCollapsed: true })
        useSystemStore.getState().toggleSidebar()
      })
      expect(useSystemStore.getState().sidebarCollapsed).toBe(false)
    })
  })

  describe('health', () => {
    it('health is null initially', () => {
      expect(useSystemStore.getState().health).toBeNull()
    })

    it('setHealth stores the system health object', () => {
      const health = mockSystemHealth()
      act(() => {
        useSystemStore.getState().setHealth(health)
      })
      expect(useSystemStore.getState().health).toEqual(health)
    })
  })
})
