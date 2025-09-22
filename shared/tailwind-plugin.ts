/**
 * Minimal Tailwind preset mapping our CSS variables to Tailwind theme tokens.
 * Consumers can import this preset in their tailwind.config.ts.
 */
export default {
  theme: {
    extend: {
      colors: {
        primary: "var(--pf-primary)",
        highlight: "var(--pf-highlight)",
        text: "var(--pf-text)",
        "text-muted": "var(--pf-text-muted)",
        border: "var(--pf-border)",
        bg: "var(--pf-bg)"
      },
      borderRadius: {
        md: "var(--pf-radius-md)",
        lg: "var(--pf-radius-lg)",
        xl: "var(--pf-radius-xl)"
      },
      fontFamily: {
        sans: "var(--pf-font)"
      }
    }
  }
};
