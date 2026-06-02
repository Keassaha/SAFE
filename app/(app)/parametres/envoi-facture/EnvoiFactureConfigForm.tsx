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

export function EnvoiFactureConfigForm() {
  const t = useTranslations("settingsUi");
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("saveError"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error && !config) {
    return (
      <p className="text-sm text-red-600 py-4">
        {error}
      </p>
    );
  }

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
              className="rounded border-neutral-300"
            />
            <span className="text-sm font-medium text-[var(--safe-text-title)]">
              {t("enableUniqueLinks")}
            </span>
          </label>
          <p className="text-sm text-[var(--safe-text-secondary)]">
            {t("uniqueLinksHelp")}
          </p>

          <div>
            <label
              htmlFor="lienExpirationJours"
              className="block text-sm font-medium text-[var(--safe-text-title)] mb-1"
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
              className="w-24 rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-[var(--safe-text-secondary)]">
              {t("linkExpirationHint")}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
