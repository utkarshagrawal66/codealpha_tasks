export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#192c4d",
        "soft-teal": "#9BC9C3",
        "warm-coral": "#F48B77",
        "background-light": "#f7f7f7",
        "background-dark": "#19191f",
        "surface-container-low": "#f4f1f7",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"],
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Manrope", "sans-serif"],
      },
      boxShadow: {
        "soft": "0 10px 30px -10px rgba(25, 44, 77, 0.1)",
        "float": "0 20px 40px -10px rgba(25, 44, 77, 0.15)"
      }
    },
  },
  plugins: [],
}
