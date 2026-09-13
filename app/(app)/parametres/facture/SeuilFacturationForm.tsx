"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateSeuilFacturation } from "./actions";

/**
 * Seuil de facturation du cabinet.
 *
 * Il vivait gravé dans le code, à 100 $ : aucun cabinet ne pouvait le changer
 * ni le mettre à zéro. Il se règle ici et se lit dans la section « Honoraires à
 * facturer », qui l'applique dossier par dossier. Décision CEO du 2026-09-12.
 */
export function SeuilFacturationForm({ initial }: { initial: number }) {
  const t = useTranslations("settingsUi");
  const locale = useLocale();
  // Le champ parle la langue de l'utilisateur : virgule en français.
  const afficher = (n: number) => (locale.startsWith("fr") ? n.toFixed(2).replace(".", ",") : n.toFixed(2));
  const [valeur, setValeur] = useState(afficher(initial));
  const [enregistre, setEnregistre] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const nombre = Number(valeur.replace(",", "."));
  const valide = Number.isFinite(nombre) && nombre >= 0;
  const dirty = valide && nombre !== enregistre;

  function submit() {
    setMessage(null);
    if (!valide) {
      setMessage({ ok: false, texte: t("seuilFacturationInvalid") });
      return;
    }
    startTransition(async () => {
      const res = await updateSeuilFacturation({ seuil: nombre });
      if (res.ok) {
        setEnregistre(nombre);
        setValeur(afficher(nombre));
        setMessage({ ok: true, texte: t("seuilFacturationSaved") });
      } else {
        setMessage({ ok: false, texte: res.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader title={t("seuilFacturationTitle")} />
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-[52ch] text-[13px] leading-relaxed text-si-muted">
            {t("seuilFacturationHint")}
          </p>
          <label className="flex shrink-0 items-center gap-2 text-[13px] text-si-muted">
            <input
              type="text"
              inputMode="decimal"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              aria-label={t("seuilFacturationTitle")}
              className="min-h-tap w-32 rounded-md border border-si-line bg-si-surface px-3 text-right font-mono text-[13px] tabular-nums text-si-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-si-ink-strong/30"
            />
            <span>$</span>
          </label>
        </div>

        {message ? (
          <p
            className={`text-[13px] ${message.ok ? "text-si-verified" : "text-status-error"}`}
            role={message.ok ? "status" : "alert"}
          >
            {message.texte}
          </p>
        ) : null}

        <div className="flex items-center justify-end">
          <Button type="button" variant="primary" disabled={!dirty || pending} loading={pending} onClick={submit}>
            {t("seuilFacturationSave")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
