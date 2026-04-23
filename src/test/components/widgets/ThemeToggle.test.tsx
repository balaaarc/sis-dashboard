import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeToggle } from '@/components/widgets/ThemeToggle'
import { useSystemStore } from '@/store/systemStore'

const defaultSystemState = {
  theme: 'dark' as const,
  scenario: 'NORMAL' as const,
  connectionStatus: 'connecting' as const,
  health: null,
  sidebarCollapsed: false,
  activePanel: 'map',
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    useSystemStore.setState(defaultSystemState)
  })

  it('renders a button element', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it("shows sun icon (☀) when theme is 'dark'", () => {
    useSystemStore.setState({ ...defaultSystemState, theme: 'dark' })
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toHaveTextContent('☀')
  })

  it("shows moon icon (☽) when theme is 'light'", () => {
    useSystemStore.setState({ ...defaultSystemState, theme: 'light' })
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toHaveTextContent('☽')
  })

  it('clicking the button calls toggleTheme and changes the theme', () => {
    useSystemStore.setState({ ...defaultSystemState, theme: 'dark' })
    const initialTheme = useSystemStore.getState().theme
    expect(initialTheme).toBe('dark')
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(useSystemStore.getState().theme).toBe('light')
  })

  it("after click in dark mode, theme becomes 'light'", () => {
    useSystemStore.setState({ ...defaultSystemState, theme: 'dark' })
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(useSystemStore.getState().theme).toBe('light')
  })
})
