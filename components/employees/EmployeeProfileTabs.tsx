"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { User, Shield, Wallet, History } from "lucide-react";
import { tMicro } from "@/lib/motion";

export type EmployeeProfileTabId = "info" | "access" | "payroll" | "activity";

interface TabConfig {
  id: EmployeeProfileTabId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: "info", labelKey: "tabInfo", icon: User },
  { id: "access", labelKey: "tabAccess", icon: Shield },
  { id: "payroll", labelKey: "tabPayroll", icon: Wallet },
  { id: "activity", labelKey: "tabActivity", icon: History },
];

interface EmployeeProfileTabsProps {
  tabs?: TabConfig[];
  activeTab: EmployeeProfileTabId;
  onTabChange: (tab: EmployeeProfileTabId) => void;
}

export function EmployeeProfileTabs({
  tabs = TABS,
  activeTab,
  onTabChange,
}: EmployeeProfileTabsProps) {
  const t = useTranslations("employees");

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
                layoutId="employee-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t"
                transition={tMicro}
                aria-hidden
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
