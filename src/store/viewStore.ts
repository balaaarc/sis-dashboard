import { create } from 'zustand'

export type ViewMode = 'minimized' | 'normal' | 'expanded'

interface ViewState {
  panelViews: Record<string, ViewMode>
  expandedPanel: string | null
  setPanelView: (panelId: string, mode: ViewMode) => void
  toggleExpand: (panelId: string) => void
  toggleMinimize: (panelId: string) => void
  getView: (panelId: string) => ViewMode
}

export const useViewStore = create<ViewState>()((set, get) => ({
  panelViews: {},
  expandedPanel: null,

  setPanelView: (panelId, mode) =>
    set((s) => ({
      panelViews: { ...s.panelViews, [panelId]: mode },
      expandedPanel:
        mode === 'expanded'
          ? panelId
          : s.expandedPanel === panelId
          ? null
          : s.expandedPanel,
    })),

  // Toggle expanded — only one panel can be expanded at a time.
  // Expanding a new panel while another is expanded replaces it.
  toggleExpand: (panelId) =>
    set((s) => {
      const current = s.panelViews[panelId] ?? 'normal'
      const newMode: ViewMode = current === 'expanded' ? 'normal' : 'expanded'
      return {
        panelViews: { ...s.panelViews, [panelId]: newMode },
        expandedPanel: newMode === 'expanded' ? panelId : null,
      }
    }),

  // Toggle minimized — independent of expanded state
  toggleMinimize: (panelId) =>
    set((s) => {
      const current = s.panelViews[panelId] ?? 'normal'
      const newMode: ViewMode = current === 'minimized' ? 'normal' : 'minimized'
      return {
        panelViews: { ...s.panelViews, [panelId]: newMode },
        // If we're un-minimizing a panel that was in expanded state, clear expanded
        expandedPanel:
          newMode !== 'expanded' && s.expandedPanel === panelId
            ? null
            : s.expandedPanel,
      }
    }),

  getView: (panelId) => get().panelViews[panelId] ?? 'normal',
}))
