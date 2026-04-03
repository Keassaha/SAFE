"use client";

import { ButtonHTMLAttributes } from "react";

/**
 * Variants alignés au design system SAFE.
 * - primary: action principale (or/gold)
 * - secondary: contour, fond blanc
 * - tertiary: texte seul
 * - soft: fond subtil pour cartes / header
 * - danger: action destructive
 * - landing-primary: bouton d'action principal refonte
 * - landing-secondary: bouton d'action secondaire glassmorphism refonte
 */
type Variant = "primary" | "secondary" | "tertiary" | "soft" | "danger" | "landing-primary" | "landing-secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-safe font-medium text-sm " +
  "transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none " +
  "active:scale-[0.98] hover:scale-[1.02] hover:-translate-y-0.5";

const variants: Record<Variant, string> = {
  primary:
    "bg-green-700 text-white border border-transparent shadow-sm " +
    "hover:bg-green-800 hover:shadow-[0_6px_20px_rgba(31,90,71,0.30)]",
  secondary:
    "bg-white text-green-900 border border-[#E5E7EB] shadow-xs " +
    "hover:bg-neutral-100 hover:border-[#D1D5DB]",
  tertiary:
    "text-green-900 hover:bg-green-50 border border-transparent bg-transparent",
  soft:
    "bg-white/90 text-[var(--safe-text-title)] border border-white/25 shadow-sm " +
    "hover:bg-white hover:border-white/50 hover:shadow-md backdrop-blur-[14px]",
  danger:
    "bg-status-error text-white border border-transparent shadow-sm " +
    "hover:opacity-90 hover:shadow-md",
  "landing-primary":
    "bg-green-700 text-white rounded-full font-semibold shadow-[0_12px_40px_rgba(61,107,90,0.35)] " +
    "hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(61,107,90,0.45)] " +
    "active:scale-[0.98] transition-all duration-200",
  "landing-secondary":
    "bg-green-950/90 text-white/95 border border-white/10 rounded-full font-semibold " +
    "backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.35)] " +
    "hover:border-white/16 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
