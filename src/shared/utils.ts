/**
 * Utility functions for PortfolioForge UI components
 */

/**
 * Conditionally join class names
 */
export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Merge CSS style objects
 */
export function mergeStyles(...styles: (React.CSSProperties | undefined)[]): React.CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}

/**
 * Convert design token spacing to CSS value
 */
export function spacing(multiplier: number): string {
  return `${multiplier * 0.25}rem`;
}

/**
 * Generate unique ID for components
 */
export function generateId(prefix = 'pf'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if a color is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate design token compliance
 */
export function validateDesignToken(value: string, type: 'color' | 'spacing' | 'radius'): boolean {
  switch (type) {
    case 'color':
      // Only allow approved colors
      const approvedColors = ['#5a3cf4', '#cbc0ff', '#1a1a1a', '#333333', '#ffffff', '#e5e7eb'];
      return approvedColors.includes(value.toLowerCase());
    case 'spacing':
      // Only allow spacing function results
      return /^\d+(\.\d+)?rem$/.test(value);
    case 'radius':
      // Only allow approved radius values
      const approvedRadius = ['0.75rem', '1rem', '1.25rem'];
      return approvedRadius.includes(value);
    default:
      return false;
  }
}