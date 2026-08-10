"use client";

import React, { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Classe CSS de largeur, conservée pour la compatibilité des formulaires. */
  maxWidth?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  const t = useTranslations("ui");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [closeOnEscape, onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Voile : il recouvre tout le travail et l'éteint. Il ne présente pas
          l'arrière-plan, il signale qu'il est hors d'atteinte. */}
      <div
        className="safe-scrim absolute inset-0"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden
      />
      {/* Plan 3, niveau focus : le panneau recouvre le canvas et réclame une
          décision. Le niveau focus est le plus opaque des trois verres, la
          lisibilité du contenu prime sur l'effet de matière. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`safe-glass-focus relative z-10 max-h-[95dvh] w-full overflow-auto rounded-t-xl border outline-none sm:max-h-[90vh] sm:rounded-xl ${maxWidth}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-si-line bg-[var(--glass-3-bg)] px-4 py-3 sm:px-6">
          <h2 id={titleId} className="truncate pr-2 font-serif text-xl leading-tight text-si-ink">
            {title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("close")} className="-mr-2 shrink-0">
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </div>
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
