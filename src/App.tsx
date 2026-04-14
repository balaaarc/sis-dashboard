import { useEffect } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useSystemStore } from './store/systemStore'
import TopNavBar from './components/layout/TopNavBar'
import LeftSidebar from './components/layout/LeftSidebar'
import PanelGrid from './components/layout/PanelGrid'

export default function App() {
  const theme = useSystemStore((s) => s.theme)
  const setReconnectFn = useSystemStore((s) => s.setReconnectFn)
  const mobileSidebarOpen = useSystemStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useSystemStore((s) => s.setMobileSidebarOpen)
  const { connect } = useWebSocket()

  useEffect(() => {
    setReconnectFn(connect)
  }, [connect, setReconnectFn])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div
      className="app-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <TopNavBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <LeftSidebar />
        {/* Mobile sidebar backdrop */}
        <div
          className={`mobile-sidebar-backdrop${mobileSidebarOpen ? ' active' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
        <PanelGrid />
      </div>
    </div>
  )
}
