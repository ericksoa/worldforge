/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        // Medieval/mystical color palette
        parchment: {
          50: '#fdfcf9',
          100: '#f9f5eb',
          200: '#f2e9d5',
          300: '#e8d9b8',
          400: '#d9c494',
          500: '#c9ad70',
          600: '#b89650',
          700: '#9a7a3d',
          800: '#7d6335',
          900: '#66512e',
        },
        burgundy: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d2d9',
          300: '#f4aebb',
          400: '#ec7c96',
          500: '#df4d72',
          600: '#c42d5a',
          700: '#a52049',
          800: '#8a1d42',
          900: '#751c3c',
          950: '#420a1e',
        },
        gold: {
          50: '#fffef0',
          100: '#fefccd',
          200: '#fef79a',
          300: '#fdee5a',
          400: '#fae027',
          500: '#e9c50a',
          600: '#c99a05',
          700: '#a07008',
          800: '#84580f',
          900: '#704812',
          950: '#422606',
        },
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#1a1a1a',
        },
      },
      fontFamily: {
        medieval: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'parchment-texture': "url('/assets/parchment-texture.png')",
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(139, 90, 43, 0.2)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 60px rgba(233, 197, 10, 0.3)',
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(233, 197, 10, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(233, 197, 10, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
