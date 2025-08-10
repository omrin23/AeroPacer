/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme tokens
        background: '#0A0B10',
        surface: '#0F1117',
        elevated: '#121521',
        foreground: '#E6EAF2',
        muted: '#7A8193',
        subtle: '#ADB5C2',
        border: 'rgba(148,163,184,0.12)',
        ring: 'rgba(139,92,246,0.60)',
        primary: {
          DEFAULT: '#7C3AED',
          soft: '#8B5CF6',
          teal: '#22D3EE',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#22D3EE',
          purple: '#8B5CF6',
          foreground: '#FFFFFF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        card: {
          DEFAULT: '#0F1117',
          foreground: '#E6EAF2',
        },
        input: 'rgba(148,163,184,0.18)',
        popover: {
          DEFAULT: '#121521',
          foreground: '#E6EAF2',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.35)',
        glow: '0 0 40px rgba(139,92,246,0.25)',
        'glow-lg': '0 0 60px rgba(34,211,238,0.25)'
      },
    },
  },
  plugins: [],
}