/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main color from Figma
        main: {
          10: '#E6F7F6',
          100: '#00a79d',
        },
        // Secondary color from Figma
        secondary: {
          10: '#FFF9F6',
          100: '#14CC26',
        },
        // Text colors from Figma
        text: {
          10: '#A9A9A9',
          50: '#676767',
          100: '#1C1C1C',
        },
        // Background colors from Figma
        bg: {
          primary: '#FBFBFB',
          white: '#FFFFFF',
        },
        // Stroke/Border color from Figma
        stroke: '#F1F1F1',
        // Primary colors for landing page (based on Figma)
        primary: {
          50: '#E6F7F6',
          100: '#CCEFED',
          200: '#99DFDB',
          300: '#66CFC9',
          400: '#33BFB7',
          500: '#00a79d',
          600: '#00867E',
          700: '#00645E',
          800: '#00433F',
          900: '#00211F',
        },
        // Accent colors for landing page
        accent: {
          50: '#FFF9F6',
          100: '#FFF3ED',
          200: '#FFE4D5',
          300: '#FFD0B5',
          400: '#FFB088',
          500: '#FF8A4C',
          600: '#F76B1C',
          700: '#D84F0A',
          800: '#B03C07',
          900: '#8B2E05',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '15px',
      },
      boxShadow: {
        'figma': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'figma-md': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
        'figma-lg': '0 10px 24px 0 rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

