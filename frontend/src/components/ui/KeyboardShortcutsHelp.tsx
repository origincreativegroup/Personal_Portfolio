import { useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard, Command } from 'lucide-react'
import { cn } from '../../shared/utils'
import Modal from './Modal'
import ModernButton from './ModernButton'

// ===== TYPES =====

interface ShortcutGroup {
  title: string
  shortcuts: {
    keys: string[]
    description: string
    action?: string
  }[]
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
  shortcuts?: ShortcutGroup[]
  className?: string
}

// ===== DEFAULT SHORTCUTS =====

const defaultShortcuts: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Esc'], description: 'Close modal or cancel action' },
      { keys: ['Enter'], description: 'Confirm or submit' },
      { keys: ['Tab'], description: 'Next element' },
      { keys: ['Shift', 'Tab'], description: 'Previous element' },
      { keys: ['↑', '↓', '←', '→'], description: 'Navigate in lists' },
    ],
  },
  {
    title: 'File Operations',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save', action: 'Save current project' },
      { keys: ['Ctrl', 'N'], description: 'New', action: 'Create new project' },
      { keys: ['Ctrl', 'O'], description: 'Open', action: 'Open existing project' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Save As', action: 'Save with new name' },
    ],
  },
  {
    title: 'Edit Operations',
    shortcuts: [
      { keys: ['Ctrl', 'C'], description: 'Copy' },
      { keys: ['Ctrl', 'V'], description: 'Paste' },
      { keys: ['Ctrl', 'X'], description: 'Cut' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Ctrl', 'A'], description: 'Select All' },
    ],
  },
  {
    title: 'Search & Help',
    shortcuts: [
      { keys: ['Ctrl', 'F'], description: 'Find', action: 'Search in current view' },
      { keys: ['Ctrl', 'K'], description: 'Search', action: 'Open global search' },
      { keys: ['Shift', '?'], description: 'Help', action: 'Show this help modal' },
      { keys: ['Ctrl', ','], description: 'Settings', action: 'Open settings' },
    ],
  },
  {
    title: 'Application',
    shortcuts: [
      { keys: ['F1'], description: 'Help' },
      { keys: ['F2'], description: 'Rename', action: 'Rename selected item' },
      { keys: ['F5'], description: 'Refresh', action: 'Refresh current view' },
      { keys: ['F11'], description: 'Fullscreen', action: 'Toggle fullscreen mode' },
      { keys: ['Delete'], description: 'Delete', action: 'Delete selected item' },
    ],
  },
  {
    title: 'Asset Management',
    shortcuts: [
      { keys: ['Ctrl', 'U'], description: 'Upload', action: 'Upload new assets' },
      { keys: ['Ctrl', 'D'], description: 'Download', action: 'Download selected assets' },
      { keys: ['Space'], description: 'Preview', action: 'Preview selected asset' },
      { keys: ['Ctrl', 'G'], description: 'Group', action: 'Group selected assets' },
    ],
  },
]

// ===== UTILITIES =====

const getKeyIcon = (key: string): ReactNode => {
  const keyLower = key.toLowerCase()
  
  switch (keyLower) {
    case 'ctrl':
      return <span className="text-xs">Ctrl</span>
    case 'cmd':
    case 'meta':
      return <Command size={14} />
    case 'alt':
      return <span className="text-xs">Alt</span>
    case 'shift':
      return <span className="text-xs">Shift</span>
    case 'space':
      return <span className="text-xs">Space</span>
    case 'enter':
      return <span className="text-xs">Enter</span>
    case 'escape':
    case 'esc':
      return <span className="text-xs">Esc</span>
    case 'tab':
      return <span className="text-xs">Tab</span>
    case 'delete':
      return <span className="text-xs">Del</span>
    case 'backspace':
      return <span className="text-xs">⌫</span>
    case 'up':
      return <span className="text-xs">↑</span>
    case 'down':
      return <span className="text-xs">↓</span>
    case 'left':
      return <span className="text-xs">←</span>
    case 'right':
      return <span className="text-xs">→</span>
    default:
      return <span className="text-xs font-mono">{key}</span>
  }
}

const formatKeys = (keys: string[]): ReactNode => {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="text-text-tertiary dark:text-text-tertiary-dark mx-1">+</span>}
          <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-surface-secondary dark:bg-surface-secondary-dark border border-border dark:border-border-dark rounded-md shadow-sm">
            {getKeyIcon(key)}
          </kbd>
        </div>
      ))}
    </div>
  )
}

// ===== COMPONENT =====

export default function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  shortcuts = defaultShortcuts,
  className,
}: KeyboardShortcutsHelpProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredShortcuts, setFilteredShortcuts] = useState<ShortcutGroup[]>(shortcuts)

  // Filter shortcuts based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredShortcuts(shortcuts)
      return
    }

    const filtered = shortcuts.map(group => ({
      ...group,
      shortcuts: group.shortcuts.filter(shortcut =>
        shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortcut.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortcut.keys.some(key => key.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })).filter(group => group.shortcuts.length > 0)

    setFilteredShortcuts(filtered)
  }, [searchTerm, shortcuts])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className={cn('max-h-[80vh]', className)}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Keyboard size={24} className="text-primary-500" />
          <h2 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark">
            Keyboard Shortcuts
          </h2>
        </div>
        <ModernButton
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-text-tertiary dark:text-text-tertiary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
        >
          <X size={20} />
        </ModernButton>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search shortcuts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark placeholder-text-tertiary dark:placeholder-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Shortcuts List */}
      <div className="space-y-6 max-h-[50vh] overflow-y-auto">
        <AnimatePresence>
          {filteredShortcuts.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={`${group.title}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-secondary-dark transition-colors duration-150"
                  >
                    <div className="flex-1">
                      <div className="text-sm text-text-primary dark:text-text-primary-dark">
                        {shortcut.description}
                      </div>
                      {shortcut.action && (
                        <div className="text-xs text-text-tertiary dark:text-text-tertiary-dark mt-1">
                          {shortcut.action}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {formatKeys(shortcut.keys)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredShortcuts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-text-tertiary dark:text-text-tertiary-dark"
          >
            <Keyboard size={48} className="mx-auto mb-4 opacity-50" />
            <p>No shortcuts found matching "{searchTerm}"</p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border dark:border-border-dark">
        <div className="flex items-center justify-between text-sm text-text-tertiary dark:text-text-tertiary-dark">
          <p>Press <kbd className="px-1 py-0.5 bg-surface-secondary dark:bg-surface-secondary-dark rounded text-xs">Esc</kbd> to close</p>
          <p>Press <kbd className="px-1 py-0.5 bg-surface-secondary dark:bg-surface-secondary-dark rounded text-xs">Shift</kbd> + <kbd className="px-1 py-0.5 bg-surface-secondary dark:bg-surface-secondary-dark rounded text-xs">?</kbd> to open this help</p>
        </div>
      </div>
    </Modal>
  )
}
