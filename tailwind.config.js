/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#3b608c",
        "primary-container": "#7da2d1",
        "on-primary": "#ffffff",
        "on-primary-container": "#083861",
        "secondary": "#366758",
        "secondary-container": "#b6ebd8",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#3a6c5d",
        "tertiary": "#745945",
        "tertiary-container": "#ba9983",
        "on-tertiary-container": "#483220",
        "surface": "#f9f9fa",
        "surface-dim": "#d9dadb",
        "surface-bright": "#f9f9fa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f4",
        "surface-container": "#eeeeef",
        "surface-container-high": "#e8e8e9",
        "surface-container-highest": "#e2e2e3",
        "on-surface": "#1a1c1d",
        "on-surface-variant": "#42474e",
        "background": "#f9f9fa",
        "on-background": "#1a1c1d",
        "outline": "#73777f",
        "outline-variant": "#c3c6d0",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      }
    },
  },
  plugins: [],
}
