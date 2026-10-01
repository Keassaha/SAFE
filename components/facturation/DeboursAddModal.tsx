"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createDeboursDossier } from "@/lib/actions/debours";
import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";
import { clientNomListe } from "@/lib/clients/normalize-name";

export interface DeboursAddModalProps {
  open: boolean;
  onClose: () => void;
  clients: { id: string; raisonSociale: string | null; prenom?: string | null; nom?: string | null }[];
  dossiers: { id: string; intitule: string; numeroDossier: string | null; clientId: string }[];
  /**
   * Client et dossier déjà connus, quand la modale est ouverte depuis un
   * contexte qui les porte — une saisie de temps, par exemple. Ils sont
   * proposés, pas imposés : on peut encore les changer.
   */
  clientIdInitial?: string;
  dossierIdInitial?: string;
  onSuccess?: () => void;
}

const selectClass =
  "w-full h-10 px-3 rounded-xl border border-si-line bg-si-canvas/80 text-sm text-si-ink placeholder:text-si-muted/50 focus:bg-si-surface focus:ring-2 focus:ring-si-verified/20 focus:border-si-verified outline-none transition-all";

function clientLabel(client: { raisonSociale: string | null; prenom?: string | null; nom?: string | null }) {
  /* Écriture des listes, règle CEO du 2026-10-01 : « Tremblay, Marie ». */
  return clientNomListe(client, "Client sans nom");
}

export function DeboursAddModal({
  open,
  onClose,
  clients,
  dossiers,
  clientIdInitial = "",
  dossierIdInitial = "",
  onSuccess,
}: DeboursAddModalProps) {
  const td = useTranslations("debours");
  const tc = useTranslations("common");
  const t = useTranslations("billingCompUi");
  const router = useRouter();
  const [clientId, setClientId] = useState(clientIdInitial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dossiersForClient = clientId ? dossiers.filter((d) => d.clientId === clientId) : [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createDeboursDossier(formData);
    if (result.ok) {
      setClientId(clientIdInitial);
      form.reset();
      onClose();
      onSuccess?.();
      router.refresh();
    } else {
      setError(result.error === "invalid" ? td("checkFields") : td("checkFields"));
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      setClientId(clientIdInitial);
      onClose();
    }
  };

  /* Rouvrir la modale depuis un AUTRE dossier doit repartir de ce
     dossier-là, pas du précédent. Sans ça, le débours partirait au mauvais
     client sans que rien ne le signale. */
  useEffect(() => {
    if (open) setClientId(clientIdInitial);
  }, [open, clientIdInitial]);

  return (
    <Modal open={open} onClose={handleClose} title={td("newDisbursement")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-si-muted mb-1.5">{tc("client")} *</label>
            <select
              name="clientId"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={selectClass}
            >
              <option value="">{td("selectClient")}</option>
              {clients.map((c) => (
	                <option key={c.id} value={c.id}>{clientLabel(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-si-muted mb-1.5">{tc("dossier")} *</label>
            <select
              name="dossierId"
              key={`${clientId}-${dossierIdInitial}`}
              required
              defaultValue={
                dossiersForClient.some((d) => d.id === dossierIdInitial) ? dossierIdInitial : ""
              }
              disabled={!clientId || dossiersForClient.length === 0}
              className={`${selectClass} disabled:opacity-60`}
            >
              <option value="">
                {!clientId ? td("selectClient") : dossiersForClient.length === 0 ? td("noMatter") : td("selectMatter")}
              </option>
              {dossiersForClient.map((d) => (
                <option key={d.id} value={d.id}>{d.numeroDossier ?? d.intitule} — {d.intitule}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-si-muted mb-1.5">{tc("date")} *</label>
          <input
            type="date"
            name="date"
            defaultValue={toIsoDay(toCalendarDayUTC(new Date()))}
            className={selectClass}
          />
        </div>

        <Input
          label={`${td("description")} *`}
          name="description"
          required
          placeholder={t("descriptionPlaceholderFiling")}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-si-muted mb-1.5">{td("quantityRequired")}</label>
            <input
              type="number"
              name="quantite"
              min="0.001"
              step="0.01"
              defaultValue="1"
              required
              className={selectClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-si-muted mb-1.5">{td("unitPriceRequired")}</label>
            <div className="relative">
              <input
                type="number"
                name="prixUnitaire"
                step="0.01"
                min="0.01"
                required
                placeholder="0"
                className={`${selectClass} pr-8`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-si-muted">$</span>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-si-ink cursor-pointer">
          <input type="checkbox" name="refacturable" defaultChecked value="on" className="rounded border-si-line text-si-ink-strong focus:ring-si-verified/25" />
          {td("billableToClient")}
        </label>
        <div className="flex gap-2">
          <label className="flex items-center gap-3 text-sm text-si-ink cursor-pointer">
            <input type="checkbox" name="taxable" value="on" className="rounded border-si-line text-si-ink-strong focus:ring-si-verified/25" />
            {td("taxable")}
          </label>
          <label className="flex items-center gap-3 text-sm text-si-ink cursor-pointer">
            <input type="checkbox" name="payeParCabinet" defaultChecked value="on" className="rounded border-si-line text-si-ink-strong focus:ring-si-verified/25" />
            {td("paidByFirm")}
          </label>
        </div>

        {error && <p className="text-sm text-[#B84A3E]">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            {tc("cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? tc("saving") : tc("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
