"use client";

import React, { forwardRef, useId, type ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "tertiary"
  | "soft"
  | "danger"
  | "landing-primary"
  | "landing-secondary"
  | "outlined"
  | "dark"
  | "dark-ghost"
  | "glass";
type Size = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingLabel?: string;
  disabledReason?: string;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-si-forest text-si-surface hover:bg-si-forest-soft active:bg-si-forest-soft aria-pressed:bg-si-forest-soft",
  secondary:
    "border border-si-line bg-si-surface text-si-ink hover:bg-si-line2 active:bg-si-line aria-pressed:bg-si-line",
  ghost:
    "border border-transparent bg-transparent text-si-muted hover:bg-si-line2 hover:text-si-ink active:bg-si-line aria-pressed:bg-si-line",
  destructive:
    "border border-transparent bg-transparent text-status-error hover:bg-status-error-bg active:bg-status-error-bg aria-pressed:bg-status-error-bg",

  // Alias maintenus pour les écrans existants. Ils convergent vers les 4 niveaux d'action.
  tertiary:
    "border border-transparent bg-transparent text-si-muted hover:bg-si-line2 hover:text-si-ink active:bg-si-line aria-pressed:bg-si-line",
  soft:
    "border border-si-line bg-si-surface text-si-ink hover:bg-si-line2 active:bg-si-line aria-pressed:bg-si-line",
  danger:
    "border border-transparent bg-transparent text-status-error hover:bg-status-error-bg active:bg-status-error-bg aria-pressed:bg-status-error-bg",
  "landing-primary":
    "bg-si-forest text-si-surface hover:bg-si-forest-soft active:bg-si-forest-soft aria-pressed:bg-si-forest-soft",
  "landing-secondary":
    "border border-si-line bg-si-surface text-si-ink hover:bg-si-line2 active:bg-si-line aria-pressed:bg-si-line",
  outlined:
    "border border-si-line bg-si-surface text-si-ink hover:bg-si-line2 active:bg-si-line aria-pressed:bg-si-line",
  dark:
    "bg-si-forest text-si-surface hover:bg-si-forest-soft active:bg-si-forest-soft aria-pressed:bg-si-forest-soft",
  "dark-ghost":
    "border border-si-surface/25 bg-transparent text-si-surface hover:bg-si-surface/10 active:bg-si-surface/15 aria-pressed:bg-si-surface/15",

  /**
   * Verre, niveau subtle du système de profondeur.
   *
   * Réservé aux boutons POSÉS SUR une surface qui flotte ou sur une image :
   * barre collante, superposition, contrôles au-dessus d'un aperçu. Le verre
   * exprime une superposition réelle, il n'est pas un habillage.
   *
   * L'action principale d'un écran de travail reste `primary`, pleine et mate :
   * une décision ne se lit pas à travers une vitre. Voir
   * docs/design/SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md §2.
   *
   * La classe porte la teinte, le flou, le filet et le repli opaque. Aucune
   * valeur littérale ici.
   */
  glass:
    "safe-glass-subtle border text-si-ink hover:bg-si-surface active:bg-si-line2 aria-pressed:bg-si-line2",
};

const sizes: Record<Size, string> = {
  default: "min-h-11 px-4",
  sm: "min-h-9 px-3 text-xs",
  lg: "min-h-11 px-6 text-sm",
  icon: "h-11 w-11 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "default",
    className,
    children,
    loading = false,
    loadingLabel = "Chargement en cours",
    disabledReason,
    disabled,
    title,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const reasonId = useId();
  const isDisabled = disabled || loading;
  const describedBy = [ariaDescribedBy, isDisabled && disabledReason ? reasonId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <>
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-sans text-sm font-medium tracking-tight",
          "transition-colors duration-normal ease-safe motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface",
          "disabled:cursor-not-allowed disabled:opacity-45",
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-describedby={describedBy}
        data-state={loading ? "loading" : isDisabled ? "disabled" : "ready"}
        title={title ?? (isDisabled ? disabledReason : undefined)}
        {...props}
      >
        {/* Hors chargement, `children` est rendu tel quel. L'envelopper dans un
            `<span>` unique cassait tous les boutons à icône : la normalisation
            de Tailwind pose `svg { display: block }`, donc à l'intérieur d'une
            enveloppe commune l'icône occupait sa propre ligne et le libellé la
            suivante. Rendus directement, icône et libellé redeviennent deux
            enfants de flexbox, alignés par `items-center` et espacés par `gap-2`. */}
        {loading ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
            <span>{loadingLabel}</span>
          </>
        ) : (
          children
        )}
      </button>
      {isDisabled && disabledReason ? (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      ) : null}
    </>
  );
});

Button.displayName = "Button";
