import { cn } from "@/lib/utils";

/**
 * PageHero — bandeau d'en-tête sur fond forêt (#0B1F19), signature récurrente
 * du design safe-interface. À utiliser en haut des pages pour ancrer le forêt
 * de façon cohérente (même couleur que le bandeau de conformité et le TrustCard
 * du tableau de bord).
 *
 * - Texte en albâtre (si-surface) pour un contraste élevé sur le forêt.
 * - Titre en serif, fil d'Ariane / méta en mono.
 * - Les actions sont rendues en clair (light-on-dark) via les variantes ci-dessous.
 */
export function PageHero({
  trail,
  title,
  subtitle,
  meta,
  actions,
  className,
}: {
  trail?: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-si-forest text-si-surface px-7 py-6",
        className,
      )}
    >
      <div aria-hidden className="absolute -right-12 -top-20 w-60 h-60 glow-verified" />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {trail && (
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-si-surface/55 mb-2">
              {trail}
            </div>
          )}
          <h1 className="font-serif text-[28px] leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-si-surface/70 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {(meta || actions) && (
          <div className="shrink-0 flex items-center gap-3">
            {meta}
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/** Bouton clair posé sur le forêt (action principale d'un PageHero). */
export function HeroButtonPrimary({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-si-surface px-4 py-2 text-sm font-medium text-si-forest hover:bg-white transition-colors",
        className,
      )}
      {...props}
    />
  );
}

/** Bouton secondaire (contour clair) posé sur le forêt. */
export function HeroButtonGhost({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-si-surface/25 px-4 py-2 text-sm font-medium text-si-surface hover:bg-si-surface/10 transition-colors",
        className,
      )}
      {...props}
    />
  );
}
