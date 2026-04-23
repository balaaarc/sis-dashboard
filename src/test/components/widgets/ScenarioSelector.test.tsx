import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ScenarioSelector } from '@/components/widgets/ScenarioSelector'
import { useSystemStore } from '@/store/systemStore'

const defaultSystemState = {
  scenario: 'NORMAL' as const,
  theme: 'dark' as const,
  connectionStatus: 'connecting' as const,
  health: null,
  sidebarCollapsed: false,
  activePanel: 'map',
}

describe('ScenarioSelector', () => {
  beforeEach(() => {
    useSystemStore.setState(defaultSystemState)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  it('renders a select/dropdown element', () => {
    render(<ScenarioSelector />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows all 6 scenarios as options', () => {
    render(<ScenarioSelector />)
    const select = screen.getByRole('combobox')
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.value)
    expect(options).toContain('NORMAL')
    expect(options).toContain('ELEVATED')
    expect(options).toContain('INTRUSION')
    expect(options).toContain('TUNNEL_ACTIVITY')
    expect(options).toContain('DRONE')
    expect(options).toContain('VEHICLE_CONVOY')
    expect(options).toHaveLength(6)
  })

  it('current scenario from store is selected', () => {
    useSystemStore.setState({ ...defaultSystemState, scenario: 'ELEVATED' })
    render(<ScenarioSelector />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('ELEVATED')
  })

  it('changing selection calls POST to /api/scenario', async () => {
    render(<ScenarioSelector />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'INTRUSION' } })
    // Allow promise microtask to run
    await Promise.resolve()
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/scenario'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('after selecting INTRUSION, scenario updates in store', async () => {
    render(<ScenarioSelector />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'INTRUSION' } })
    await Promise.resolve()
    expect(useSystemStore.getState().scenario).toBe('INTRUSION')
  })

  it('renders without crashing', () => {
    expect(() => render(<ScenarioSelector />)).not.toThrow()
  })
})
