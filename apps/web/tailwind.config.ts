import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          500: '#e91e8c',
          600: '#db166e',
          700: '#be185d',
        },
        secondary: {
          500: '#9c27b0',
          600: '#7b1fa2',
        },
      },
    },
  },
  plugins: [],
}

export default config
