/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a2b4a',
          50: '#f1f4f9',
          100: '#dce3ef',
          700: '#243a63',
          800: '#1a2b4a',
          900: '#121f37',
        },
        accent: {
          DEFAULT: '#e8833a',
          light: '#f4a868',
          dark: '#cc6e29',
        },
        rag: {
          on: '#16a34a',
          slip: '#d97706',
          block: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
