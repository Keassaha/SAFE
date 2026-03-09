"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { User, FolderOpen, Receipt } from "lucide-react";
import { tMicro } from "@/lib/motion";

export type ClientProfileTabId = "overview" | "cases" | "financier";

interface TabConfig {
  id: ClientProfileTabId;
  labelKey: string;
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface ClientProfileTabsProps {
  tabs: TabConfig[];
  activeTab: ClientProfileTabId;
  onTabChange: (tab: ClientProfileTabId) => void;
}

export function ClientProfileTabs({ tabs, activeTab, onTabChange }: ClientProfileTabsProps) {
  const t = useTranslations("clients");

  return (
    <nav
      className="relative flex gap-1 border-b border-neutral-border"
      aria-label={t("profileSections")}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium -mb-px transition-colors duration-200 ${
              isActive
                ? "text-primary-700"
                : "text-neutral-muted hover:text-neutral-text-secondary"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="client-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t"
                transition={tMicro}
                aria-hidden
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{t(tab.labelKey as any)}</span>
            {tab.count != null && (
              <span className="text-neutral-muted relative z-10">({tab.count})</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export const DEFAULT_PROFILE_TABS: TabConfig[] = [
  { id: "overview", labelKey: "overviewTab", icon: User },
  { id: "cases", labelKey: "casesTab", icon: FolderOpen },
  { id: "financier", labelKey: "financierTab", icon: Receipt },
];
