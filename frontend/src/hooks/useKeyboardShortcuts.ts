import { useEffect, useCallback, useRef } from 'react'

// ===== TYPES =====

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  action: () => void
  description?: string
  disabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
}

export interface KeyboardShortcutOptions {
  enabled?: boolean
  target?: HTMLElement | Document | Window
  preventDefault?: boolean
  stopPropagation?: boolean
}

// ===== UTILITIES =====

const normalizeKey = (key: string): string => {
  return key.toLowerCase().replace(/\s+/g, '')
}

const createShortcutKey = (shortcut: Omit<KeyboardShortcut, 'action' | 'description' | 'disabled'>): string => {
  const parts = []
  
  if (shortcut.ctrlKey) parts.push('ctrl')
  if (shortcut.metaKey) parts.push('meta')
  if (shortcut.altKey) parts.push('alt')
  if (shortcut.shiftKey) parts.push('shift')
  parts.push(normalizeKey(shortcut.key))
  
  return parts.join('+')
}

const matchesShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  const eventKey = normalizeKey(event.key)
  const shortcutKey = normalizeKey(shortcut.key)
  
  return (
    eventKey === shortcutKey &&
    !!event.ctrlKey === !!shortcut.ctrlKey &&
    !!event.metaKey === !!shortcut.metaKey &&
    !!event.altKey === !!shortcut.altKey &&
    !!event.shiftKey === !!shortcut.shiftKey
  )
}

// ===== HOOK =====

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: KeyboardShortcutOptions = {}
) => {
  const {
    enabled = true,
    target = document,
    preventDefault = true,
    stopPropagation = false,
  } = options

  const shortcutsRef = useRef(shortcuts)
  const optionsRef = useRef(options)

  // Update refs when dependencies change
  useEffect(() => {
    shortcutsRef.current = shortcuts
    optionsRef.current = options
  }, [shortcuts, options])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const currentShortcuts = shortcutsRef.current
    const currentOptions = optionsRef.current

    // Find matching shortcut
    const matchingShortcut = currentShortcuts.find(shortcut => 
      !shortcut.disabled && matchesShortcut(event, shortcut)
    )

    if (matchingShortcut) {
      // Prevent default behavior if specified
      if (matchingShortcut.preventDefault !== false && (preventDefault || matchingShortcut.preventDefault)) {
        event.preventDefault()
      }

      // Stop propagation if specified
      if (matchingShortcut.stopPropagation || stopPropagation) {
        event.stopPropagation()
      }

      // Execute action
      matchingShortcut.action()
    }
  }, [enabled, preventDefault, stopPropagation])

  useEffect(() => {
    if (!enabled) return

    const targetElement = target as EventTarget
    targetElement.addEventListener('keydown', handleKeyDown)

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, target, handleKeyDown])
}

// ===== CONVENIENCE HOOKS =====

export const useGlobalShortcuts = (shortcuts: KeyboardShortcut[]) => {
  return useKeyboardShortcuts(shortcuts, {
    target: document,
    enabled: true,
  })
}

export const useElementShortcuts = (
  shortcuts: KeyboardShortcut[],
  element: HTMLElement | null,
  enabled: boolean = true
) => {
  return useKeyboardShortcuts(shortcuts, {
    target: element || document,
    enabled: enabled && !!element,
  })
}

// ===== COMMON SHORTCUTS =====

