/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#38dacac3",
          dark: "#35d1c1",
        },
      },
    },
  },
  plugins: [],
}
