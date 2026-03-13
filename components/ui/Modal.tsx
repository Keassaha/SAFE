"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { overlayVariants, panelVariants } from "@/lib/motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Classe CSS pour la largeur du panneau (ex. max-w-2xl pour formulaires larges) */
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  const t = useTranslations("ui");
  useEffect(() => {
    if (open) {
      const onEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onEscape);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onEscape);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open, onClose]);

  // Restore body scroll on unmount (e.g. navigation while modal open)
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const content = (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative z-10 w-full ${maxWidth} rounded-2xl bg-white shadow-xl border border-[var(--safe-neutral-border)] max-h-[90vh] overflow-auto`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--safe-neutral-border)]">
              <h2 id="modal-title" className="text-lg font-semibold safe-text-title">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)] p-1 rounded-lg transition-colors duration-200"
                aria-label={t("close")}
              >
                ×
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
