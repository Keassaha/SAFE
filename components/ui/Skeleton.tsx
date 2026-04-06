import type { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-safe-sm bg-neutral-200 animate-pulse ${className}`}
      aria-hidden
    />
  );
}

/** Skeleton for a metric/KPI card */
export function SkeletonCard() {
  return (
    <div className="card-glass p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0 rounded-safe-sm" />
      </div>
    </div>
  );
}

/** Skeleton for a table row */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-[var(--safe-neutral-border)]/80">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}
