"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { setDigestPreferenceAction } from "@/app/(app)/mes-heures/actions";

interface Props {
  enabled: boolean;
}

const FOREST = "#1F3A2E";

/** Bascule on/off du digest courriel quotidien (N7b — notifications calmes). */
export function DigestPreferenceToggle({ enabled: initial }: Props) {
  const t = useTranslations("digestUi");
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      try {
        await setDigestPreferenceAction(next);
        router.refresh();
      } catch {
        setEnabled(!next); // rollback
      }
    });
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        {enabled ? (
          <Bell className="h-4 w-4" style={{ color: FOREST }} aria-hidden />
        ) : (
          <BellOff className="h-4 w-4 text-neutral-400" aria-hidden />
        )}
        <div>
          <div className="text-sm font-semibold text-neutral-900">{t("title")}</div>
          <div className="text-xs text-neutral-500">{enabled ? t("onHint") : t("offHint")}</div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={pending}
        onClick={toggle}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
        style={{ backgroundColor: enabled ? FOREST : "#D4D4D8" }}
      >
        <span
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: enabled ? "translateX(22px)" : "translateX(2px)" }}
        />
        {pending ? (
          <Loader2 className="absolute -right-6 h-4 w-4 animate-spin text-neutral-400" aria-hidden />
        ) : null}
      </button>
    </div>
  );
}
