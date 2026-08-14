import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#05050a',
          900: '#0a0a14',
          800: '#12121f',
          700: '#1b1b2e',
          600: '#26263f',
        },
        echo: {
          400: '#8b7cf6',
          500: '#7c5cff',
          600: '#6a3ff5',
        },
        glow: {
          400: '#5ee6d0',
          500: '#3fd8bd',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        pulseSlow: 'pulseSlow 3s ease-in-out infinite',
        ripple: 'ripple 2.2s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
