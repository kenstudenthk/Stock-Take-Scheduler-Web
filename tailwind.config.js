/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",        // 掃描根目錄下的 App.tsx, main.tsx 等
    "./components/**/*.{js,ts,jsx,tsx}", // 掃描 components 資料夾
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d9488',
        secondary: '#fb7185',
      }
    },
  },
  plugins: [],
}
