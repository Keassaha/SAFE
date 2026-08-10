import Link from "next/link";
import { Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import type { DossierFinancialSummary } from "@/lib/dossiers/financial-summary";
import { routes } from "@/lib/routes";
import s from "../../../v2.module.css";
import {
  StatusPill,
  hoursLabel,
  moneyFR,
  dateShortFR,
  type PillTone,
} from "../../../_components/primitives";

const INVOICE_STATUS_LABELS: Record<string, { label: string; tone: PillTone }> = {
  brouillon: { label: "Brouillon", tone: "neutral" },
  envoyee: { label: "Envoyée", tone: "warning" },
  partiellement_payee: { label: "Partiellement payée", tone: "warning" },
  payee: { label: "Payée", tone: "success" },
  en_retard: { label: "En retard", tone: "danger" },
};

/** Onglet Facturation — factures réelles du dossier, deep-links vers la facturation legacy. */
export async function BillingTab({
  cabinetId,
  dossierId,
  summary,
}: {
  cabinetId: string;
  dossierId: string;
  summary: DossierFinancialSummary;
}) {
  const invoices = await prisma.invoice.findMany({
    where: { cabinetId, dossierId },
    orderBy: { dateEmission: "desc" },
    take: 50,
    select: {
      id: true,
      numero: true,
      statut: true,
      dateEmission: true,
      dateEcheance: true,
      montantTotal: true,
      montantPaye: true,
      cancelledAt: true,
    },
  });

  if (invoices.length === 0) {
    return (
      <section className={s.emptyState}>
        <span className={s.emptyIcon}>
          <Receipt size={22} />
        </span>
        <h2>Aucune facture pour ce dossier</h2>
        <p>
          {summary.unbilledMinutes > 0
            ? `${hoursLabel(summary.unbilledMinutes)} sont prêtes à être transformées en facture sans ressaisir le client.`
            : "Les factures émises sur ce dossier apparaîtront ici."}
        </p>
        <Link href={routes.facturationFactureNouvelle} className={s.primaryButton}>
          Préparer la facture
        </Link>
      </section>
    );
  }

  return (
    <section className={s.fullSection}>
      <div className={s.sectionHeader}>
        <div>
          <div className={s.sectionEyebrow}>Facturation</div>
          <h2>Factures du dossier</h2>
          <p>
            Solde à recevoir : {moneyFR.format(summary.receivableBalance)}
            {summary.readyToBillCount > 0
              ? ` · ${summary.readyToBillCount} entrée${summary.readyToBillCount > 1 ? "s" : ""} de temps prête${summary.readyToBillCount > 1 ? "s" : ""} à facturer`
              : ""}
          </p>
        </div>
        <div className={s.sectionActions}>
          <Link href={routes.facturationFactureNouvelle} className={s.primaryButton}>
            Préparer la facture
          </Link>
        </div>
      </div>
      <div className={s.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Émission</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th className={s.numeric}>Total</th>
              <th className={s.numeric}>Payé</th>
              <th className={s.numeric}>Solde</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const meta = inv.cancelledAt
                ? { label: "Annulée", tone: "neutral" as PillTone }
                : (INVOICE_STATUS_LABELS[inv.statut] ?? {
                    label: inv.statut,
                    tone: "neutral" as PillTone,
                  });
              return (
                <tr key={inv.id}>
                  <td>
                    <Link
                      href={routes.facturationFactureApercu(inv.id)}
                      className={s.rowLink}
                    >
                      {inv.numero}
                    </Link>
                  </td>
                  <td>{dateShortFR(inv.dateEmission)}</td>
                  <td>{dateShortFR(inv.dateEcheance)}</td>
                  <td>
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </td>
                  <td className={s.numeric}>{moneyFR.format(inv.montantTotal)}</td>
                  <td className={s.numeric}>{moneyFR.format(inv.montantPaye)}</td>
                  <td className={s.numeric}>
                    {moneyFR.format(Math.max(0, inv.montantTotal - inv.montantPaye))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
