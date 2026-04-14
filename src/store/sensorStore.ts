import { create } from 'zustand'
import type { SensorPayload, Track } from '../types/sensors'

const MAX_HISTORY = 100

interface SensorState {
  sensors: Map<string, SensorPayload>
  sensorHistory: Map<string, SensorPayload[]>
  tracks: Track[]
  selectedSensorId: string | null
  updateSensor: (payload: SensorPayload) => void
  updateTracks: (tracks: Track[]) => void
  selectSensor: (id: string | null) => void
}

export const useSensorStore = create<SensorState>()((set, get) => ({
  sensors: new Map(),
  sensorHistory: new Map(),
  tracks: [],
  selectedSensorId: null,

  updateSensor: (payload: SensorPayload) => {
    set((state) => {
      const sensors = new Map(state.sensors)
      sensors.set(payload.sensor_id, payload)

      const sensorHistory = new Map(state.sensorHistory)
      const history = sensorHistory.get(payload.sensor_id) ?? []
      const newHistory = [...history, payload].slice(-MAX_HISTORY)
      sensorHistory.set(payload.sensor_id, newHistory)

      return { sensors, sensorHistory }
    })
  },

  updateTracks: (tracks: Track[]) => {
    set({ tracks })
  },

  selectSensor: (id: string | null) => {
    set({ selectedSensorId: id })
  },
}))
