import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RadarScope } from '@/components/widgets/RadarScope'
import type { Track } from '@/types/sensors'

function mockTrack(overrides: Partial<Track> = {}): Track {
  return {
    track_id: 'TRK-001',
    lat: 21.945,
    lon: 88.123,
    range_m: 500,
    velocity: 1.2,
    heading: 45,
    class: 'HUMAN',
    confidence: 0.85,
    age_frames: 5,
    ...overrides,
  }
}

describe('RadarScope', () => {
  it('renders without crashing with empty tracks', () => {
    expect(() => render(<RadarScope tracks={[]} />)).not.toThrow()
  })

  it('renders with multiple tracks without crashing', () => {
    const tracks = [
      mockTrack({ track_id: 'TRK-001', heading: 0, range_m: 200 }),
      mockTrack({ track_id: 'TRK-002', heading: 90, range_m: 400 }),
      mockTrack({ track_id: 'TRK-003', heading: 180, range_m: 700 }),
    ]
    expect(() => render(<RadarScope tracks={tracks} />)).not.toThrow()
  })

  it('renders a canvas element', () => {
    const { container } = render(<RadarScope tracks={[]} />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('accepts maxRange prop without crashing', () => {
    expect(() => render(<RadarScope tracks={[]} maxRange={2000} />)).not.toThrow()
  })

  it('renders with VEHICLE tracks without crashing', () => {
    const tracks = [
      mockTrack({ track_id: 'TRK-V01', class: 'VEHICLE', range_m: 300, velocity: 15 }),
      mockTrack({ track_id: 'TRK-V02', class: 'VEHICLE', range_m: 600, velocity: 22 }),
    ]
    expect(() => render(<RadarScope tracks={tracks} />)).not.toThrow()
  })

  it('renders with 0 tracks gracefully and canvas is present', () => {
    const { container } = render(<RadarScope tracks={[]} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('width')
    expect(canvas).toHaveAttribute('height')
  })
})
