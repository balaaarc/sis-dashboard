import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SensorMarker from '../../../components/map/SensorMarker'
import type { SensorPayload } from '../../../types/sensors'

function makeSensor(overrides: Partial<SensorPayload> = {}): SensorPayload {
  return {
    sensor_id: 'S01-GEO-TEST',
    modality: 'SEISMIC',
    timestamp: '2026-04-11T10:00:00.000Z',
    site_id: 'SITE-01',
    bop_id: 'BOP-ALPHA-01',
    quality_score: 0.92,
    raw_value: { amplitude: 0.3, frequency: 10.5 },
    sensor_status: 'ONLINE',
    lat: 21.945,
    lon: 88.123,
    ...overrides,
  }
}

describe('SensorMarker', () => {
  it('renders without crashing', () => {
    expect(() => render(<SensorMarker sensor={makeSensor()} />)).not.toThrow()
  })

  it('renders a circle-marker element (mocked CircleMarker)', () => {
    render(<SensorMarker sensor={makeSensor()} />)
    expect(screen.getByTestId('circle-marker')).toBeInTheDocument()
  })

  it('shows sensor_id in the popup', () => {
    render(<SensorMarker sensor={makeSensor()} />)
    expect(screen.getByText('S01-GEO-TEST')).toBeInTheDocument()
  })

  it('shows modality in the popup', () => {
    render(<SensorMarker sensor={makeSensor({ modality: 'SEISMIC' })} />)
    expect(screen.getByText('SEISMIC')).toBeInTheDocument()
  })

  it('shows site_id in the popup', () => {
    render(<SensorMarker sensor={makeSensor({ site_id: 'SITE-99' })} />)
    expect(screen.getByText('SITE-99')).toBeInTheDocument()
  })

  it('shows ONLINE status in popup', () => {
    render(<SensorMarker sensor={makeSensor({ sensor_status: 'ONLINE' })} />)
    expect(screen.getByText(/Online/i)).toBeInTheDocument()
  })

  it('shows DEGRADED status in popup', () => {
    render(<SensorMarker sensor={makeSensor({ sensor_status: 'DEGRADED' })} />)
    expect(screen.getByText(/Degraded/i)).toBeInTheDocument()
  })

  it('shows OFFLINE status in popup', () => {
    render(<SensorMarker sensor={makeSensor({ sensor_status: 'OFFLINE' })} />)
    expect(screen.getByText(/Offline/i)).toBeInTheDocument()
  })

  it('shows quality score as percentage in popup', () => {
    render(<SensorMarker sensor={makeSensor({ quality_score: 0.92 })} />)
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  it('renders without lat/lon (falls back to hardcoded centre)', () => {
    const sensor = makeSensor()
    delete (sensor as Partial<SensorPayload>).lat
    delete (sensor as Partial<SensorPayload>).lon
    expect(() => render(<SensorMarker sensor={sensor} />)).not.toThrow()
  })

  it('renders a popup element (mocked Popup)', () => {
    render(<SensorMarker sensor={makeSensor()} />)
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('renders for ACOUSTIC modality without crashing', () => {
    expect(() =>
      render(<SensorMarker sensor={makeSensor({ modality: 'ACOUSTIC', sensor_id: 'S03-ACU' })} />)
    ).not.toThrow()
  })

  it('renders for GMTI_RADAR modality without crashing', () => {
    expect(() =>
      render(<SensorMarker sensor={makeSensor({ modality: 'GMTI_RADAR', sensor_id: 'S10-GMR' })} />)
    ).not.toThrow()
  })

  it('renders for CHEMICAL modality without crashing', () => {
    expect(() =>
      render(<SensorMarker sensor={makeSensor({ modality: 'CHEMICAL', sensor_id: 'S20-CHM' })} />)
    ).not.toThrow()
  })

  it('displays raw_value summary (up to 3 keys) in popup', () => {
    render(
      <SensorMarker
        sensor={makeSensor({ raw_value: { amplitude: 0.5, frequency: 12.3, phase: 0.1 } })}
      />
    )
    // summariseRaw renders "key: value" — at least one should appear
    const container = screen.getByTestId('popup')
    expect(container.textContent).toMatch(/amplitude/)
  })
})
