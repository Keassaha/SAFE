"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

type Config = {
  activer: boolean;
  lienExpirationJours: number;
};

type EmailTemplate = {
  objet: string;
  message: string;
  instructionsPaiement: string;
};

type EmailField = keyof EmailTemplate;

// Variables offertes à l'insertion. Le libellé est humain, le token est
// substitué au moment de l'envoi (cf. applyInvoiceEmailVariables).
const EMAIL_VARIABLES: { token: string; labelKey: string }[] = [
  { token: "{{client}}", labelKey: "emailVarClient" },
  { token: "{{numero_facture}}", labelKey: "emailVarNumero" },
  { token: "{{cabinet}}", labelKey: "emailVarCabinet" },
  { token: "{{echeance}}", labelKey: "emailVarEcheance" },
];

export function EnvoiFactureConfigForm() {
  const t = useTranslations("settingsUi");
  const [config, setConfig] = useState<Config | null>(null);
  const [email, setEmail] = useState<EmailTemplate>({
    objet: "",
    message: "",
    instructionsPaiement: "",
  });
  const [activeField, setActiveField] = useState<EmailField>("message");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cabinet/config")
      .then((res) => {
        if (!res.ok) throw new Error(t("loadError"));
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setConfig({
            activer: data.envoiFactureClient?.activer ?? true,
            lienExpirationJours:
              data.envoiFactureClient?.lienExpirationJours ?? 30,
          });
          setEmail({
            objet: data.emailFacture?.objet ?? "",
            message: data.emailFacture?.message ?? "",
            instructionsPaiement: data.emailFacture?.instructionsPaiement ?? "",
          });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : t("genericError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const insertVariable = (token: string) => {
    setEmail((e) => {
      const current = e[activeField];
      const needsSpace = current.length > 0 && !/\s$/.test(current);
      return { ...e, [activeField]: current + (needsSpace ? " " : "") + token };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/cabinet/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envoiFactureClient: {
            activer: config.activer,
            lienExpirationJours: config.lienExpirationJours,
          },
          emailFacture: {
            objet: email.objet.trim(),
            message: email.message.trim(),
            instructionsPaiement: email.instructionsPaiement.trim(),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("saveError"));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-si-muted/50" />
      </div>
    );
  }

  if (error && !config) {
    return (
      <p className="text-sm text-[#B84A3E] py-4">
        {error}
      </p>
    );
  }

  const fieldClass =
    "w-full rounded border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-si-primary/40";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader title={t("invoiceSendCardTitle")} />
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config?.activer ?? true}
              onChange={(e) =>
                setConfig((c) => (c ? { ...c, activer: e.target.checked } : c))
              }
              className="rounded border-si-line"
            />
            <span className="text-sm font-medium text-si-ink">
              {t("enableUniqueLinks")}
            </span>
          </label>
          <p className="text-sm text-si-muted">
            {t("uniqueLinksHelp")}
          </p>

          <div>
            <label
              htmlFor="lienExpirationJours"
              className="block text-sm font-medium text-si-ink mb-1"
            >
              {t("linkExpirationLabel")}
            </label>
            <input
              id="lienExpirationJours"
              type="number"
              min={1}
              max={365}
              value={config?.lienExpirationJours ?? 30}
              onChange={(e) =>
                setConfig((c) =>
                  c
                    ? {
                        ...c,
                        lienExpirationJours: Math.min(
                          365,
                          Math.max(1, parseInt(e.target.value, 10) || 30)
                        ),
                      }
                    : c
                )
              }
              className="w-24 rounded border border-si-line px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-si-muted">
              {t("linkExpirationHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t("emailTemplateCardTitle")} />
        <CardContent className="space-y-4">
          <p className="text-sm text-si-muted">{t("emailTemplateHelp")}</p>

          <div className="rounded-md bg-si-surface/60 border border-si-line p-3">
            <p className="text-xs font-medium text-si-ink mb-2">
              {t("emailVariablesHint")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EMAIL_VARIABLES.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  onClick={() => insertVariable(v.token)}
                  className="rounded-full border border-si-line bg-white px-2.5 py-1 text-xs font-mono text-si-ink hover:bg-si-primary/5 transition-colors"
                  title={t(v.labelKey)}
                >
                  {v.token}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="emailObjet" className="block text-sm font-medium text-si-ink mb-1">
              {t("emailSubjectLabel")}
            </label>
            <input
              id="emailObjet"
              type="text"
              value={email.objet}
              onFocus={() => setActiveField("objet")}
              onChange={(e) => setEmail((s) => ({ ...s, objet: e.target.value }))}
              placeholder={t("emailSubjectPlaceholder")}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="emailMessage" className="block text-sm font-medium text-si-ink mb-1">
              {t("emailMessageLabel")}
            </label>
            <textarea
              id="emailMessage"
              rows={7}
              value={email.message}
              onFocus={() => setActiveField("message")}
              onChange={(e) => setEmail((s) => ({ ...s, message: e.target.value }))}
              placeholder={t("emailMessagePlaceholder")}
              className={`${fieldClass} resize-y`}
            />
          </div>

          <div>
            <label htmlFor="emailPaiement" className="block text-sm font-medium text-si-ink mb-1">
              {t("emailPaymentLabel")}
            </label>
            <textarea
              id="emailPaiement"
              rows={5}
              value={email.instructionsPaiement}
              onFocus={() => setActiveField("instructionsPaiement")}
              onChange={(e) => setEmail((s) => ({ ...s, instructionsPaiement: e.target.value }))}
              placeholder={t("emailPaymentPlaceholder")}
              className={`${fieldClass} resize-y`}
            />
          </div>

          <p className="text-xs text-si-muted">{t("emailTemplateEditableNote")}</p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-[#B84A3E]">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-si-primary">{t("savedConfirmation")}</p>
      )}

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
