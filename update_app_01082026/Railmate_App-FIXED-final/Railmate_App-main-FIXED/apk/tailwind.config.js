/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
    './stores/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // All values resolve to CSS variables set at runtime by
        // <ThemeProvider> (app/_layout.tsx) based on the resolved
        // dark/light theme — see constants/colors.ts for source values.
        'bg-base': 'var(--color-bg-base)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-card': 'var(--color-bg-card)',
        'bg-overlay': 'var(--color-bg-overlay)',
        'primary': 'var(--color-primary)',
        'primary-dim': 'var(--color-primary-dim)',
        'primary-subtle': 'var(--color-primary-subtle)',
        'accent': 'var(--color-accent)',
        'accent-dim': 'var(--color-accent-dim)',
        'accent-subtle': 'var(--color-accent-subtle)',
        'danger': 'var(--color-danger)',
        'danger-subtle': 'var(--color-danger-subtle)',
        'success': 'var(--color-success)',
        'success-subtle': 'var(--color-success-subtle)',
        'info': 'var(--color-info)',
        'info-subtle': 'var(--color-info-subtle)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-inverse': 'var(--color-text-inverse)',
        'border': 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        'border-focus': 'var(--color-border-focus)',
      },
    },
  },
  plugins: [],
};
