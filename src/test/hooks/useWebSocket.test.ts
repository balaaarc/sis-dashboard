import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useSensorStore } from '../../store/sensorStore'
import { useAlertStore } from '../../store/alertStore'
import { useSystemStore } from '../../store/systemStore'
import type { SensorPayload, Track, ThreatAssessment, SystemHealth } from '../../types/sensors'

// ── helpers ──────────────────────────────────────────────────
function resetStores() {
  useSensorStore.setState({
    sensors: new Map(),
    sensorHistory: new Map(),
    tracks: [],
    selectedSensorId: null,
  })
  useAlertStore.setState({
    alerts: [],
    threatAssessment: null,
    filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'UNACKED' },
  })
  useSystemStore.setState({
    connectionStatus: 'disconnected',
    scenario: 'NORMAL',
    health: null,
    sidebarCollapsed: false,
    theme: 'dark',
  })
}

function getLastWs(): InstanceType<typeof WebSocket> {
  // MockWebSocket tracks instances — return the most recently created
  const instances = (global.WebSocket as unknown as { instances?: WebSocket[] }).instances
  return instances![instances!.length - 1]
}

function dispatchMessage(ws: WebSocket, type: string, payload: unknown) {
  act(() => {
    const event = new MessageEvent('message', {
      data: JSON.stringify({ type, payload }),
    })
    ws.onmessage!(event)
  })
}

// ── Track created WS instances ────────────────────────────────
class TrackingMockWS {
  static OPEN = 1
  static CLOSED = 3
  static instances: TrackingMockWS[] = []
  readyState = TrackingMockWS.OPEN
  onopen: ((e: Event) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = TrackingMockWS.CLOSED
  })
  url: string
  constructor(url: string) {
    this.url = url
    TrackingMockWS.instances.push(this)
    setTimeout(() => {
      if (this.onopen) this.onopen(new Event('open'))
    }, 0)
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  TrackingMockWS.instances = []
  global.WebSocket = TrackingMockWS as unknown as typeof WebSocket
  resetStores()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useWebSocket', () => {
  describe('connection lifecycle', () => {
    it('sets connectionStatus to "connecting" immediately on mount', () => {
      renderHook(() => useWebSocket())
      expect(useSystemStore.getState().connectionStatus).toBe('connecting')
    })

    it('sets connectionStatus to "connected" after WebSocket opens', async () => {
      renderHook(() => useWebSocket())
      await act(async () => {
        vi.runAllTimers()
      })
      expect(useSystemStore.getState().connectionStatus).toBe('connected')
    })

    it('sends SUBSCRIBE message on open', async () => {
      renderHook(() => useWebSocket())
      await act(async () => {
        vi.runAllTimers()
      })
      const ws = TrackingMockWS.instances[0]
      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'SUBSCRIBE', payload: { streams: ['ALL'] } })
      )
    })

    it('sets connectionStatus to "disconnected" when WS closes', async () => {
      renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]
      act(() => {
        ws.onclose!(new CloseEvent('close'))
      })
      expect(useSystemStore.getState().connectionStatus).toBe('disconnected')
    })

    it('calls ws.close() on unmount', async () => {
      const { unmount } = renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]
      unmount()
      expect(ws.close).toHaveBeenCalled()
    })
  })

  describe('message dispatch — SENSOR_DATA', () => {
    it('calls updateSensor in sensorStore when SENSOR_DATA arrives', async () => {
      renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]

      const payload: SensorPayload = {
        sensor_id: 'S01-GEO',
        modality: 'SEISMIC',
        timestamp: new Date().toISOString(),
        site_id: 'SITE-01',
        bop_id: 'BOP-ALPHA-01',
        quality_score: 0.9,
        raw_value: {},
        sensor_status: 'ONLINE',
      }
      dispatchMessage(ws, 'SENSOR_DATA', payload)
      expect(useSensorStore.getState().sensors.has('S01-GEO')).toBe(true)
    })
  })

  describe('message dispatch — AIML_TRACK_UPDATE', () => {
    it('updates tracks in sensorStore', async () => {
      renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]

      const tracks: Track[] = [
        {
          track_id: 't1',
          lat: 21.945,
          lon: 88.12,
          range_m: 500,
          velocity: 1.5,
          heading: 45,
          class: 'HUMAN',
          confidence: 0.9,
          age_frames: 3,
        },
      ]
      dispatchMessage(ws, 'AIML_TRACK_UPDATE', { tracks })
      expect(useSensorStore.getState().tracks).toHaveLength(1)
      expect(useSensorStore.getState().tracks[0].track_id).toBe('t1')
    })
  })

  describe('message dispatch — AIML_ALERT', () => {
    it('adds alert to alertStore', async () => {
      renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]

      dispatchMessage(ws, 'AIML_ALERT', {
        alert_id: 'alert-001',
        timestamp: new Date().toISOString(),
        threat_level: 'HIGH',
        contributing_sensors: ['S01'],
        location: { lat: 21.945, lon: 88.12 },
        scenario: 'INTRUSION',
        recommended_action: 'Deploy QRT',
      })
      const { alerts } = useAlertStore.getState()
      expect(alerts).toHaveLength(1)
      expect(alerts[0].id).toBe('alert-001')
      expect(alerts[0].threat_level).toBe('HIGH')
    })
  })

  describe('message dispatch — THREAT_ASSESSMENT', () => {
    it('stores threat assessment in alertStore', async () => {
      renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]

      const assessment: ThreatAssessment = {
        assessment_id: 'ta-001',
        timestamp: new Date().toISOString(),
        threat_score: 80,
        threat_level: 'HIGH',
        contributing_sensors: ['S02'],
        dominant_modality: 'SEISMIC',
        location: { lat: 21.945, lon: 88.12, accuracy_m: 50 },
        recommended_action: 'Alert',
        model_version: 'bayesian-v3.1',
      }
      dispatchMessage(ws, 'THREAT_ASSESSMENT', assessment)
      expect(useAlertStore.getState().threatAssessment?.threat_score).toBe(80)
    })
  })

  describe('message dispatch — SYSTEM_HEALTH', () => {
    it('stores system health in systemStore', async () => {
      renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]

      const health: SystemHealth = {
        cpu_pct: 45,
        mem_pct: 60,
        uptime_s: 3600,
        sensors_online: 18,
        sensors_total: 20,
        ws_clients: 1,
        scenario: 'NORMAL',
      }
      dispatchMessage(ws, 'SYSTEM_HEALTH', health)
      expect(useSystemStore.getState().health?.cpu_pct).toBe(45)
    })
  })

  describe('message dispatch — SCENARIO_CHANGE', () => {
    it('updates scenario in systemStore', async () => {
      renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]

      dispatchMessage(ws, 'SCENARIO_CHANGE', { current: 'INTRUSION' })
      expect(useSystemStore.getState().scenario).toBe('INTRUSION')
    })
  })

  describe('message dispatch — malformed JSON', () => {
    it('does not crash when message is not valid JSON', async () => {
      renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]

      expect(() => {
        act(() => {
          ws.onmessage!(new MessageEvent('message', { data: 'not-json{{' }))
        })
      }).not.toThrow()
    })
  })

  describe('sendMessage', () => {
    it('sendMessage sends JSON string over the socket when OPEN', async () => {
      const { result } = renderHook(() => useWebSocket())
      await act(async () => { vi.runAllTimers() })
      const ws = TrackingMockWS.instances[0]

      act(() => {
        result.current.sendMessage({ type: 'PTZ_CONTROL', payload: { pan: 10 } })
      })
      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'PTZ_CONTROL', payload: { pan: 10 } })
      )
    })
  })
})
