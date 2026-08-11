/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(224, 71%, 4%)',
        foreground: 'hsl(213, 31%, 91%)',
        primary: {
          DEFAULT: 'hsl(263.4, 70%, 50.4%)', // Sleek violet/purple
          foreground: 'hsl(210, 40%, 98%)',
        },
        card: {
          DEFAULT: 'hsl(222.2, 84%, 4.9%)',
          foreground: 'hsl(210, 40%, 98%)',
        },
        muted: {
          DEFAULT: 'hsl(215, 27.9%, 16.9%)',
          foreground: 'hsl(215.4, 16.3%, 56.9%)',
        },
        accent: {
          DEFAULT: 'hsl(217.2, 32.6%, 17.5%)',
          foreground: 'hsl(210, 40%, 98%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 72.2%, 50.6%)',
          foreground: 'hsl(210, 40%, 98%)',
        },
        border: 'hsl(217.2, 32.6%, 17.5%)',
        input: 'hsl(217.2, 32.6%, 17.5%)',
        ring: 'hsl(263.4, 70%, 50.4%)',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
