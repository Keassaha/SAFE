"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createDeboursDossier } from "@/lib/actions/debours";

export interface DeboursAddModalProps {
  open: boolean;
  onClose: () => void;
  clients: { id: string; raisonSociale: string }[];
  dossiers: { id: string; intitule: string; numeroDossier: string | null; clientId: string }[];
}

const selectClass =
  "w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/80 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all";

export function DeboursAddModal({
  open,
  onClose,
  clients,
  dossiers,
}: DeboursAddModalProps) {
  const td = useTranslations("debours");
  const tc = useTranslations("common");
  const router = useRouter();
  const [clientId, setClientId] = useState("");
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
      setClientId("");
      form.reset();
      onClose();
      router.refresh();
    } else {
      setError(result.error === "invalid" ? td("checkFields") : td("checkFields"));
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      setClientId("");
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={td("newDisbursement")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">{tc("client")} *</label>
            <select
              name="clientId"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={selectClass}
            >
              <option value="">{td("selectClient")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.raisonSociale}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">{tc("dossier")} *</label>
            <select
              name="dossierId"
              required
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
          <label className="block text-sm font-medium text-neutral-600 mb-1.5">{tc("date")} *</label>
          <input
            type="date"
            name="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={selectClass}
          />
        </div>

        <Input
          label={`${td("description")} *`}
          name="description"
          required
          placeholder="Ex: Dépôt requête introductive d'instance"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">{td("quantityRequired")}</label>
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
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">{td("unitPriceRequired")}</label>
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-neutral-700 cursor-pointer">
          <input type="checkbox" name="refacturable" defaultChecked value="on" className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500/30" />
          {td("billableToClient")}
        </label>
        <div className="flex gap-2">
          <label className="flex items-center gap-2.5 text-sm text-neutral-700 cursor-pointer">
            <input type="checkbox" name="taxable" value="on" className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500/30" />
            {td("taxable")}
          </label>
          <label className="flex items-center gap-2.5 text-sm text-neutral-700 cursor-pointer">
            <input type="checkbox" name="payeParCabinet" defaultChecked value="on" className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500/30" />
            {td("paidByFirm")}
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
