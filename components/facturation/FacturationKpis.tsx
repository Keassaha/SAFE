"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  Percent,
} from "lucide-react";
import type { InvoiceStatut } from "@prisma/client";

export interface FacturationKpisData {
  totalFactureMois: number;
  totalEncaisseMois: number;
  enRetardCount: number;
  enRetardSum: number;
  brouillonsCount: number;
  tauxEncaissement?: number;
}

interface FacturationKpisProps {
  kpis: FacturationKpisData;
  currentStatut?: InvoiceStatut | null;
}

const CARD_BASE =
  "relative overflow-hidden rounded-xl border border-[var(--safe-neutral-border)] bg-white shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2";

function KpiCard({
  card,
  kpis,
  currentStatut,
  pathname,
  isActive,
}: {
  card: {
    key: keyof FacturationKpisData;
    statut: "" | InvoiceStatut;
    label: string;
    icon: typeof DollarSign;
    valueColor: string;
    href: string;
    getValue: (k: FacturationKpisData) => string | number;
  };
  kpis: FacturationKpisData;
  currentStatut: InvoiceStatut | null;
  pathname: string;
  isActive: boolean;
}) {
  const Icon = card.icon;
  return (
    <Link
      href={card.href}
      className={`${CARD_BASE} ${isActive ? "ring-2 ring-primary-500 ring-offset-2" : ""}`}
    >
      <div className="pt-4 pb-4 px-4 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wide">
            {card.label}
          </p>
          <p
            className={`text-xl md:text-2xl font-bold tracking-tight truncate ${card.valueColor}`}
          >
            {card.getValue(kpis)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-neutral-100 text-[var(--safe-text-secondary)] shrink-0">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </Link>
  );
}

export function FacturationKpis({ kpis, currentStatut = null }: FacturationKpisProps) {
  const pathname = usePathname();
  const tf = useTranslations("facturation");

  const CE_MOIS_CARDS: {
    key: keyof FacturationKpisData;
    statut: "" | InvoiceStatut;
    label: string;
    icon: typeof DollarSign;
    valueColor: string;
    href: string;
    getValue: (k: FacturationKpisData) => string | number;
  }[] = [
    {
      key: "totalFactureMois",
      statut: "",
      label: tf("billedThisMonth"),
      icon: DollarSign,
      valueColor: "text-status-success",
      href: "/facturation",
      getValue: (k) => formatCurrency(k.totalFactureMois),
    },
    {
      key: "totalEncaisseMois",
      statut: "payee",
      label: tf("collectedThisMonth"),
      icon: TrendingUp,
      valueColor: "text-status-success",
      href: "/facturation?statut=payee",
      getValue: (k) => formatCurrency(k.totalEncaisseMois),
    },
    {
      key: "tauxEncaissement",
      statut: "",
      label: tf("collectionRate"),
      icon: Percent,
      valueColor: "text-[var(--safe-text-title)]",
      href: "/facturation",
      getValue: (k) =>
        typeof k.tauxEncaissement === "number" ? `${k.tauxEncaissement}%` : "—",
    },
  ];

  const ALERTES_CARDS: {
    key: keyof FacturationKpisData;
    statut: "" | InvoiceStatut;
    label: string;
    icon: typeof AlertCircle;
    valueColor: string;
    href: string;
    getValue: (k: FacturationKpisData) => string | number;
  }[] = [
    {
      key: "enRetardCount",
      statut: "en_retard",
      label: tf("overdue"),
      icon: AlertCircle,
      valueColor: "text-status-error",
      href: "/facturation?statut=en_retard",
      getValue: (k) =>
        `${k.enRetardCount} facture${k.enRetardCount !== 1 ? "s" : ""} — ${formatCurrency(k.enRetardSum)}`,
    },
    {
      key: "brouillonsCount",
      statut: "brouillon",
      label: tf("drafts"),
      icon: FileText,
      valueColor: "text-[var(--safe-text-secondary)]",
      href: "/facturation?statut=brouillon",
      getValue: (k) =>
        `${k.brouillonsCount} facture${k.brouillonsCount !== 1 ? "s" : ""}`,
    },
  ];

  const isActive = (statut: "" | InvoiceStatut) =>
    statut === ""
      ? !currentStatut && pathname === "/facturation"
      : currentStatut === statut;

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-sm font-semibold text-[var(--safe-text-secondary)] uppercase tracking-wider mb-3">
          {tf("monthSummary")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CE_MOIS_CARDS.map((card) => (
            <KpiCard
              key={card.key}
              card={card}
              kpis={kpis}
              currentStatut={currentStatut ?? null}
              pathname={pathname}
              isActive={isActive(card.statut)}
            />
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold text-[var(--safe-text-secondary)] uppercase tracking-wider mb-3">
          {tf("toWatch")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 max-w-2xl">
          {ALERTES_CARDS.map((card) => (
            <KpiCard
              key={card.key}
              card={card}
              kpis={kpis}
              currentStatut={currentStatut ?? null}
              pathname={pathname}
              isActive={isActive(card.statut)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
