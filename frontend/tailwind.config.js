/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    colors: {
      background: "#0B0C10",
      elementBackground: "#2C2C2C", 
      primary: "#00C896",
      primaryHover: "#00E6A0",
      secondary: "#FFFFFF",
      textSecondary: "#A8A8A8", 
      accent: "#00FFC5",
      accentHover: "#B675F8",
    },
    fontFamily: {
      sans: ["Inter", "sans-serif"],
    },
  },
  plugins: [],
}