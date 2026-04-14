import { useEffect } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useSystemStore } from './store/systemStore'
import TopNavBar from './components/layout/TopNavBar'
import LeftSidebar from './components/layout/LeftSidebar'
import PanelGrid from './components/layout/PanelGrid'

export default function App() {
  const theme = useSystemStore((s) => s.theme)
  const setReconnectFn = useSystemStore((s) => s.setReconnectFn)
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
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftSidebar />
        <PanelGrid />
      </div>
    </div>
  )
}
