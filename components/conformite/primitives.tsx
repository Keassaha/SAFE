"use client";

/**
 * Primitives partagées des écrans de conformité.
 *
 * Les dix écrans réglementaires racontent la même chose sous des formes différentes :
 * une liste de lignes, un article qui la fonde, un état qui appelle ou non une action.
 * Les redessiner à chaque fois les ferait diverger, et un cabinet qui voit dix
 * grammaires visuelles finit par ne plus en lire aucune.
 *
 * Règles encodées ici, tirées de `docs/design/DESIGN_HUMAIN.md` :
 *   A14 · aucune bordure verticale, filets horizontaux à faible opacité seulement ;
 *   L2  · les nombres à droite, en chiffres tabulaires ;
 *   T2  · entêtes et données à la même taille, la graisse seule fait la hiérarchie ;
 *   L3  · une colonne porteuse large, métadonnées comprimées ;
 *   MO1 · au survol, transition de couleur seule, aucun déplacement ;
 *   §11 · pastille à fond dilué quand le statut appelle une action, à contour sinon.
 */

import { useState, type ReactNode } from "react";
import { formatCurrency } from "@/lib/utils/format";

/* ════════════════════════════════════════════════════════════════
   SURFACE
   ════════════════════════════════════════════════════════════════ */

/**
 * Surface structurelle, toujours mate.
 *
 * Le ton est un PARAMÈTRE et non une classe passée par-dessus : deux `bg-*` de même
 * spécificité se départagent par l'ordre du CSS généré, pas par l'ordre où on les
 * écrit. Un panneau d'alerte peut donc rester incolore sans prévenir.
 */
export function Panel({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "alert";
  className?: string;
}) {
  const toneClasses =
    tone === "alert"
      ? "border-[#B84A3E]/30 bg-[#B84A3E]/[0.05]"
      : "border-[var(--si-line)] bg-[var(--si-surface)]";
  return <section className={`rounded-xl border ${toneClasses} ${className}`}>{children}</section>;
}

/** Entête de bloc, portant son article. La source se lit sans clic (PR-4). */
export function BlockHeader({
  title,
  reference,
  count,
  countLabel = "ligne",
  action,
}: {
  title: string;
  reference?: string | null;
  count?: number;
  countLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-baseline justify-between gap-4 border-b border-[var(--si-line)] px-4 py-3">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-[var(--si-ink)]">{title}</h3>
        {reference && <p className="mt-0.5 text-xs text-[var(--si-muted)]">{reference}</p>}
      </div>
      <div className="flex shrink-0 items-baseline gap-3">
        {typeof count === "number" && count > 0 && (
          <span className="text-xs tabular-nums text-[var(--si-muted)]">
            {count} {countLabel}
            {count === 1 ? "" : "s"}
          </span>
        )}
        {action}
      </div>
    </header>
  );
}

/**
 * Absence de lignes.
 *
 * Elle dit « aucun », pas « rien à afficher » : dans un registre réglementaire,
 * l'absence de chèques en circulation est une information, pas un écran vide.
 */
export function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-sm text-[var(--si-muted)]">{children}</p>;
}

/* ════════════════════════════════════════════════════════════════
   ÉTAT
   ════════════════════════════════════════════════════════════════ */

export type PillTone = "action" | "info" | "done";

/**
 * Pastille d'état.
 *
 * Deux registres, selon le conflit tranché au §11 de la base design : fond dilué
 * quand l'état appelle une action, contour quand il est purement informatif. Un seul
 * registre appliqué partout ne se lit plus.
 */
