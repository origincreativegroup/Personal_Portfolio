import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react'
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from '../hooks/useKeyboardShortcuts'

// ===== TYPES =====

interface KeyboardShortcutsContextType {
  registerShortcut: (shortcut: KeyboardShortcut) => void
  unregisterShortcut: (key: string, modifiers?: {
    ctrlKey?: boolean
    metaKey?: boolean
    altKey?: boolean
    shiftKey?: boolean
  }) => void
  clearShortcuts: () => void
  getShortcuts: () => KeyboardShortcut[]
  isShortcutRegistered: (key: string, modifiers?: {
    ctrlKey?: boolean
    metaKey?: boolean
    altKey?: boolean
    shiftKey?: boolean
  }) => boolean
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode
  globalShortcuts?: KeyboardShortcut[]
  enableCommonShortcuts?: boolean
}

// ===== CONTEXT =====

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined)

// ===== PROVIDER =====

export const KeyboardShortcutsProvider = ({
  children,
  globalShortcuts = [],
  enableCommonShortcuts = true,
}: KeyboardShortcutsProviderProps) => {
  // Combine global shortcuts with common shortcuts if enabled
  const allShortcuts = useMemo(() => {
    const shortcuts = [...globalShortcuts]
    
    if (enableCommonShortcuts) {
      // Add common shortcuts that are typically useful globally
      shortcuts.push(
        commonShortcuts.escape(() => {
          // Close any open modals or cancel current action
          const escapeEvent = new CustomEvent('keyboard:escape')
          document.dispatchEvent(escapeEvent)
        }),
        commonShortcuts.help(() => {
          // Show help modal or toggle help panel
          const helpEvent = new CustomEvent('keyboard:help')
          document.dispatchEvent(helpEvent)
        }),
        commonShortcuts.search(() => {
          // Open search or command palette
          const searchEvent = new CustomEvent('keyboard:search')
          document.dispatchEvent(searchEvent)
        }),
        commonShortcuts.themeToggle(() => {
          // Toggle theme
          const themeEvent = new CustomEvent('keyboard:theme-toggle')
          document.dispatchEvent(themeEvent)
        })
      )
    }
    
    return shortcuts
  }, [globalShortcuts, enableCommonShortcuts])

  // Register shortcuts
  useKeyboardShortcuts(allShortcuts, {
    enabled: true,
    target: document,
  })

  // Context methods
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    // This would typically be handled by a more sophisticated state management system
    // For now, we'll just add it to the global shortcuts
    console.log('Registering shortcut:', shortcut)
  }, [])

  const unregisterShortcut = useCallback((key: string, modifiers = {}) => {
    console.log('Unregistering shortcut:', key, modifiers)
  }, [])

  const clearShortcuts = useCallback(() => {
    console.log('Clearing all shortcuts')
  }, [])

  const getShortcuts = useCallback(() => {
    return allShortcuts
  }, [allShortcuts])

  const isShortcutRegistered = useCallback((key: string, modifiers = {}) => {
    return allShortcuts.some(shortcut => 
      shortcut.key.toLowerCase() === key.toLowerCase() &&
      !!shortcut.ctrlKey === !!modifiers.ctrlKey &&
      !!shortcut.metaKey === !!modifiers.metaKey &&
      !!shortcut.altKey === !!modifiers.altKey &&
      !!shortcut.shiftKey === !!modifiers.shiftKey
    )
  }, [allShortcuts])

  const contextValue: KeyboardShortcutsContextType = {
    registerShortcut,
    unregisterShortcut,
    clearShortcuts,
    getShortcuts,
    isShortcutRegistered,
  }

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}

// ===== HOOK =====

export const useKeyboardShortcutsContext = () => {
  const context = useContext(KeyboardShortcutsContext)
  if (context === undefined) {
    throw new Error('useKeyboardShortcutsContext must be used within a KeyboardShortcutsProvider')
  }
  return context
}

// ===== SHORTCUT HOOKS =====

export const useShortcut = (
  key: string,
  action: () => void,
  options: {
    ctrlKey?: boolean
    metaKey?: boolean
    altKey?: boolean
    shiftKey?: boolean
    disabled?: boolean
    description?: string
  } = {}
) => {
  const shortcut: KeyboardShortcut = {
    key,
    action,
    ...options,
  }

  useKeyboardShortcuts([shortcut], {
    enabled: !options.disabled,
    target: document,
  })
}

export const useEscapeShortcut = (action: () => void, disabled = false) => {
  useShortcut('Escape', action, { disabled })
}

export const useEnterShortcut = (action: () => void, disabled = false) => {
  useShortcut('Enter', action, { disabled })
}

export const useSaveShortcut = (action: () => void, disabled = false) => {
  useShortcut('s', action, { ctrlKey: true, disabled, description: 'Save' })
}

export const useNewShortcut = (action: () => void, disabled = false) => {
  useShortcut('n', action, { ctrlKey: true, disabled, description: 'New' })
}

export const useOpenShortcut = (action: () => void, disabled = false) => {
  useShortcut('o', action, { ctrlKey: true, disabled, description: 'Open' })
}

export const useSearchShortcut = (action: () => void, disabled = false) => {
  useShortcut('k', action, { ctrlKey: true, disabled, description: 'Search' })
}

export const useHelpShortcut = (action: () => void, disabled = false) => {
  useShortcut('?', action, { shiftKey: true, disabled, description: 'Help' })
}

export const useSettingsShortcut = (action: () => void, disabled = false) => {
  useShortcut(',', action, { ctrlKey: true, disabled, description: 'Settings' })
}

// ===== EXPORT =====

export default KeyboardShortcutsProvider
