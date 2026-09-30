"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * Pièces d'interface de « Reprendre un client ». Mêmes classes que l'écran
 * d'Entrée d'un client (maquette validée le 2026-09-14), pour que les deux
 * écrans se lisent comme un seul produit.
 */

export const champClass =
  "h-9 w-full rounded-md border border-si-line bg-si-canvas px-2.5 text-[13px] text-si-ink outline-none transition-colors focus:border-si-border-strong focus:bg-si-surface disabled:text-si-subtle";

/** Une valeur reprise à la main par-dessus la lecture se voit en ambre. */
export const champRepris = "border-si-amber/60 bg-si-amber/[0.07]";

export function Champ({
  libelle,
  children,
  className = "",
}: {
  libelle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[12px] text-si-muted">{libelle}</span>
      {children}
    </label>
  );
}

export function Segment<T extends string>({
  options,
  valeur,
  onChange,
  taille = "normale",
  etiquette,
}: {
  options: { cle: T; libelle: string }[];
  valeur: T | null;
  onChange: (v: T) => void;
  taille?: "normale" | "petite";
  etiquette?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={etiquette}
      className="inline-flex rounded-lg border border-si-line bg-si-surface2 p-0.5"
    >
      {options.map((o) => {
        const actif = o.cle === valeur;
        return (
          <button
            key={o.cle}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(o.cle)}
            className={`rounded-[6px] transition-all ${
              taille === "petite" ? "px-2 py-1 text-[12px]" : "min-h-8 px-3.5 text-[13px]"
            } ${
              actif
                ? "bg-si-surface font-medium text-si-ink shadow-[0_0_0_1px_rgba(22,24,23,0.11)]"
                : "text-si-muted hover:text-si-ink"
            }`}
          >
            {o.libelle}
          </button>
        );
      })}
    </div>
  );
}

export function Bloc({
  lettre,
  titre,
  aide,
  children,
  dernier = false,
}: {
  lettre: string;
  titre: string;
  aide?: ReactNode;
  children: ReactNode;
  dernier?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[26px_1fr] gap-x-2.5 ${
        dernier ? "" : "mb-[18px] border-b border-si-line2 pb-[18px]"
      }`}
    >
      <span className="pt-px font-mono text-[12px] text-si-subtle">{lettre}</span>
      <div className="min-w-0">
        <h3 className="text-[14px] font-medium text-si-ink">{titre}</h3>
        {aide && <p className="mt-0.5 text-[12px] text-si-muted">{aide}</p>}
        {children}
      </div>
    </div>
  );
}

export function Carte({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-si-line bg-si-surface ${className}`}>{children}</div>;
}

export function EnTeteCarte({ titre, aide, actions }: { titre: string; aide?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-4">
      <div>
        <h2 className="text-[15px] font-medium text-si-ink">{titre}</h2>
        {aide && <p className="mt-0.5 text-[13px] text-si-muted">{aide}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Pastille({ ton, children }: { ton: "ok" | "cours" | "attention" | "neutre"; children: ReactNode }) {
  const tons = {
    ok: "bg-si-verified/10 text-si-verified",
    cours: "bg-si-surface2 text-si-ink",
    attention: "bg-si-amber/10 text-si-amber-ink",
    neutre: "bg-si-surface2 text-si-muted",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] ${tons[ton]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

/** Message ambre (attention) ou vert (confirmé), toujours doublé d'un texte. */
export function Message({ ton, children }: { ton: "attention" | "ok" | "erreur"; children: ReactNode }) {
  const tons = {
    attention: "border-si-amber/30 bg-si-amber/[0.07] text-si-amber-ink",
    ok: "border-si-verified/25 bg-si-verified/[0.06] text-si-verified",
    erreur: "border-si-danger/30 bg-si-danger/[0.06] text-si-danger-ink",
  } as const;
  return (
    <div className={`mt-2.5 flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px] ${tons[ton]}`}>
      {ton === "ok" ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> : <span aria-hidden>!</span>}
      <span className="text-si-body">{children}</span>
    </div>
  );
}

export function Ligne({ libelle, valeur, mono = false }: { libelle: string; valeur: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[5px]">
      <dt className="text-[12px] text-si-muted">{libelle}</dt>
      <dd className={`text-right text-[13px] text-si-ink ${mono ? "font-mono tabular-nums" : ""}`}>{valeur}</dd>
    </div>
  );
}

export function nouvelId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
