"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import {
  DollarSign,
  Send,
  FileCheck,
  AlertCircle,
  Percent,
  User,
  FolderOpen,
} from "lucide-react";
import { routes } from "@/lib/routes";

export interface FacturationMainKpisData {
  facturablesCount: number;
  facturablesSum: number;
  envoyeesCount: number;
  envoyeesSum: number;
  verificationCount: number;
  enRetardCount: number;
  enRetardSum: number;
  tauxEncaissement: number | undefined;
}

interface FacturationMainKpisProps {
  kpis: FacturationMainKpisData;
}

const CARD_BASE =
  "relative overflow-hidden rounded-safe border border-[var(--safe-neutral-border)] bg-white shadow-sm transition-all hover:shadow-md";

export function FacturationMainKpis({ kpis }: FacturationMainKpisProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tFacturation = useTranslations("facturation");
  const isRetard = searchParams.get("retard") === "1";

  const CARDS: {
    key: keyof FacturationMainKpisData;
    label: string;
    sublabel?: string;
    icon: typeof DollarSign;
    valueColor: string;
    href: string;
    getValue: (k: FacturationMainKpisData) => string;
    getSub?: (k: FacturationMainKpisData) => string;
    subPrefixKey?: string;
  }[] = [
    {
      key: "facturablesSum",
      label: tFacturation("billable"),
      icon: DollarSign,
      valueColor: "text-status-success",
      href: routes.facturationHonoraires,
      getValue: (k) => `${k.facturablesCount}`,
      getSub: (k) => formatCurrency(k.facturablesSum),
      subPrefixKey: "amountLabel",
    },
    {
      key: "envoyeesSum",
      label: tFacturation("sent"),
      icon: Send,
      valueColor: "text-amber-600",
      href: routes.facturationSuivi,
      getValue: (k) => `${k.envoyeesCount}`,
      getSub: (k) => formatCurrency(k.envoyeesSum),
    },
    {
      key: "verificationCount",
      label: tFacturation("verification"),
      sublabel: tFacturation("pendingApproval"),
      icon: FileCheck,
      valueColor: "text-amber-600",
      href: routes.facturationVerification,
      getValue: (k) => `${k.verificationCount}`,
      getSub: () => tFacturation("pendingApproval"),
    },
    {
      key: "enRetardSum",
      label: tFacturation("overdue"),
      icon: AlertCircle,
      valueColor: "text-status-error",
      href: "/facturation/suivi?retard=1",
      getValue: (k) => `${k.enRetardCount}`,
      getSub: (k) => formatCurrency(k.enRetardSum),
    },
    {
      key: "tauxEncaissement",
      label: tFacturation("collectionRate"),
      sublabel: tFacturation("paidIssued"),
      icon: Percent,
      valueColor: "text-[var(--safe-text-title)]",
      href: routes.facturationPaiements,
      getValue: (k) =>
        typeof k.tauxEncaissement === "number" ? `${k.tauxEncaissement} %` : "—",
      getSub: () => tFacturation("paidIssued"),
    },
  ];

  const TABS: { label: string; href: string; count?: keyof FacturationMainKpisData; icon: typeof User }[] = [
    { label: tFacturation("honorairesLabel"), href: routes.facturationHonoraires, count: "facturablesCount", icon: User },
    { label: tFacturation("verification"), href: routes.facturationVerification, count: "verificationCount", icon: FileCheck },
    { label: tFacturation("followUp"), href: routes.facturationSuivi, count: "envoyeesCount", icon: Send },
    { label: tFacturation("overdue"), href: "/facturation/suivi?retard=1", count: "enRetardCount", icon: AlertCircle },
    { label: tFacturation("deposits"), href: routes.facturationPaiements, icon: FolderOpen },
  ];

  const isTabActive = (tab: (typeof TABS)[0]) => {
    const base = tab.href.split("?")[0];
    if (tab.label === tFacturation("overdue")) return pathname === base && isRetard;
    if (tab.label === tFacturation("followUp")) return pathname === base && !isRetard;
    return pathname === base || pathname.startsWith(base + "/");
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.key} href={card.href} className={CARD_BASE}>
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
                  {(card.getSub || card.sublabel) && (
                    <p className="text-xs text-[var(--safe-text-secondary)]">
                      {card.getSub
                        ? (card.subPrefixKey
                          ? `${tFacturation(card.subPrefixKey)} : ${card.getSub(kpis)}`
                          : card.getSub(kpis))
                        : card.sublabel}
                    </p>
                  )}
                </div>
                <div className="p-2 rounded-safe-sm bg-neutral-100 text-[var(--safe-text-secondary)] shrink-0">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <nav
        className="flex flex-wrap items-center gap-1 p-2 rounded-safe bg-white border border-[var(--safe-neutral-border)] shadow-sm"
        aria-label={tFacturation("billingTabs")}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = tab.count ? kpis[tab.count] : undefined;
          const active = isTabActive(tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-safe-sm text-sm font-medium transition-colors
                ${active
                  ? "bg-[var(--safe-green-100)] text-[var(--safe-text-title)] border border-[var(--safe-neutral-border)] shadow-sm"
                  : "text-[var(--safe-neutral-700)] hover:bg-neutral-100 hover:text-[var(--safe-text-title)]"}
              `}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{tab.label}</span>
              {typeof count === "number" && (
                <span className={active ? "text-xs text-[var(--safe-text-secondary)]" : "text-xs text-[var(--safe-neutral-500)]"}>({count})</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
