/**
 * PortfolioForge Design Tokens
 * Centralized theme configuration for consistent design
 */

export const theme = {
  colors: {
    primary: {
      50: '#f3f0ff',
      100: '#e9e5ff',
      200: '#d6ccff',
      300: '#cbc0ff', // Lavender highlight
      400: '#a78bfa',
      500: '#5a3cf4', // Royal purple
      600: '#4c34d4',
      700: '#3e2bb4',
      800: '#312394',
      900: '#261a74',
    },
    gray: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },
  },
  spacing: {
    0: '0',
    1: '0.125rem', // 2px
    2: '0.25rem',  // 4px
    3: '0.375rem', // 6px
    4: '0.5rem',   // 8px
    5: '0.625rem', // 10px
    6: '0.75rem',  // 12px
    8: '1rem',     // 16px
    10: '1.25rem', // 20px
    12: '1.5rem',  // 24px
    16: '2rem',    // 32px
    20: '2.5rem',  // 40px
    24: '3rem',    // 48px
    32: '4rem',    // 64px
    40: '5rem',    // 80px
    48: '6rem',    // 96px
    56: '7rem',    // 112px
    64: '8rem',    // 128px
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.375rem', // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 'Courier', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
  },
} as const

export type Theme = typeof theme

// Create compatibility layer for existing components
export const tokens = {
  color: {
    ...theme.colors,
    // Add missing color properties
    text: theme.colors.gray[900],
    textMuted: theme.colors.gray[600],
    bg: theme.colors.gray[50],
    border: theme.colors.gray[200],
    highlight: theme.colors.primary[300],
    // Ensure color objects are flattened to strings for compatibility
    primary: theme.colors.primary[500], // Convert object to string
    gray: theme.colors.gray[500], // Convert object to string
    success: theme.colors.success[500], // Convert object to string
    warning: theme.colors.warning[500], // Convert object to string
    error: theme.colors.error[500], // Convert object to string
  },
  spacing: (n: number) => theme.spacing[n as keyof typeof theme.spacing] || `${n * 0.25}rem`,
  radius: theme.borderRadius,
  font: {
    ...theme.typography.fontFamily,
    // Convert font family arrays to strings for compatibility
    family: theme.typography.fontFamily.sans.join(', '),
    sans: theme.typography.fontFamily.sans.join(', '),
    mono: theme.typography.fontFamily.mono.join(', '),
  },
} as const

export default theme
