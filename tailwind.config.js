/** @type {import('tailwindcss').Config} */

/**
 * Helper: wraps a CSS variable so Tailwind's opacity modifier (/50, /20 etc.) works.
 * Usage in config: withOpacity('--titan-accent') → supports bg-titan-accent/20
 */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}-rgb), ${opacityValue})`;
    }
    return `var(${variableName})`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        titan: {
          bg: withOpacity('--titan-bg'),
          surface: withOpacity('--titan-surface'),
          card: withOpacity('--titan-card'),
          elevated: withOpacity('--titan-elevated'),
          border: withOpacity('--titan-border'),
          muted: withOpacity('--titan-muted'),
          text: withOpacity('--titan-text'),
          subtext: withOpacity('--titan-subtext'),
          tertiary: withOpacity('--titan-tertiary'),
          accent: withOpacity('--titan-accent'),
          accentDark: withOpacity('--titan-accentDark'),
          glow: 'var(--titan-glow)',
          gold: withOpacity('--titan-gold'),
          goldLight: withOpacity('--titan-goldLight'),
          danger: withOpacity('--titan-danger'),
          success: withOpacity('--titan-success'),
          warning: withOpacity('--titan-warning'),
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'titan': '0 0 0 1px rgba(var(--titan-accent-rgb), 0.15), 0 4px 24px var(--titan-shadow-heavy)',
        'titan-glow': '0 0 40px rgba(var(--titan-accent-rgb), 0.06)',
        'card': '0 1px 3px var(--titan-shadow-base), 0 0 0 1px var(--titan-shadow-outline)',
        'elevated': '0 4px 24px var(--titan-shadow-heavy), 0 0 0 1px rgba(var(--titan-accent-rgb), 0.08)',
      },
      backgroundImage: {
        'titan-gradient': 'linear-gradient(135deg, var(--titan-bg) 0%, var(--titan-surface) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #4ECDC4 0%, #3AA89F 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'stagger-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(78, 205, 196, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(78, 205, 196, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
