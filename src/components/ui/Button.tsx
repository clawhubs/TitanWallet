import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants = {
    primary: 'bg-titan-accent text-titan-bg hover:bg-titan-accentDark focus:ring-2 focus:ring-titan-accent/40',
    secondary: 'bg-titan-surface text-titan-text border border-titan-border hover:border-titan-accent/40 hover:bg-titan-muted/30 focus:ring-2 focus:ring-titan-accent/20',
    ghost: 'text-titan-subtext hover:text-titan-text hover:bg-titan-muted/30',
    danger: 'bg-titan-danger/10 text-titan-danger border border-titan-danger/30 hover:bg-titan-danger/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;
