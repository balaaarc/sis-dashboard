import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AIMLPanel } from '@/components/panels/AIMLPanel'
import { useAlertStore } from '@/store/alertStore'
import { useSensorStore } from '@/store/sensorStore'
import type { ThreatAssessment, Track } from '@/types/sensors'

const mockAssessment: ThreatAssessment = {
  assessment_id: 'ta-001',
  timestamp: '2026-04-11T10:00:00.000Z',
  threat_score: 75,
  threat_level: 'HIGH',
  contributing_sensors: ['S02-GEO-001', 'S03-ACU-001'],
  dominant_modality: 'SEISMIC',
  location: { lat: 21.945, lon: 88.123, accuracy_m: 50 },
  recommended_action: 'Deploy QRT to sector 4',
  model_version: 'bayesian-v3.1',
}

function makeTrack(id: string, cls: Track['class'] = 'HUMAN'): Track {
  return {
    track_id: id,
    lat: 21.945,
    lon: 88.123,
    range_m: 500,
    velocity: 1.2,
    heading: 45,
    class: cls,
    confidence: 0.85,
    age_frames: 10,
  }
}

beforeEach(() => {
  useAlertStore.setState({
    alerts: [],
    threatAssessment: null,
    filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'UNACKED' },
  })
  useSensorStore.setState({
    sensors: new Map(),
    sensorHistory: new Map(),
    tracks: [],
    selectedSensorId: null,
  })
})

describe('AIMLPanel', () => {
  it('renders without crashing with no data', () => {
    const { container } = render(<AIMLPanel />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders ThreatGauge component (SVG present)', () => {
    render(<AIMLPanel />)
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('shows threat score (75) when assessment is provided', () => {
    useAlertStore.setState({ threatAssessment: mockAssessment })
    render(<AIMLPanel />)
    // ThreatGauge renders the rounded score as text inside SVG
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  it('shows threat level (HIGH) when assessment is provided', () => {
    useAlertStore.setState({ threatAssessment: mockAssessment })
    render(<AIMLPanel />)
    // Level label is rendered in the SVG text and/or threat details
    expect(screen.getAllByText('HIGH').length).toBeGreaterThan(0)
  })

  it('shows recommended_action text', () => {
    useAlertStore.setState({ threatAssessment: mockAssessment })
    render(<AIMLPanel />)
    expect(screen.getByText(/Deploy QRT to sector 4/i)).toBeInTheDocument()
  })

  it('shows dominant_modality value', () => {
    useAlertStore.setState({ threatAssessment: mockAssessment })
    render(<AIMLPanel />)
    expect(screen.getByText('SEISMIC')).toBeInTheDocument()
  })

  it('renders track list when tracks exist', () => {
    useSensorStore.setState({
      tracks: [makeTrack('trk-001', 'HUMAN'), makeTrack('trk-002', 'VEHICLE')],
    })
    render(<AIMLPanel />)
    expect(screen.getByText(/Active Tracks/i)).toBeInTheDocument()
  })

  it('shows track class initial for each track (H for HUMAN, V for VEHICLE)', () => {
    useSensorStore.setState({
      tracks: [makeTrack('trk-001', 'HUMAN'), makeTrack('trk-002', 'VEHICLE')],
    })
    render(<AIMLPanel />)
    // Track table shows first letter of class
    expect(screen.getByText('H')).toBeInTheDocument()
    expect(screen.getByText('V')).toBeInTheDocument()
  })

  it('shows 0 tracks label when tracks array is empty', () => {
    useSensorStore.setState({ tracks: [] })
    render(<AIMLPanel />)
    // Header shows "Tracks: <strong>0</strong>"
    const strong = screen.getByText('0', { selector: 'strong' })
    expect(strong).toBeInTheDocument()
  })

  it('renders without crashing when threatAssessment is null', () => {
    useAlertStore.setState({ threatAssessment: null })
    expect(() => render(<AIMLPanel />)).not.toThrow()
    // Shows the "no data" state
    expect(screen.getByText(/Awaiting AI\/ML data.../i)).toBeInTheDocument()
  })
})
