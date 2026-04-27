"use client";


import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ChevronRight,
  Shield,
  TrendingUp,
  Wallet,
  Receipt,
  Clock,
} from "lucide-react";
import { useSafeMotion, staggerContainer, staggerItem } from "@/lib/motion";
import { routes } from "@/lib/routes";
import type {
  DashboardPayload,
  DossierEvolutionItem,
  DossierEtape,
  OutstandingAccountRow,
  MonthlyComparisonRow,
  LawyerProductivityRow,
  TrustReconciliationSummary,
} from "@/lib/dashboard/types";

export interface DashboardViewProps {
  payload: DashboardPayload;
}

/* ────────────────────────────────────────────────────────────── */
/*  Design tokens — "Éditorial Chaleureux"                        */
/* ────────────────────────────────────────────────────────────── */

const T = {
  page: "#F7F2E8",
  surface: "#FCFAF4",
  borderSubtle: "#EDE5D4",
  borderStrong: "#D4C8B0",

  brand50: "#EEF5F0",
  brand100: "#D4E8D9",
  brand600: "#2B4A3E",
  brand700: "#234539",
  brand800: "#1F3A2E",

  gold50: "#FEF6E3",
  gold400: "#F5C96B",
  gold500: "#F4A045",
  gold700: "#A8611C",

  textTitle: "#18181B",
  textBody: "#3F3F46",
  textMuted: "#71717A",
  textFaint: "#A1A1AA",

  successBg: "#D4E8D9",
  successFg: "#1F3A2E",
  warningBg: "#F5E6C8",
  warningFg: "#8B6B1F",
  dangerBg: "#F3D8D2",
  dangerFg: "#8A3A2D",

  credit: "#1F3A2E",
  debit: "#B84A3E",
  pending: "#BA7517",
  neutral: "#6B6B66",
} as const;

/* ────────────────────────────────────────────────────────────── */
/*  Atoms                                                          */
/* ────────────────────────────────────────────────────────────── */

