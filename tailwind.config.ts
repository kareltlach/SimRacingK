import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/renderer/**/*.{ts,tsx,html}',
    './src/overlay/**/*.{ts,tsx,html}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'apex-red': {
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
          DEFAULT: '#ef4444'
        },
        'apex-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
          DEFAULT: '#3b82f6'
        },
        'apex-dark': {
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
          DEFAULT: '#0f172a'
        },
        'apex-green': {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          DEFAULT: '#22c55e'
        },
        'apex-yellow': {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          DEFAULT: '#eab308'
        },
        'apex-purple': {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          DEFAULT: '#a855f7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      }
    }
  },
  plugins: []
}

export default config
