"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Pièces de « Reprendre un client », version 4 (maquettes validées le
 * 2026-10-01).
 *
 * Règle typographique de la section, mesurée sur les maquettes :
 *   - UNE famille (SAFE Grotesk), chiffres tabulaires pour l'alignement ;
 *   - DEUX tailles : 20 px pour le nom du client, 14 px pour tout le reste ;
 *   - DEUX graisses : normale et moyenne.
 * Pas de police mono : décision CEO du 2026-10-01, écart assumé à la lettre de
 * la loi L1 du référentiel (les chiffres restent alignés, jamais tronqués).
 *
 * Des filets, pas des boîtes. Une seule action pleine par écran.
 */

export const racine = "text-[14px] leading-[1.5] text-si-ink [font-variant-numeric:tabular-nums]";
export const titre = "text-[20px] font-medium tracking-[-0.01em] text-si-ink";
export const discret = "text-si-muted";

export const champ =
  "h-9 w-full rounded-md border border-si-line bg-si-surface px-3 text-[14px] text-si-ink outline-none transition-colors placeholder:text-si-subtle focus:border-si-border-strong disabled:text-si-subtle";

/** Une valeur reprise à la main par-dessus la lecture se voit en ambre. */
export const champRepris = "border-si-amber/60 bg-si-amber/[0.07]";

export function Section({ children, premiere = false }: { children: ReactNode; premiere?: boolean }) {
  return <section className={premiere ? "pb-6" : "border-t border-si-line py-6"}>{children}</section>;
}

export function Libelle({ children }: { children: ReactNode }) {
  return <div className="text-si-muted">{children}</div>;
}

export function Champ({ libelle, children, className = "" }: { libelle: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-si-muted">{libelle}</span>
      {children}
    </label>
  );
}

export function Lien({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`text-si-muted underline decoration-si-ink/30 underline-offset-[3px] hover:text-si-ink disabled:no-underline disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Une remarque qui demande un regard : un filet ambre à gauche, jamais une boîte. */
export function Alerte({ children }: { children: ReactNode }) {
  return <div className="mt-3 border-l-2 border-si-amber/50 pl-3">{children}</div>;
}

export function Erreur({ children }: { children: ReactNode }) {
  return <div className="mt-3 border-l-2 border-si-danger/60 pl-3 text-si-danger-ink">{children}</div>;
}

export function Choix<T extends string>({
  options,
  valeur,
  onChange,
  etiquette,
}: {
  options: { cle: T; libelle: string }[];
  valeur: T | null;
  onChange: (v: T) => void;
  etiquette: string;
}) {
  return (
    <div role="radiogroup" aria-label={etiquette} className="flex flex-wrap gap-x-6 gap-y-2">
      {options.map((o) => {
        const actif = o.cle === valeur;
        return (
          <button
            key={o.cle}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(o.cle)}
            className={`flex items-center gap-2 ${actif ? "text-si-ink" : "text-si-muted hover:text-si-ink"}`}
          >
            <span
              aria-hidden
              className={`grid h-3.5 w-3.5 place-items-center rounded-full border-[1.5px] ${actif ? "border-si-ink" : "border-si-border-strong"}`}
            >
              {actif && <span className="h-[7px] w-[7px] rounded-full bg-si-ink" />}
            </span>
            {o.libelle}
          </button>
        );
      })}
    </div>
  );
}

/** Le pied de l'espace de travail : une phrase d'état à gauche, l'action pleine à droite. */
export function BarreDecision({ etat, children }: { etat: ReactNode; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-si-line bg-si-surface/95 px-7 py-3.5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 text-si-muted">{etat}</div>
        <div className="flex items-center gap-5">{children}</div>
      </div>
    </div>
  );
}