function Eyebrow({
  children,
  gold = false,
  className = "",
}: {
  children: React.ReactNode;
  gold?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`text-[10.5px] font-sans uppercase tracking-[0.12em] font-semibold ${className}`}
      style={{ color: gold ? T.gold700 : T.textMuted }}
    >
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  title,
  gold,
  right,
}: {
  eyebrow: string;
  title: string;
  gold?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <Eyebrow gold={gold} className="block mb-1">
          {eyebrow}
        </Eyebrow>
        <h2 className="text-[22px] font-sans font-semibold leading-[1.15] tracking-tight safe-text-title">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

function Card({
  children,
  className = "",
  href,
  interactive = true,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  interactive?: boolean;
}) {
  // Adopts the Clients-page shell: white bg, rounded-20px, soft green border (#d0ddd6),
  // soft shadow, translateY(-2px) + shadow-card-hover on hover.
  const base = `card-glass overflow-hidden ${interactive ? "safe-hover-lift" : ""}`;
  if (href) {
    return (
      <Link href={href} className={`group block ${base} ${className}`}>
        {children}
      </Link>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}

function Delta({
  value,
  label,
  invert = false,
}: {
  value?: number;
  label?: string;
  invert?: boolean;
}) {
  if (value === undefined || value === null) return null;
  const up = value > 0;
  const neutral = value === 0;
  const good = invert ? !up : up;
  const color = neutral ? T.neutral : good ? T.credit : T.debit;
  const Icon = neutral ? null : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-mono font-medium tabular-nums"
      style={{ color }}
    >
      {Icon && <Icon className="w-2.5 h-2.5" strokeWidth={2.25} />}
      {neutral ? "—" : `${up ? "+" : ""}${value.toFixed(1).replace(/\.0$/, "")}%`}
      {label && (
        <span className="text-[10.5px] ml-1 font-sans font-normal" style={{ color: T.textMuted }}>
          {label}
        </span>
      )}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Sparkline                                                      */
/* ────────────────────────────────────────────────────────────── */

function Sparkline({
  data,
  color = T.credit,
  width = 96,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  });
  const line = "M" + pts.join(" L");
  const area = `M0,${height} L` + pts.join(" L") + ` L${width},${height} Z`;
  return (
    <svg width={width} height={height} aria-hidden className="shrink-0">
      <path d={area} fill={color} fillOpacity={0.15} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  KPI card                                                       */
/* ────────────────────────────────────────────────────────────── */

function Kpi({
  label,
  value,
  delta,
  deltaLabel,
  invertDelta,
  spark,
  sparkColor,
  sub,
  href,
  icon: Icon,
  iconTone = "default",
}: {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  invertDelta?: boolean;
  spark?: number[];
  sparkColor?: string;
  sub?: React.ReactNode;
  href?: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  iconTone?: "default" | "success" | "gold" | "danger";
}) {
  const iconClass =
    iconTone === "success"
      ? "bg-status-success-bg text-status-success"
      : iconTone === "gold"
        ? "bg-[#FEF6E3] text-[#A8611C]"
        : iconTone === "danger"
          ? "bg-[#F3D8D2] text-[#8A3A2D]"
          : "bg-green-100 text-[var(--safe-icon-default)]";

  return (
    <Card href={href} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold safe-text-secondary uppercase tracking-widest">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold safe-text-metric tracking-tight tabular-nums">
            {value}
          </p>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <Delta value={delta} label={deltaLabel} invert={invertDelta} />
            {sub && <span className="text-[12px] safe-text-secondary">{sub}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {Icon && (
            <div
              className={`w-11 h-11 rounded-safe flex items-center justify-center ${iconClass}`}
            >
              <Icon className="w-5 h-5" aria-hidden />
            </div>
          )}
          {spark && spark.length >= 2 && <Sparkline data={spark} color={sparkColor ?? T.credit} />}
        </div>
      </div>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  6-month chart                                                  */
/* ────────────────────────────────────────────────────────────── */

function SixMonthChart({ rows }: { rows: MonthlyComparisonRow[] }) {
  if (rows.length < 2) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="font-sans text-[13px]" style={{ color: T.textMuted }}>
          Pas assez de données pour tracer la tendance.
        </p>
      </div>
    );
  }
  const w = 720;
  const h = 180;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const maxV = Math.max(...rows.flatMap((r) => [r.invoiced, r.collected]), 1);
  const stepX = innerW / (rows.length - 1);

  const toXY = (v: number, i: number) => {
    const x = padL + i * stepX;
    const y = padT + innerH - (v / maxV) * innerH;
    return [x, y] as const;
  };

  const pathFrom = (fn: (r: MonthlyComparisonRow) => number) =>
    "M" + rows.map((r, i) => toXY(fn(r), i).join(",")).join(" L");

  const pathInvoiced = pathFrom((r) => r.invoiced);
  const pathCollected = pathFrom((r) => r.collected);

  // Area between (invoiced - collected = cash qui dort)
  const gapArea =
    "M" +
    rows.map((r, i) => toXY(r.invoiced, i).join(",")).join(" L") +
    " L" +
    rows
      .slice()
      .reverse()
      .map((r, i) => toXY(r.collected, rows.length - 1 - i).join(","))
      .join(" L") +
    " Z";

  const money = (v: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="px-4 py-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
        {/* grid */}
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={padL}
            x2={w - padR}
            y1={padT + innerH * (1 - p)}
            y2={padT + innerH * (1 - p)}
            stroke={T.borderSubtle}
            strokeWidth="1"
            strokeDasharray="2,3"
          />
        ))}

        {/* gap area — cash qui dort */}
        <path d={gapArea} fill={T.pending} fillOpacity="0.12" />

        {/* invoiced line (dashed) */}
        <path
          d={pathInvoiced}
          fill="none"
          stroke={T.neutral}
          strokeWidth="1.5"
          strokeDasharray="4,3"
          strokeLinecap="round"
        />

        {/* collected line (solid forest) */}
        <path d={pathCollected} fill="none" stroke={T.credit} strokeWidth="2" strokeLinecap="round" />

        {/* points on collected */}
        {rows.map((r, i) => {
          const [x, y] = toXY(r.collected, i);
          return <circle key={`c-${i}`} cx={x} cy={y} r="2.5" fill={T.credit} />;
        })}

        {/* x-axis month labels */}
        {rows.map((r, i) => {
          const x = padL + i * stepX;
          return (
            <text
              key={`lbl-${i}`}
              x={x}
              y={h - 8}
              textAnchor="middle"
              fontSize="10"
              fill={T.textMuted}
              fontFamily="Inter, sans-serif"
            >
              {r.month}
            </text>
          );
        })}

        {/* y-axis max label */}
        <text
          x={padL - 6}
          y={padT + 4}
          textAnchor="end"
          fontSize="10"
          fill={T.textFaint}
          fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        >
          {money(maxV).replace(/\s?\$/, "")}
        </text>
        <text
          x={padL - 6}
          y={padT + innerH}
          textAnchor="end"
          fontSize="10"
          fill={T.textFaint}
          fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        >
          0
        </text>
      </svg>

      {/* legend */}
      <div className="flex items-center gap-5 mt-2 text-[11.5px]" style={{ color: T.textMuted }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-[2px]" style={{ background: T.credit }} />
          Encaissé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-3 h-[2px]"
            style={{ background: T.neutral, borderTop: `1px dashed ${T.neutral}` }}
          />
          Facturé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-2" style={{ background: T.pending, opacity: 0.3 }} />
          <span className="font-sans">cash qui dort</span>
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Aging buckets                                                  */
/* ────────────────────────────────────────────────────────────── */

function agingBuckets(accounts: OutstandingAccountRow[]) {
  const b = {
    "0-30": { clients: new Set<string>(), amount: 0 },
    "30-60": { clients: new Set<string>(), amount: 0 },
    "60-90": { clients: new Set<string>(), amount: 0 },
    "90+": { clients: new Set<string>(), amount: 0 },
  };
  for (const a of accounts) {
    const d = a.daysSinceFirstInvoice;
    const bucket = d <= 30 ? "0-30" : d <= 60 ? "30-60" : d <= 90 ? "60-90" : "90+";
    b[bucket].clients.add(a.clientId);
    b[bucket].amount += a.balanceDue;
  }
  const total = Object.values(b).reduce((s, x) => s + x.amount, 0);
  return { ...b, total };
}

function AgingBuckets({ accounts }: { accounts: OutstandingAccountRow[] }) {
  const buckets = agingBuckets(accounts);
  const money = (v: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(v);

  const cells: Array<{
    key: keyof typeof buckets;
    label: string;
    tone: string;
    ageLabel: string;
  }> = [
    { key: "0-30", label: "0–30 j", tone: T.credit, ageLabel: "Récent" },
    { key: "30-60", label: "30–60 j", tone: T.pending, ageLabel: "Relance" },
    { key: "60-90", label: "60–90 j", tone: T.pending, ageLabel: "Pressant" },
    { key: "90+", label: "90+ j", tone: T.debit, ageLabel: "Critique" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cells.map((c) => {
        const b = buckets[c.key] as { clients: Set<string>; amount: number };
        const pct = buckets.total > 0 ? (b.amount / buckets.total) * 100 : 0;
        return (
          <Card key={c.key} href={routes.facturationSuivi} className="hover:border-forest-600/40">
            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <Eyebrow>{c.label}</Eyebrow>
                <span
                  className="text-[9.5px] font-sans uppercase tracking-[0.08em] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: `${c.tone}12`, color: c.tone }}
                >
                  {c.ageLabel}
                </span>
              </div>
              <div
                className="text-[18px] tabular-nums font-semibold leading-none mb-1"
                style={{ color: c.tone }}
              >
                {money(b.amount)}
              </div>
              <div className="text-[11px] font-sans" style={{ color: T.textMuted }}>
                <span className="tabular-nums" style={{ color: T.textBody }}>
                  {b.clients.size}
                </span>{" "}
                client{b.clients.size > 1 ? "s" : ""} ·{" "}
                <span className="tabular-nums">{pct.toFixed(0)}%</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Pipeline par étape                                             */
/* ────────────────────────────────────────────────────────────── */

function Pipeline({ dossiers }: { dossiers: DossierEvolutionItem[] }) {
  const byEtape: Record<DossierEtape, DossierEvolutionItem[]> = {
    Ouverture: [],
    Exécution: [],
    Finalisation: [],
    Clôture: [],
  };
  for (const d of dossiers) byEtape[d.etape].push(d);

  const medianDays = (arr: DossierEvolutionItem[]) => {
    if (arr.length === 0) return null;
    const ages = arr
      .map((d) => Math.round((Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      .sort((a, b) => a - b);
    const mid = Math.floor(ages.length / 2);
    return ages.length % 2 === 0 ? Math.round((ages[mid - 1] + ages[mid]) / 2) : ages[mid];
  };

  const cols: Array<{ key: DossierEtape; accent: string }> = [
    { key: "Ouverture", accent: T.neutral },
    { key: "Exécution", accent: T.credit },
    { key: "Finalisation", accent: T.pending },
    { key: "Clôture", accent: T.brand800 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cols.map((c) => {
        const list = byEtape[c.key];
        const med = medianDays(list);
        return (
          <Card key={c.key} href={routes.dossiers} className="hover:border-forest-600/40">
            <div className="px-4 py-3.5 flex flex-col gap-2.5 h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: c.accent }}
                  />
                  <span
                    className="text-[11px] font-sans font-semibold"
                    style={{ color: T.textTitle }}
                  >
                    {c.key}
                  </span>
                </div>
                <span
                  className="text-[18px] tabular-nums font-semibold leading-none"
                  style={{ color: c.accent }}
                >
                  {list.length}
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-0.5">
                {list.slice(0, 3).map((d) => (
                  <span
                    key={d.id}
                    className="text-[11px] font-sans truncate"
                    style={{ color: T.textBody }}
                    title={d.intitule}
                  >
                    {d.clientName}
                  </span>
                ))}
                {list.length > 3 && (
                  <span className="text-[10.5px] font-sans" style={{ color: T.textFaint }}>
                    +{list.length - 3} autres
                  </span>
                )}
                {list.length === 0 && (
                  <span
                    className="text-[11px] font-sans"
                    style={{ color: T.textFaint }}
                  >
                    Aucun
                  </span>
                )}
              </div>
              {med !== null && (
                <div
                  className="text-[10.5px] font-sans mt-auto pt-1.5 border-t"
                  style={{ color: T.textMuted, borderColor: T.borderSubtle }}
                >
                  Durée médiane ·{" "}
                  <span className="tabular-nums" style={{ color: T.textBody }}>
                    {med} j
                  </span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Dossiers à risque                                              */
/* ────────────────────────────────────────────────────────────── */

type RiskReason = {
  kind: "immobile" | "deadline" | "checklist";
  label: string;
  tone: string;
};

function detectRisk(d: DossierEvolutionItem): RiskReason | null {
  const immobileDays = Math.round(
    (Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (immobileDays > 30) {
    return { kind: "immobile", label: `Immobile ${immobileDays} j`, tone: T.neutral };
  }
  if (d.nextDeadline) {
    const daysLeft = Math.round(
      (new Date(d.nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft < 0) {
      return { kind: "deadline", label: `En retard ${-daysLeft} j`, tone: T.debit };
    }
    if (daysLeft <= 7) {
      return { kind: "deadline", label: `Échéance dans ${daysLeft} j`, tone: T.pending };
    }
  }
  if (d.taskCount > 0 && d.tasksDone / d.taskCount < 0.5) {
    return {
      kind: "checklist",
      label: `Checklist ${d.tasksDone}/${d.taskCount}`,
      tone: T.pending,
    };
  }
  return null;
}

function RiskTable({ dossiers }: { dossiers: DossierEvolutionItem[] }) {
  const dateShort = (d: Date | string) =>
    new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short" }).format(new Date(d));

  const flagged = dossiers
    .map((d) => ({ d, risk: detectRisk(d) }))
    .filter((x): x is { d: DossierEvolutionItem; risk: RiskReason } => x.risk !== null)
    .sort((a, b) => {
      const order = { deadline: 0, checklist: 1, immobile: 2 } as const;
      return order[a.risk.kind] - order[b.risk.kind];
    })
    .slice(0, 6);

  return (
    <Card>
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${T.borderSubtle}` }}
      >
        <div>
          <h3 className="text-[15px] font-sans font-semibold tracking-tight safe-text-title">
            Dossiers à risque
          </h3>
          <p className="text-[11px] font-sans mt-0.5" style={{ color: T.textMuted }}>
            {flagged.length} dossier{flagged.length > 1 ? "s" : ""} à traiter
          </p>
        </div>
        <Link
          href={routes.dossiers}
          className="text-[11.5px] font-sans font-medium inline-flex items-center gap-1"
          style={{ color: T.brand700 }}
        >
          Tout voir <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      {flagged.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="font-sans text-[13px]" style={{ color: T.textMuted }}>
            Aucun dossier à risque. Bravo.
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: T.borderSubtle }}>
          {flagged.map(({ d, risk }) => (
            <Link
              key={d.id}
              href={routes.dossier(d.id)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-200 hover:bg-primary-50/40 group"
              style={{ borderColor: T.borderSubtle }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-sans font-semibold truncate safe-text-title group-hover:text-primary-700 transition-colors">
                  {d.clientName}
                </p>
                <p
                  className="text-[11px] font-sans truncate"
                  style={{ color: T.textMuted }}
                >
                  {d.intitule}
                </p>
              </div>
              <span
                className="text-[10.5px] font-sans font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                style={{ background: `${risk.tone}14`, color: risk.tone }}
              >
                {risk.label}
              </span>
              <span
                className="text-[10.5px] tabular-nums whitespace-nowrap hidden md:inline"
                style={{ color: T.textMuted }}
              >
                {dateShort(d.updatedAt)}
              </span>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: T.textFaint }} />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Charge par avocat                                              */
/* ────────────────────────────────────────────────────────────── */

function LawyerLoad({
  rows,
  target,
}: {
  rows: LawyerProductivityRow[];
  target: number;
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <div className="px-4 py-8 text-center">
          <p className="font-sans text-[13px]" style={{ color: T.textMuted }}>
            Aucune donnée de productivité disponible.
          </p>
        </div>
      </Card>
    );
  }
  const maxCap = Math.max(target, ...rows.map((r) => r.billableHours));
  return (
    <Card>
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${T.borderSubtle}` }}
      >
        <h3 className="text-[13px] font-sans font-semibold" style={{ color: T.textTitle }}>
          Charge par avocat
        </h3>
        <span className="text-[10.5px] font-sans" style={{ color: T.textMuted }}>
          Cible ·{" "}
          <span className="tabular-nums" style={{ color: T.textBody }}>
            {target} h
          </span>
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: T.borderSubtle }}>
        {rows.slice(0, 6).map((r) => {
          const pct = (r.billableHours / target) * 100;
          const barPct = (r.billableHours / maxCap) * 100;
          const over = pct > 100;
          const low = pct < 60;
          const color = over ? T.debit : low ? T.neutral : T.credit;
          return (
            <div
              key={r.userId}
              className="px-4 py-2.5"
              style={{ borderColor: T.borderSubtle }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[12.5px] font-sans font-medium truncate"
                  style={{ color: T.textTitle }}
                >
                  {r.lawyerName}
                </span>
                <span
                  className="text-[11px] tabular-nums font-medium whitespace-nowrap"
                  style={{ color }}
                >
                  {r.billableHours.toFixed(1)} h{" "}
                  <span style={{ color: T.textMuted }}>/ {target} h</span>
                </span>
              </div>
              <div
                className="relative h-1.5 rounded-full overflow-hidden"
                style={{ background: T.borderSubtle }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{ width: `${Math.min(barPct, 100)}%`, background: color }}
                />
                {/* Target marker */}
                <div
                  className="absolute inset-y-0 w-[1px]"
                  style={{ left: `${(target / maxCap) * 100}%`, background: T.textMuted }}
                />
              </div>
              <div
                className="flex items-center justify-between mt-1 text-[10.5px] font-sans"
                style={{ color: T.textMuted }}
              >
                <span>
                  Taux facturation{" "}
                  <span
                    className="tabular-nums font-medium"
                    style={{ color: T.textBody }}
                  >
                    {r.billingRate.toFixed(0)}%
                  </span>
                </span>
                <span className="font-sans">
                  {over ? "Overbooké" : low ? "De la capacité" : "Bonne cadence"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Main view                                                      */
/* ────────────────────────────────────────────────────────────── */

export function DashboardView({ payload }: DashboardViewProps) {
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-CA" : "fr-CA";
  const money = (n: number, compact = true) =>
    new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: compact ? 0 : 2,
    }).format(n);

  const {
    kpis,
    monthlyComparison,
    outstandingAccounts,
    dossierEvolution,
    lawyerProductivity,
    indicators,
    soldeFideicommis,
    alerts,
    revenueChartData,
    lastReconciliation,
    lawyerHoursTarget,
    activeClientsCount,
    inactiveClientsCount,
    activeDossiersCount,
    dossiersParStatut,
  } = payload;

  const { reduceMotion } = useSafeMotion();
  const containerVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : staggerContainer;
  const itemVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : staggerItem;

  const collectedSpark = revenueChartData.map((p) => p.value);
  const invoicedSpark = revenueChartData.map((p) => p.invoiced ?? 0);

  const totalOutstanding = outstandingAccounts.reduce((s, a) => s + a.balanceDue, 0);

  // Fidé : alerte réelle = (1) jamais réconcilié, OU (2) écart > 0 à la dernière,
  //                      OU (3) dernière réco > 35 jours (B-1 r.5 ≤ 25 j + marge).
  const trustRisk: {
    severity: "danger" | "warn" | "ok";
    label: string;
    detail: string;
  } = (() => {
    if (!lastReconciliation) {
      return {
        severity: "danger",
        label: "Jamais réconcilié",
        detail:
          "Le Règlement B-1 r.5 exige une réconciliation mensuelle dans les 25 jours.",
      };
    }
    if (Math.abs(lastReconciliation.ecart) > 0.01) {
      return {
        severity: "danger",
        label: `Écart de ${new Intl.NumberFormat(intlLocale, { style: "currency", currency: "CAD", maximumFractionDigits: 2 }).format(Math.abs(lastReconciliation.ecart))}`,
        detail: "Écart 3-voies non résolu à la dernière réconciliation.",
      };
    }
    if (lastReconciliation.daysSince > 35) {
      return {
        severity: "warn",
        label: `${lastReconciliation.daysSince} j depuis`,
        detail: "La prochaine réconciliation devrait être en cours.",
      };
    }
    return {
      severity: "ok",
      label: `À jour · ${lastReconciliation.daysSince} j`,
      detail: "",
    };
  })();
  const trustBadCompliance = trustRisk.severity !== "ok";

  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        className="w-full max-w-[1440px] mx-auto pb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col gap-10 px-6 md:px-10 pt-4 pb-8">
          <motion.div variants={itemVariants}>
            <header
              className="dash-header relative overflow-hidden rounded-lg p-8"
              style={{
                background:
                  "linear-gradient(115deg, #0F2A22 0%, #1F3A2E 35%, #234539 65%, #2B6A4E 100%)",
              }}
            >
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-[32px] font-sans font-semibold tracking-tight text-forest-50 leading-[1.15]">
                    Tableau de bord
                  </h1>
                  <p className="mt-1 text-[14px] font-sans text-forest-200">
                    Votre cockpit financier et la production des dossiers, en un clin d&apos;œil.
                  </p>
                </div>
                <Link
                  href={routes.rapports}
                  className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-forest-50 bg-white/10 hover:bg-white/20 transition-colors px-3.5 py-2 rounded-md backdrop-blur-sm border border-white/15"
                >
                  Rapports détaillés
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </header>
          </motion.div>

          {/* ═══════════════════════════════════════════════ */}
          {/*  1 · COCKPIT FINANCIER                          */}
          {/* ═══════════════════════════════════════════════ */}
          <motion.section variants={itemVariants}>
            <SectionHead
              eyebrow="01 · Cockpit financier"
              title="Où est l'argent cette semaine ?"
              gold
              right={
                <Link
                  href={routes.rapports}
                  className="text-[12px] font-sans font-medium inline-flex items-center gap-1"
                  style={{ color: T.brand700 }}
                >
                  Rapports détaillés <ArrowUpRight className="w-3 h-3" />
                </Link>
              }
            />

            {/* 1a · KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Kpi
                label="Revenus · mois"
                value={kpis.revenueThisMonth.value}
                delta={kpis.revenueThisMonth.trend}
                deltaLabel="M-1"
                spark={invoicedSpark}
                href={routes.rapports}
                icon={TrendingUp}
                iconTone="success"
              />
              <Kpi
                label="Encaissé · mois"
                value={kpis.paymentsReceived.value}
                delta={kpis.paymentsReceived.trend}
                deltaLabel="M-1"
                spark={collectedSpark}
                href={routes.facturationPaiements}
                icon={Wallet}
                iconTone="default"
              />
              <Kpi
                label="À recouvrer"
                value={kpis.outstandingInvoices.value}
                sparkColor={T.debit}
                sub={
                  <>
                    <span className="tabular-nums safe-text-title font-semibold">
                      {outstandingAccounts.length}
                    </span>{" "}
                    client{outstandingAccounts.length > 1 ? "s" : ""}
                  </>
                }
                href={routes.facturationSuivi}
                icon={Receipt}
                iconTone="danger"
              />
              <Kpi
                label="Non-facturé qui dort"
                value={kpis.unbilledHoursValue.value}
                sparkColor={T.pending}
                sub={
                  <>
                    <span className="tabular-nums safe-text-title font-semibold">
                      {indicators.unbilledEntries}
                    </span>{" "}
                    entrée{indicators.unbilledEntries > 1 ? "s" : ""}
                  </>
                }
                href={routes.temps}
                icon={Clock}
                iconTone="gold"
              />
            </div>

            {/* 1a-bis · Compteurs opérationnels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Kpi
                label="Clients actifs"
                value={String(activeClientsCount)}
                sub={
                  inactiveClientsCount > 0 ? (
                    <>{inactiveClientsCount} inactif{inactiveClientsCount > 1 ? "s" : ""}</>
                  ) : undefined
                }
                href={routes.clients}
              />
              <Kpi
                label="Clients inactifs"
                value={String(inactiveClientsCount)}
                href={routes.clients}
              />
              <Kpi
                label="Dossiers actifs"
                value={String(activeDossiersCount)}
                sub={
                  dossiersParStatut.en_attente > 0 ? (
                    <>{dossiersParStatut.en_attente} en attente</>
                  ) : dossiersParStatut.ouvert > 0 ? (
                    <>{dossiersParStatut.ouvert} ouvert{dossiersParStatut.ouvert > 1 ? "s" : ""}</>
                  ) : undefined
                }
                href={routes.dossiers}
              />
            </div>

            {/* 1b · Graphique 6 mois + Fidé */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-6">
              <Card>
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: `1px solid ${T.borderSubtle}` }}
                >
                  <div>
                    <h3
                      className="text-[13px] font-sans font-semibold"
                      style={{ color: T.textTitle }}
                    >
                      Facturé vs encaissé · 6 mois
                    </h3>
                    <p
                      className="text-[11px] font-sans mt-0.5"
                      style={{ color: T.textMuted }}
                    >
                      L'écart ambré, c'est ton cash qui dort.
                    </p>
                  </div>
                </div>
                <SixMonthChart rows={monthlyComparison.slice(-6)} />
              </Card>

              {/* Fidéicommis en contexte */}
              <Card
                href={routes.comptes}
                className="hover:border-forest-600/40"
              >
                <div className="px-4 py-3.5 flex flex-col h-full gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" style={{ color: T.brand700 }} />
                      <Eyebrow>Fidéicommis</Eyebrow>
                    </div>
                    {trustRisk.severity === "danger" ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: T.dangerBg, color: T.dangerFg }}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Action requise
                      </span>
                    ) : trustRisk.severity === "warn" ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: T.warningBg, color: T.warningFg }}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        À surveiller
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: T.successBg, color: T.successFg }}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        B-1 r.5 conforme
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[28px] tabular-nums font-semibold leading-none tracking-[-0.01em]"
                    style={{ color: T.gold700 }}
                  >
                    {soldeFideicommis ?? kpis.trustBalance.value}
                  </div>
                  <div
                    className="grid grid-cols-2 gap-3 pt-2.5"
                    style={{ borderTop: `1px solid ${T.borderSubtle}` }}
                  >
                    <div>
                      <Eyebrow>Comptes actifs</Eyebrow>
                      <div
                        className="text-[16px] tabular-nums font-semibold mt-1"
                        style={{ color: T.textTitle }}
                      >
                        {indicators.activeTrustAccounts}
                      </div>
                    </div>
                    <div>
                      <Eyebrow>Dernière réco.</Eyebrow>
                      <div
                        className="text-[13px] font-sans mt-1"
                        style={{
                          color: trustBadCompliance ? T.debit : T.textBody,
                        }}
                      >
                        {trustRisk.label}
                      </div>
                    </div>
                  </div>
                  {trustRisk.detail && (
                    <p
                      className="text-[11px] font-sans leading-[1.4]"
                      style={{
                        color:
                          trustRisk.severity === "danger"
                            ? T.dangerFg
                            : T.warningFg,
                      }}
                    >
                      {trustRisk.detail}
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* 1c · Âge des créances */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-sans font-semibold tracking-tight safe-text-title">
                  Âge des créances
                </h3>
                <span className="text-[11px] font-sans" style={{ color: T.textMuted }}>
                  Total ·{" "}
                  <span
                    className="tabular-nums font-semibold"
                    style={{ color: T.textTitle }}
                  >
                    {money(totalOutstanding)}
                  </span>
                </span>
              </div>
              <AgingBuckets accounts={outstandingAccounts} />
            </div>
          </motion.section>

          {/* ═══════════════════════════════════════════════ */}
          {/*  2 · PRODUCTION DES DOSSIERS                    */}
          {/* ═══════════════════════════════════════════════ */}
          <motion.section variants={itemVariants}>
            <SectionHead
              eyebrow="02 · Production"
              title="Où en sont les dossiers ?"
              gold
              right={
                <Link
                  href={routes.dossiers}
                  className="text-[12px] font-sans font-medium inline-flex items-center gap-1"
                  style={{ color: T.brand700 }}
                >
                  Tous les dossiers <ArrowUpRight className="w-3 h-3" />
                </Link>
              }
            />

            {/* 2a · Pipeline */}
            <div className="mb-4">
              <Pipeline dossiers={dossierEvolution} />
            </div>

            {/* 2b + 2c · À-risque + charge avocat */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RiskTable dossiers={dossierEvolution} />
              <LawyerLoad
                rows={lawyerProductivity}
                target={lawyerHoursTarget ?? 140}
              />
            </div>
          </motion.section>
        </div>
      </motion.div>
    </div>
  );
}
