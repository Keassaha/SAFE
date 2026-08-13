import React, { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ children, className, elevated = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        /* Feuille : la surface qui porte un contenu, détachée du canvas.
         * Le rayon passe de 8 à 14 px et l'ombre devient permanente, au lieu
         * d'être réservée à `elevated`. Sur un canvas gris franc, une carte
         * blanche sans ombre flotte sans se poser. Une seule ombre, longue et
         * basse, doublée d'un liseré d'un pixel : deux niveaux d'ombre empilés
         * font du carton, pas de la profondeur.
         * Ce composant est monté dans 98 fichiers : c'est ici que « arrondi,
         * en relief, avec des ombres » se décide, pas page par page. */
        "overflow-hidden rounded-[14px] border border-si-line bg-si-surface text-si-ink",
        "shadow-[0_1px_2px_rgb(var(--si-line-ink-rgb)/0.04),0_18px_40px_-28px_rgb(var(--si-line-ink-rgb)/0.30)]",
        elevated &&
          "shadow-[0_1px_2px_rgb(var(--si-line-ink-rgb)/0.05),0_26px_56px_-30px_rgb(var(--si-line-ink-rgb)/0.38)]",
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
