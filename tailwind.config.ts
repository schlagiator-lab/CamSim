import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0f',
        accent: '#00d4ff',
        surface: '#0f0f14',
        separator: '#191921',
        alert: '#ff6b00',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        'dm-mono': ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
