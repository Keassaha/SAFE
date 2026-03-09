"use client";

import Link from "next/link";
import { ChartBillableHours } from "./ChartBillableHours";
import { Maximize2, Briefcase, FileText, Users } from "lucide-react";
import { routes } from "@/lib/routes";

interface DossierOuClient {
  id: string;
  label: string;
  value: string;
  href: string;
  type?: "dossier" | "client";
}

interface DashboardCategoryCardProps {
  billedPercent: number;
  items: DossierOuClient[];
  title?: string;
  subtitle?: string;
}

const iconByType = { dossier: Briefcase, client: Users };
const defaultIcon = FileText;

export function DashboardCategoryCard({
  billedPercent,
  items,
  title = "Répartition",
  subtitle = "Heures facturables",
}: DashboardCategoryCardProps) {
  return (
    <div className="card-glass overflow-hidden p-5 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold safe-text-title">{title}</h3>
          <p className="text-xs safe-text-secondary mt-0.5">{subtitle}</p>
        </div>
        <Link
          href={routes.temps}
          className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-300 flex items-center justify-center transition-colors text-[var(--safe-icon-default)] hover:text-green-800"
          aria-label="Voir fiches de temps"
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      </div>
      <div className="mb-4 h-36 flex items-center justify-center">
        <ChartBillableHours billedPercent={billedPercent} label="" />
      </div>
      <div className="space-y-2">
        {items.slice(0, 4).map((item) => {
          const Icon = (item.type && iconByType[item.type]) || defaultIcon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 transition-colors border border-transparent hover:border-[var(--safe-neutral-border)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0 text-[var(--safe-icon-default)]">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium safe-text-title truncate">
                    {item.label}
                  </p>
                  <p className="text-xs safe-text-secondary">{item.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
