import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { useSystemStore } from '@/store/systemStore'
import { useAlertStore } from '@/store/alertStore'
import type { Alert } from '@/types/sensors'

function makeAlert(
  id: string,
  level: Alert['threat_level'],
  acked = false
): Alert {
  return {
    id,
    timestamp: new Date().toISOString(),
    source_sensors: ['S01-GEO-001'],
    location: '21.94, 88.12',
    classification: 'INTRUSION',
    threat_level: level,
    acknowledged: acked,
    description: `Alert ${id}`,
  }
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
  useAlertStore.setState({
    alerts: [],
    threatAssessment: null,
    filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'UNACKED' },
  })
})

describe('LeftSidebar', () => {
  it('renders without crashing', () => {
    const { container } = render(<LeftSidebar />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('shows panel navigation buttons (Map, Alerts, Video, Sensors, AI/ML, Health)', () => {
    render(<LeftSidebar />)
    expect(screen.getByRole('button', { name: /live map/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /alerts/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /video feed/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sensors/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ai\/ml/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sys health/i })).toBeInTheDocument()
  })

  it('shows all 6 sensor family labels', () => {
    render(<LeftSidebar />)
    expect(screen.getByText('Seismic')).toBeInTheDocument()
    expect(screen.getByText('Acoustic')).toBeInTheDocument()
    expect(screen.getByText('Optical')).toBeInTheDocument()
    expect(screen.getByText('Radar')).toBeInTheDocument()
    expect(screen.getByText('Magnetic')).toBeInTheDocument()
    expect(screen.getByText('Chemical')).toBeInTheDocument()
  })

  it('when sidebarCollapsed=false, sidebar content is visible', () => {
    useSystemStore.setState({ sidebarCollapsed: false })
    render(<LeftSidebar />)
    expect(screen.getByText('Seismic')).toBeVisible()
    expect(screen.getByText('Live Map')).toBeInTheDocument()
  })

  it('when sidebarCollapsed=true, sidebar is collapsed (width 0)', () => {
    useSystemStore.setState({ sidebarCollapsed: true })
    render(<LeftSidebar />)
    const aside = screen.getByRole('complementary')
    expect(aside).toHaveStyle({ width: '0px' })
  })

  it('alert count badges are visible when there are unacknowledged alerts', () => {
    useAlertStore.setState({
      alerts: [
        makeAlert('a1', 'CRITICAL'),
        makeAlert('a2', 'HIGH'),
        makeAlert('a3', 'MEDIUM'),
      ],
    })
    render(<LeftSidebar />)
    // The alert summary section should show counts > 0
    const counts = screen.getAllByText('1')
    expect(counts.length).toBeGreaterThanOrEqual(1)
  })

  it('shows CRITICAL count badge when there are CRITICAL unacked alerts', () => {
    useAlertStore.setState({
      alerts: [makeAlert('c1', 'CRITICAL'), makeAlert('c2', 'CRITICAL')],
    })
    render(<LeftSidebar />)
    // CRITICAL section should show "2"
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows HIGH count badge when there are HIGH unacked alerts', () => {
    useAlertStore.setState({
      alerts: [makeAlert('h1', 'HIGH')],
    })
    render(<LeftSidebar />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    // HIGH level count shown as 1
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('clicking a family filter calls setFilter on alertStore', () => {
    const setFilterSpy = vi.fn()
    useAlertStore.setState({ setFilter: setFilterSpy } as any)
    render(<LeftSidebar />)
    fireEvent.click(screen.getByText('Seismic'))
    expect(setFilterSpy).toHaveBeenCalledWith({ sensorFamily: 'Seismic' })
  })

  it('renders threat level summary section', () => {
    render(<LeftSidebar />)
    // The "Active Alerts" heading and THREAT_LEVELS rows should be present
    expect(screen.getByText(/active alerts/i)).toBeInTheDocument()
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('LOW')).toBeInTheDocument()
  })
})
