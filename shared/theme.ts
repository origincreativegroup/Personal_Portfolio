/**
 * PortfolioForge brand tokens (flat, no gradients, no shadows).
 * Expose both JS tokens and CSS vars for Tailwind to consume.
 */
export const tokens = {
  color: {
    primary: "#5a3cf4", // royal purple
    highlight: "#cbc0ff", // lavender
    text: "#1a1a1a",
    textMuted: "#333333",
    bg: "#ffffff",
    border: "#e5e7eb"
  },
  radius: {
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem"
  },
  spacing: (n: number) => `${n * 0.25}rem`,
  font: {
    family: "'Poppins', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
  }
};

export const cssVars = `
:root {
  --pf-primary: ${tokens.color.primary};
  --pf-highlight: ${tokens.color.highlight};
  --pf-text: ${tokens.color.text};
  --pf-text-muted: ${tokens.color.textMuted};
  --pf-bg: ${tokens.color.bg};
  --pf-border: ${tokens.color.border};
  --pf-radius-md: ${tokens.radius.md};
  --pf-radius-lg: ${tokens.radius.lg};
  --pf-radius-xl: ${tokens.radius.xl};
  --pf-font: ${tokens.font.family};
}
`;
