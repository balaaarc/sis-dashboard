import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AlertRow } from '@/components/widgets/AlertRow'
import type { Alert } from '@/types/sensors'

function mockAlert(overrides = {}): Alert {
  return {
    id: 'alert-001',
    timestamp: '2026-04-11T10:00:00.000Z',
    source_sensors: ['S02-GEO-001'],
    location: '21.9452, 88.1234',
    classification: 'INTRUSION',
    threat_level: 'HIGH',
    acknowledged: false,
    description: 'Seismic anomaly detected',
    ...overrides,
  }
}

describe('AlertRow', () => {
  let onAck: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onAck = vi.fn()
  })

  it('renders without crashing', () => {
    expect(() => render(<AlertRow alert={mockAlert()} onAck={onAck} />)).not.toThrow()
  })

  it('shows the alert description text', () => {
    render(<AlertRow alert={mockAlert()} onAck={onAck} />)
    expect(screen.getByText('Seismic anomaly detected')).toBeInTheDocument()
  })

  it("shows the threat_level initial badge — 'H' for HIGH", () => {
    render(<AlertRow alert={mockAlert({ threat_level: 'HIGH' })} onAck={onAck} />)
    expect(screen.getByText('H')).toBeInTheDocument()
  })

  it("shows 'C' initial badge for CRITICAL", () => {
    render(<AlertRow alert={mockAlert({ threat_level: 'CRITICAL' })} onAck={onAck} />)
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('shows ACK button when alert.acknowledged is false', () => {
    render(<AlertRow alert={mockAlert({ acknowledged: false })} onAck={onAck} />)
    expect(screen.getByText('ACK')).toBeInTheDocument()
  })

  it("shows 'ACKED' and no ACK button when alert.acknowledged is true", () => {
    render(<AlertRow alert={mockAlert({ acknowledged: true })} onAck={onAck} />)
    expect(screen.queryByText('ACK')).not.toBeInTheDocument()
    expect(screen.getByText('ACKED')).toBeInTheDocument()
  })

  it('clicking ACK button once opens confirm input, second click calls onAck with alert id', () => {
    render(<AlertRow alert={mockAlert({ id: 'alert-001', acknowledged: false })} onAck={onAck} />)
    // First click shows Confirm
    fireEvent.click(screen.getByText('ACK'))
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    // Second click confirms and calls onAck
    fireEvent.click(screen.getByText('Confirm'))
    expect(onAck).toHaveBeenCalledWith('alert-001')
  })

  it('shows CRITICAL alert with class containing "critical"', () => {
    const { container } = render(
      <AlertRow alert={mockAlert({ threat_level: 'CRITICAL' })} onAck={onAck} />
    )
    const row = container.firstChild as HTMLElement
    expect(row.className).toMatch(/critical/)
  })

  it('shows LOW alert with class containing "low"', () => {
    const { container } = render(
      <AlertRow alert={mockAlert({ threat_level: 'LOW' })} onAck={onAck} />
    )
    const row = container.firstChild as HTMLElement
    expect(row.className).toMatch(/low/)
  })
})
