/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        accent: '#06b6d4',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        surface: {
          DEFAULT: 'rgba(255,255,255,0.78)',
          strong: '#ffffff',
          soft: '#f8fafc',
        },
        text: {
          DEFAULT: '#0f172a',
          secondary: '#475569',
          tertiary: '#64748b',
        },
        border: {
          DEFAULT: 'rgba(15, 23, 42, 0.08)',
          strong: 'rgba(15, 23, 42, 0.14)',
        },
      },
      borderRadius: {
        xl: '28px',
        lg: '22px',
        md: '16px',
        sm: '12px',
      },
      boxShadow: {
        lg: '0 18px 48px rgba(15, 23, 42, 0.08)',
        md: '0 10px 24px rgba(15, 23, 42, 0.06)',
        sm: '0 4px 10px rgba(15, 23, 42, 0.05)',
      },
      spacing: {
        grid: '20px',
      },
      maxWidth: {
        page: '1440px',
      },
    },
  },
  plugins: [],
}
