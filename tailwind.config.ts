import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Tokens em formato `rgb(var(--xxx) / <alpha-value>)` pra permitir
        // alpha modifier (`bg-danger/25`, `text-ice/40`, etc).
        // ── Surfaces ───────────────────────────────────────
        'bg-deep': 'rgb(var(--bg-deep) / <alpha-value>)',
        'bg-paper': 'rgb(var(--bg-paper) / <alpha-value>)',
        'bg-card': 'rgb(var(--bg-card) / <alpha-value>)',
        'bg-card-2': 'rgb(var(--bg-card-2) / <alpha-value>)',
        // ── Ink (text) ────────────────────────────────────
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        // ── Ice accents ───────────────────────────────────
        ice: 'rgb(var(--ice) / <alpha-value>)',
        'ice-bright': 'rgb(var(--ice-bright) / <alpha-value>)',
        'ice-deep': 'rgb(var(--ice-deep) / <alpha-value>)',
        // ── Selo (chromatic touch) ────────────────────────
        seal: 'rgb(var(--seal) / <alpha-value>)',
        // ── Semantic ──────────────────────────────────────
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        // ── Borders (overlays ja com alpha hardcoded) ─────
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-eb-garamond)', 'Georgia', 'serif'],
        jp: ['var(--font-shippori)', 'serif'],
        display: ['var(--font-cinzel)', 'Georgia', 'serif'],
      },
      boxShadow: {
        hero: '0 30px 80px -20px rgba(0, 0, 0, 0.8)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.025' },
          '50%': { opacity: '0.05' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateX(24px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        shimmer: 'shimmer 8s ease-in-out infinite',
        'toast-in': 'toastIn 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
