"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

type Config = {
  activer: boolean;
  lienExpirationJours: number;
};

export function EnvoiFactureConfigForm() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cabinet/config")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement");
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
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      if (!res.ok) throw new Error(data.error ?? "Erreur enregistrement");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
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
        <CardHeader title="Envoi de facture au client" />
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
              Activer les liens uniques pour envoyer les factures aux clients
            </span>
          </label>
          <p className="text-sm text-[var(--safe-text-secondary)]">
            Lorsque cette option est activée, vous pouvez générer un lien
            sécurisé pour chaque facture envoyée. Le client pourra consulter la
            facture sans se connecter.
          </p>

          <div>
            <label
              htmlFor="lienExpirationJours"
              className="block text-sm font-medium text-[var(--safe-text-title)] mb-1"
            >
              Expiration du lien (jours)
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
              Entre 1 et 365 jours. Après cette date, le lien ne fonctionnera
              plus.
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
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
