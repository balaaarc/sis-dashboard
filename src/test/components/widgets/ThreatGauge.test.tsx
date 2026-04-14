import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ThreatGauge from '../../../components/widgets/ThreatGauge'
import type { ThreatLevel } from '../../../types/sensors'

describe('ThreatGauge', () => {
  it("renders without crashing with score=0, level='CLEAR'", () => {
    expect(() => render(<ThreatGauge score={0} level="CLEAR" />)).not.toThrow()
  })

  it("renders without crashing with score=100, level='CRITICAL'", () => {
    expect(() => render(<ThreatGauge score={100} level="CRITICAL" />)).not.toThrow()
  })

  it('displays the score number in the output', () => {
    render(<ThreatGauge score={42} level="MEDIUM" />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('displays the threat level label', () => {
    render(<ThreatGauge score={60} level="MEDIUM" />)
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    const { container } = render(<ThreatGauge score={50} level="MEDIUM" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it("score=50 renders with 'MEDIUM' displayed", () => {
    render(<ThreatGauge score={50} level="MEDIUM" />)
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it("score=85 renders with 'HIGH' displayed", () => {
    render(<ThreatGauge score={85} level="HIGH" />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it("score=95 renders with 'CRITICAL' displayed", () => {
    render(<ThreatGauge score={95} level="CRITICAL" />)
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()
  })
})
