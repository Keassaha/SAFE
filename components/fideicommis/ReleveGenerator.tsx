"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface ReleveGeneratorProps {
  clients: { id: string; raisonSociale: string }[];
  dossiers: { id: string; clientId: string; intitule: string; numeroDossier: string | null }[];
  disabled?: boolean;
}

const MONTH_KEYS = [
  "monthJanuary", "monthFebruary", "monthMarch", "monthApril", "monthMay", "monthJune",
  "monthJuly", "monthAugust", "monthSeptember", "monthOctober", "monthNovember", "monthDecember",
] as const;

export function ReleveGenerator({ clients, dossiers, disabled }: ReleveGeneratorProps) {
  const tf = useTranslations("fideicommis");
  const MOIS_LABELS: Record<number, string> = Object.fromEntries(
    MONTH_KEYS.map((key, i) => [i + 1, tf(key)])
  );
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [clientId, setClientId] = useState("");
  const [dossierId, setDossierId] = useState("");

  const handleDownloadPdf = () => {
    const params = new URLSearchParams({
      mois: String(mois),
      annee: String(annee),
      format: "pdf",
    });
    if (clientId) params.set("clientId", clientId);
    if (dossierId) params.set("dossierId", dossierId);
    const url = `/api/fideicommis/releve?${params.toString()}`;
    toast.success(tf("downloadingPdf"));
    window.open(url, "_blank", "noopener");
  };

  const dossiersForClient = clientId ? dossiers.filter((d) => d.clientId === clientId) : [];

  return (
    <Card>
      <CardHeader title={tf("monthlyStatement")} />
      <CardContent className="space-y-4">
        <p className="text-sm text-neutral-muted">
          {tf("generateStatementDescription")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{tf("monthLabel")}</label>
            <select
              value={mois}
              onChange={(e) => setMois(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90"
            >
              {Object.entries(MOIS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{tf("yearLabel")}</label>
            <input
              type="number"
              min={2020}
              max={2100}
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{tf("clientOptional")}</label>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setDossierId("");
            }}
            disabled={disabled}
            className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90"
          >
            <option value="">{tf("all")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.raisonSociale}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{tf("matterOptional")}</label>
          <select
            value={dossierId}
            onChange={(e) => setDossierId(e.target.value)}
            disabled={disabled || !clientId}
            className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90"
          >
            <option value="">{tf("all")}</option>
            {dossiersForClient.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numeroDossier ? `${d.numeroDossier} – ` : ""}{d.intitule}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          onClick={handleDownloadPdf}
          disabled={disabled}
        >
          {tf("downloadPdfStatement")}
        </Button>
      </CardContent>
    </Card>
  );
}
