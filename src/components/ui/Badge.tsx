import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'accent' | 'gold' | 'success' | 'warning' | 'danger' | 'neutral' | 'live';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className,
}) => {
  const variants = {
    accent: 'bg-titan-accent/10 text-titan-accent border-titan-accent/20',
    gold: 'bg-titan-gold/10 text-titan-goldLight border-titan-gold/20',
    success: 'bg-titan-success/10 text-titan-success border-titan-success/20',
    warning: 'bg-titan-warning/10 text-titan-warning border-titan-warning/20',
    danger: 'bg-titan-danger/10 text-titan-danger border-titan-danger/20',
    neutral: 'bg-titan-muted/40 text-titan-subtext border-titan-border',
    live: 'bg-titan-success/10 text-titan-success border-titan-success/30',
  };

  const dotColors = {
    accent: 'bg-titan-accent',
    gold: 'bg-titan-goldLight',
    success: 'bg-titan-success',
    warning: 'bg-titan-warning',
    danger: 'bg-titan-danger',
    neutral: 'bg-titan-subtext',
    live: 'bg-titan-success',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 border rounded-full font-medium',
      variants[variant],
      sizes[size],
      className
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse-slow', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

export default Badge;
