/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind v4 utilise @import "tailwindcss" dans globals.css
  // Cette config est pour la compatibilité avec Next.js
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

