"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "font-sans text-sm text-ink bg-white border border-line rounded-[10px] px-[13px] py-[11px] outline-none w-full placeholder:text-[#9AA59E] focus:border-verified focus:ring-2 focus:ring-verified/15 transition";

/* Conteneur de champ avec libelle */
export function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-[7px] mb-4", full && "col-span-full")}>
      <label className="text-xs text-muted tracking-wide">
        {label} {required && <span className="text-amber">*</span>}
      </label>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={fieldBase} {...props} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea className={cn(fieldBase, "resize-y min-h-[80px]")} {...props} />
  );
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "select-caret pr-9")} {...props}>
      {children}
    </select>
  );
}

/* Champ montant avec prefixe $ */
export function AmountInput({
  defaultValue,
}: {
  defaultValue?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-[13px] top-1/2 -translate-y-1/2 font-mono text-sm text-muted">
        $
      </span>
      <input className={cn(fieldBase, "pl-[30px]")} defaultValue={defaultValue} />
    </div>
  );
}

/* Controle segmente */
export function SegmentedControl({
  options,
  defaultIndex = 0,
  fill = false,
}: {
  options: string[];
  defaultIndex?: number;
  fill?: boolean;
}) {
  const [active, setActive] = useState(defaultIndex);
  return (
    <div
      className={cn(
        "inline-flex bg-canvas border border-line rounded-xl p-[3px] gap-[3px]",
        fill && "flex w-full"
      )}
    >
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => setActive(i)}
          className={cn(
            "font-sans text-[13px] rounded-[9px] py-[9px] px-[18px] cursor-pointer transition-colors",
            fill && "flex-1 px-0",
            active === i
              ? "bg-white text-ink font-medium shadow-[0_1px_2px_rgba(31,42,36,0.08)]"
              : "bg-transparent text-muted"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
