"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Clock, Package, Layers, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateBillingMode } from "./actions";
import type { BillingModeChoice } from "./billing-modes";

/**
 * Choix du mode de facturation principal du cabinet.
 *
 * Ce réglage n'est pas cosmétique : il change ce que l'application DEMANDE.
 * En forfait, le dossier cesse d'exiger un taux horaire et la facture parle de
 * tâches plutôt que de lignes d'honoraires. C'est pour ça que chaque option
 * annonce sa conséquence au lieu de se contenter d'un nom.
 */

const OPTIONS: Array<{
  value: BillingModeChoice;
  icon: typeof Clock;
  titleKey: string;
  effectKey: string;
}> = [
  { value: "horaire", icon: Clock, titleKey: "billingModeHourly", effectKey: "billingModeHourlyEffect" },
  { value: "forfait", icon: Package, titleKey: "billingForfait", effectKey: "billingModeForfaitEffect" },
  { value: "mixte", icon: Layers, titleKey: "billingModeMixed", effectKey: "billingModeMixedEffect" },
];

export function BillingModeForm({ initial }: { initial: BillingModeChoice }) {
  const t = useTranslations("settingsUi");
  const [choice, setChoice] = useState<BillingModeChoice>(initial);
  const [saved, setSaved] = useState<BillingModeChoice>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = choice !== saved;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await updateBillingMode({ principal: choice });
      if (res.ok) {
        setSaved(choice);
      } else {
        setError(res.error);
        setChoice(saved);
      }
    });
  }

  return (
    <Card>
      <CardHeader title={t("billingModeSectionTitle")} />
      <CardContent className="space-y-4">
        <p className="text-[13px] leading-relaxed text-si-muted">
          {t("billingModeSectionIntro")}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const actif = choice === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setChoice(opt.value)}
                aria-pressed={actif}
                className={`safe-zoom-rang rounded-lg border p-4 text-left transition-all ${
                  actif
                    ? "border-si-verified bg-si-verified/[0.06]"
                    : "border-si-line bg-si-surface hover:border-si-verified/40"
                }`}
              >
                <span className="mb-2 flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${actif ? "text-si-verified" : "text-si-muted"}`}
                    aria-hidden
                  />
                  <span className="text-[14px] font-medium text-si-ink">{t(opt.titleKey)}</span>
                  {saved === opt.value ? (
                    <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-si-verified" aria-hidden />
                  ) : null}
                </span>
                <span className="block text-[12px] leading-relaxed text-si-muted">
                  {t(opt.effectKey)}
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <p className="text-[13px] text-status-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          {dirty ? (
            <p className="text-[12px] text-si-muted">{t("billingModeAppliesEverywhere")}</p>
          ) : null}
          <Button type="button" variant="primary" disabled={!dirty || pending} onClick={submit}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {t("billingModeSave")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
