"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createDeboursDossier } from "@/lib/actions/debours";

export interface DeboursAddFormProps {
  clients: { id: string; raisonSociale: string }[];
  dossiers: { id: string; intitule: string; numeroDossier: string | null; clientId: string }[];
  deboursTypes: { id: string; nom: string; categorie: string }[];
}

export function DeboursAddForm({
  clients,
  dossiers,
  deboursTypes,
}: DeboursAddFormProps) {
  const td = useTranslations("debours");
  const tc = useTranslations("common");
  const [clientId, setClientId] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dossiersForClient = clientId
    ? dossiers.filter((d) => d.clientId === clientId)
    : [];

  return (
    <Card>
      <CardHeader title={td("add")} />
      <CardContent>
        <form
          action={async (formData: FormData) => {
            setSubmitError(null);
            const result = await createDeboursDossier(formData);
            if (result.ok) {
              setClientId("");
              const form = document.getElementById("debours-add-form") as HTMLFormElement;
              if (form) form.reset();
              setClientId("");
            } else {
              setSubmitError(
                result.error === "invalid"
                  ? td("checkFieldsDetailed")
                  : td("checkFields")
              );
            }
          }}
          id="debours-add-form"
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tc("client")} <span className="text-status-error">*</span>
              </label>
              <select
                name="clientId"
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
              >
                <option value="">{td("chooseClient")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.raisonSociale}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tc("dossier")} <span className="text-status-error">*</span>
              </label>
              <select
                name="dossierId"
                required
                disabled={!clientId || dossiersForClient.length === 0}
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none disabled:opacity-60"
              >
                <option value="">
                  {!clientId
                    ? td("chooseClientFirst")
                    : dossiersForClient.length === 0
                      ? td("noMatterForClientAlt")
                      : td("chooseMatter")}
                </option>
                {dossiersForClient.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.numeroDossier ?? d.intitule} — {d.intitule}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
              {td("typeOptional")}
            </label>
            <select
              name="deboursTypeId"
              className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-sm"
            >
              <option value="">{td("manual")}</option>
              {deboursTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.categorie} — {t.nom}
                </option>
              ))}
            </select>
          </div>

          <Input
            label={td("description")}
            name="description"
            required
            placeholder="Ex. Frais de signification"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={td("amountDollar")}
              name="montant"
              type="number"
              step="0.01"
              min="0.01"
              required
            />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tc("date")}
              </label>
              <input
                type="date"
                name="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 items-center">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="taxable" value="on" className="rounded" />
              {td("taxable")}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="payeParCabinet"
                defaultChecked
                value="on"
                className="rounded"
              />
              {td("paidByFirm")}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="refacturable"
                defaultChecked
                value="on"
                className="rounded"
              />
              {td("refundable")}
            </label>
          </div>

          {submitError && (
            <p className="text-sm text-status-error">{submitError}</p>
          )}

          <Button type="submit">{td("saveDisbursement")}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
