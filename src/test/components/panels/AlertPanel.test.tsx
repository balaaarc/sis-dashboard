import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import AlertPanel from '../../../components/panels/AlertPanel'
import { useAlertStore } from '../../../store/alertStore'
import type { Alert } from '../../../types/sensors'

function mockAlert(id: string, level: Alert['threat_level'], acked = false): Alert {
  return {
    id,
    timestamp: new Date().toISOString(),
    source_sensors: ['S02-GEO-001'],
    location: '21.94, 88.12',
    classification: 'INTRUSION',
    threat_level: level,
    acknowledged: acked,
    description: `Alert ${id} description`,
  }
}

beforeEach(() => {
  useAlertStore.setState({
    alerts: [],
    threatAssessment: null,
    filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'UNACKED' },
  })
})

describe('AlertPanel', () => {
  it('renders without crashing with empty alerts', () => {
    const { container } = render(<AlertPanel />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("shows 'No alerts match current filters' empty state when no alerts", () => {
    render(<AlertPanel />)
    expect(screen.getByText(/no alerts match current filters/i)).toBeInTheDocument()
  })

  it('renders AlertRow for each alert in the filtered list', () => {
    useAlertStore.setState({
      alerts: [
        mockAlert('a1', 'HIGH'),
        mockAlert('a2', 'LOW'),
      ],
      filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'ALL' },
    })
    render(<AlertPanel />)
    // Each alert renders its classification text
    expect(screen.getAllByText('INTRUSION').length).toBeGreaterThanOrEqual(2)
  })

  it('filter chips are visible (ALL, CRITICAL, HIGH, MEDIUM, LOW)', () => {
    render(<AlertPanel />)
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'CRITICAL' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'HIGH' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'MEDIUM' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LOW' })).toBeInTheDocument()
  })

  it('clicking CRITICAL filter shows only CRITICAL alerts', () => {
    useAlertStore.setState({
      alerts: [
        mockAlert('c1', 'CRITICAL'),
        mockAlert('h1', 'HIGH'),
      ],
      filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'ALL' },
    })
    render(<AlertPanel />)

    // Switch to CRITICAL filter
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'CRITICAL' }))
    })
    // Should show "1 shown" (only the CRITICAL alert)
    expect(screen.getByText('1 shown')).toBeInTheDocument()
  })

  it('clicking ALL filter shows all alerts', () => {
    useAlertStore.setState({
      alerts: [
        mockAlert('c1', 'CRITICAL'),
        mockAlert('h1', 'HIGH'),
        mockAlert('m1', 'MEDIUM'),
      ],
      filter: { threatLevel: 'CRITICAL', sensorFamily: 'ALL', acknowledged: 'ALL' },
    })
    render(<AlertPanel />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'ALL' }))
    })
    expect(screen.getByText('3 shown')).toBeInTheDocument()
  })

  it('family dropdown is rendered', () => {
    render(<AlertPanel />)
    // There are two <select> elements: family and ack status
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(1)
    // Check one of the family options is present
    expect(screen.getByRole('option', { name: 'Seismic' })).toBeInTheDocument()
  })

  it('ack status filter is rendered', () => {
    render(<AlertPanel />)
    expect(screen.getByRole('option', { name: 'Unacknowledged' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Acknowledged' })).toBeInTheDocument()
  })

  it('alert description text is visible in the list', () => {
    useAlertStore.setState({
      alerts: [mockAlert('d1', 'MEDIUM')],
      filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'ALL' },
    })
    render(<AlertPanel />)
    expect(screen.getByText('Alert d1 description')).toBeInTheDocument()
  })

  it('renders without crashing with 10 alerts of different levels', () => {
    const levels: Alert['threat_level'][] = [
      'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'CRITICAL',
      'HIGH', 'MEDIUM', 'LOW', 'CRITICAL', 'HIGH',
    ]
    const alerts = levels.map((lvl, i) => mockAlert(`id-${i}`, lvl))
    useAlertStore.setState({
      alerts,
      filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'ALL' },
    })
    expect(() => render(<AlertPanel />)).not.toThrow()
    expect(screen.getByText('10 shown')).toBeInTheDocument()
  })

  it('CRITICAL alerts are visible when CRITICAL filter is active', () => {
    useAlertStore.setState({
      alerts: [
        mockAlert('crit1', 'CRITICAL'),
        mockAlert('low1', 'LOW'),
      ],
      filter: { threatLevel: 'CRITICAL', sensorFamily: 'ALL', acknowledged: 'ALL' },
    })
    render(<AlertPanel />)
    expect(screen.getByText('Alert crit1 description')).toBeInTheDocument()
    expect(screen.queryByText('Alert low1 description')).not.toBeInTheDocument()
  })

  it('when filter is UNACKED, acknowledged alerts are hidden', () => {
    useAlertStore.setState({
      alerts: [
        mockAlert('u1', 'HIGH', false),
        mockAlert('a1', 'HIGH', true),
      ],
      filter: { threatLevel: 'ALL', sensorFamily: 'ALL', acknowledged: 'UNACKED' },
    })
    render(<AlertPanel />)
    expect(screen.getByText('Alert u1 description')).toBeInTheDocument()
    expect(screen.queryByText('Alert a1 description')).not.toBeInTheDocument()
  })
})
