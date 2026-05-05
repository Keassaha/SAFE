"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import {
  DollarSign,
  Send,
  FileCheck,
  AlertCircle,
  Percent,
} from "lucide-react";

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
  "relative overflow-hidden rounded-safe border border-[var(--safe-neutral-border)] bg-white shadow-sm transition-all hover:shadow-md hover:border-[var(--safe-green-700)]";

const CARD_ACTIVE =
  "ring-2 ring-[var(--safe-green-700)] border-[var(--safe-green-700)]";

/**
 * Unified KPI strip. Each tile is a clickable filter on the current page:
 * updates the ?statut= URL param to drive the main invoice table filter.
 * No sub-page navigation — stays in the unified view.
 */
export function FacturationMainKpis({ kpis }: FacturationMainKpisProps) {
  const searchParams = useSearchParams();
  const tFacturation = useTranslations("facturation");
  const currentStatut = searchParams.get("statut") ?? "";

  /** Build /facturation URL with a specific statut filter */
  const linkWithStatut = (statut: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (statut) params.set("statut", statut);
    else params.delete("statut");
    const qs = params.toString();
    return qs ? `/facturation?${qs}` : "/facturation";
  };

  const CARDS: {
    key: keyof FacturationMainKpisData;
    label: string;
    icon: typeof DollarSign;
    valueColor: string;
    href: string;
    statutFilter: string;
    getValue: (k: FacturationMainKpisData) => string;
    getSub?: (k: FacturationMainKpisData) => string;
    subPrefixKey?: string;
  }[] = [
    {
      key: "facturablesSum",
      label: tFacturation("billable"),
      icon: DollarSign,
      valueColor: "text-status-success",
      href: "/facturation#facturables",
      statutFilter: "", // ancre interne vers la section "Facturables par client"
      getValue: (k) => `${k.facturablesCount}`,
      getSub: (k) => formatCurrency(k.facturablesSum),
      subPrefixKey: "amountLabel",
    },
    {
      key: "verificationCount",
      label: tFacturation("verification"),
      icon: FileCheck,
      valueColor: "text-amber-600",
      href: linkWithStatut("brouillon"),
      statutFilter: "brouillon",
      getValue: (k) => `${k.verificationCount}`,
      getSub: () => tFacturation("pendingApproval"),
    },
    {
      key: "envoyeesSum",
      label: tFacturation("sent"),
      icon: Send,
      valueColor: "text-blue-600",
      href: linkWithStatut("envoyee"),
      statutFilter: "envoyee",
      getValue: (k) => `${k.envoyeesCount}`,
      getSub: (k) => formatCurrency(k.envoyeesSum),
    },
    {
      key: "enRetardSum",
      label: tFacturation("overdue"),
      icon: AlertCircle,
      valueColor: "text-status-error",
      href: linkWithStatut("en_retard"),
      statutFilter: "en_retard",
      getValue: (k) => `${k.enRetardCount}`,
      getSub: (k) => formatCurrency(k.enRetardSum),
    },
    {
      key: "tauxEncaissement",
      label: tFacturation("collectionRate"),
      icon: Percent,
      valueColor: "text-[var(--safe-text-title)]",
      href: linkWithStatut(""),
      statutFilter: "",
      getValue: (k) =>
        typeof k.tauxEncaissement === "number" ? `${k.tauxEncaissement} %` : "—",
      getSub: () => tFacturation("paidIssued"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const isActive =
          card.statutFilter !== "" && currentStatut === card.statutFilter;
        return (
          <Link
            key={card.key}
            href={card.href}
            className={`${CARD_BASE} ${isActive ? CARD_ACTIVE : ""}`}
            aria-pressed={isActive || undefined}
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
                {card.getSub && (
                  <p className="text-xs text-[var(--safe-text-secondary)]">
                    {card.subPrefixKey
                      ? `${tFacturation(card.subPrefixKey)} : ${card.getSub(kpis)}`
                      : card.getSub(kpis)}
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
  );
}
