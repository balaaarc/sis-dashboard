import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TrackMarker from '../../../components/map/TrackMarker'
import type { Track } from '../../../types/sensors'

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    track_id: 'trk-001',
    lat: 21.945,
    lon: 88.123,
    range_m: 750,
    velocity: 1.8,
    heading: 135,
    class: 'HUMAN',
    confidence: 0.88,
    age_frames: 12,
    ...overrides,
  }
}

describe('TrackMarker', () => {
  it('renders without crashing for a HUMAN track', () => {
    expect(() => render(<TrackMarker track={makeTrack()} />)).not.toThrow()
  })

  it('renders a marker element (mocked Marker)', () => {
    render(<TrackMarker track={makeTrack()} />)
    expect(screen.getByTestId('marker')).toBeInTheDocument()
  })

  it('shows track_id in the popup', () => {
    render(<TrackMarker track={makeTrack({ track_id: 'trk-XYZ' })} />)
    expect(screen.getByText('trk-XYZ')).toBeInTheDocument()
  })

  it('shows class label HUMAN in the popup', () => {
    render(<TrackMarker track={makeTrack({ class: 'HUMAN' })} />)
    expect(screen.getByText('HUMAN')).toBeInTheDocument()
  })

  it('shows class label VEHICLE in the popup', () => {
    render(<TrackMarker track={makeTrack({ class: 'VEHICLE', track_id: 'trk-002' })} />)
    expect(screen.getByText('VEHICLE')).toBeInTheDocument()
  })

  it('shows class label ANIMAL in the popup', () => {
    render(<TrackMarker track={makeTrack({ class: 'ANIMAL', track_id: 'trk-003' })} />)
    expect(screen.getByText('ANIMAL')).toBeInTheDocument()
  })

  it('shows class label UNKNOWN in the popup', () => {
    render(<TrackMarker track={makeTrack({ class: 'UNKNOWN', track_id: 'trk-004' })} />)
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
  })

  it('shows confidence as percentage', () => {
    render(<TrackMarker track={makeTrack({ confidence: 0.88 })} />)
    expect(screen.getByText('88%')).toBeInTheDocument()
  })

  it('shows velocity in the popup', () => {
    render(<TrackMarker track={makeTrack({ velocity: 1.8 })} />)
    expect(screen.getByText('1.8 m/s')).toBeInTheDocument()
  })

  it('shows heading in the popup', () => {
    render(<TrackMarker track={makeTrack({ heading: 135 })} />)
    expect(screen.getByText('135.0°')).toBeInTheDocument()
  })

  it('shows range in the popup', () => {
    render(<TrackMarker track={makeTrack({ range_m: 750 })} />)
    expect(screen.getByText('750 m')).toBeInTheDocument()
  })

  it('shows age_frames in the popup', () => {
    render(<TrackMarker track={makeTrack({ age_frames: 12 })} />)
    expect(screen.getByText('12 frames')).toBeInTheDocument()
  })

  it('shows lat/lon position in the popup', () => {
    render(<TrackMarker track={makeTrack({ lat: 21.9452, lon: 88.1234 })} />)
    expect(screen.getByText('21.9452, 88.1234')).toBeInTheDocument()
  })

  it('renders a popup element (mocked Popup)', () => {
    render(<TrackMarker track={makeTrack()} />)
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })
})
