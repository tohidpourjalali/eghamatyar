/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: 'rgb(var(--primary) / <alpha-value>)', dark: 'rgb(var(--primary-hover) / <alpha-value>)', light: 'rgb(var(--primary-soft) / <alpha-value>)' },
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        canvas: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--text-primary) / <alpha-value>)',
        muted: 'rgb(var(--text-secondary) / <alpha-value>)',
        line: 'rgb(var(--border) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--error) / <alpha-value>)',
      },
      fontFamily: { sans: ['Vazirmatn Variable', 'Tahoma', 'sans-serif'] },
      boxShadow: {
        soft: '0 10px 30px rgb(85 49 25 / 0.08)',
        warm: '0 18px 50px rgb(89 47 17 / 0.14)',
        card: '0 3px 14px rgb(83 44 19 / 0.07)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'soft-zoom': { '0%': { transform: 'scale(1.02)' }, '100%': { transform: 'scale(1.08)' } },
        'float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-7px)' } },
      },
      animation: {
        'fade-up': 'fade-up .65s cubic-bezier(.2,.7,.2,1) both',
        'soft-zoom': 'soft-zoom 24s ease-in-out infinite alternate',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