export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const styles = {
    action: "bg-[#B84A3E]/10 text-[#8F3529] border-transparent",
    done: "bg-[#0B1F19]/[0.06] text-[var(--si-forest)] border-transparent",
    info: "border-[var(--si-line)] text-[var(--si-muted)]",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${styles}`}>
      {children}
    </span>
  );
}

/** Message d'erreur d'action, toujours au même endroit et au même ton. */
export function ErrorBanner({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-[#B84A3E]/30 bg-[#B84A3E]/[0.06] px-4 py-3 text-sm text-[#8F3529]"
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TABLEAU
   ════════════════════════════════════════════════════════════════ */

export type Align = "left" | "right";

/**
 * Tableau réglementaire.
 *
 * Filets horizontaux seulement, jamais de grille complète : une grille pleine fait
 * ressembler un registre à un tableur de saisie. La première colonne porte la ligne
 * et prend la moitié de la largeur ; les autres se compriment.
 *
 * `min-w-0` sur le conteneur : sans lui, un enfant de grille prend sa largeur
 * min-content et le tableau pousse la page hors de l'écran sur mobile.
 */
export function Table({
  head,
  align,
  rows,
  firstColumnWidth = "w-1/2",
}: {
  head: string[];
  align: Align[];
  rows: ReactNode[][];
  firstColumnWidth?: string;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--si-line)]">
            {head.map((h, i) => (
              <th
                key={`${h}-${i}`}
                scope="col"
                className={`px-4 py-2.5 font-medium text-[var(--si-muted)] ${
                  align[i] === "right" ? "text-right" : "text-left"
                } ${i === 0 ? firstColumnWidth : "whitespace-nowrap"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-[var(--si-line)] transition-colors last:border-b-0 hover:bg-[#0B1F19]/[0.02]"
            >
              {r.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 text-[var(--si-ink)] ${
                    align[j] === "right" ? "text-right tabular-nums" : "text-left"
                  } ${j === 0 ? "max-w-0" : "whitespace-nowrap"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FORMULAIRE
   ════════════════════════════════════════════════════════════════ */

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-[var(--si-muted)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--si-muted)]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--si-line)] bg-white px-3 py-2 text-sm text-[var(--si-ink)] focus:border-[var(--si-forest)] focus:outline-none";

export const inputNumberClass = `${inputClass} text-right tabular-nums`;

/**
 * Action principale. Un seul par écran (méta-règle M2).
 *
 * `className` est AJOUTÉ, jamais écrasé : la forme `{...props} className="…"` place la
 * classe du composant après celle de l'appelant et la supprime en silence. Une largeur
 * ou une marge passée par un écran disparaissait sans erreur.
 */
export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-[var(--si-forest)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#123028] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg border border-[var(--si-line)] px-3 py-2 text-sm text-[var(--si-ink)] transition-colors hover:bg-[#0B1F19]/[0.04] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   DIVULGATION PROGRESSIVE
   ════════════════════════════════════════════════════════════════ */

/**
 * Section repliable.
 *
 * Le déclencheur est un bouton persistant, jamais un survol : sur tablette le survol
 * n'existe pas, et une action essentielle cachée derrière lui devient inatteignable
 * (MB1).
 */
export function Disclosure({
  label,
  meta,
  children,
  defaultOpen = false,
}: {
  label: string;
  meta?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Panel>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[#0B1F19]/[0.02]"
      >
        <span className="text-sm font-medium text-[var(--si-ink)]">{label}</span>
        {meta && <span className="shrink-0 text-xs text-[var(--si-muted)]">{meta}</span>}
      </button>
      {open && <div className="border-t border-[var(--si-line)]">{children}</div>}
    </Panel>
  );
}

/* ════════════════════════════════════════════════════════════════
   FORMATAGE
   ════════════════════════════════════════════════════════════════ */

/**
 * Montant.
 *
 * Délègue au formateur canonique du dépôt plutôt que d'en être une troisième
 * implémentation. Il y en avait deux (`lib/format.ts`, mort, et `lib/utils/format.ts`,
 * vivant) ; en ajouter une aurait garanti que les écrans de conformité affichent les
 * montants autrement que le reste de l'application.
 */
export function money(n: number): string {
  return formatCurrency(n);
}

/**
 * Date en clair, toujours absolue.
 *
 * Écart assumé à la règle A13 du temps relatif : dans un registre, la date EST la
 * donnée réglementaire. Un inspecteur qui lit « il y a 3 j » sur une date d'émission
 * de chèque ne peut rien recouper.
 */
export function day(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "—";
}

export function monthLabel(periode: string): string {
  const [y, m] = periode.split("-").map(Number);
  const noms = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${noms[(m ?? 1) - 1]} ${y}`;
}
