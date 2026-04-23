import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WaveformChart } from '@/components/widgets/WaveformChart'

function makeData(length: number): number[] {
  return Array.from({ length }, (_, i) => Math.sin(i * 0.1) * 50)
}

describe('WaveformChart', () => {
  it('renders without crashing with empty data array', () => {
    expect(() => render(<WaveformChart data={[]} />)).not.toThrow()
  })

  it('renders a placeholder when data is empty', () => {
    render(<WaveformChart data={[]} />)
    expect(screen.getByText('No waveform data')).toBeInTheDocument()
  })

  it('renders with 100-point data array without crashing', () => {
    expect(() => render(<WaveformChart data={makeData(100)} />)).not.toThrow()
  })

  it('renders an SVG element when data has points', () => {
    const { container } = render(<WaveformChart data={makeData(100)} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('accepts optional color prop without crashing', () => {
    expect(() => render(<WaveformChart data={makeData(10)} color="#FF0000" />)).not.toThrow()
  })

  it('accepts optional label prop and displays it', () => {
    render(<WaveformChart data={makeData(10)} label="SEISMIC CH-1" />)
    expect(screen.getByText('SEISMIC CH-1')).toBeInTheDocument()
  })

  it('renders with custom height prop', () => {
    const { container } = render(<WaveformChart data={makeData(10)} height={120} />)
    // The outer container uses height: HEIGHT + label offset
    const wrapper = container.querySelector('.canvas-container') as HTMLElement
    expect(wrapper).toBeInTheDocument()
    expect(wrapper.style.height).toBe('120px')
  })

  it('does not crash with single data point', () => {
    // Single point — pathD will be empty string (< 2 points guard)
    expect(() => render(<WaveformChart data={[0.5]} />)).not.toThrow()
  })
})
