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
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg"
        style={
          focus
            ? { backgroundColor: "#1F3A2E", color: "#fff" }
            : { backgroundColor: "#fff", color: "#1F3A2E", border: "1px solid #CDE0D4" }
        }
        aria-pressed={focus}
      >
        {focus ? <X className="h-4 w-4" aria-hidden /> : <Target className="h-4 w-4" aria-hidden />}
        {focus ? t("exitFocus") : t("focusMode")}
      </button>
    </div>
  );
}
