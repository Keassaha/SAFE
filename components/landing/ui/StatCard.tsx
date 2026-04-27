import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  chartSlot?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, chartSlot, className }: StatCardProps) {
  return (
    <div className={cn("flex flex-col border border-border rounded-[7px] bg-surface p-4", className)}>
      <div className="flex justify-between items-end mb-2">
        <span className="text-[13px] text-text-muted uppercase tracking-[0.1em]">{label}</span>
      </div>
      <div className="font-serif italic text-4xl text-text-primary tracking-[-0.02em] font-variant-numeric:tabular-nums font-mono tabular-nums">
        {value}
      </div>
      {chartSlot && (
        <div className="mt-4">
          {chartSlot}
        </div>
      )}
    </div>
  );
}
