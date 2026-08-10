import type { ReactNode } from "react";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { Button } from "@/components/ui/Button";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * Pont de compatibilité du prototype `ds-safe`.
 *
 * Les écrans historiques peuvent conserver leurs imports, mais les rôles
 * fondamentaux proviennent désormais des primitives canoniques `components/ui`.
 */
export { Button, Card, CardSubtitle, CardTitle };

export function Badge({ tone, children }: { tone: "ok" | "warn"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "ok" && "bg-status-success-bg text-status-success",
        tone === "warn" && "bg-status-warning-bg text-status-warning",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="relative z-10 inline-flex items-center gap-2 rounded-full bg-si-verified/25 px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-si-verified-on-forest">
      <span className="h-1.5 w-1.5 rounded-full bg-si-verified-dot" aria-hidden />
      {children}
    </span>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return <SafeLogo size={size} alt="SAFE" />;
}
