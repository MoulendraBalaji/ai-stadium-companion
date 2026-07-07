/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        'canvas-soft': 'var(--color-canvas-soft)',
        'canvas-elevated': 'var(--color-canvas-elevated)',
        primary: '#00d992',
        'primary-soft': '#2fd6a1',
        'primary-deep': '#10b981',
        'primary-glow': 'rgba(0, 217, 146, 0.15)',
        hairline: 'var(--color-hairline)',
        ink: 'var(--color-ink)',
        'ink-strong': 'var(--color-ink-strong)',
        body: 'var(--color-body)',
        mute: 'var(--color-mute)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        tech: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      borderWidth: { '1': '1px' },
      borderRadius: {
        'xs': '4px', 'sm': '6px', 'md': '8px', 'lg': '12px', 'xl': '16px'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'primary-glow': 'radial-gradient(ellipse at center, rgba(0, 217, 146, 0.12) 0%, transparent 70%)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    }
  },
  plugins: []
}
