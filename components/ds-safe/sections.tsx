import { Card, CardTitle } from "@/components/ds-safe/core";
import { cn } from "@/lib/utils";

/**
 * Sections du tableau de bord — design system safe-interface (namespace si-*).
 * Portées depuis docs/propositions/safe-interface/components/dashboard/sections.tsx.
 * Types inlinés pour rester autonome (le branchement aux vraies données se fera
 * au moment du re-habillage des écrans réels).
 */

export type ComplianceItem = { label: string; value: string; state: "ok" | "warn" };
export type PriorityMetric = { label: string; value: string; tone?: "amber" | "ink" };
export type PriorityTask = { eyebrow: string; title: string; metrics: PriorityMetric[] };
export type UpNextItem = { text: string; meta: string; tone: "amber" | "verified" | "muted" };
export type Kpi = { label: string; value: string };
export type Obligation = { title: string; detail: string; status: string; state: "ok" | "warn" };

const dotClass: Record<string, string> = {
  ok: "bg-[#5FCF9C] shadow-[0_0_0_4px_rgba(95,207,156,0.18)]",
  warn: "bg-[#E3A94A] shadow-[0_0_0_4px_rgba(227,169,74,0.18)]",
};

/* Bandeau de conformité */
export function ComplianceStrip({
  items,
  rightNote,
}: {
  items: ComplianceItem[];
  rightNote: string;
}) {
  return (
    <div className="relative overflow-hidden flex items-center gap-[22px] bg-si-forest text-si-surface rounded-2xl px-[22px] py-[13px] mb-5">
      <div className="absolute -right-[50px] -top-[70px] w-[230px] h-[230px] glow-verified" />
      {items.map((it, i) => (
        <div key={it.label} className="contents">
          {i > 0 && <span className="w-px h-[18px] bg-si-surface/[0.16] relative z-10" />}
          <div className="relative z-10 flex items-center gap-[9px] text-[13px]">
            <span className={cn("w-2 h-2 rounded-full", dotClass[it.state])} />
            {it.label} <b className="font-medium">{it.value}</b>
          </div>
        </div>
      ))}
      <div className="ml-auto relative z-10 font-mono text-[11.5px] opacity-70">{rightNote}</div>
    </div>
  );
}

const tagClass: Record<string, string> = {
  amber: "bg-si-amber",
  verified: "bg-si-verified",
  muted: "bg-si-muted",
};

/* Carte de priorité unique */
export function PriorityCard({
  priority,
  upNext,
  children,
}: {
  priority: PriorityTask;
  upNext: UpNextItem[];
  children?: React.ReactNode;
}) {
  return (
    <Card elevated className="px-8 py-[30px]">
      <div className="font-mono text-[11px] tracking-[1.4px] uppercase text-si-verified mb-4">
        {priority.eyebrow}
      </div>
      <h1 className="font-serif text-[35px] leading-[1.12] max-w-[28ch] text-si-ink">
        {priority.title}
      </h1>
      <div className="flex gap-7 my-6 flex-wrap">
        {priority.metrics.map((m) => (
          <div key={m.label}>
            <div className="text-[11px] text-si-muted tracking-wide mb-1">{m.label}</div>
            <div className={cn("font-mono text-lg", m.tone === "amber" ? "text-si-amber-ink" : "text-si-ink")}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
      {children}

      <div className="mt-6 border-t border-si-line pt-[18px]">
        <div className="font-mono text-[11px] text-si-muted tracking-wide uppercase mb-[10px]">
          Ensuite
        </div>
        {upNext.map((row, i) => (
          <div
            key={i}
            className={cn("flex items-center gap-[13px] py-[10px]", i > 0 && "border-t border-si-line2")}
          >
            <span className={cn("w-[7px] h-[7px] rounded-full shrink-0", tagClass[row.tone])} />
            <span className="text-[13.5px] text-si-ink">{row.text}</span>
            <span className="ml-auto font-mono text-xs text-si-muted">{row.meta}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* Encart fidéicommis sur fond forêt */
export function TrustCard({
  badge,
  label,
  amount,
  caption,
}: {
  badge: string;
  label: string;
  amount: string;
  caption: string;
}) {
  return (
    <div className="relative overflow-hidden bg-si-forest text-si-surface rounded-2xl px-[26px] py-6">
      <div className="absolute -left-[50px] -bottom-[70px] w-[200px] h-[200px] glow-verified" />
      <span className="relative z-10 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider bg-si-verified/25 text-[#9FE3C2] px-2.5 py-[5px] rounded-full mb-3.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#5FCF9C]" />
        {badge}
      </span>
      <div className="relative z-10 text-xs opacity-75">{label}</div>
      <div className="relative z-10 font-mono text-[28px] mt-1 mb-0.5">{amount}</div>
      <div className="relative z-10 text-[11.5px] opacity-[0.66]">{caption}</div>
    </div>
  );
}

/* Indicateurs du mois */
export function KpiCard({ title, kpis }: { title: string; kpis: Kpi[] }) {
  return (
    <Card className="px-6 py-[22px]">
      <CardTitle className="mb-3.5">{title}</CardTitle>
      {kpis.map((k, i) => (
        <div
          key={k.label}
          className={cn("flex items-baseline justify-between py-[9px]", i > 0 && "border-t border-si-line2")}
        >
          <span className="text-[13px] text-si-muted">{k.label}</span>
          <span className="font-mono text-base text-si-ink">{k.value}</span>
        </div>
      ))}
    </Card>
  );
}

/* État des obligations (Barreau / Règlement B-1 r.5) */
export function Obligations({ items }: { items: Obligation[] }) {
  return (
    <Card className="px-7 py-6">
      <div className="flex items-baseline justify-between mb-1.5">
        <h3 className="font-serif text-xl text-si-ink">État des obligations</h3>
        <span className="text-xs text-si-verified font-medium cursor-pointer">
          Générer l&apos;attestation
        </span>
      </div>
      <p className="text-xs text-si-muted mb-4">
        Suivi automatique des exigences du Barreau et du Règlement B-1 r.5
      </p>
      <div className="grid grid-cols-2 gap-x-9">
        {items.map((o) => (
          <div
            key={o.title}
            className="flex items-center gap-[13px] py-[13px] border-t border-si-line2"
          >
            <div
              className={cn(
                "w-6 h-6 rounded-[7px] shrink-0 grid place-items-center text-[13px] font-semibold",
                o.state === "ok" ? "bg-si-verified/10 text-si-verified" : "bg-si-amber/[0.13] text-si-amber-ink"
              )}
            >
              {o.state === "ok" ? "✓" : "!"}
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-si-ink">{o.title}</div>
              <div className="text-[11.5px] text-si-muted mt-0.5">{o.detail}</div>
            </div>
            <div className="font-mono text-[11px] text-si-muted">{o.status}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
