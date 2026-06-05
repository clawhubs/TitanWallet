import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '../../store/useThemeStore';

const MODES: { id: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { id: 'light', icon: <Sun size={13} />, label: 'Light' },
  { id: 'dark', icon: <Moon size={13} />, label: 'Dark' },
  { id: 'system', icon: <Monitor size={13} />, label: 'System' },
];

const ThemeSwitcher: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div
      className="flex items-center rounded-xl border border-titan-border bg-titan-surface p-0.5"
      role="radiogroup"
      aria-label="Theme"
    >
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="radio"
          aria-checked={theme === mode.id}
          aria-label={mode.label}
          title={mode.label}
          onClick={() => setTheme(mode.id)}
          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150 ${
            theme === mode.id
              ? 'bg-titan-accent text-[#06080C] shadow-sm'
              : 'text-titan-subtext hover:text-titan-text hover:bg-titan-elevated'
          }`}
        >
          {mode.icon}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
