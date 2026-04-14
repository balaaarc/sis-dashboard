import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useSensorStore } from '../../store/sensorStore'
import type { SensorPayload, Track } from '../../types/sensors'

function mockPayload(overrides?: Partial<SensorPayload>): SensorPayload {
  return {
    sensor_id: 'S02-GEO-001',
    modality: 'SEISMIC',
    timestamp: '2026-04-11T10:00:00.000Z',
    site_id: 'BOP-ALPHA-01',
    bop_id: 'BOP-001',
    quality_score: 0.95,
    raw_value: { pgv: 0.05, rms: 0.02 },
    sensor_status: 'ONLINE',
    ...overrides,
  }
}

function mockTrack(overrides?: Partial<Track>): Track {
  return {
    track_id: 'T-001',
    lat: 21.9452,
    lon: 88.1234,
    range_m: 150,
    velocity: 1.2,
    heading: 45,
    class: 'HUMAN',
    confidence: 0.87,
    age_frames: 10,
    ...overrides,
  }
}

beforeEach(() => {
  useSensorStore.setState({
    sensors: new Map(),
    sensorHistory: new Map(),
    tracks: [],
    selectedSensorId: null,
  })
})

describe('useSensorStore', () => {
  describe('initial state', () => {
    it('sensors map is empty', () => {
      const { sensors } = useSensorStore.getState()
      expect(sensors.size).toBe(0)
    })

    it('tracks is an empty array', () => {
      const { tracks } = useSensorStore.getState()
      expect(tracks).toEqual([])
    })

    it('selectedSensorId is null', () => {
      const { selectedSensorId } = useSensorStore.getState()
      expect(selectedSensorId).toBeNull()
    })
  })

  describe('updateSensor', () => {
    it('stores payload in sensors map', () => {
      const payload = mockPayload()
      act(() => {
        useSensorStore.getState().updateSensor(payload)
      })
      const { sensors } = useSensorStore.getState()
      expect(sensors.has('S02-GEO-001')).toBe(true)
      expect(sensors.get('S02-GEO-001')).toEqual(payload)
    })

    it('updates existing sensor with the same sensor_id', () => {
      const first = mockPayload({ timestamp: '2026-04-11T10:00:00.000Z', quality_score: 0.80 })
      const second = mockPayload({ timestamp: '2026-04-11T10:00:05.000Z', quality_score: 0.92 })

      act(() => {
        useSensorStore.getState().updateSensor(first)
        useSensorStore.getState().updateSensor(second)
      })

      const { sensors } = useSensorStore.getState()
      expect(sensors.size).toBe(1)
      expect(sensors.get('S02-GEO-001')).toEqual(second)
    })

    it('appends payload to sensorHistory', () => {
      const payload = mockPayload()
      act(() => {
        useSensorStore.getState().updateSensor(payload)
      })
      const { sensorHistory } = useSensorStore.getState()
      const history = sensorHistory.get('S02-GEO-001')
      expect(history).toHaveLength(1)
      expect(history![0]).toEqual(payload)
    })

    it('caps sensorHistory at 100 items when 105 payloads are added', () => {
      act(() => {
        for (let i = 0; i < 105; i++) {
          useSensorStore.getState().updateSensor(
            mockPayload({ timestamp: `2026-04-11T10:00:${String(i).padStart(2, '0')}.000Z` })
          )
        }
      })
      const { sensorHistory } = useSensorStore.getState()
      const history = sensorHistory.get('S02-GEO-001')
      expect(history).toHaveLength(100)
    })

    it('stores multiple sensors independently', () => {
      const payloadA = mockPayload({ sensor_id: 'S02-GEO-001' })
      const payloadB = mockPayload({ sensor_id: 'S03-ACO-002', modality: 'ACOUSTIC' })

      act(() => {
        useSensorStore.getState().updateSensor(payloadA)
        useSensorStore.getState().updateSensor(payloadB)
      })

      const { sensors } = useSensorStore.getState()
      expect(sensors.size).toBe(2)
      expect(sensors.get('S02-GEO-001')).toEqual(payloadA)
      expect(sensors.get('S03-ACO-002')).toEqual(payloadB)
    })
  })

  describe('updateTracks', () => {
    it('replaces the tracks array', () => {
      const tracks = [mockTrack({ track_id: 'T-001' }), mockTrack({ track_id: 'T-002' })]
      act(() => {
        useSensorStore.getState().updateTracks(tracks)
      })
      expect(useSensorStore.getState().tracks).toEqual(tracks)
    })

    it('with empty array clears tracks', () => {
      act(() => {
        useSensorStore.getState().updateTracks([mockTrack()])
        useSensorStore.getState().updateTracks([])
      })
      expect(useSensorStore.getState().tracks).toEqual([])
    })
  })

  describe('selectSensor', () => {
    it('sets selectedSensorId to the given id', () => {
      act(() => {
        useSensorStore.getState().selectSensor('S02-GEO-001')
      })
      expect(useSensorStore.getState().selectedSensorId).toBe('S02-GEO-001')
    })

    it('null clears the selection', () => {
      act(() => {
        useSensorStore.getState().selectSensor('S02-GEO-001')
        useSensorStore.getState().selectSensor(null)
      })
      expect(useSensorStore.getState().selectedSensorId).toBeNull()
    })
  })
})
