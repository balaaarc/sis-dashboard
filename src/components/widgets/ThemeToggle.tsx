import { useSystemStore } from '@/store/systemStore'

export function ThemeToggle() {
  const theme = useSystemStore((s) => s.theme)
  const toggleTheme = useSystemStore((s) => s.toggleTheme)

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-8 h-8 rounded-lg border border-border-color bg-bg-tertiary text-text-primary cursor-pointer text-base flex items-center justify-center transition-colors duration-150 shrink-0 hover:bg-[var(--border-color)]"
    >
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  )
}
