import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useAlertStore } from '../../store/alertStore'
import type { Alert, ThreatAssessment } from '../../types/sensors'

function mockAlert(overrides?: Partial<Alert>): Alert {
  return {
    id: 'alert-001',
    timestamp: '2026-04-11T10:00:00.000Z',
    source_sensors: ['S02-GEO-001'],
    location: '21.9452, 88.1234',
    classification: 'INTRUSION',
    threat_level: 'HIGH',
    acknowledged: false,
    description: 'Seismic anomaly detected',
    ...overrides,
  }
}

function mockThreatAssessment(overrides?: Partial<ThreatAssessment>): ThreatAssessment {
  return {
    assessment_id: 'ta-001',
    timestamp: '2026-04-11T10:00:00.000Z',
    threat_score: 0.85,
    threat_level: 'HIGH',
    contributing_sensors: ['S02-GEO-001'],
    dominant_modality: 'SEISMIC',
    location: { lat: 21.9452, lon: 88.1234, accuracy_m: 15 },
    recommended_action: 'Deploy QRT to sector 4',
    model_version: '1.4.2',
    ...overrides,
  }
}

beforeEach(() => {
  useAlertStore.setState({
    alerts: [],
    threatAssessment: null,
    filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'UNACKED' },
  })
})

describe('useAlertStore', () => {
  describe('initial state', () => {
    it('alerts array is empty', () => {
      expect(useAlertStore.getState().alerts).toEqual([])
    })

    it('threatAssessment is null', () => {
      expect(useAlertStore.getState().threatAssessment).toBeNull()
    })
  })

  describe('addAlert', () => {
    it('prepends a new alert to the front of the array', () => {
      const alert = mockAlert({ id: 'alert-001' })
      act(() => {
        useAlertStore.getState().addAlert(alert)
      })
      expect(useAlertStore.getState().alerts[0]).toEqual(alert)
    })

    it('caps the alerts array at 200 items when 205 alerts are added', () => {
      act(() => {
        for (let i = 0; i < 205; i++) {
          useAlertStore.getState().addAlert(mockAlert({ id: `alert-${i}` }))
        }
      })
      expect(useAlertStore.getState().alerts).toHaveLength(200)
    })

    it('most recently added alert is first in the array', () => {
      act(() => {
        useAlertStore.getState().addAlert(mockAlert({ id: 'alert-first' }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'alert-second' }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'alert-third' }))
      })
      expect(useAlertStore.getState().alerts[0].id).toBe('alert-third')
    })
  })

  describe('acknowledgeAlert', () => {
    it('sets acknowledged to true on the matching alert id', () => {
      act(() => {
        useAlertStore.getState().addAlert(mockAlert({ id: 'alert-001', acknowledged: false }))
        useAlertStore.getState().acknowledgeAlert('alert-001', 'Confirmed by operator')
      })
      const alert = useAlertStore.getState().alerts.find((a) => a.id === 'alert-001')
      expect(alert?.acknowledged).toBe(true)
    })

    it('sets annotation to the provided comment string', () => {
      act(() => {
        useAlertStore.getState().addAlert(mockAlert({ id: 'alert-001' }))
        useAlertStore.getState().acknowledgeAlert('alert-001', 'False positive — wildlife')
      })
      const alert = useAlertStore.getState().alerts.find((a) => a.id === 'alert-001')
      expect(alert?.annotation).toBe('False positive — wildlife')
    })

    it('does not modify other alerts', () => {
      act(() => {
        useAlertStore.getState().addAlert(mockAlert({ id: 'alert-001', acknowledged: false }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'alert-002', acknowledged: false }))
        useAlertStore.getState().acknowledgeAlert('alert-001', 'Confirmed')
      })
      const other = useAlertStore.getState().alerts.find((a) => a.id === 'alert-002')
      expect(other?.acknowledged).toBe(false)
      expect(other?.annotation).toBeUndefined()
    })
  })

  describe('setThreatAssessment', () => {
    it('stores the threat assessment object', () => {
      const ta = mockThreatAssessment()
      act(() => {
        useAlertStore.getState().setThreatAssessment(ta)
      })
      expect(useAlertStore.getState().threatAssessment).toEqual(ta)
    })
  })

  describe('setFilter', () => {
    it('partial merge preserves other filter fields', () => {
      act(() => {
        useAlertStore.getState().setFilter({ threatLevel: 'CRITICAL' })
      })
      const { filter } = useAlertStore.getState()
      expect(filter.threatLevel).toBe('CRITICAL')
      expect(filter.sensorFamily).toBe('ALL')
      expect(filter.acknowledged).toBe('UNACKED')
    })
  })

  describe('filteredAlerts', () => {
    it('returns all alerts when filter is ALL/ALL/ALL', () => {
      act(() => {
        useAlertStore.getState().addAlert(mockAlert({ id: 'a1', threat_level: 'HIGH', acknowledged: false }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a2', threat_level: 'LOW', acknowledged: true }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a3', threat_level: 'CRITICAL', acknowledged: false }))
        useAlertStore.getState().setFilter({ threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'ALL' })
      })
      expect(useAlertStore.getState().filteredAlerts()).toHaveLength(3)
    })

    it('filters by threat level — CRITICAL only returns CRITICAL alerts', () => {
      act(() => {
        useAlertStore.getState().addAlert(mockAlert({ id: 'a1', threat_level: 'CRITICAL' }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a2', threat_level: 'HIGH' }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a3', threat_level: 'CRITICAL' }))
        useAlertStore.getState().setFilter({ threatLevel: 'CRITICAL', acknowledged: 'ALL' })
      })
      const result = useAlertStore.getState().filteredAlerts()
      expect(result).toHaveLength(2)
      expect(result.every((a) => a.threat_level === 'CRITICAL')).toBe(true)
    })

    it('filters out acknowledged alerts when filter is UNACKED', () => {
      act(() => {
        useAlertStore.getState().addAlert(mockAlert({ id: 'a1', acknowledged: false }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a2', acknowledged: true }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a3', acknowledged: false }))
        useAlertStore.getState().setFilter({ acknowledged: 'UNACKED', threatLevel: 'ALL' })
      })
      const result = useAlertStore.getState().filteredAlerts()
      expect(result).toHaveLength(2)
      expect(result.every((a) => !a.acknowledged)).toBe(true)
    })

    it('shows only acknowledged alerts when filter is ACKED', () => {
      act(() => {
        useAlertStore.getState().addAlert(mockAlert({ id: 'a1', acknowledged: false }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a2', acknowledged: true }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a3', acknowledged: true }))
        useAlertStore.getState().setFilter({ acknowledged: 'ACKED', threatLevel: 'ALL' })
      })
      const result = useAlertStore.getState().filteredAlerts()
      expect(result).toHaveLength(2)
      expect(result.every((a) => a.acknowledged)).toBe(true)
    })

    it('applies combined filters — HIGH threat level AND UNACKED', () => {
      act(() => {
        useAlertStore.getState().addAlert(mockAlert({ id: 'a1', threat_level: 'HIGH', acknowledged: false }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a2', threat_level: 'HIGH', acknowledged: true }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a3', threat_level: 'CRITICAL', acknowledged: false }))
        useAlertStore.getState().addAlert(mockAlert({ id: 'a4', threat_level: 'LOW', acknowledged: false }))
        useAlertStore.getState().setFilter({ threatLevel: 'HIGH', acknowledged: 'UNACKED' })
      })
      const result = useAlertStore.getState().filteredAlerts()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('a1')
    })
  })
})
