import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className, hover = false, glow = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'titan-card',
        hover && 'hover:border-titan-border/80 hover:bg-titan-card/80 transition-all duration-200 cursor-pointer',
        glow && 'border-titan-accent/20 shadow-titan',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h3 className={cn('text-sm font-semibold text-titan-text', className)}>{children}</h3>
);

export default Card;
