import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { useSystemStore } from '@/store/systemStore'
import { useAlertStore } from '@/store/alertStore'
import type { Alert } from '@/types/sensors'

function makeAlert(id: string, acked = false): Alert {
  return {
    id,
    timestamp: new Date().toISOString(),
    source_sensors: ['S01-GEO-001'],
    location: '21.94, 88.12',
    classification: 'INTRUSION',
    threat_level: 'HIGH',
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

describe('TopNavBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<TopNavBar />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("shows 'SIS' logo text", () => {
    render(<TopNavBar />)
    expect(screen.getByText('SIS')).toBeInTheDocument()
  })

  it("shows 'IINVSYS' subtitle", () => {
    render(<TopNavBar />)
    expect(screen.getByText('IINVSYS')).toBeInTheDocument()
  })

  it('shows the current UTC time in HH:mm:ss format', () => {
    render(<TopNavBar />)
    // The time is displayed as "HH:mm:ss UTC"
    const timeEl = screen.getByText(/^\d{2}:\d{2}:\d{2} UTC$/)
    expect(timeEl).toBeInTheDocument()
  })

  it('shows the current scenario name (NORMAL by default)', () => {
    render(<TopNavBar />)
    expect(screen.getByText('NORMAL')).toBeInTheDocument()
  })

  it('shows site selector dropdown with BOP-ALPHA-01 and BOP-BETA-01 options', () => {
    render(<TopNavBar />)
    // Two comboboxes exist (site selector + scenario selector); pick the first (site)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(1)
    const siteSelect = selects[0]
    expect(siteSelect).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'BOP-ALPHA-01' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'BOP-BETA-01' })).toBeInTheDocument()
  })

  it('shows 0 unacknowledged alerts badge when no alerts', () => {
    render(<TopNavBar />)
    // The badge should not render when unackedCount === 0
    expect(screen.queryByText(/^[1-9]\d*$/)).not.toBeInTheDocument()
  })

  it('shows unacknowledged count badge when there are unacked alerts', () => {
    useAlertStore.setState({ alerts: [makeAlert('a1'), makeAlert('a2')] })
    render(<TopNavBar />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not show alert badge when all alerts are acknowledged', () => {
    useAlertStore.setState({
      alerts: [makeAlert('a1', true), makeAlert('a2', true)],
    })
    render(<TopNavBar />)
    // No badge — unackedCount is 0
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })

  it('renders ConnectionBadge component showing connection status text', () => {
    render(<TopNavBar />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('renders ThemeToggle button', () => {
    render(<TopNavBar />)
    // ThemeToggle renders a button with a title about switching mode
    const toggleBtn = screen.getByTitle(/switch to (light|dark) mode/i)
    expect(toggleBtn).toBeInTheDocument()
  })

  it("shows 'Operator' role label", () => {
    render(<TopNavBar />)
    expect(screen.getByText('Operator')).toBeInTheDocument()
  })

  it("INTRUSION scenario shows 'INTRUSION' in the nav bar", () => {
    useSystemStore.setState({ scenario: 'INTRUSION' })
    render(<TopNavBar />)
    expect(screen.getByText('INTRUSION')).toBeInTheDocument()
  })

  it('scenario chip changes when store scenario changes', () => {
    const { rerender } = render(<TopNavBar />)
    expect(screen.getByText('NORMAL')).toBeInTheDocument()

    act(() => {
      useSystemStore.setState({ scenario: 'ELEVATED' })
    })
    rerender(<TopNavBar />)
    expect(screen.getByText('ELEVATED')).toBeInTheDocument()
    // The scenario select value should reflect the new scenario
    const selects = screen.getAllByRole('combobox')
    const scenarioSelect = selects.find(
      (s) => (s as HTMLSelectElement).value === 'ELEVATED'
    )
    expect(scenarioSelect).toBeDefined()
  })
})
