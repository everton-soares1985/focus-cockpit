import { forwardRef } from 'react';
import { cn } from '../utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lane-a disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          {
            'bg-surface-raised text-text hover:bg-surface-soft border border-border-strong': variant === 'primary',
            'bg-transparent hover:bg-surface-raised text-text': variant === 'secondary',
            'bg-danger/20 text-danger hover:bg-danger/30 border border-danger/30': variant === 'danger',
            'bg-transparent hover:bg-surface-soft text-text-muted hover:text-text': variant === 'ghost',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2 text-sm': size === 'md',
            'h-12 px-8 text-base': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
