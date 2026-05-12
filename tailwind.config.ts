import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        'bg-deep': 'var(--bg-deep)',
        'bg-paper': 'var(--bg-paper)',
        'bg-card': 'var(--bg-card)',
        'bg-card-2': 'var(--bg-card-2)',
        // Ink (text)
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        'ink-faint': 'var(--ink-faint)',
        // Ice accents
        ice: 'var(--ice)',
        'ice-bright': 'var(--ice-bright)',
        'ice-deep': 'var(--ice-deep)',
        // Single chromatic touch
        seal: 'var(--seal)',
        // Borders
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
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        shimmer: 'shimmer 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
