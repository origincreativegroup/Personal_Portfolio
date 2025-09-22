/**
 * Design Tokens - TypeScript definitions for PortfolioForge design system
 * Provides type-safe access to design tokens and utilities
 */

// ===== COLOR TOKENS =====

export const colors = {
  // Primary Colors
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  
  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Accent Colors
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },
  
  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  
  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
} as const

// ===== SEMANTIC COLORS =====

export const semanticColors = {
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    tertiary: 'var(--color-text-tertiary)',
    inverse: 'var(--color-text-inverse)',
    disabled: 'var(--color-text-disabled)',
    link: 'var(--color-text-link)',
    success: 'var(--color-text-success)',
    warning: 'var(--color-text-warning)',
    error: 'var(--color-text-error)',
  },
  
  background: {
    primary: 'var(--color-bg-primary)',
    secondary: 'var(--color-bg-secondary)',
    tertiary: 'var(--color-bg-tertiary)',
    inverse: 'var(--color-bg-inverse)',
    overlay: 'var(--color-bg-overlay)',
    disabled: 'var(--color-bg-disabled)',
    success: 'var(--color-bg-success)',
    warning: 'var(--color-bg-warning)',
    error: 'var(--color-bg-error)',
  },
  
  border: {
    primary: 'var(--color-border-primary)',
    secondary: 'var(--color-border-secondary)',
    focus: 'var(--color-border-focus)',
    error: 'var(--color-border-error)',
    success: 'var(--color-border-success)',
    warning: 'var(--color-border-warning)',
  },
} as const

// ===== SPACING TOKENS =====

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const

// ===== TYPOGRAPHY TOKENS =====

export const typography = {
  fontFamily: {
    sans: 'var(--font-family-sans)',
    mono: 'var(--font-family-mono)',
    serif: 'var(--font-family-serif)',
  },
  
  fontSize: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
    '5xl': 'var(--font-size-5xl)',
    '6xl': 'var(--font-size-6xl)',
    '7xl': 'var(--font-size-7xl)',
    '8xl': 'var(--font-size-8xl)',
    '9xl': 'var(--font-size-9xl)',
  },
  
  fontWeight: {
    thin: 'var(--font-weight-thin)',
    extralight: 'var(--font-weight-extralight)',
    light: 'var(--font-weight-light)',
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
    extrabold: 'var(--font-weight-extrabold)',
    black: 'var(--font-weight-black)',
  },
  
  lineHeight: {
    none: 'var(--line-height-none)',
    tight: 'var(--line-height-tight)',
    snug: 'var(--line-height-snug)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
    loose: 'var(--line-height-loose)',
  },
  
  letterSpacing: {
    tighter: 'var(--letter-spacing-tighter)',
    tight: 'var(--letter-spacing-tight)',
    normal: 'var(--letter-spacing-normal)',
    wide: 'var(--letter-spacing-wide)',
    wider: 'var(--letter-spacing-wider)',
    widest: 'var(--letter-spacing-widest)',
  },
} as const

// ===== BORDER TOKENS =====

export const borders = {
  radius: {
    none: 'var(--radius-none)',
    sm: 'var(--radius-sm)',
    base: 'var(--radius-base)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
    '3xl': 'var(--radius-3xl)',
    full: 'var(--radius-full)',
  },
  
  width: {
    0: 'var(--border-width-0)',
    1: 'var(--border-width-1)',
    2: 'var(--border-width-2)',
    4: 'var(--border-width-4)',
    8: 'var(--border-width-8)',
  },
} as const

// ===== SHADOW TOKENS =====

export const shadows = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  base: 'var(--shadow-base)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
  inner: 'var(--shadow-inner)',
  none: 'var(--shadow-none)',
} as const

// ===== Z-INDEX TOKENS =====

export const zIndex = {
  0: 'var(--z-index-0)',
  10: 'var(--z-index-10)',
  20: 'var(--z-index-20)',
  30: 'var(--z-index-30)',
  40: 'var(--z-index-40)',
  50: 'var(--z-index-50)',
  auto: 'var(--z-index-auto)',
  dropdown: 'var(--z-index-dropdown)',
  sticky: 'var(--z-index-sticky)',
  fixed: 'var(--z-index-fixed)',
  modalBackdrop: 'var(--z-index-modal-backdrop)',
  modal: 'var(--z-index-modal)',
  popover: 'var(--z-index-popover)',
  tooltip: 'var(--z-index-tooltip)',
  toast: 'var(--z-index-toast)',
} as const

// ===== TRANSITION TOKENS =====

export const transitions = {
  none: 'var(--transition-none)',
  all: 'var(--transition-all)',
  colors: 'var(--transition-colors)',
  opacity: 'var(--transition-opacity)',
  shadow: 'var(--transition-shadow)',
  transform: 'var(--transition-transform)',
} as const

// ===== BREAKPOINT TOKENS =====

export const breakpoints = {
  sm: 'var(--breakpoint-sm)',
  md: 'var(--breakpoint-md)',
  lg: 'var(--breakpoint-lg)',
  xl: 'var(--breakpoint-xl)',
  '2xl': 'var(--breakpoint-2xl)',
} as const

