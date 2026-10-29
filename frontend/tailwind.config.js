/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#040711',
          900: '#080d1a',
          850: '#0d1527',
          800: '#131e36',
          700: '#1d2c4d',
          600: '#2c3f6b',
        },
        hud: {
          cyan: '#00f2fe',
          teal: '#4facfe',
          emerald: '#00f5a0',
          amber: '#ffb300',
          rose: '#ff3366',
          purple: '#7928ca',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 242, 254, 0.3)',
        'glow-rose': '0 0 25px -3px rgba(255, 51, 102, 0.4)',
        'glow-amber': '0 0 20px -3px rgba(255, 179, 0, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(0, 245, 160, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
};
