import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import VideoPanel from '../../../components/panels/VideoPanel'
import { useSensorStore } from '../../../store/sensorStore'
import type { SensorPayload } from '../../../types/sensors'

// Mock fetch for PTZ control commands
global.fetch = vi.fn().mockResolvedValue({ ok: true })

function makeOpticalSensor(id: string, modality: SensorPayload['modality'] = 'CCTV'): SensorPayload {
  return {
    sensor_id: id,
    modality,
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

function makeOpticalSensorWithFrame(id: string): SensorPayload {
  return {
    sensor_id: id,
    modality: 'PTZ',
    timestamp: new Date().toISOString(),
    site_id: 'SITE-01',
    bop_id: 'BOP-ALPHA-01',
    quality_score: 0.9,
    raw_value: {
      frame_jpeg_b64: 'AAAA',
      width: 640,
      height: 480,
    },
    sensor_status: 'ONLINE',
    lat: 21.945,
    lon: 88.123,
  }
}

function makeSensorWithDetections(id: string): SensorPayload {
  return {
    sensor_id: id,
    modality: 'CCTV',
    timestamp: new Date().toISOString(),
    site_id: 'SITE-01',
    bop_id: 'BOP-ALPHA-01',
    quality_score: 0.9,
    raw_value: {
      frame_jpeg_b64: 'AAAA',
      width: 640,
      height: 480,
      detections: [{ x: 10, y: 10, width: 50, height: 80, label: 'HUMAN', confidence: 0.92 }],
    },
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
  vi.clearAllMocks()
})

describe('VideoPanel', () => {
  it('renders without crashing with no optical sensors', () => {
    const { container } = render(<VideoPanel />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('shows grid mode selector buttons (1x1, 2x2, 3x3)', () => {
    render(<VideoPanel />)
    expect(screen.getByRole('button', { name: '1x1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2x2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3x3' })).toBeInTheDocument()
  })

  it('renders camera cells when optical sensors are in store', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('cam-001', makeOpticalSensor('cam-001', 'CCTV'))
    sensors.set('cam-002', makeOpticalSensor('cam-002', 'EOTS'))
    useSensorStore.setState({ sensors })
    render(<VideoPanel />)
    // Camera cells show sensor_id in the label bar
    expect(screen.getByText('cam-001')).toBeInTheDocument()
    expect(screen.getByText('cam-002')).toBeInTheDocument()
  })

  it('shows an img element for each visible camera', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('cam-001', makeOpticalSensor('cam-001', 'CCTV'))
    sensors.set('cam-002', makeOpticalSensor('cam-002', 'THERMAL'))
    useSensorStore.setState({ sensors })
    render(<VideoPanel />)
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThanOrEqual(2)
  })

  it('PTZ control buttons are rendered in 1x1 mode with PTZ sensor', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('ptz-001', makeOpticalSensorWithFrame('ptz-001'))
    useSensorStore.setState({ sensors })
    render(<VideoPanel />)

    // Switch to 1x1 mode
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '1x1' }))
    })
    // PTZ directional buttons
    expect(screen.getByTitle('Tilt Up')).toBeInTheDocument()
    expect(screen.getByTitle('Pan Left')).toBeInTheDocument()
    expect(screen.getByTitle('Pan Right')).toBeInTheDocument()
    expect(screen.getByTitle('Tilt Down')).toBeInTheDocument()
  })

  it('shows camera label (sensor_id) in the cell', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('thermal-01', makeOpticalSensor('thermal-01', 'THERMAL'))
    useSensorStore.setState({ sensors })
    render(<VideoPanel />)
    expect(screen.getByText('thermal-01')).toBeInTheDocument()
  })

  it('renders without crashing when frame_jpeg_b64 is absent', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('cam-no-frame', makeOpticalSensor('cam-no-frame', 'CCTV'))
    useSensorStore.setState({ sensors })
    expect(() => render(<VideoPanel />)).not.toThrow()
    // Should still render the sensor label
    expect(screen.getByText('cam-no-frame')).toBeInTheDocument()
  })

  it('shows bounding boxes overlay (SVG) when detections present', () => {
    const sensors = new Map<string, SensorPayload>()
    sensors.set('cam-det', makeSensorWithDetections('cam-det'))
    useSensorStore.setState({ sensors })
    render(<VideoPanel />)
    // Detection overlay renders an SVG with a rect
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
    // Detection label text
    expect(screen.getByText(/HUMAN/i)).toBeInTheDocument()
  })

  it('shows awaiting sensor data message when no optical sensors', () => {
    render(<VideoPanel />)
    expect(screen.getByText(/Awaiting sensor data/i)).toBeInTheDocument()
  })
})
