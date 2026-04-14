import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'

// Extend the react-leaflet mock to include LayersControl.BaseLayer which the
// global setup.ts mock omits (it only mocks LayersControl as a plain wrapper).
vi.mock('react-leaflet', async (importOriginal) => {
  const React = await import('react')
  function BaseLayer({ children }: { children?: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children)
  }
  function LayersControl({ children }: { children?: React.ReactNode }) {
    return React.createElement('div', null, children)
  }
  LayersControl.BaseLayer = BaseLayer

  return {
    MapContainer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'map-container' }, children),
    TileLayer: () => null,
    LayersControl,
    CircleMarker: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'circle-marker' }, children),
    Marker: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'marker' }, children),
    Polygon: () => null,
    Popup: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'popup' }, children),
    useMap: vi.fn(() => ({ fitBounds: vi.fn(), setView: vi.fn() })),
  }
})

import LiveMapPanel from '../../../components/panels/LiveMapPanel'
import { useSensorStore } from '../../../store/sensorStore'
import { useAlertStore } from '../../../store/alertStore'
import type { SensorPayload, Track, ThreatAssessment } from '../../../types/sensors'

function makeSensor(id: string): SensorPayload {
  return {
    sensor_id: id,
    modality: 'SEISMIC',
    timestamp: new Date().toISOString(),
    site_id: 'SITE-01',
    bop_id: 'BOP-ALPHA-01',
    quality_score: 0.9,
    raw_value: {},
    sensor_status: 'ONLINE',
    lat: 21.945,
    lon: 88.123,
  }
}

function makeTrack(id: string): Track {
  return {
    track_id: id,
    lat: 21.945,
    lon: 88.123,
    range_m: 500,
    velocity: 1.5,
    heading: 90,
    class: 'HUMAN',
    confidence: 0.88,
    age_frames: 5,
  }
}

const criticalAssessment: ThreatAssessment = {
  assessment_id: 'ta-crit',
  timestamp: new Date().toISOString(),
  threat_score: 95,
  threat_level: 'CRITICAL',
  contributing_sensors: ['S01'],
  dominant_modality: 'SEISMIC',
  location: { lat: 21.945, lon: 88.123, accuracy_m: 30 },
  recommended_action: 'Immediate response',
  model_version: 'bayesian-v3.1',
}

beforeEach(() => {
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
})

describe('LiveMapPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<LiveMapPanel />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("shows 'Live Tactical Map' heading", () => {
    render(<LiveMapPanel />)
    expect(screen.getByText('Live Tactical Map')).toBeInTheDocument()
  })

  it("shows '0 sensors' badge with empty store", () => {
    render(<LiveMapPanel />)
    expect(screen.getByText('0 sensors')).toBeInTheDocument()
  })

  it('shows track count badge', () => {
    render(<LiveMapPanel />)
    expect(screen.getByText('0 tracks')).toBeInTheDocument()
  })

  it('renders map-container (mocked)', () => {
    render(<LiveMapPanel />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('shows Zone A and Zone B labels', () => {
    render(<LiveMapPanel />)
    expect(screen.getByText(/Zone A/i)).toBeInTheDocument()
    expect(screen.getByText(/Zone B/i)).toBeInTheDocument()
  })

  it('with sensors in store, sensor count badge updates', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('s01', makeSensor('s01'))
    sensors.set('s02', makeSensor('s02'))
    useSensorStore.setState({ sensors })
    render(<LiveMapPanel />)
    expect(screen.getByText('2 sensors')).toBeInTheDocument()
  })

  it('with tracks in store, track count updates', () => {
    useSensorStore.setState({
      tracks: [makeTrack('t1'), makeTrack('t2'), makeTrack('t3')],
    })
    render(<LiveMapPanel />)
    expect(screen.getByText('3 tracks')).toBeInTheDocument()
  })

  it('does not crash when threatAssessment is CRITICAL (zone turns red)', () => {
    useAlertStore.setState({ threatAssessment: criticalAssessment })
    expect(() => render(<LiveMapPanel />)).not.toThrow()
    // Still renders the map container
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })
})
