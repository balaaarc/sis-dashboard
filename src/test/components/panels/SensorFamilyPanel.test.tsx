import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import SensorFamilyPanel from '../../../components/panels/SensorFamilyPanel'
import { useSensorStore } from '../../../store/sensorStore'
import type { SensorPayload } from '../../../types/sensors'

function makeSensor(id: string, modality: SensorPayload['modality']): SensorPayload {
  return {
    sensor_id: id,
    modality,
    timestamp: new Date().toISOString(),
    site_id: 'SITE-01',
    bop_id: 'BOP-ALPHA-01',
    quality_score: 0.8,
    raw_value: { amplitude: 0.5 },
    sensor_status: 'ONLINE',
    lat: 21.945,
    lon: 88.123,
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

describe('SensorFamilyPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<SensorFamilyPanel />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('shows tab buttons for all 6 sensor families', () => {
    render(<SensorFamilyPanel />)
    expect(screen.getByRole('button', { name: /Seismic/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Acoustic/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Optical/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Radar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Magnetic/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Chemical/i })).toBeInTheDocument()
  })

  it('Seismic tab is active by default (shows empty state for Seismic)', () => {
    render(<SensorFamilyPanel />)
    // With no sensors, the empty state message references the active family
    expect(screen.getByText(/No Seismic sensors/i)).toBeInTheDocument()
  })

  it('clicking Acoustic tab switches to Acoustic content', () => {
    render(<SensorFamilyPanel />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Acoustic/i }))
    })
    expect(screen.getByText(/No Acoustic sensors/i)).toBeInTheDocument()
  })

  it('clicking Radar tab switches to Radar content', () => {
    render(<SensorFamilyPanel />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Radar/i }))
    })
    expect(screen.getByText(/No Radar sensors/i)).toBeInTheDocument()
  })

  it('Seismic tab shows WaveformChart (SVG) when there is sensor history', () => {
    // Provide a sensor and its history so waveform renders (needs > 1 data points)
    const sensor = makeSensor('s01-seismic', 'SEISMIC')
    const sensors = new Map<string, SensorPayload>()
    sensors.set('s01-seismic', sensor)

    const historyEntry1 = { ...sensor, raw_value: { amplitude: 0.3 } }
    const historyEntry2 = { ...sensor, raw_value: { amplitude: 0.6 } }
    const sensorHistory = new Map<string, SensorPayload[]>()
    sensorHistory.set('s01-seismic', [historyEntry1, historyEntry2])

    useSensorStore.setState({ sensors, sensorHistory, selectedSensorId: 's01-seismic' })
    render(<SensorFamilyPanel />)
    // WaveformChart renders an SVG (not canvas)
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('renders without sensors in store (empty state)', () => {
    render(<SensorFamilyPanel />)
    expect(screen.getByText(/No Seismic sensors/i)).toBeInTheDocument()
  })

  it('clicking each tab does not crash', () => {
    render(<SensorFamilyPanel />)
    const families = ['Acoustic', 'Optical', 'Radar', 'Magnetic', 'Chemical', 'Seismic']
    for (const fam of families) {
      expect(() => {
        act(() => {
          fireEvent.click(screen.getByRole('button', { name: new RegExp(fam, 'i') }))
        })
      }).not.toThrow()
    }
  })

  it('shows Sensor Families heading in the panel', () => {
    render(<SensorFamilyPanel />)
    expect(screen.getByText('Sensor Families')).toBeInTheDocument()
  })

  it('shows online count and avg quality in header', () => {
    render(<SensorFamilyPanel />)
    expect(screen.getByText(/Online:/i)).toBeInTheDocument()
    expect(screen.getByText(/Avg Q:/i)).toBeInTheDocument()
  })
})
