import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ConnectionBadge } from '@/components/widgets/ConnectionBadge'
import { useSystemStore } from '@/store/systemStore'

const defaultSystemState = {
  connectionStatus: 'connected' as const,
  theme: 'dark' as const,
  scenario: 'NORMAL' as const,
  health: null,
  sidebarCollapsed: false,
  activePanel: 'map',
}

describe('ConnectionBadge', () => {
  beforeEach(() => {
    useSystemStore.setState(defaultSystemState)
  })

  it("renders without crashing", () => {
    expect(() => render(<ConnectionBadge />)).not.toThrow()
  })

  it("component returns a DOM element", () => {
    const { container } = render(<ConnectionBadge />)
    expect(container.firstChild).not.toBeNull()
  })

  it("shows 'Connected' text when status='connected'", () => {
    useSystemStore.setState({ ...defaultSystemState, connectionStatus: 'connected' })
    render(<ConnectionBadge />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it("shows 'Reconnecting...' text when status='reconnecting'", () => {
    useSystemStore.setState({ ...defaultSystemState, connectionStatus: 'reconnecting' })
    render(<ConnectionBadge />)
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument()
  })

  it("shows 'Disconnected' text when status='disconnected'", () => {
    useSystemStore.setState({ ...defaultSystemState, connectionStatus: 'disconnected' })
    render(<ConnectionBadge />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  it("shows 'Connecting...' text when status='connecting'", () => {
    useSystemStore.setState({ ...defaultSystemState, connectionStatus: 'connecting' })
    render(<ConnectionBadge />)
    expect(screen.getByText('Connecting...')).toBeInTheDocument()
  })
})
