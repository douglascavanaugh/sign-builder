import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#fad7a5',
          300: '#f6ba6d',
          400: '#f19333',
          500: '#ee7711',
          600: '#df5d07',
          700: '#b94408',
          800: '#93360e',
          900: '#772e0f',
          950: '#401505',
        },
      },
    },
  },
  plugins: [],
}

export default config
