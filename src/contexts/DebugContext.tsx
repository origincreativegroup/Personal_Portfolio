/**
 * Debug Context - Global Debug State Management
 *
 * Manages debug panel visibility, keyboard shortcuts, and debug mode
 * configuration for development and AI-assisted troubleshooting.
 */

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import logger from '../utils/logger';

interface DebugState {
  isDebugPanelOpen: boolean;
  isDebugMode: boolean;
  enableKeyboardShortcuts: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'critical';
}

interface DebugContextType {
  state: DebugState;
  openDebugPanel: () => void;
  closeDebugPanel: () => void;
  toggleDebugPanel: () => void;
  toggleDebugMode: () => void;
  setLogLevel: (level: DebugState['logLevel']) => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

interface DebugProviderProps {
  children: ReactNode;
}

export function DebugProvider({ children }: DebugProviderProps) {
  const [state, setState] = useState<DebugState>({
    isDebugPanelOpen: false,
    isDebugMode: process.env.NODE_ENV === 'development',
    enableKeyboardShortcuts: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  });

  const openDebugPanel = useCallback(() => {
    setState(prev => ({ ...prev, isDebugPanelOpen: true }));
    logger.info('Debug panel opened', 'ui', { component: 'DebugContext' });
  }, []);

  const closeDebugPanel = useCallback(() => {
    setState(prev => ({ ...prev, isDebugPanelOpen: false }));
    logger.info('Debug panel closed', 'ui', { component: 'DebugContext' });
  }, []);

  const toggleDebugPanel = useCallback(() => {
    if (state.isDebugPanelOpen) {
      closeDebugPanel();
    } else {
      openDebugPanel();
    }
  }, [state.isDebugPanelOpen, openDebugPanel, closeDebugPanel]);

  const toggleDebugMode = useCallback(() => {
    setState(prev => {
      const newDebugMode = !prev.isDebugMode;
      logger.info(`Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`, 'system', {
        debugMode: newDebugMode,
        component: 'DebugContext'
      });
      return { ...prev, isDebugMode: newDebugMode };
    });
  }, []);

  const setLogLevel = useCallback((level: DebugState['logLevel']) => {
    setState(prev => ({ ...prev, logLevel: level }));
    logger.info(`Log level changed to ${level}`, 'system', {
      logLevel: level,
      component: 'DebugContext'
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!state.enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to toggle debug panel
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        toggleDebugPanel();
      }

      // Ctrl/Cmd + Shift + L to toggle debug mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        toggleDebugMode();
      }

      // Escape to close debug panel
      if (event.key === 'Escape' && state.isDebugPanelOpen) {
        event.preventDefault();
        closeDebugPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.enableKeyboardShortcuts, state.isDebugPanelOpen, toggleDebugPanel, toggleDebugMode, closeDebugPanel]);

  // Debug mode indicator
  useEffect(() => {
    if (state.isDebugMode && typeof window !== 'undefined') {
      // Add visual indicator for debug mode
      const indicator = document.createElement('div');
      indicator.id = 'debug-mode-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(147, 51, 234, 0.9);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        z-index: 9999;
        pointer-events: none;
      `;
      indicator.textContent = 'DEBUG MODE';
      document.body.appendChild(indicator);

      return () => {
        const existingIndicator = document.getElementById('debug-mode-indicator');
        if (existingIndicator) {
          document.body.removeChild(existingIndicator);
        }
      };
    }
  }, [state.isDebugMode]);

  // Log context initialization
  useEffect(() => {
    logger.info('Debug context initialized', 'system', {
      debugMode: state.isDebugMode,
      logLevel: state.logLevel,
      keyboardShortcuts: state.enableKeyboardShortcuts
    });
  }, []);

  const value: DebugContextType = {
    state,
    openDebugPanel,
    closeDebugPanel,
    toggleDebugPanel,
    toggleDebugMode,
    setLogLevel
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}

/**
 * Hook for development-only debugging utilities
 */
export function useDevDebug() {
  const { state, toggleDebugPanel, toggleDebugMode } = useDebug();

  const logCurrentState = useCallback((componentName: string, componentState: any) => {
    if (state.isDebugMode) {
      logger.debug(`Component state snapshot: ${componentName}`, 'ui', {
        componentState,
        component: componentName
      });
    }
  }, [state.isDebugMode]);

  const measurePerformance = useCallback((label: string, fn: () => void) => {
    if (state.isDebugMode) {
      const start = performance.now();
      fn();
      const end = performance.now();
      logger.debug(`Performance measurement: ${label}`, 'performance', {
        duration: end - start,
        label
      });
    } else {
      fn();
    }
  }, [state.isDebugMode]);

  const trackUserInteraction = useCallback((interaction: string, element?: string, data?: any) => {
    if (state.isDebugMode) {
      logger.debug(`User interaction: ${interaction}`, 'user-action', {
        interaction,
        element,
        data,
        timestamp: Date.now()
      });
    }
  }, [state.isDebugMode]);

  return {
    isDebugMode: state.isDebugMode,
    toggleDebugPanel,
    toggleDebugMode,
    logCurrentState,
    measurePerformance,
    trackUserInteraction
  };
}

export default DebugContext;