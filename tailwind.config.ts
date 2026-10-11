import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-plus-jakarta)',
          'Plus Jakarta Sans',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        mono: [
          'var(--font-plus-jakarta)',
          'Plus Jakarta Sans',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite ease-in-out',
      },
      boxShadow: {
        'btn-primary':
          'inset 0 1px 0 0 rgba(255, 255, 255, 0.28), 0 2px 4px -1px rgba(15, 23, 42, 0.25), 0 4px 14px -2px rgba(15, 23, 42, 0.15)',
        'btn-secondary':
          'inset 0 1px 0 0 #ffffff, 0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        'card-double':
          '0 0 0 1px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.02), 0 8px 24px -4px rgba(15, 23, 42, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 1)',
        'card-hover':
          '0 0 0 1px rgba(16, 185, 129, 0.35), 0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 16px 36px -6px rgba(16, 185, 129, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 1)',
        well: 'inset 0 1px 2px 0 rgba(15, 23, 42, 0.06), 0 1px 0 0 rgba(255, 255, 255, 0.8)',
      },
      colors: {
        finance: {
          surplus: '#059669',
          deficit: '#e11d48',
          escrow: '#d97706',
          neutral: '#64748b',
          canvas: '#e6ecf2',
          card: '#f8fafc',
          border: '#cbd5e1',
        },
      },
    },
  },
  plugins: [],
};

export default config;
