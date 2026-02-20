module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'travel-green': '#1a6b54',
        'cream-bg': '#f5f0eb'
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'serif'],
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  darkMode: 'class',
  plugins: []
};
