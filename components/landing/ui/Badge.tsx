import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'neutral' | 'forest' | 'warning' | 'danger';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-[0.1em] uppercase transition-colors';
  
  const variants = {
    neutral: 'bg-surface-3 text-text-body border border-border-strong/50',
    forest: 'bg-forest-50 text-forest-600 border border-forest-100',
    warning: 'bg-warning-soft text-warning border border-warning/20',
    danger: 'bg-danger-soft text-danger border border-danger/20',
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
