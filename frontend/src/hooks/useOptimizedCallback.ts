import { useCallback, useRef } from 'react'

/**
 * Optimized callback hook that prevents unnecessary re-renders
 * Uses deep comparison for dependency array
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  const callbackRef = useRef<T>(callback)
  const depsRef = useRef(deps)

  // Update refs if dependencies changed
  if (!areEqual(depsRef.current, deps)) {
    callbackRef.current = callback
    depsRef.current = deps
  }

  return useCallback(callbackRef.current, deps) as T
}

/**
 * Optimized memo hook for complex objects
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: any[]
): T {
  const valueRef = useRef<T>()
  const depsRef = useRef(deps)

  if (!valueRef.current || !areEqual(depsRef.current, deps)) {
    valueRef.current = factory()
    depsRef.current = deps
  }

  return valueRef.current
}

/**
 * Simple deep equality check for optimization
 */
function areEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      // For objects, do a simple shallow comparison
      if (typeof a[i] === 'object' && typeof b[i] === 'object' && a[i] && b[i]) {
        const keysA = Object.keys(a[i])
        const keysB = Object.keys(b[i])

        if (keysA.length !== keysB.length) return false

        for (const key of keysA) {
          if (a[i][key] !== b[i][key]) return false
        }

        continue
      }

      return false
    }
  }

  return true
}