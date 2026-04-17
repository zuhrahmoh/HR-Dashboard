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
        }
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.06), 0 8px 24px rgb(15 23 42 / 0.06)'
      }
    }
  }
}

export default tailwindConfig
