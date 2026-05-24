import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', className }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 modal-backdrop animate-fade-in sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn(
        'relative my-auto w-full max-h-[calc(100vh-2rem)] overflow-hidden titan-card shadow-titan animate-slide-up',
        sizes[size],
        className
      )}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-titan-border">
            <h2 className="text-base font-semibold text-titan-text">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-titan-subtext hover:text-titan-text hover:bg-titan-muted/40 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className={cn('max-h-[calc(100vh-2rem)] overflow-y-auto', !title && 'relative')}>
          {!title && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-titan-subtext hover:text-titan-text hover:bg-titan-muted/40 transition-all"
            >
              <X size={16} />
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
