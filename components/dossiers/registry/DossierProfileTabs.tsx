"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { FolderSearch, Wallet, StickyNote, LayoutDashboard, Receipt } from "lucide-react";
import { tMicro } from "@/lib/motion";

export type DossierProfileTabId =
  | "overview"
  | "procedures"
  | "time"
  | "debours"
  | "notes";

interface TabConfig {
  id: DossierProfileTabId;
  label: string;
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface DossierProfileTabsProps {
  tabs: TabConfig[];
  activeTab: DossierProfileTabId;
  onTabChange: (tab: DossierProfileTabId) => void;
}

export function DossierProfileTabs({
  tabs,
  activeTab,
  onTabChange,
}: DossierProfileTabsProps) {
  const t = useTranslations("matters");

  return (
    <nav
      className="relative flex gap-1 border-b border-neutral-border overflow-x-auto"
      aria-label={t("matterSections")}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium -mb-px transition-colors duration-200 whitespace-nowrap ${
              isActive
                ? "text-primary-700"
                : "text-neutral-muted hover:text-neutral-text-secondary"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="dossier-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t"
                transition={tMicro}
                aria-hidden
              />
            )}
            <Icon className="w-4 h-4 shrink-0 relative z-10" />
            <span className="relative z-10">{tab.label}</span>
            {tab.count != null && (
              <span className="text-neutral-muted relative z-10">({tab.count})</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function useDefaultDossierTabs(): TabConfig[] {
  const t = useTranslations("matters");
  return [
    { id: "overview", label: t("tabOverview"), icon: LayoutDashboard },
    { id: "procedures", label: t("tabProcedures"), icon: FolderSearch },
    { id: "time", label: t("tabTime"), icon: Wallet },
    { id: "debours", label: t("tabDisbursements"), icon: Receipt },
    { id: "notes", label: t("tabNotes"), icon: StickyNote },
  ];
}

export const DEFAULT_DOSSIER_TABS: TabConfig[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "procedures", label: "Procédures & documents", icon: FolderSearch },
  { id: "time", label: "Temps", icon: Wallet },
  { id: "debours", label: "Débours", icon: Receipt },
  { id: "notes", label: "Notes", icon: StickyNote },
];
