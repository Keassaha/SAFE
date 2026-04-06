"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createDeboursDossier,
  deleteDeboursDossierForm,
} from "@/lib/actions/debours";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { Pencil, Trash2, FileText } from "lucide-react";

export type DeboursDossierRow = {
  id: string;
  description: string;
  montant: number;
  taxable: boolean;
  date: Date;
  payeParCabinet: boolean;
  refacturable: boolean;
  factureId: string | null;
  factureNumero?: string | null;
  deboursTypeNom?: string | null;
  deboursTypeCategorie?: string | null;
};

interface DossierDeboursProps {
  dossierId: string;
  clientId: string;
  debours: DeboursDossierRow[];
  deboursTypes: { id: string; nom: string; categorie: string }[];
}

export function DossierDebours({
  dossierId,
  clientId,
  debours,
  deboursTypes,
}: DossierDeboursProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalRefacturable = debours
    .filter((d) => d.refacturable && !d.factureId)
    .reduce((s, d) => s + d.montant, 0);
  const totalFacture = debours.filter((d) => d.factureId).length;

  return (
    <Card>
      <CardHeader
        title={t("disbursements")}
        action={
          <Button type="button" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? tc("cancel") : `+ ${t("addDisbursement")}`}
          </Button>
        }
      />
      <CardContent className="space-y-4">
        {showAdd && (
          <form
            action={async (formData: FormData) => {
              const result = await createDeboursDossier(formData);
              if (result.ok) setShowAdd(false);
            }}
            className="rounded-safe-sm border border-neutral-border p-4 space-y-3 bg-neutral-surface/30"
          >
            <input type="hidden" name="dossierId" value={dossierId} />
            <input type="hidden" name="clientId" value={clientId} />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("typeOptional")}
              </label>
              <select
                name="deboursTypeId"
                className="w-full h-10 px-3 rounded-safe-sm border border-neutral-border bg-white text-sm"
              >
                <option value="">{t("manualEntry")}</option>
                {deboursTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.categorie} — {dt.nom}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={tc("description")}
              name="description"
              required
              placeholder="Ex. Frais de signification"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={`${tc("amount")} ($)`}
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
                  className="w-full h-10 px-3 rounded-safe-sm border border-neutral-border bg-white text-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="taxable" defaultChecked={false} className="rounded" />
                {t("taxableGstQst")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="payeParCabinet" defaultChecked className="rounded" />
                {t("paidByFirm")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="refacturable" defaultChecked className="rounded" />
                {t("reinvoiceableToClient")}
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{tc("save")}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                {tc("cancel")}
              </Button>
            </div>
          </form>
        )}

        {debours.length === 0 && !showAdd ? (
          <p className="text-sm text-neutral-muted py-4">
            {t("noDisbursementsMessage")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-border text-left text-neutral-muted">
                  <th className="py-2 pr-2">{tc("date")}</th>
                  <th className="py-2 pr-2">{t("typeDescription")}</th>
                  <th className="py-2 pr-2 text-right">{tc("amount")}</th>
                  <th className="py-2 pr-2">{t("taxable")}</th>
                  <th className="py-2 pr-2">{t("reinvoiced")}</th>
                  <th className="py-2 pr-2 w-24">{tc("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {debours.map((d) => (
                  <tr key={d.id} className="border-b border-neutral-border/70">
                    <td className="py-2 pr-2">{formatDate(d.date)}</td>
                    <td className="py-2 pr-2">
                      {d.deboursTypeNom ? (
                        <span className="text-neutral-muted">{d.deboursTypeCategorie} — </span>
                      ) : null}
                      {d.description}
                    </td>
                    <td className="py-2 pr-2 text-right font-medium">
                      {formatCurrency(d.montant)}
                    </td>
                    <td className="py-2 pr-2">{d.taxable ? tc("yes") : tc("no")}</td>
                    <td className="py-2 pr-2">
                      {d.factureId ? (
                        <Link
                          href={routes.facturationFactureEdit(d.factureId)}
                          className="text-primary-600 hover:underline inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {d.factureNumero ?? t("invoice")}
                        </Link>
                      ) : (
                        <span className="text-neutral-muted">{t("notInvoiced")}</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {!d.factureId ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(editingId === d.id ? null : d.id)}
                            className="p-1.5 rounded text-neutral-muted hover:bg-neutral-100 hover:text-neutral-700"
                            aria-label={tc("edit")}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <form
                            action={deleteDeboursDossierForm}
                            className="inline"
                            onSubmit={(e) => {
                              if (!confirm(t("deleteDisbursement"))) e.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={d.id} />
                            <button
                              type="submit"
                              className="p-1.5 rounded text-neutral-muted hover:bg-red-50 hover:text-red-600"
                              aria-label={tc("delete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {debours.length > 0 && (
          <div className="flex flex-wrap gap-4 pt-2 text-sm">
            <span className="text-neutral-muted">
              {t("disbursementsToReinvoice")} : <strong className="text-neutral-800">{formatCurrency(totalRefacturable)}</strong>
            </span>
            {totalFacture > 0 && (
              <span className="text-neutral-muted">
                {t("disbursementsAlreadyInvoiced", { count: totalFacture })}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
