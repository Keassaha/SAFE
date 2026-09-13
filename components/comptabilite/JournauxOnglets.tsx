"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { tMicro } from "@/lib/motion";

export interface OngletJournal<T extends string> {
  id: T;
  label: string;
  desc?: string;
  count?: number;
}

/**
 * La rangée d'onglets des journaux, en tête de la feuille.
 *
 * Les boutons du journal actif se posent à droite, sur la même ligne : ils
 * occupaient une rangée à eux seuls, sous les onglets. Le compte se lit en
 * gris à côté du nom, plus dans une pastille pleine ; les icônes partent, le
 * nom suffit. Demande CEO du 2026-09-12. Le trait glisse d'un onglet à l'autre
 * (motif validé le 2026-08-27).
 */
export function JournauxOnglets<T extends string>({
  items,
  actif,
  onChoisir,
  ariaLabel,
  actionsHostId,
  actions,
}: {
  items: OngletJournal<T>[];
  actif: T;
  onChoisir: (id: T) => void;
  ariaLabel: string;
  /** Cible du portail des journaux : leurs boutons se rendent ici. */
  actionsHostId?: string;
  /** Boutons rendus directement, quand il n'y a pas de portail. */
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-si-line pl-2 pr-3">
      <nav className="flex flex-wrap gap-1" aria-label={ariaLabel}>
        {items.map((j) => {
          const estActif = actif === j.id;
          return (
            <button
              key={j.id}
              type="button"
              onClick={() => onChoisir(j.id)}
              aria-current={estActif ? "page" : undefined}
              title={j.desc}
              className={`min-h-tap safe-zoom relative -mb-px flex shrink-0 items-baseline gap-2 whitespace-nowrap px-4 py-3.5 text-sm font-medium ${
                estActif ? "text-si-ink" : "text-si-muted hover:text-si-body"
              }`}
            >
              {estActif && (
                <motion.span
                  layoutId="compta-onglet"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-t bg-si-ink"
                  transition={tMicro}
                  aria-hidden
                />
              )}
              <span className="relative z-10">{j.label}</span>
              {typeof j.count === "number" && (
                <span className="relative z-10 font-mono text-[12px] font-normal tabular-nums text-si-muted">{j.count}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div id={actionsHostId} className="flex flex-wrap items-center gap-2 py-2 empty:hidden">
        {actions}
      </div>
    </div>
  );
}
