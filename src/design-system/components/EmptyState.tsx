import { ReactNode } from 'react';
import { cn } from '../utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      {icon && <div className="mb-4 text-text-muted opacity-50">{icon}</div>}
      <h3 className="mb-2 text-lg font-medium text-text">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-text-muted">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
