import { cn } from '../utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'lane-a' | 'lane-b' | 'success' | 'danger' | 'neutral' | 'outline';
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        {
          'bg-lane-a/20 text-lane-a border border-lane-a/30': variant === 'lane-a',
          'bg-lane-b/20 text-lane-b border border-lane-b/30': variant === 'lane-b',
          'bg-success/20 text-success border border-success/30': variant === 'success',
          'bg-danger/20 text-danger border border-danger/30': variant === 'danger',
          'bg-surface-raised text-text-muted border border-border': variant === 'neutral',
          'bg-transparent text-text-muted border border-border': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
