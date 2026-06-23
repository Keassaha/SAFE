import { cn } from "@/lib/cn";

/* Bouton */
export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      className={cn(
        "font-sans text-sm font-medium rounded-xl px-[22px] py-3 cursor-pointer transition-colors",
        variant === "primary" && "bg-forest text-surface hover:bg-forest-soft",
        variant === "ghost" &&
          "bg-transparent text-ink border border-line hover:bg-canvas",
        className
      )}
      {...props}
    />
  );
}

/* Carte de surface */
export function Card({
  className,
  children,
  elevated = false,
}: {
  className?: string;
  children: React.ReactNode;
  elevated?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-2xl",
        elevated && "shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("font-serif text-[19px] leading-tight", className)}>
      {children}
    </h2>
  );
}

export function CardSubtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted mt-1 mb-5">{children}</p>;
}

/* Badge d'etat */
export function Badge({
  tone,
  children,
}: {
  tone: "ok" | "warn";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] px-2.5 py-1 rounded-full",
        tone === "ok" && "bg-verified/10 text-verified",
        tone === "warn" && "bg-amber/[0.13] text-amber"
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/* Pastille sur fond forest */
export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative z-10 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider bg-verified/25 text-[#9FE3C2] px-2.5 py-[5px] rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-[#5FCF9C]" />
      {children}
    </span>
  );
}

/* Logo SAFE */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <div
      className="rounded-[9px] bg-forest grid place-items-center text-surface font-serif"
      style={{ width: size, height: size, fontSize: size * 0.58 }}
    >
      S
    </div>
  );
}
