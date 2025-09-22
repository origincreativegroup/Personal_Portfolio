import { useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X, HelpCircle } from 'lucide-react'
import { cn } from '../../shared/utils'
import ModernButton from './ModernButton'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'

// ===== TYPES =====

interface KeyboardShortcutsIndicatorProps {
  className?: string
  showHelpButton?: boolean
  showShortcutsList?: boolean
  shortcuts?: Array<{
    keys: string[]
    description: string
    action?: string
  }>
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  autoHide?: boolean
  hideDelay?: number
}

// ===== COMPONENT =====

export default function KeyboardShortcutsIndicator({
  className,
  showHelpButton = true,
  showShortcutsList = true,
  shortcuts = [],
  position = 'bottom-right',
  autoHide = true,
  hideDelay = 3000,
}: KeyboardShortcutsIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [currentShortcut, setCurrentShortcut] = useState<string | null>(null)

  // Show indicator when shortcuts are available
  useEffect(() => {
    if (shortcuts.length > 0) {
      setIsVisible(true)
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false)
        }, hideDelay)
        
        return () => clearTimeout(timer)
      }
    }
  }, [shortcuts.length, autoHide, hideDelay])

  // Listen for keyboard events to show current shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      const modifiers = []
      
      if (e.ctrlKey) modifiers.push('Ctrl')
      if (e.metaKey) modifiers.push('Cmd')
      if (e.altKey) modifiers.push('Alt')
      if (e.shiftKey) modifiers.push('Shift')
      
      const shortcutString = [...modifiers, key].join('+')
      setCurrentShortcut(shortcutString)
      
      // Hide after a short delay
      setTimeout(() => setCurrentShortcut(null), 1000)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  const formatKeys = (keys: string[]): ReactNode => {
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="text-text-tertiary dark:text-text-tertiary-dark mx-1">+</span>}
            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-surface-secondary dark:bg-surface-secondary-dark border border-border dark:border-border-dark rounded-md shadow-sm">
              {key}
            </kbd>
          </div>
        ))}
      </div>
    )
  }

  if (!isVisible && !currentShortcut) return null

  return (
    <>
      <AnimatePresence>
        {(isVisible || currentShortcut) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={cn(
              'fixed z-50 flex items-center gap-3 p-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg shadow-lg backdrop-blur-sm',
              positionClasses[position],
              className
            )}
          >
            {/* Current Shortcut Display */}
            {currentShortcut && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 text-sm text-text-primary dark:text-text-primary-dark"
              >
                <Keyboard size={16} className="text-primary-500" />
                <span>Pressed:</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100 rounded">
                  {currentShortcut}
                </kbd>
              </motion.div>
            )}

            {/* Shortcuts List */}
            {showShortcutsList && shortcuts.length > 0 && !currentShortcut && (
              <div className="flex items-center gap-2">
                <Keyboard size={16} className="text-primary-500" />
                <div className="flex items-center gap-2 text-sm text-text-primary dark:text-text-primary-dark">
                  <span>Available shortcuts:</span>
                  <div className="flex items-center gap-1">
                    {shortcuts.slice(0, 3).map((shortcut, index) => (
                      <div key={index} className="flex items-center">
                        {index > 0 && <span className="text-text-tertiary dark:text-text-tertiary-dark mx-1">•</span>}
                        {formatKeys(shortcut.keys)}
                      </div>
                    ))}
                    {shortcuts.length > 3 && (
                      <span className="text-text-tertiary dark:text-text-tertiary-dark ml-1">
                        +{shortcuts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Help Button */}
            {showHelpButton && (
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(true)}
                className="text-text-tertiary dark:text-text-tertiary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
              >
                <HelpCircle size={16} />
              </ModernButton>
            )}

            {/* Close Button */}
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-text-tertiary dark:text-text-tertiary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
            >
              <X size={16} />
            </ModernButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts.map(s => ({
          title: 'Available Shortcuts',
          shortcuts: [s]
        }))}
      />
    </>
  )
}

// ===== HOOK FOR SHORTCUT INDICATOR =====

export const useShortcutIndicator = (
  shortcuts: Array<{
    keys: string[]
    description: string
    action?: string
  }>,
  options: {
    autoShow?: boolean
    showDelay?: number
    hideDelay?: number
  } = {}
) => {
  const [isVisible, setIsVisible] = useState(false)
  const { autoShow = true, showDelay = 0, hideDelay = 3000 } = options

  useEffect(() => {
    if (autoShow && shortcuts.length > 0) {
      const showTimer = setTimeout(() => {
        setIsVisible(true)
      }, showDelay)

      const hideTimer = setTimeout(() => {
        setIsVisible(false)
      }, showDelay + hideDelay)

      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [shortcuts.length, autoShow, showDelay, hideDelay])

  const show = () => setIsVisible(true)
  const hide = () => setIsVisible(false)

  return {
    isVisible,
    show,
    hide,
  }
}
