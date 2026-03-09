"use client";

import { Landmark, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { RapportFideicommisSummary } from "@/lib/rapports/types";

interface RapportFideicommisSectionProps {
  data: RapportFideicommisSummary;
}

export function RapportFideicommisSection({ data }: RapportFideicommisSectionProps) {
  const cards = [
    {
      title: "Dépôts (période)",
      value: formatCurrency(data.depots),
      icon: ArrowDownCircle,
      className: "border-l-emerald-500",
    },
    {
      title: "Utilisations (période)",
      value: formatCurrency(data.utilisations),
      icon: ArrowUpCircle,
      className: "border-l-amber-500",
    },
    {
      title: "Solde fidéicommis",
      value: formatCurrency(data.solde),
      icon: Wallet,
      className: "border-l-blue-500",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold safe-text-title flex items-center gap-2">
        <Landmark className="w-4 h-4" aria-hidden />
        Rapport fidéicommis
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className={`card-glass overflow-hidden p-5 border-l-4 ${c.className}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium safe-text-secondary uppercase tracking-wider">
                  {c.title}
                </span>
                <Icon className="w-5 h-5 text-[var(--safe-text-secondary)]" aria-hidden />
              </div>
              <p className="text-xl font-bold safe-text-title tabular-nums">{c.value}</p>
            </div>
          );
        })}
      </div>
      <p className="text-xs safe-text-secondary">
        {data.transactionsCount} transaction(s) sur la période.
      </p>
    </div>
  );
}
