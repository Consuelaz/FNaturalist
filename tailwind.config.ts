import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f3f4ed',
          100: '#e4e6d5',
          200: '#c9cdac',
          300: '#a8ad7d',
          400: '#8a9363',
          500: '#7D9B76',
          600: '#5E7A5C',
          700: '#4d6350',
          800: '#3f5142',
          900: '#344437',
        },
        sandstone: {
          50: '#faf7f4',
          100: '#f0ebe4',
          200: '#e0d5c8',
          300: '#cdb8a4',
          400: '#A67C52',
          500: '#8a6643',
          600: '#6e5238',
          700: '#56412e',
          800: '#463428',
          900: '#3b2c24',
        },
        cream: '#FDFBF7',
        amber: '#D4A373',
      },
      fontFamily: {
        'chinese-title': ['LXGW WenKai', 'Songti SC', 'serif'],
        'chinese-body': ['LXGW WenKai', 'PingFang SC', 'sans-serif'],
        'english-display': ['Playfair Display', 'serif'],
        'english-body': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}

export default config
