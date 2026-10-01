"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { clientNomListe } from "@/lib/clients/normalize-name";

const MONTH_KEYS = [
  "monthJanuary", "monthFebruary", "monthMarch", "monthApril", "monthMay", "monthJune",
  "monthJuly", "monthAugust", "monthSeptember", "monthOctober", "monthNovember", "monthDecember",
] as const;

const champ =
  "min-h-tap w-full rounded-lg border border-si-line bg-si-surface px-3 text-sm text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 disabled:cursor-not-allowed disabled:opacity-60";

export interface ReleveInitial {
  mois: number;
  annee: number;
  clientId: string;
  dossierId: string;
}

/**
 * Le relevé PDF d'un mois, dans une fenêtre.
 *
 * Il occupait un tiers de l'écran en permanence, avec deux listes (client,
 * dossier) que les filtres du registre proposaient déjà juste à côté. La
 * fenêtre s'ouvre pré-remplie avec ce que le registre affiche.
 */
export function ReleveModal({
  open,
  onClose,
  clients,
  dossiers,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  clients: { id: string; raisonSociale: string | null; prenom: string | null; nom: string | null }[];
  dossiers: { id: string; clientId: string; intitule: string; numeroDossier: string | null }[];
  initial: ReleveInitial;
}) {
  const tf = useTranslations("fideicommis");
  const tc = useTranslations("common");
  const [mois, setMois] = useState(initial.mois);
  const [annee, setAnnee] = useState(initial.annee);
  const [clientId, setClientId] = useState(initial.clientId);
  const [dossierId, setDossierId] = useState(initial.dossierId);

  /* À chaque ouverture, on repart de ce que le registre montre. */
  useEffect(() => {
    if (!open) return;
    setMois(initial.mois);
    setAnnee(initial.annee);
    setClientId(initial.clientId);
    setDossierId(initial.dossierId);
  }, [open, initial]);

  const dossiersDuClient = clientId ? dossiers.filter((d) => d.clientId === clientId) : [];

  const telecharger = () => {
    const params = new URLSearchParams({ mois: String(mois), annee: String(annee), format: "pdf" });
    if (clientId) params.set("clientId", clientId);
    if (dossierId) params.set("dossierId", dossierId);
    toast.success(tf("downloadingPdf"));
    window.open(`/api/fideicommis/releve?${params.toString()}`, "_blank", "noopener");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={tf("statementModalTitle")}>
      <div className="space-y-4">
        <p className="text-sm text-si-muted">{tf("statementModalIntro")}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="releve-mois" className="mb-1 block text-sm font-medium text-si-muted">
              {tf("monthLabel")}
            </label>
            <select id="releve-mois" value={mois} onChange={(e) => setMois(Number(e.target.value))} className={champ}>
              {MONTH_KEYS.map((key, i) => (
                <option key={key} value={i + 1}>
                  {tf(key)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="releve-annee" className="mb-1 block text-sm font-medium text-si-muted">
              {tf("yearLabel")}
            </label>
            <input
              id="releve-annee"
              type="number"
              min={2020}
              max={2100}
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              className={champ}
            />
          </div>
        </div>
        <div>
          <label htmlFor="releve-client" className="mb-1 block text-sm font-medium text-si-muted">
            {tf("clientOptional")}
          </label>
          <select
            id="releve-client"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setDossierId("");
            }}
            className={champ}
          >
            <option value="">{tf("all")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {clientNomListe(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="releve-dossier" className="mb-1 block text-sm font-medium text-si-muted">
            {tf("matterOptional")}
          </label>
          <select
            id="releve-dossier"
            value={dossierId}
            onChange={(e) => setDossierId(e.target.value)}
            disabled={!clientId}
            className={champ}
          >
            <option value="">{tf("all")}</option>
            {dossiersDuClient.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numeroDossier ? `${d.numeroDossier} – ` : ""}
                {d.intitule}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button type="button" variant="primary" onClick={telecharger}>
            {tf("downloadPdfStatement")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
