"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
          Outils
          <ChevronDown className={`h-3 w-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} aria-hidden />
        </Button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 rounded-safe bg-white border border-[var(--safe-neutral-border)] shadow-lg z-20 py-1 animate-fade-in"
          >
            <Link href={routes.facturationNotesCredit} className={menuItemClass} onClick={closeMenu} role="menuitem">
              <FileMinus className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">Notes de crédit</span>
            </Link>
            <Link href={routes.facturationFrais} className={menuItemClass} onClick={closeMenu} role="menuitem">
              <Receipt className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">Registre des débours</span>
            </Link>
            <Link href={`${routes.facturationSuivi}?retard=1`} className={menuItemClass} onClick={closeMenu} role="menuitem">
              <Bell className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">Rappels & retards</span>
            </Link>

            <div className="my-1 h-px bg-neutral-100" />

            <button
              type="button"
              className={`${menuItemClass} opacity-50 cursor-not-allowed`}
              disabled
              title="Bientôt disponible"
              role="menuitem"
            >
              <Download className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">Export CSV / PDF</span>
              <span className="text-[10px] uppercase tracking-wide text-neutral-400">soon</span>
            </button>
            <button
              type="button"
              className={`${menuItemClass} opacity-50 cursor-not-allowed`}
              disabled
              title="Bientôt disponible"
              role="menuitem"
            >
              <Settings className="h-4 w-4 text-neutral-400" aria-hidden />
              <span className="flex-1">Paramètres facturation</span>
              <span className="text-[10px] uppercase tracking-wide text-neutral-400">soon</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary action */}
      <Button variant="primary" onClick={() => setShowModal(true)} className="gap-2">
        <Plus className="h-4 w-4" aria-hidden />
        Facturer
      </Button>

      <NewInvoiceChoiceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        preferRegistre={billingMode === "forfait"}
      />
    </div>
  );
}
