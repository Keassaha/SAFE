"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Champs de formulaire — design system safe-interface (tokens si-*).
 *
 * Typographie cohérente partout : libellés en Geist (font-sans), saisie en Geist,
 * montants en Geist Mono (font-mono), titres de carte en serif (voir CardTitle).
 * Le « vert » apparaît au focus : bordure forêt + halo vérifié — c'est la présence
 * du forêt quand on clique dans un champ.
 */

// Base sans police : la police est posée par chaque composant (Geist pour le
// texte, Geist Mono pour les montants) afin d'éviter tout conflit font-sans/mono.
// Le « vert au clic » : bordure verte + halo vert au focus.
const fieldBase =
  "text-sm text-si-ink bg-si-surface border border-si-line rounded-[10px] px-[13px] py-[11px] outline-none w-full placeholder:text-si-muted/70 focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition";

/* Conteneur de champ avec libellé */
export function Field({
  label,
  required,
  full,
  hint,
  children,
}: {
  label?: string;
  required?: boolean;
  full?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-[7px] mb-4", full && "col-span-full")}>
      {label && (
        <label className="text-xs font-sans text-si-muted tracking-wide">
          {label} {required && <span className="text-si-amber-ink">*</span>}
        </label>
      )}
      {children}
      {hint && <span className="text-[11.5px] text-si-muted">{hint}</span>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "font-sans")} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "font-sans resize-y min-h-[80px]")} {...props} />;
}

export function Select({
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "font-sans pr-9", className)} {...props}>
      {children}
    </select>
  );
}

/* Champ montant avec préfixe $ — saisie en mono */
export function AmountInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="absolute left-[13px] top-1/2 -translate-y-1/2 font-mono text-sm text-si-muted">
        $
      </span>
      <input
        inputMode="decimal"
        className={cn(fieldBase, "pl-[30px] font-mono tabular-nums", className)}
        {...props}
      />
    </div>
  );
}

/* Contrôle segmenté */
export function SegmentedControl({
  options,
  defaultIndex = 0,
  fill = false,
  onChange,
}: {
  options: string[];
  defaultIndex?: number;
  fill?: boolean;
  onChange?: (index: number) => void;
}) {
  const [active, setActive] = useState(defaultIndex);
  return (
    <div
      className={cn(
        "inline-flex bg-si-canvas border border-si-line rounded-xl p-[3px] gap-[3px]",
        fill && "flex w-full",
      )}
    >
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => {
            setActive(i);
            onChange?.(i);
          }}
          className={cn(
            "font-sans text-[13px] rounded-[9px] py-[9px] px-[18px] cursor-pointer transition-colors",
            fill && "flex-1 px-0",
            active === i
              ? "bg-si-surface text-si-ink font-medium shadow-[0_1px_2px_rgba(31,42,36,0.08)]"
              : "bg-transparent text-si-muted hover:text-si-ink",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
