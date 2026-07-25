"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "tertiary" | "soft" | "danger" | "landing-primary" | "landing-secondary" | "outlined" | "dark" | "dark-ghost";
type Size = "default" | "sm" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-si-forest text-si-surface hover:brightness-95",
  secondary: "border border-si-line bg-transparent text-si-ink hover:bg-si-line2",
  ghost: "border border-transparent bg-transparent text-si-muted hover:bg-si-line2 hover:text-si-ink",
  destructive: "border border-transparent bg-transparent text-status-error hover:bg-status-error-bg",

  // LEGACY ALIASES (Mapped to DS variants)
  tertiary: "border border-transparent bg-transparent text-si-muted hover:bg-si-line2 hover:text-si-ink",
  soft: "border border-si-line bg-si-canvas text-si-ink hover:bg-si-line2",
  danger: "border border-transparent bg-transparent text-status-error hover:bg-status-error-bg",
  "landing-primary": "bg-slate-900 text-white rounded-full hover:bg-slate-800",
  "landing-secondary": "bg-transparent text-slate-900 border border-slate-300 rounded-full hover:bg-slate-50",
  outlined: "border border-si-line bg-transparent text-si-ink hover:bg-si-line2",
  dark: "bg-si-forest text-si-surface hover:brightness-95",
  "dark-ghost": "border border-si-surface/20 bg-transparent text-si-surface hover:bg-si-surface/10",
};

const sizes: Record<Size, string> = {
  default: "h-[38px] px-[16px]",
  sm: "h-[32px] px-[12px] text-[13px]",
  lg: "h-[44px] px-[24px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = "primary",
  size = "default",
  className = "",
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-sans text-[13px] font-medium tracking-[-0.008em] transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-si-forest/35 focus-visible:outline-offset-[-2px]",
        "disabled:cursor-default disabled:opacity-45",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";
