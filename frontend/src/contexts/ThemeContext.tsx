import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }

    // Default to light mode for better UX
    return 'light'
  })

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', theme)

    // Update document class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Listen for keyboard shortcut to toggle theme
  useEffect(() => {
    const handleThemeToggle = () => {
      toggleTheme()
    }

    document.addEventListener('keyboard:theme-toggle', handleThemeToggle)
    return () => {
      document.removeEventListener('keyboard:theme-toggle', handleThemeToggle)
    }
  }, [toggleTheme])

  const resetTheme = () => {
    localStorage.removeItem('theme')
    setTheme('light')
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    resetTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}