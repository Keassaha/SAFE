"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import s from "../v2.module.css";

/**
 * Tiroir latéral droit (dialog) — même structure DOM que le prototype :
 * drawerLayer > drawerScrim + drawer > header + contenu.
 * Verrouille le scroll du body et se ferme sur Échap.
 */
export function Drawer({
  title,
  context,
  onClose,
  children,
}: {
  title: string;
  /** Petit repère au-dessus du titre (ex. référence du dossier). */
  context?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className={s.drawerLayer}>
      <button
        type="button"
        className={s.drawerScrim}
        aria-label="Fermer"
        onClick={onClose}
      />
      <section
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header>
          <div>
            {context ? <span>{context}</span> : null}
            <h2 id="drawer-title">{title}</h2>
          </div>
          <button
            type="button"
            className={s.iconButton}
            aria-label="Fermer"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
