import type { ButtonHTMLAttributes } from "react";

/**
 * Variants alignés au design system SAFE.
 * - primary: action principale (hover: léger lift + ombre)
 * - secondary: contour primaire
 * - tertiary: texte seul
 * - soft: fond glass pour cartes / header (style "Voir tout")
 * - danger: action destructive
 */
type Variant = "primary" | "secondary" | "tertiary" | "soft" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  "px-5 py-2.5 rounded-safe font-medium transition-all duration-200 ease-out disabled:opacity-50 active:scale-[0.98] " +
  "hover:scale-[1.02] hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-gold-600 text-white border border-transparent shadow-sm hover:bg-gold-700 hover:shadow-[0_6px_20px_rgba(31,90,71,0.35)]",
  secondary:
    "bg-white text-green-900 border border-[#E5E7EB] hover:bg-neutral-100",
  tertiary:
    "text-green-900 hover:bg-green-50 border border-transparent bg-transparent",
  soft:
    "bg-white/90 text-[var(--safe-text-title)] border border-white/25 hover:bg-white hover:border-white/50 shadow-sm hover:shadow-md backdrop-blur-[14px]",
  danger:
    "bg-status-error text-white hover:opacity-90 border border-transparent shadow-sm hover:shadow-md",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
