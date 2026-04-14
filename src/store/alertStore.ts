import { create } from 'zustand'
import type { Alert, ThreatAssessment, ThreatLevel, SensorFamily } from '../types/sensors'

const MAX_ALERTS = 200

interface AlertFilter {
  threatLevel: ThreatLevel | 'ALL'
  sensorFamily: SensorFamily | 'ALL'
  acknowledged: 'ALL' | 'UNACKED' | 'ACKED'
}

interface AlertState {
  alerts: Alert[]
  threatAssessment: ThreatAssessment | null
  filter: AlertFilter
  addAlert: (alert: Alert) => void
  acknowledgeAlert: (id: string, comment: string) => void
  setThreatAssessment: (ta: ThreatAssessment) => void
  setFilter: (filter: Partial<AlertFilter>) => void
  filteredAlerts: () => Alert[]
}

export const useAlertStore = create<AlertState>()((set, get) => ({
  alerts: [],
  threatAssessment: null,
  filter: {
    threatLevel: 'ALL',
    sensorFamily: 'ALL',
    acknowledged: 'UNACKED',
  },

  addAlert: (alert: Alert) => {
    set((state) => {
      const alerts = [alert, ...state.alerts].slice(0, MAX_ALERTS)
      return { alerts }
    })
  },

  acknowledgeAlert: (id: string, comment: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true, annotation: comment } : a
      ),
    }))
  },

  setThreatAssessment: (ta: ThreatAssessment) => {
    set({ threatAssessment: ta })
  },

  setFilter: (filter: Partial<AlertFilter>) => {
    set((state) => ({ filter: { ...state.filter, ...filter } }))
  },

  filteredAlerts: () => {
    const { alerts, filter } = get()
    return alerts.filter((alert) => {
      if (filter.threatLevel !== 'ALL' && alert.threat_level !== filter.threatLevel) {
        return false
      }
      if (filter.sensorFamily !== 'ALL' && alert.sensor_family !== filter.sensorFamily) {
        return false
      }
      if (filter.acknowledged === 'UNACKED' && alert.acknowledged) {
        return false
      }
      if (filter.acknowledged === 'ACKED' && !alert.acknowledged) {
        return false
      }
      return true
    })
  },
}))
