import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SensorStatusGrid from '../../../components/widgets/SensorStatusGrid'
import { useSensorStore } from '../../../store/sensorStore'
import type { SensorPayload } from '../../../types/sensors'

function mockSensor(id: string, overrides: Partial<SensorPayload> = {}): SensorPayload {
  return {
    sensor_id: id,
    modality: 'SEISMIC',
    timestamp: '2026-04-11T10:00:00.000Z',
    site_id: 'SITE-A',
    bop_id: 'BOP-01',
    quality_score: 0.85,
    raw_value: { amplitude: 0.3 },
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

function buildSensorMap(payloads: SensorPayload[]): Map<string, SensorPayload> {
  const m = new Map<string, SensorPayload>()
  payloads.forEach((p) => m.set(p.sensor_id, p))
  return m
}

describe('SensorStatusGrid', () => {
  beforeEach(() => {
    useSensorStore.setState(emptyStoreState)
  })

  it('renders without crashing with empty sensor store', () => {
    expect(() => render(<SensorStatusGrid />)).not.toThrow()
  })

  it('renders a sensor entry for each sensor in the store', () => {
    const sensors = buildSensorMap([
      mockSensor('S01-SEIS-001'),
      mockSensor('S02-SEIS-002'),
      mockSensor('S03-SEIS-003'),
    ])
    useSensorStore.setState({ ...emptyStoreState, sensors })
    const { container } = render(<SensorStatusGrid />)
    // Grid renders one card per sensor: 3 direct children inside the grid div
    // Check by the formatted short names or count of quality scores rendered
    const qualityTexts = container.querySelectorAll('[style*="text-align: right"]')
    expect(qualityTexts.length).toBe(3)
  })

  it('shows ONLINE status for online sensors via progress bar and glow styling', () => {
    const sensors = buildSensorMap([mockSensor('S01-SEIS-001', { sensor_status: 'ONLINE' })])
    useSensorStore.setState({ ...emptyStoreState, sensors })
    const { container } = render(<SensorStatusGrid />)
    // The status dot for ONLINE has box-shadow applied; check title attr on the cell
    const cell = container.querySelector('[title*="ONLINE"]')
    expect(cell).toBeInTheDocument()
  })

  it('shows OFFLINE status for offline sensors', () => {
    const sensors = buildSensorMap([mockSensor('S01-SEIS-001', { sensor_status: 'OFFLINE' })])
    useSensorStore.setState({ ...emptyStoreState, sensors })
    const { container } = render(<SensorStatusGrid />)
    const cell = container.querySelector('[title*="OFFLINE"]')
    expect(cell).toBeInTheDocument()
  })

  it('shows DEGRADED status for degraded sensors', () => {
    const sensors = buildSensorMap([mockSensor('S01-SEIS-001', { sensor_status: 'DEGRADED' })])
    useSensorStore.setState({ ...emptyStoreState, sensors })
    const { container } = render(<SensorStatusGrid />)
    const cell = container.querySelector('[title*="DEGRADED"]')
    expect(cell).toBeInTheDocument()
  })

  it('renders quality score for each sensor', () => {
    const sensors = buildSensorMap([
      mockSensor('S01-SEIS-001', { quality_score: 0.75 }),
      mockSensor('S02-SEIS-002', { quality_score: 0.50 }),
    ])
    useSensorStore.setState({ ...emptyStoreState, sensors })
    render(<SensorStatusGrid />)
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders with 20 sensors without crashing (stress test)', () => {
    const payloads = Array.from({ length: 20 }, (_, i) =>
      mockSensor(`S${String(i + 1).padStart(2, '0')}-SEIS-${String(i + 1).padStart(3, '0')}`)
    )
    const sensors = buildSensorMap(payloads)
    useSensorStore.setState({ ...emptyStoreState, sensors })
    expect(() => render(<SensorStatusGrid />)).not.toThrow()
    // 20 quality scores rendered
    const qualityTexts = screen.getAllByText('85%')
    expect(qualityTexts.length).toBe(20)
  })
})
