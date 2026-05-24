/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        titan: {
          bg: '#06080C',
          surface: '#0C1017',
          card: '#131821',
          elevated: '#182030',
          border: '#1A2233',
          muted: '#1A2233',
          text: '#E8ECF4',
          subtext: '#6B7A90',
          tertiary: '#3D4A5C',
          accent: '#4ECDC4',
          accentDark: '#3AA89F',
          glow: 'rgba(78,205,196,0.08)',
          gold: '#B8985A',
          goldLight: '#A08548',
          danger: '#E0544E',
          success: '#3EBD7A',
          warning: '#D4943A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'titan': '0 0 0 1px rgba(78, 205, 196, 0.15), 0 4px 24px rgba(0,0,0,0.4)',
        'titan-glow': '0 0 40px rgba(78, 205, 196, 0.06)',
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)',
        'elevated': '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(78,205,196,0.08)',
      },
      backgroundImage: {
        'titan-gradient': 'linear-gradient(135deg, #06080C 0%, #0C1017 100%)',
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
