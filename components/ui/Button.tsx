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
  // OFFICIAL DS v1.0 VARIANTS
  primary: "bg-forest-700 text-forest-50 hover:opacity-90",
  secondary: "bg-transparent text-forest-700 border border-forest-700/50 hover:bg-forest-50",
  ghost: "bg-transparent text-forest-700 hover:bg-forest-50 border border-transparent",
  destructive: "bg-[#A32D2D] text-[#FCEBEB] hover:opacity-90",

  // LEGACY ALIASES (Mapped to DS variants)
  tertiary: "bg-transparent text-forest-700 hover:bg-forest-50 border border-transparent", // alias ghost
  soft: "bg-forest-50 text-forest-900 border border-transparent hover:bg-forest-100", 
  danger: "bg-[#A32D2D] text-[#FCEBEB] hover:opacity-90",
  "landing-primary": "bg-slate-900 text-white rounded-full hover:bg-slate-800",
  "landing-secondary": "bg-transparent text-slate-900 border border-slate-300 rounded-full hover:bg-slate-50",
  outlined: "bg-transparent text-forest-700 border border-forest-700/50 hover:bg-forest-50",
  dark: "bg-forest-900 text-forest-50 hover:bg-forest-800",
  "dark-ghost": "bg-transparent text-forest-50 border border-forest-50/20 hover:bg-forest-900",
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
        "inline-flex items-center justify-center gap-1.5 rounded-md font-sans text-[14px] font-medium transition-base",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest-500 focus-visible:ring-offset-1 focus-visible:shadow-focus",
        "disabled:opacity-40 disabled:cursor-not-allowed",
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
