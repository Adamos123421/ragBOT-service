/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chatgpt-gray': '#000000',
        'chatgpt-dark': '#000000',
        'chatgpt-light': '#1a1a1a',
        'chatgpt-border': '#2a2a2a',
        'chatgpt-text': '#ffffff',
        'chatgpt-green': '#10a37f',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
