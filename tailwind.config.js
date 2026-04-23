/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['attribute', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-hover': 'var(--bg-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'border-color': 'var(--border-color)',
        'border-subtle': 'var(--border-subtle)',
        'accent-blue': 'var(--accent-blue)',
        'accent-blue-dim': 'var(--accent-blue-dim)',
        'accent-teal': 'var(--accent-teal)',
        'panel-bg': 'var(--panel-bg)',
        'panel-border': 'var(--panel-border)',
        'panel-header-bg': 'var(--panel-header-bg)',
        'alert-critical': 'var(--alert-critical)',
        'alert-high': 'var(--alert-high)',
        'alert-medium': 'var(--alert-medium)',
        'alert-low': 'var(--alert-low)',
        'sensor-seismic': 'var(--sensor-seismic)',
        'sensor-acoustic': 'var(--sensor-acoustic)',
        'sensor-optical': 'var(--sensor-optical)',
        'sensor-radar': 'var(--sensor-radar)',
        'sensor-magnetic': 'var(--sensor-magnetic)',
        'sensor-chemical': 'var(--sensor-chemical)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        blink: 'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
