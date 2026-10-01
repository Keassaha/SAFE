"use client";

import { Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import { RowMenu, rowMenuItemClass, rowMenuItemDangerClass } from "@/components/ui/RowMenu";
import {
  registreCellClass,
  registreCellMutedClass,
  registreCellNumClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreRowClass,
  RegistrePlainHeader,
} from "@/components/ui/registre";
import { clientNomListe } from "@/lib/clients/normalize-name";

/**
 * Une ligne du registre des paiements, telle que `/api/facturation/paiements`
 * la rend. `paymentMethod` est enregistré depuis toujours par le formulaire mais
 * n'avait jamais été affiché.
 */
export type PaiementRangee = {
  id: string;
  clientId: string | null;
  datePaiement: string;
  client: { id: string; raisonSociale: string | null; prenom?: string | null; nom?: string | null } | null;
  invoice: { id: string; numero: string } | null;
  montant: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  allocationStatus: string;
  paymentMethod?: string | null;
  preuveStorageKey?: string | null;
};

/** Clés de `payments.paymentMethod*`, par valeur enregistrée. */
const MODE_LABEL_KEY: Record<string, string> = {
  cash: "paymentMethodCash",
  cheque: "paymentMethodCheque",
  e_transfer: "paymentMethodTransfer",
  card: "paymentMethodCard",
  bank_transfer: "paymentMethodBankTransfer",
  trust: "paymentMethodTrust",
  other: "paymentMethodOther",
};

export function libelleClientPaiement(client: PaiementRangee["client"]): string {
  if (!client) return "—";
  /* Écriture des listes, règle CEO du 2026-10-01 : « Tremblay, Marie ». */
  return clientNomListe(client, "Client sans nom");
}

export function paiementAllouable(p: PaiementRangee): boolean {
  return (
    p.unallocatedAmount > 0 &&
    (p.allocationStatus === "UNALLOCATED" || p.allocationStatus === "PARTIALLY_ALLOCATED")
  );
}

interface PaiementsTableProps {
  rangees: PaiementRangee[];
  /** Droit d'écrire. À `false`, aucune action n'est proposée, la lecture reste entière. */
  canWrite: boolean;
  onModifier: (id: string) => void;
  onAllouer: (p: PaiementRangee) => void;
  onAnnuler: (p: PaiementRangee) => void;
}

/**
 * Registre des paiements, dans la grammaire commune des registres.
 *
 * Le tableau précédent disait quatre fois la même chose : Montant, Alloué,
 * Non alloué et un badge de statut racontaient tous « reste-t-il de l'argent à
 * rattacher à une facture ». Une seule colonne le dit maintenant, « Reste à
 * allouer », en ambre quand il y a quelque chose à faire, un tiret sinon. Le
 * mode de paiement, saisi depuis toujours, devient visible.
 *
 * Les cinq icônes muettes de chaque ligne deviennent un menu nommé, comme dans
 * le registre de facturation. Le trombone reste : c'est une information (une
 * preuve est jointe), pas une action. Demande CEO du 2026-09-12.
 */
export function PaiementsTable({ rangees, canWrite, onModifier, onAllouer, onAnnuler }: PaiementsTableProps) {
  const t = useTranslations("billingUi");
  const tp = useTranslations("payments");
  const { formatCurrency, formatCalendarDate } = useFormatteurs();

  const libelleMode = (mode: string | null | undefined) => {
    const key = mode ? MODE_LABEL_KEY[mode] : undefined;
    return key ? tp(key) : "—";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className={registreHeadRowClass}>
            <th scope="col" className={`w-[112px] ${registreHeadCellClass}`}>
              <RegistrePlainHeader label={t("date")} />
            </th>
            <th scope="col" className={registreHeadCellClass}>
              <RegistrePlainHeader label={t("clientAndInvoice")} />
            </th>
            <th scope="col" className={`w-[120px] ${registreHeadCellClass}`}>
              <RegistrePlainHeader label={t("paymentMode")} />
            </th>
            <th scope="col" className={`w-[140px] ${registreHeadCellClass} text-right`}>
              <RegistrePlainHeader label={t("amount")} align="right" />
            </th>
            <th scope="col" className={`w-[220px] ${registreHeadCellClass} text-right`}>
              <RegistrePlainHeader label={t("remainingToAllocate")} align="right" />
            </th>
            <th scope="col" className={`w-[72px] ${registreHeadCellClass}`}>
              <RegistrePlainHeader label={t("proofShort")} />
            </th>
            <th scope="col" className={`w-[56px] ${registreHeadCellClass}`}>
              <span className="sr-only">{t("actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rangees.map((p) => {
            const annule = p.allocationStatus === "REVERSED";
            const allouable = paiementAllouable(p);
            const client = libelleClientPaiement(p.client);
            const date = formatCalendarDate(p.datePaiement);
            const decrit = t("rowActionsPayment", { date, client });
            return (
              <tr key={p.id} className={registreRowClass}>
                <td className={`whitespace-nowrap ${registreCellMutedClass}`}>{date}</td>
                <td className={registreCellClass}>
                  <span
                    className={`block truncate text-[14px] font-medium leading-5 ${
                      annule ? "text-si-muted line-through" : "text-si-ink"
                    }`}
                  >
                    {client}
                  </span>
                  <span className="block text-[12px] leading-4 text-si-muted">
                    {p.invoice ? (
                      <span className="font-mono">{p.invoice.numero}</span>
                    ) : (
                      t("noInvoiceShort")
                    )}
                    {annule ? ` · ${t("reversedShort")}` : null}
                  </span>
                </td>
                <td className={`whitespace-nowrap ${registreCellMutedClass}`}>{libelleMode(p.paymentMethod)}</td>
                <td className={`whitespace-nowrap ${registreCellNumClass} ${annule ? "text-si-muted" : ""}`}>
                  {annule ? <s>{formatCurrency(p.montant)}</s> : formatCurrency(p.montant)}
                </td>
                {/* L'ambre n'est jamais seul : le montant en clair et le verbe
                    « Allouer » disent la même chose que la couleur (WCAG 1.4.1). */}
                <td className={`whitespace-nowrap ${registreCellNumClass}`}>
                  {!annule && p.unallocatedAmount > 0 ? (
                    <span className="inline-flex items-center gap-3">
                      <span className="font-medium text-si-amber-ink">{formatCurrency(p.unallocatedAmount)}</span>
                      {canWrite && allouable ? (
                        <button
                          type="button"
                          onClick={() => onAllouer(p)}
                          className="min-h-tap font-sans text-[13px] font-medium text-si-ink underline decoration-si-line underline-offset-2 hover:decoration-si-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
                        >
                          {t("allocateShort")}
                        </button>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-si-muted">—</span>
                  )}
                </td>
                <td className={registreCellMutedClass}>
                  {p.preuveStorageKey ? (
                    <a
                      href={`/api/facturation/paiements/${p.id}/preuve`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-tap w-tap items-center justify-center rounded-md text-si-muted hover:text-si-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
                      aria-label={t("viewProof")}
                      title={t("viewProof")}
                    >
                      <Paperclip className="h-4 w-4" aria-hidden />
                    </a>
                  ) : (
                    <span aria-hidden>—</span>
                  )}
                </td>
                <td className={`text-right ${registreCellClass}`}>
                  <RowMenu label={t("actions")} describedBy={decrit}>
                    <a
                      href={`/api/documents/payment-receipt/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={rowMenuItemClass}
                      role="menuitem"
                    >
                      {t("viewReceipt")}
                    </a>
                    {p.preuveStorageKey ? (
                      <a
                        href={`/api/facturation/paiements/${p.id}/preuve`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={rowMenuItemClass}
                        role="menuitem"
                      >
                        {t("viewProof")}
                      </a>
                    ) : null}
                    {canWrite && allouable ? (
                      <button type="button" className={rowMenuItemClass} role="menuitem" onClick={() => onAllouer(p)}>
                        {t("allocatePaymentToInvoice")}
                      </button>
                    ) : null}
                    {canWrite ? (
                      <button type="button" className={rowMenuItemClass} role="menuitem" onClick={() => onModifier(p.id)}>
                        {t("editPayment")}
                      </button>
                    ) : null}
                    {/* Un encaissement déjà annulé ne se réannule pas : le
                        service le refuserait, on ne propose pas le geste. */}
                    {canWrite && !annule ? (
                      <button type="button" className={rowMenuItemDangerClass} role="menuitem" onClick={() => onAnnuler(p)}>
                        {t("reversePayment")}
                      </button>
                    ) : null}
                  </RowMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
