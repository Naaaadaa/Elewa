/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#EDF9F1',
          100: '#D3F0DE',
          200: '#A6E1BE',
          300: '#6FCC97',
          400: '#37B270',
          500: '#0E9147',
          600: '#0B7A3C',
          700: '#096130',
          800: '#074B26',
          900: '#05361B',
        },
        amber: {
          50: '#FEF7EA',
          100: '#FDEBC9',
          200: '#FAD794',
          300: '#F2A93C',
          400: '#E2951F',
          500: '#C57C11',
          600: '#9C610D',
        },
        ink: {
          DEFAULT: '#17211C',
          soft: '#3E4A43',
          mute: '#6B7871',
          faint: '#9AA5A0',
        },
        paper: {
          DEFAULT: '#FBF8F2',
          raised: '#FFFFFF',
          sunk: '#F4F0E7',
          line: '#E8E2D6',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,33,28,0.05), 0 1px 3px rgba(23,33,28,0.04)',
        lift: '0 4px 16px rgba(23,33,28,0.08)',
        phone: '0 24px 70px -12px rgba(23,33,28,0.35), 0 0 0 1px rgba(23,33,28,0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.22s ease-out both',
      },
    },
  },
  plugins: [],
};
