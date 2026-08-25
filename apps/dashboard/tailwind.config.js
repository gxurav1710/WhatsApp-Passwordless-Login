/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#25d366', // WhatsApp green
          700: '#059669',
          800: '#065f46',
          900: '#064e3b',
        },
        dark: {
          bg: '#090d16',
          card: '#111827',
          border: '#1f293d',
          hover: '#1e293b',
        },
      },
    },
  },
  plugins: [],
};
