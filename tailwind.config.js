/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/web/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/web/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#04163a',
          primary: '#04163a',
          accent: '#2b7a78',
          soft: '#6bcfcf',
          secondary: '#6bcfcf',
          white: '#ffffff'
        },
      },
      boxShadow: {
        'marketing-xl': '0 10px 30px -10px rgba(0,0,0,0.35)',
        'marketing-2xl': '0 25px 60px -12px rgba(0,0,0,0.4)',
        'card': '0 8px 30px rgba(0,0,0,.12)',
        'soft': '0 4px 16px rgba(0,0,0,.08)',
        'glow': '0 0 0 4px rgba(107,207,207,.22)'
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem'
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(.2,.8,.2,1)'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
};

