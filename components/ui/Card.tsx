import React, { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ children, className, elevated = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-si-line bg-si-surface text-si-ink",
        elevated && "shadow-si-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Alias de compatibilité. Les entrées décoratives automatiques ont été retirées:
 * une carte n'est animée que lorsqu'un changement d'état l'exige.
 */
export function MotionCard(props: CardProps) {
  return <Card {...props} />;
}

export function CardHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between border-b border-si-line px-6 py-4", className)}>
      <h2 className="font-serif text-xl leading-tight text-si-ink">{title}</h2>
      {action}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("font-serif text-xl leading-tight text-si-ink", className)}>{children}</h2>;
}

export function CardSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-1 mb-5 text-xs text-si-muted", className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 text-si-ink", className)}>{children}</div>;
}