export const commonShortcuts = {
  // Navigation
  escape: (action: () => void): KeyboardShortcut => ({
    key: 'Escape',
    action,
    description: 'Close modal or cancel action',
  }),

  enter: (action: () => void): KeyboardShortcut => ({
    key: 'Enter',
    action,
    description: 'Confirm or submit',
  }),

  // File operations
  save: (action: () => void): KeyboardShortcut => ({
    key: 's',
    ctrlKey: true,
    action,
    description: 'Save',
  }),

  new: (action: () => void): KeyboardShortcut => ({
    key: 'n',
    ctrlKey: true,
    action,
    description: 'New',
  }),

  open: (action: () => void): KeyboardShortcut => ({
    key: 'o',
    ctrlKey: true,
    action,
    description: 'Open',
  }),

  // Edit operations
  copy: (action: () => void): KeyboardShortcut => ({
    key: 'c',
    ctrlKey: true,
    action,
    description: 'Copy',
  }),

  paste: (action: () => void): KeyboardShortcut => ({
    key: 'v',
    ctrlKey: true,
    action,
    description: 'Paste',
  }),

  cut: (action: () => void): KeyboardShortcut => ({
    key: 'x',
    ctrlKey: true,
    action,
    description: 'Cut',
  }),

  undo: (action: () => void): KeyboardShortcut => ({
    key: 'z',
    ctrlKey: true,
    action,
    description: 'Undo',
  }),

  redo: (action: () => void): KeyboardShortcut => ({
    key: 'y',
    ctrlKey: true,
    action,
    description: 'Redo',
  }),

  // Search and navigation
  find: (action: () => void): KeyboardShortcut => ({
    key: 'f',
    ctrlKey: true,
    action,
    description: 'Find',
  }),

  search: (action: () => void): KeyboardShortcut => ({
    key: 'k',
    ctrlKey: true,
    action,
    description: 'Search',
  }),

  // Application shortcuts
  help: (action: () => void): KeyboardShortcut => ({
    key: '?',
    shiftKey: true,
    action,
    description: 'Show help',
  }),

  settings: (action: () => void): KeyboardShortcut => ({
    key: ',',
    ctrlKey: true,
    action,
    description: 'Open settings',
  }),

  themeToggle: (action: () => void): KeyboardShortcut => ({
    key: 't',
    ctrlKey: true,
    shiftKey: true,
    action,
    description: 'Toggle theme',
  }),

  // Tab navigation
  nextTab: (action: () => void): KeyboardShortcut => ({
    key: 'Tab',
    action,
    description: 'Next tab',
  }),

  previousTab: (action: () => void): KeyboardShortcut => ({
    key: 'Tab',
    shiftKey: true,
    action,
    description: 'Previous tab',
  }),

  // Arrow keys
  up: (action: () => void): KeyboardShortcut => ({
    key: 'ArrowUp',
    action,
    description: 'Move up',
  }),

  down: (action: () => void): KeyboardShortcut => ({
    key: 'ArrowDown',
    action,
    description: 'Move down',
  }),

  left: (action: () => void): KeyboardShortcut => ({
    key: 'ArrowLeft',
    action,
    description: 'Move left',
  }),

  right: (action: () => void): KeyboardShortcut => ({
    key: 'ArrowRight',
    action,
    description: 'Move right',
  }),

  // Function keys
  f1: (action: () => void): KeyboardShortcut => ({
    key: 'F1',
    action,
    description: 'Help',
  }),

  f2: (action: () => void): KeyboardShortcut => ({
    key: 'F2',
    action,
    description: 'Rename',
  }),

  f5: (action: () => void): KeyboardShortcut => ({
    key: 'F5',
    action,
    description: 'Refresh',
  }),

  f11: (action: () => void): KeyboardShortcut => ({
    key: 'F11',
    action,
    description: 'Toggle fullscreen',
  }),

  // Delete operations
  delete: (action: () => void): KeyboardShortcut => ({
    key: 'Delete',
    action,
    description: 'Delete',
  }),

  backspace: (action: () => void): KeyboardShortcut => ({
    key: 'Backspace',
    action,
    description: 'Backspace',
  }),
}

// ===== SHORTCUT MANAGER =====

export class ShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private enabled: boolean = true
  private target: EventTarget = document

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  add(shortcut: KeyboardShortcut): void {
    const key = createShortcutKey(shortcut)
    this.shortcuts.set(key, shortcut)
  }

  remove(shortcut: Omit<KeyboardShortcut, 'action' | 'description' | 'disabled'>): void {
    const key = createShortcutKey(shortcut)
    this.shortcuts.delete(key)
  }

  clear(): void {
    this.shortcuts.clear()
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  setTarget(target: EventTarget): void {
    this.target.removeEventListener('keydown', this.handleKeyDown)
    this.target = target
    this.target.addEventListener('keydown', this.handleKeyDown)
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return

    const matchingShortcut = Array.from(this.shortcuts.values()).find(shortcut => 
      !shortcut.disabled && matchesShortcut(event, shortcut)
    )

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault()
      }

      if (matchingShortcut.stopPropagation) {
        event.stopPropagation()
      }

      matchingShortcut.action()
    }
  }

  start(): void {
    this.target.addEventListener('keydown', this.handleKeyDown)
  }

  stop(): void {
    this.target.removeEventListener('keydown', this.handleKeyDown)
  }

  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  getShortcutDescription(key: string): string | undefined {
    const shortcut = this.shortcuts.get(key)
    return shortcut?.description
  }
}

// ===== EXPORT =====

export default {
  useKeyboardShortcuts,
  useGlobalShortcuts,
  useElementShortcuts,
  commonShortcuts,
  ShortcutManager,
}
