"use client";

import Link from "next/link";
import { DollarSign, BarChart3, Clock } from "lucide-react";

interface DashboardHeroCardProps {
  soldeFiduciaire: string;
  libelle?: string;
}

export function DashboardHeroCard({
  soldeFiduciaire,
  libelle = "Solde fiduciaire",
}: DashboardHeroCardProps) {
  return (
    <div className="card-glass overflow-hidden p-5 md:p-6">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold safe-text-title">{libelle}</h3>
          <p className="text-xs safe-text-secondary mt-0.5">SAFE</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-[var(--safe-icon-default)] shrink-0">
          <DollarSign className="w-5 h-5" aria-hidden />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-bold safe-text-metric tracking-tight">
        {soldeFiduciaire}
      </p>
      <p className="text-sm safe-text-secondary flex items-center gap-2 mt-1">
        <span className="w-2 h-2 rounded-full bg-status-success" aria-hidden />
        Actif
      </p>
      <div className="flex items-center gap-2 mt-6">
        <Link
          href="/rapports"
          className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-green-50 border border-green-600/30 text-green-900 hover:bg-green-100 transition-colors text-xs font-medium"
        >
          <BarChart3 className="w-4 h-4" aria-hidden />
          Rapports
        </Link>
        <Link
          href="/temps"
          className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-green-50 border border-green-600/30 text-green-900 hover:bg-green-100 transition-colors text-xs font-medium"
        >
          <Clock className="w-4 h-4" aria-hidden />
          Fiche de temps
        </Link>
      </div>
    </div>
  );
}
