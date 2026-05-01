import defaultTheme from 'tailwindcss/defaultTheme'
import type { Config } from 'tailwindcss'

const tailwindConfig: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{vue,js,ts,mjs}'],
  theme: {
    extend: {
      colors: {
        hr: {
          navy: '#0d1b3e',
          page: '#eff1f4',
          mint: '#4ade80',
          chart: {
            navy: '#0d1b3e',
            mint: '#4ade80',
            blue: '#3b82f6',
            amber: '#fbbf24'
          }
        },
        brand: {
          pink: '#ec4899',
          purple: '#6d28d9',
          blue: '#1e3a8a',
          green: '#22c55e'
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #ec4899 0%, #a855f7 45%, #1e3a8a 100%)',
        'brand-gradient-soft':
          'linear-gradient(120deg, rgb(253 242 248 / 0.35) 0%, rgb(245 243 255 / 0.35) 50%, rgb(238 242 255 / 0.35) 100%)',
        'brand-gradient-nav':
          'linear-gradient(90deg, rgb(253 242 248 / 0.3) 0%, rgb(255 255 255 / 0.95) 50%, rgb(238 242 255 / 0.3) 100%)'
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        card: '0 2px 4px rgb(15 23 42 / 0.12), 0 12px 32px rgb(15 23 42 / 0.16)'
      }
    }
  }
}

export default tailwindConfig
