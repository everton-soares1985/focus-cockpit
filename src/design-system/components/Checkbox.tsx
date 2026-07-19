import { forwardRef } from 'react';
import { cn } from '../utils';
import { Check } from 'lucide-react';

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          className={cn(
            'peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-border bg-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lane-a disabled:cursor-not-allowed disabled:opacity-50 checked:bg-lane-a checked:border-lane-a cursor-pointer',
            className
          )}
          ref={ref}
          {...props}
        />
        <Check className="pointer-events-none absolute h-3 w-3 text-bg opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
