import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SystemHealthPanel } from '@/components/panels/SystemHealthPanel'
import { useSystemStore } from '@/store/systemStore'
import type { SystemHealth } from '@/types/sensors'

const mockHealth: SystemHealth = {
  timestamp: '2026-04-11T10:00:00.000Z',
  node_id: 'BOP-ALPHA-01',
  hardware: {
    cpu_percent: 45.2,
    gpu_percent: 67.8,
    ram_percent: 52.1,
    nvme_percent: 23.4,
    temperature_c: 52.3,
    uptime_hours: 72.5,
  },
  comms: {
    SATCOM: { active: true, signal_quality: 0.87 },
    LTE: { active: true, signal_quality: 0.92 },
    VHF_UHF: { active: false, signal_quality: 0.0 },
    LORA: { active: true, signal_quality: 0.76 },
    WIFI6: { active: true, signal_quality: 0.95 },
    BLE: { active: true, signal_quality: 0.88 },
  },
  aiml: {
    inference_fps: 24.5,
    gpu_memory_percent: 71.2,
    model_versions: {
      detection: 'yolov9-v1.2',
      tracking: 'bytetrack-v2.0',
      threat: 'bayesian-v3.1',
    },
  },
}

beforeEach(() => {
  useSystemStore.setState({
    theme: 'dark',
    scenario: 'NORMAL',
    connectionStatus: 'connected',
    health: null,
    sidebarCollapsed: false,
    activePanel: 'map',
  })
})

describe('SystemHealthPanel', () => {
  it('renders without crashing when health is null (no data state)', () => {
    const { container } = render(<SystemHealthPanel />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("shows 'Awaiting telemetry...' message when health is null", () => {
    render(<SystemHealthPanel />)
    expect(screen.getByText(/awaiting telemetry/i)).toBeInTheDocument()
  })

  it('renders hardware metrics when health is provided', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    // The Hardware section heading should appear
    expect(screen.getByText('Hardware')).toBeInTheDocument()
  })

  it('shows CPU percentage value in output', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    expect(screen.getByText('45.2%')).toBeInTheDocument()
  })

  it('shows GPU percentage value', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    expect(screen.getByText('67.8%')).toBeInTheDocument()
  })

  it('shows RAM percentage value', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    expect(screen.getByText('52.1%')).toBeInTheDocument()
  })

  it('shows SATCOM comms channel', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    expect(screen.getByText('SATCOM')).toBeInTheDocument()
  })

  it('shows LTE comms channel', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    expect(screen.getByText('LTE')).toBeInTheDocument()
  })

  it('shows model version strings', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    // versions are rendered as "v<ver>"
    expect(screen.getByText('vyolov9-v1.2')).toBeInTheDocument()
    expect(screen.getByText('vbytetrack-v2.0')).toBeInTheDocument()
  })

  it('shows inference FPS value', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    expect(screen.getByText('24.5')).toBeInTheDocument()
  })

  it('shows node_id in the output', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    expect(screen.getByText(/BOP-ALPHA-01/)).toBeInTheDocument()
  })

  it('renders comms section with at least one channel listed', () => {
    useSystemStore.setState({ health: mockHealth })
    render(<SystemHealthPanel />)
    expect(screen.getByText(/comms links/i)).toBeInTheDocument()
    // Multiple comms entries rendered
    expect(screen.getByText('SATCOM')).toBeInTheDocument()
    expect(screen.getByText('LORA')).toBeInTheDocument()
  })
})