// ===== COMPONENT TOKENS =====

export const components = {
  button: {
    height: {
      sm: 'var(--button-height-sm)',
      md: 'var(--button-height-md)',
      lg: 'var(--button-height-lg)',
    },
    paddingX: {
      sm: 'var(--button-padding-x-sm)',
      md: 'var(--button-padding-x-md)',
      lg: 'var(--button-padding-x-lg)',
    },
    paddingY: {
      sm: 'var(--button-padding-y-sm)',
      md: 'var(--button-padding-y-md)',
      lg: 'var(--button-padding-y-lg)',
    },
  },
  
  input: {
    height: {
      sm: 'var(--input-height-sm)',
      md: 'var(--input-height-md)',
      lg: 'var(--input-height-lg)',
    },
    paddingX: {
      sm: 'var(--input-padding-x-sm)',
      md: 'var(--input-padding-x-md)',
      lg: 'var(--input-padding-x-lg)',
    },
    paddingY: {
      sm: 'var(--input-padding-y-sm)',
      md: 'var(--input-padding-y-md)',
      lg: 'var(--input-padding-y-lg)',
    },
  },
  
  card: {
    padding: {
      sm: 'var(--card-padding-sm)',
      md: 'var(--card-padding-md)',
      lg: 'var(--card-padding-lg)',
    },
    radius: 'var(--card-radius)',
    shadow: 'var(--card-shadow)',
    border: 'var(--card-border)',
  },
  
  modal: {
    backdrop: 'var(--modal-backdrop)',
    radius: 'var(--modal-radius)',
    shadow: 'var(--modal-shadow)',
    maxWidth: 'var(--modal-max-width)',
    maxHeight: 'var(--modal-max-height)',
  },
  
  toast: {
    radius: 'var(--toast-radius)',
    shadow: 'var(--toast-shadow)',
    maxWidth: 'var(--toast-max-width)',
    zIndex: 'var(--toast-z-index)',
  },
} as const

// ===== TYPE DEFINITIONS =====

export type ColorScale = keyof typeof colors.primary
export type SpacingScale = keyof typeof spacing
export type FontSizeScale = keyof typeof typography.fontSize
export type FontWeightScale = keyof typeof typography.fontWeight
export type LineHeightScale = keyof typeof typography.lineHeight
export type LetterSpacingScale = keyof typeof typography.letterSpacing
export type RadiusScale = keyof typeof borders.radius
export type BorderWidthScale = keyof typeof borders.width
export type ShadowScale = keyof typeof shadows
export type ZIndexScale = keyof typeof zIndex
export type TransitionScale = keyof typeof transitions
export type BreakpointScale = keyof typeof breakpoints

// ===== UTILITY FUNCTIONS =====

/**
 * Get a color value from the design system
 */
export function getColor(color: keyof typeof colors, scale: ColorScale): string {
  return colors[color][scale]
}

/**
 * Get a spacing value from the design system
 */
export function getSpacing(scale: SpacingScale): string {
  return spacing[scale]
}

/**
 * Get a typography value from the design system
 */
export function getTypography(
  property: keyof typeof typography,
  scale: FontSizeScale | FontWeightScale | LineHeightScale | LetterSpacingScale
): string {
  return typography[property][scale as any]
}

/**
 * Get a border radius value from the design system
 */
export function getRadius(scale: RadiusScale): string {
  return borders.radius[scale]
}

/**
 * Get a shadow value from the design system
 */
export function getShadow(scale: ShadowScale): string {
  return shadows[scale]
}

/**
 * Get a z-index value from the design system
 */
export function getZIndex(scale: ZIndexScale): string {
  return zIndex[scale]
}

/**
 * Get a transition value from the design system
 */
export function getTransition(scale: TransitionScale): string {
  return transitions[scale]
}

/**
 * Get a breakpoint value from the design system
 */
export function getBreakpoint(scale: BreakpointScale): string {
  return breakpoints[scale]
}

// ===== CSS VARIABLE HELPERS =====

/**
 * Get a CSS custom property value
 */
export function getCSSVar(property: string): string {
  return `var(--${property})`
}

/**
 * Create a CSS custom property declaration
 */
export function createCSSVar(property: string, value: string): string {
  return `--${property}: ${value};`
}

// ===== THEME UTILITIES =====

/**
 * Generate CSS custom properties for a theme
 */
export function generateThemeCSS(theme: Record<string, string>): string {
  return Object.entries(theme)
    .map(([key, value]) => createCSSVar(key, value))
    .join('\n  ')
}

/**
 * Create a responsive breakpoint media query
 */
export function createMediaQuery(breakpoint: BreakpointScale, minMax: 'min' | 'max' = 'min'): string {
  const value = getBreakpoint(breakpoint)
  return `@media (${minMax}-width: ${value})`
}

// ===== EXPORT ALL TOKENS =====

export const designTokens = {
  colors,
  semanticColors,
  spacing,
  typography,
  borders,
  shadows,
  zIndex,
  transitions,
  breakpoints,
  components,
} as const

export default designTokens
