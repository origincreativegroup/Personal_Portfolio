import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

const ThemeToggle: React.FC = () => {
  const { state, setTheme } = useApp()

  const toggleTheme = () => {
    setTheme(state.theme === 'light' ? 'dark' : 'light')
  }

  const isLight = state.theme === 'light'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
    >
      {isLight ? <Moon width={16} height={16} /> : <Sun width={16} height={16} />}
      <span>{isLight ? 'Dark' : 'Light'} mode</span>
    </button>
  )
}

export default React.memo(ThemeToggle)
