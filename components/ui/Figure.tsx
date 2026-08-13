import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitive unique de tout chiffre affiché comme donnée : montant, compteur,
 * durée, pourcentage.
 *
 * SAFE est jugé sur la précision de ses chiffres. Ils doivent donc se ressembler
 * d'un écran à l'autre, s'aligner verticalement quand ils sont empilés, et ne
 * jamais changer de graisse au gré de la page.
 *
 * Trois tailles seulement, une par rôle. Au-delà, la hiérarchie se dissout.
 */
type Taille = "principale" | "secondaire" | "mention";

/**
 * La teinte porte un sens comptable, jamais une décoration. `attention` est
 * réservée à ce qui appelle une action ; elle ne suffit jamais seule à porter
 * l'information, un libellé l'accompagne toujours.
 */
type Teinte = "neutre" | "attention" | "confirme" | "discret";

const tailles: Record<Taille, string> = {
  principale: "text-2xl font-medium leading-tight",
  secondaire: "text-xl font-medium leading-tight",
  mention: "text-xs font-medium leading-snug",
};

const teintes: Record<Teinte, string> = {
  neutre: "text-si-ink",
  attention: "text-status-error",
  confirme: "text-si-verified",
  discret: "text-si-muted",
};

export interface FigureProps {
  /** Valeur déjà formatée selon la langue de la session. */
  children: ReactNode;
  taille?: Taille;
  teinte?: Teinte;
  /** Les montants s'alignent à droite pour se comparer d'une ligne à l'autre. */
  aligne?: "gauche" | "droite";
  className?: string;
}

export function Figure({
  children,
  taille = "principale",
  teinte = "neutre",
  aligne = "gauche",
  className,
}: FigureProps) {
  return (
    <span
      className={cn(
        // Mono tabulaire : sans elle, deux montants empilés ne s'alignent pas
        // et l'œil ne peut plus les comparer d'un coup.
        "font-mono tabular-nums",
        tailles[taille],
        teintes[teinte],
        aligne === "droite" && "text-right",
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface MetricTileProps {
  /** Intitulé de la mesure, en toutes lettres. */
  label: string;
  /** Valeur formatée. */
  value: ReactNode;
  /** Précision secondaire : montant associé, période, effectif. */
  hint?: ReactNode;
  teinte?: Teinte;
  className?: string;
}

/**
 * Tuile canonique d'un registre de mesures.
 *
 * Un seul rythme vertical pour toutes les pages : intitulé, valeur, précision.
 * La valeur et sa précision partagent la même ligne de base, la précision est
 * poussée à droite pour que les colonnes se lisent verticalement.
 */
export function MetricTile({ label, value, hint, teinte = "neutre", className }: MetricTileProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate text-xs font-medium text-si-muted">{label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <Figure taille="secondaire" teinte={teinte}>
          {value}
        </Figure>
        {hint ? (
          <Figure taille="mention" teinte="discret" aligne="droite" className="truncate">
            {hint}
          </Figure>
        ) : null}
      </div>
    </div>
  );
}
