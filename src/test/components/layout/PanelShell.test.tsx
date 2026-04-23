import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PanelShell } from '@/components/layout/PanelShell'
import { useViewStore } from '@/store/viewStore'

describe('PanelShell', () => {
  beforeEach(() => {
    // Reset view store so panel state doesn't leak between tests
    useViewStore.setState({ panelViews: {}, expandedPanel: null })
  })
  it('renders without crashing with title and children', () => {
    const { container } = render(
      <PanelShell panelId="test" title="Test Panel">
        <div>Child content</div>
      </PanelShell>
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('shows the title text', () => {
    render(
      <PanelShell panelId="test" title="My Panel Title">
        <div>content</div>
      </PanelShell>
    )
    expect(screen.getByText('My Panel Title')).toBeInTheDocument()
  })

  it('shows the icon when provided', () => {
    render(
      <PanelShell panelId="test" title="Panel" icon="🔔">
        <div>content</div>
      </PanelShell>
    )
    expect(screen.getByText('🔔')).toBeInTheDocument()
  })

  it('renders children inside the panel body', () => {
    render(
      <PanelShell panelId="test" title="Panel">
        <div data-testid="child-node">child here</div>
      </PanelShell>
    )
    expect(screen.getByTestId('child-node')).toBeInTheDocument()
    expect(screen.getByText('child here')).toBeInTheDocument()
  })

  it('has a minimize button', () => {
    render(
      <PanelShell panelId="test" title="Panel">
        <div>content</div>
      </PanelShell>
    )
    const minBtn = screen.getByTitle('Minimize')
    expect(minBtn).toBeInTheDocument()
  })

  it('clicking minimize hides the children (minimized state)', () => {
    render(
      <PanelShell panelId="test" title="Panel">
        <div data-testid="body-content">visible content</div>
      </PanelShell>
    )
    expect(screen.getByTestId('body-content')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Minimize'))

    expect(screen.queryByTestId('body-content')).not.toBeInTheDocument()
  })

  it('clicking minimize again shows children again (toggle behavior)', () => {
    render(
      <PanelShell panelId="test" title="Panel">
        <div data-testid="body-content">visible content</div>
      </PanelShell>
    )
    const minBtn = screen.getByTitle('Minimize')
    // Minimize
    fireEvent.click(minBtn)
    expect(screen.queryByTestId('body-content')).not.toBeInTheDocument()

    // Maximize (button title changes after minimize)
    fireEvent.click(screen.getByTitle('Maximize'))
    expect(screen.getByTestId('body-content')).toBeInTheDocument()
  })

  it('applies gridArea style when gridArea prop is provided', () => {
    const { container } = render(
      <PanelShell panelId="test" title="Panel" gridArea="main">
        <div>content</div>
      </PanelShell>
    )
    const panelDiv = container.firstChild as HTMLElement
    expect(panelDiv.style.gridArea).toBe('main')
  })

  it('does not crash without optional props (no icon, no gridArea)', () => {
    expect(() =>
      render(
        <PanelShell panelId="test" title="Minimal">
          <span>ok</span>
        </PanelShell>
      )
    ).not.toThrow()
    expect(screen.getByText('Minimal')).toBeInTheDocument()
  })

  it('headerExtra content is rendered when provided', () => {
    render(
      <PanelShell
        panelId="test"
        title="Panel"
        headerExtra={<button data-testid="extra-btn">Extra</button>}
      >
        <div>content</div>
      </PanelShell>
    )
    expect(screen.getByTestId('extra-btn')).toBeInTheDocument()
    expect(screen.getByText('Extra')).toBeInTheDocument()
  })
})
