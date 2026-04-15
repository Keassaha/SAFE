"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const dragY = useMotionValue(0);
  const dragOpacity = useTransform(dragY, [0, 300], [1, 0.2]);

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

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  const content = (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4"
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
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // Mobile swipe-to-dismiss
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            style={{ y: dragY, opacity: dragOpacity }}
            className={`relative z-10 w-full ${maxWidth} bg-white shadow-xl border border-[var(--safe-neutral-border)] max-h-[95dvh] sm:max-h-[90vh] overflow-auto rounded-t-2xl sm:rounded-safe-md`}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-2 pb-0 sticky top-0 z-20 bg-white rounded-t-2xl">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--safe-neutral-border)] sticky top-0 sm:top-0 z-10 bg-white sm:rounded-t-safe-md rounded-t-2xl">
              <h2 id="modal-title" className="text-base sm:text-lg font-semibold safe-text-title tracking-tight pr-2 truncate">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)] p-2 -mr-1 rounded-safe-sm transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={t("close")}
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
