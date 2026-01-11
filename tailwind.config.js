/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 這行最重要，它會掃描你的 React 組件
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
