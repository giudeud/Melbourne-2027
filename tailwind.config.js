/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#FAFAF8',
        ink: { DEFAULT: '#111111', soft: '#3F3F46', muted: '#71717A', faint: '#A1A1AA' },
        line: '#E7E5E4',
        ok: { DEFAULT: '#3F7D58', soft: '#EAF3EC' },
        warn: { DEFAULT: '#B7791F', soft: '#FDF6E3' },
        crit: { DEFAULT: '#B42318', soft: '#FDECEA' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,16,16,0.04), 0 1px 1px rgba(16,16,16,0.02)',
        lift: '0 8px 24px rgba(16,16,16,0.10)',
      },
    },
  },
  plugins: [],
};
