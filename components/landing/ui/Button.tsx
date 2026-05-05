import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Button as BaseButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "tertiary" | "soft" | "danger" | "landing-primary" | "landing-secondary" | "outlined" | "dark" | "dark-ghost";
type Size = "default" | "sm" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => {
    const siteCta =
      variant === "primary" || variant === "landing-primary"
        ? "safe-site-cta-primary h-auto rounded-[10px]"
        : variant === "secondary" || variant === "landing-secondary" || variant === "outlined"
          ? "safe-site-cta-secondary h-auto rounded-[10px]"
          : "";

    return (
      <BaseButton
        ref={ref}
        variant={variant}
        className={cn(siteCta, className)}
        {...props}
      />
    );
  }
);

Button.displayName = "LandingButton";
