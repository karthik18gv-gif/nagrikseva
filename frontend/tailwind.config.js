/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gov: { blue:'#1a3a6b', dark:'#0f2347', light:'#e8f0fe' },
        accent: { orange:'#f4a200', dark:'#d97706' }
      },
      fontFamily: { sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { card:'0 2px 15px rgba(0,0,0,0.08)', hover:'0 8px 30px rgba(0,0,0,0.12)' }
    }
  },
  plugins: []
}
