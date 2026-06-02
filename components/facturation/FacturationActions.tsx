"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { NewInvoiceChoiceModal } from "./NewInvoiceChoiceModal";
import {
  Plus,
  ChevronDown,
  Wrench,
  FileMinus,
  Receipt,
  Bell,
  Download,
  Settings,
} from "lucide-react";
import { routes } from "@/lib/routes";

interface FacturationActionsProps {
  /** When forfait, the "from registre" path is prioritized in the modal */
  billingMode?: "forfait" | "horaire" | "mixed";
}

export function FacturationActions({ billingMode = "horaire" }: FacturationActionsProps) {
  const t = useTranslations("billingCompUi");
  const [showModal, setShowModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const menuItemClass =
    "flex items-center gap-3 w-full px-3 py-2 text-sm text-left text-neutral-700 hover:bg-neutral-50 transition-colors";

  return (
    <div className="flex items-center gap-2">
      {/* Outils dropdown */}
      <div className="relative" ref={menuRef}>
        <Button
          variant="secondary"
          onClick={() => setMenuOpen((v) => !v)}
          className="gap-2"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <Wrench className="h-4 w-4" aria-hidden />
          {t("tools")}
          <ChevronDown className={`h-3 w-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} aria-hidden />
        </Button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 rounded-safe bg-white border border-[var(--safe-neutral-border)] shadow-lg z-20 py-1 animate-fade-in"
          >
            <Link href={routes.facturationNotesCredit} className={menuItemClass} onClick={closeMenu} role="menuitem">
              <FileMinus className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">{t("creditNotes")}</span>
            </Link>
            <Link href={routes.facturationFrais} className={menuItemClass} onClick={closeMenu} role="menuitem">
              <Receipt className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">{t("disbursementsRegister")}</span>
            </Link>
            <Link href={`${routes.facturationSuivi}?retard=1`} className={menuItemClass} onClick={closeMenu} role="menuitem">
              <Bell className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">{t("remindersAndOverdue")}</span>
            </Link>

            <div className="my-1 h-px bg-neutral-100" />

            <button
              type="button"
              className={`${menuItemClass} opacity-50 cursor-not-allowed`}
              disabled
              title={t("comingSoon")}
              role="menuitem"
            >
              <Download className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">{t("exportCsvPdf")}</span>
              <span className="text-[10px] uppercase tracking-wide text-neutral-400">{t("soonBadge")}</span>
            </button>
            <button
              type="button"
              className={`${menuItemClass} opacity-50 cursor-not-allowed`}
              disabled
              title={t("comingSoon")}
              role="menuitem"
            >
              <Settings className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">{t("billingSettings")}</span>
              <span className="text-[10px] uppercase tracking-wide text-neutral-400">{t("soonBadge")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary action */}
      <Button variant="primary" onClick={() => setShowModal(true)} className="gap-2">
        <Plus className="h-4 w-4" aria-hidden />
        {t("createInvoice")}
      </Button>

      <NewInvoiceChoiceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        preferRegistre={billingMode === "forfait"}
      />
    </div>
  );
}
