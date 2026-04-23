import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SensorCard } from '@/components/widgets/SensorCard'
import { useSensorStore } from '@/store/sensorStore'
import type { SensorPayload } from '@/types/sensors'

function mockSensor(overrides: Partial<SensorPayload> = {}): SensorPayload {
  return {
    sensor_id: 'S01-SEIS-001',
    modality: 'SEISMIC',
    timestamp: '2026-04-11T10:00:00.000Z',
    site_id: 'SITE-A',
    bop_id: 'BOP-01',
    quality_score: 0.92,
    raw_value: { amplitude: 0.45 },
    sensor_status: 'ONLINE',
    ...overrides,
  }
}

const emptyStoreState = {
  sensors: new Map<string, SensorPayload>(),
  sensorHistory: new Map<string, SensorPayload[]>(),
  tracks: [],
  selectedSensorId: null,
}

describe('SensorCard', () => {
  beforeEach(() => {
    useSensorStore.setState(emptyStoreState)
  })

  it('renders without crashing when sensor exists in store', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('S01-SEIS-001', mockSensor())
    useSensorStore.setState({ ...emptyStoreState, sensors })
    expect(() => render(<SensorCard sensorId="S01-SEIS-001" />)).not.toThrow()
  })

  it('shows sensor modality', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('S01-SEIS-001', mockSensor({ modality: 'SEISMIC' }))
    useSensorStore.setState({ ...emptyStoreState, sensors })
    render(<SensorCard sensorId="S01-SEIS-001" />)
    expect(screen.getByText('SEISMIC')).toBeInTheDocument()
  })

  it('shows sensor_status ONLINE', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('S01-SEIS-001', mockSensor({ sensor_status: 'ONLINE' }))
    useSensorStore.setState({ ...emptyStoreState, sensors })
    render(<SensorCard sensorId="S01-SEIS-001" />)
    expect(screen.getByText('ONLINE')).toBeInTheDocument()
  })

  it('shows sensor_status DEGRADED', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('S01-SEIS-001', mockSensor({ sensor_status: 'DEGRADED' }))
    useSensorStore.setState({ ...emptyStoreState, sensors })
    render(<SensorCard sensorId="S01-SEIS-001" />)
    expect(screen.getByText('DEGRADED')).toBeInTheDocument()
  })

  it('shows quality score as percentage', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('S01-SEIS-001', mockSensor({ quality_score: 0.92 }))
    useSensorStore.setState({ ...emptyStoreState, sensors })
    render(<SensorCard sensorId="S01-SEIS-001" />)
    // formatQualityScore(0.92) => "92%"
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  it('when sensor is OFFLINE, renders OFFLINE status text', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('S01-SEIS-001', mockSensor({ sensor_status: 'OFFLINE' }))
    useSensorStore.setState({ ...emptyStoreState, sensors })
    render(<SensorCard sensorId="S01-SEIS-001" />)
    expect(screen.getByText('OFFLINE')).toBeInTheDocument()
  })

  it('when sensor is DEGRADED, shows degraded indicator', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('S01-SEIS-001', mockSensor({ sensor_status: 'DEGRADED', quality_score: 0.5 }))
    useSensorStore.setState({ ...emptyStoreState, sensors })
    render(<SensorCard sensorId="S01-SEIS-001" />)
    expect(screen.getByText('DEGRADED')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('when sensorId not in store, renders fallback state without crashing', () => {
    // Store is empty — sensor does not exist
    render(<SensorCard sensorId="NONEXISTENT-001" />)
    expect(screen.getByText('NONEXISTENT-001')).toBeInTheDocument()
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('renders sensor_id in the output', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('S01-SEIS-001', mockSensor({ sensor_id: 'S01-SEIS-001' }))
    useSensorStore.setState({ ...emptyStoreState, sensors })
    render(<SensorCard sensorId="S01-SEIS-001" />)
    // sensor_id <= 14 chars is shown as-is
    expect(screen.getByText('S01-SEIS-001')).toBeInTheDocument()
  })
})
