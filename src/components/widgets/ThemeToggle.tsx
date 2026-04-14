import { useSystemStore } from '../../store/systemStore'

export default function ThemeToggle() {
  const theme = useSystemStore((s) => s.theme)
  const toggleTheme = useSystemStore((s) => s.toggleTheme)

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--border-color)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)'
      }}
    >
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  )
}
