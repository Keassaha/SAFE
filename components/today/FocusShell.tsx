"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Target, X } from "lucide-react";

/**
 * Mode focus (TDAH) : un toggle flottant qui masque tout sauf l'action unique
 * (les sections marquées `.today-dimmable` sont cachées via globals.css).
 */
export function FocusShell({ children }: { children: ReactNode }) {
  const t = useTranslations("todayUi");
  const [focus, setFocus] = useState(false);
  return (
    <div data-today-focus={focus ? "on" : "off"}>
      {children}
      <button
        type="button"
        onClick={() => setFocus((f) => !f)}
        /* Le widget d'aide est global et occupe déjà le coin inférieur droit.
           Le mode focus ne concerne que cette page : il se range au-dessus de
           lui plutôt que de le recouvrir. Les deux restaient superposés et
           l'un masquait l'autre. */
        className="fixed bottom-[4.75rem] right-5 z-50 inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg"
        style={
          focus
            ? { backgroundColor: "var(--si-ink-strong)", color: "#fff" }
            : { backgroundColor: "#fff", color: "var(--si-ink-strong)", border: "1px solid #CDE0D4" }
        }
        aria-pressed={focus}
      >
        {focus ? <X className="h-4 w-4" aria-hidden /> : <Target className="h-4 w-4" aria-hidden />}
        {focus ? t("exitFocus") : t("focusMode")}
      </button>
    </div>
  );
}
