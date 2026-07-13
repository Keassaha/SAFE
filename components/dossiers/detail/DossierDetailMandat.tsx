"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileSignature, Plus, Upload, Loader2, ArrowUpRight, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImportMandatDialog } from "./ImportMandatDialog";

/**
 * Onglet 02 — Mandat
 * Rédaction du mandat via l'éditeur : liste les mandats du dossier et crée un
 * mandat pré-rempli (RichDocument type="mandat") ouvert dans l'éditeur, d'où
 * l'avocat le modifie puis l'envoie au client (PDF joint).
 */
interface MandatItem {
  id: string;
  titre: string;
  statut: string;
  updatedAt: string;
  lastEditedBy?: { nom: string } | null;
}

export function DossierDetailMandat({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  const router = useRouter();
  const [mandats, setMandats] = useState<MandatItem[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dossiers/${dossierId}/mandat`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setMandats(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setMandats([]);
      });
    return () => {
      cancelled = true;
    };
  }, [dossierId]);

  const createMandat = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/mandat`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) throw new Error(data?.error ?? t("mandateError"));
      router.push(`/edition/${dossierId}/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("mandateError"));
      setCreating(false);
    }
  };

  const statusLabel = (statut: string) =>
    statut === "final" ? t("mandateStatusFinal") : t("mandateStatusBrouillon");
  const statusClass = (statut: string) =>
    statut === "final"
      ? "bg-green-100 text-green-700"
      : "bg-amber-100 text-amber-800";

  return (
    <div className="rounded-lg border border-si-line bg-si-surface p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-si-primary/10 p-2 text-si-primary">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-si-ink">{t("mandateSectionTitle")}</h3>
            <p className="mt-1 text-sm text-si-muted">{t("mandateSectionDesc")}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => setShowImport(true)} disabled={creating} variant="secondary" className="gap-2">
            <Upload className="h-4 w-4" />
            {t("mandateImportButton")}
          </Button>
          <Button onClick={createMandat} disabled={creating} variant="primary" className="gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {creating ? t("mandateCreating") : t("mandateCreateButton")}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-[#B84A3E]">{error}</p>}

      {mandats === null ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-si-muted/50" />
        </div>
      ) : mandats.length === 0 ? (
        <p className="rounded-md border border-dashed border-si-line px-4 py-6 text-center text-sm text-si-muted">
          {t("mandateEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-si-line rounded-md border border-si-line">
          {mandats.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-si-ink">{m.titre}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(m.statut)}`}>
                    {statusLabel(m.statut)}
                  </span>
                </div>
                {m.lastEditedBy?.nom && (
                  <p className="mt-0.5 text-xs text-si-muted">
                    {t("mandateLastEditedBy", { name: m.lastEditedBy.nom })}
                  </p>
                )}
              </div>
              <Link
                href={`/edition/${dossierId}/${m.id}`}
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-si-primary hover:underline"
              >
                {t("mandateOpen")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-2 text-xs text-si-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("mandateSendHint")}
      </p>

      {showImport && (
        <ImportMandatDialog
          dossierId={dossierId}
          onClose={() => setShowImport(false)}
          onImported={(id, warning) => {
            setShowImport(false);
            if (warning) toast.warning(warning);
            router.push(`/edition/${dossierId}/${id}`);
          }}
        />
      )}
    </div>
  );
}
