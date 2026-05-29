/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Cool ink/slate used for text, borders and subtle surfaces.
        navy: {
          DEFAULT: '#1b2440',
          50: '#f5f7fc',
          100: '#e7ebf5',
          700: '#34406a',
          800: '#1b2440',
          900: '#11182e',
        },
        // Revolut-style cool accent (violet-blue), with teal/blue partners for gradients.
        accent: {
          DEFAULT: '#6d5efc',
          light: '#8b7bff',
          dark: '#5a47e0',
          teal: '#22d3ee',
          blue: '#4f8bff',
        },
        rag: {
          on: '#16a34a',
          slip: '#d97706',
          block: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(27,36,64,.04), 0 10px 30px -16px rgba(27,36,64,.22)',
        glass: '0 8px 32px -8px rgba(27,36,64,.18)',
        lift: '0 14px 44px -14px rgba(109,94,252,.40)',
      },
      backgroundImage: {
        brand: 'linear-gradient(135deg, #7c5cff 0%, #4f8bff 55%, #22d3ee 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(124,92,255,.12), rgba(34,211,238,.12))',
      },
    },
  },
  plugins: [],
};
