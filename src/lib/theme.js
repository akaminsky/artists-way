// tend — shared style constants (ported from the design prototype's primitives)
//
// Colors are CSS variables (defined in tokens.css) rather than fixed hex, so the
// whole app — which styles inline from this `C` object — follows light/dark mode
// automatically. The hex after each var is the light-mode fallback. Dark values
// live in tokens.css under @media (prefers-color-scheme: dark).
export const C = {
  bg:    'var(--color-bg-primary, #F3EDE2)',
  card:  'var(--color-surface-card, #FBF6EB)',
  inset: 'var(--color-surface-secondary, #ECE4D5)',
  edge:  'var(--color-surface-edge, #E4DAC6)',
  ink:   'var(--color-text-primary, #1C1814)',
  mid:   'var(--color-text-secondary, #6B6359)',
  muted: 'var(--color-text-tertiary, #9A9183)',
  sep:   'var(--color-separator, rgba(28,24,20,0.10))',
  hair:  'var(--color-hairline-soft, rgba(28,24,20,0.06))',
};

export const SERIF = "'Fraunces','New York',Georgia,serif";
export const SANS  = "'Inter',system-ui,-apple-system,sans-serif";
export const MONO  = "'JetBrains Mono','SF Mono',monospace";

// Accent is plum (chosen in design Tweaks); read from the CSS var set in app.css.
export const ACCENT = 'var(--rs-accent, #8A5E7E)';
export const ACCENT_SOFT = 'var(--rs-accent-soft, rgba(138,94,126,0.12))';

// Foreground that sits ON the accent (and other always-dark fills like the leave
// button): stays light in BOTH modes, since the accent itself doesn't invert.
// Use this instead of C.card for text/icons on a colored background.
export const ON_ACCENT = 'var(--c-on-accent, #FBF6EB)';
