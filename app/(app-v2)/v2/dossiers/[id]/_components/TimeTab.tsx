import Link from "next/link";
import { prisma } from "@/lib/db";
import type { DossierFinancialSummary } from "@/lib/dossiers/financial-summary";
import { routes } from "@/lib/routes";
import { TimeEntryDrawer } from "./TimeEntryDrawer";
import s from "../../../v2.module.css";
import {
  StatusPill,
  hoursLabel,
  moneyFR,
  dateShortFR,
  type PillTone,
} from "../../../_components/primitives";

const BILLING_STATUS_LABELS: Record<string, { label: string; tone: PillTone }> = {
  NON_BILLED: { label: "Non facturé", tone: "warning" },
  READY_TO_BILL: { label: "Prêt à facturer", tone: "warning" },
  IN_DRAFT_INVOICE: { label: "Dans un brouillon", tone: "neutral" },
  BILLED: { label: "Facturé", tone: "success" },
  NON_BILLABLE: { label: "Non facturable", tone: "neutral" },
  WRITTEN_OFF: { label: "Radié", tone: "neutral" },
  CANCELLED: { label: "Annulé", tone: "neutral" },
};

const DEBOURS_STATUS_LABELS: Record<string, { label: string; tone: PillTone }> = {
  NON_FACTURE: { label: "Non facturé", tone: "warning" },
  FACTURE: { label: "Facturé", tone: "success" },
  RECOUVRE: { label: "Recouvré", tone: "success" },
  RADIE: { label: "Radié", tone: "neutral" },
};

/** Onglet Temps et débours — entrées réelles du dossier (lecture). */
export async function TimeTab({
  cabinetId,
  dossierId,
  numeroDossier,
  intitule,
  clientName,
  userId,
  summary,
}: {
  cabinetId: string;
  dossierId: string;
  numeroDossier: string;
  intitule: string;
  clientName: string;
  userId: string;
  summary: DossierFinancialSummary;
}) {
  const [entries, debours] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { cabinetId, dossierId },
      orderBy: { date: "desc" },
      take: 50,
      select: {
        id: true,
        date: true,
        description: true,
        dureeMinutes: true,
        montant: true,
        facturable: true,
        billingStatus: true,
        isWrittenOff: true,
        user: { select: { nom: true } },
      },
    }),
    prisma.deboursDossier.findMany({
      where: { cabinetId, dossierId },
      orderBy: { date: "desc" },
      take: 50,
      select: {
        id: true,
        date: true,
        description: true,
        montant: true,
        refacturable: true,
        statutDebours: true,
      },
    }),
  ]);

  return (
    <section className={s.fullSection}>
      <div className={s.sectionHeader}>
        <div>
          <div className={s.sectionEyebrow}>Temps et débours</div>
          <h2>Éléments facturables du dossier</h2>
          <p>Le client et le dossier restent attachés à chaque entrée.</p>
        </div>
        <div className={s.sectionActions}>
          <TimeEntryDrawer
            dossierId={dossierId}
            numeroDossier={numeroDossier}
            intitule={intitule}
            clientName={clientName}
            userId={userId}
            defaultTaux={summary.tauxHoraire}
            variant="secondary"
          />
          <Link href={routes.facturationFactureNouvelle} className={s.primaryButton}>
            Préparer la facture
          </Link>
        </div>
      </div>

      <div className={s.summaryLine}>
        <span>
          <small>Temps non facturé</small>
          <strong>{hoursLabel(summary.unbilledMinutes)}</strong>
        </span>
        <span>
          <small>Honoraires</small>
          <strong>{moneyFR.format(summary.unbilledFeesAmount)}</strong>
        </span>
        <span>
          <small>Débours non facturés</small>
          <strong>{moneyFR.format(summary.unbilledDisbursements)}</strong>
        </span>
        {summary.readyToBillCount > 0 ? (
          <span>
            <small>Statut</small>
            <StatusPill tone="warning">
              {summary.readyToBillCount} prête{summary.readyToBillCount > 1 ? "s" : ""} à
              facturer
            </StatusPill>
          </span>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className={s.emptyState}>
          <h2>Aucune entrée de temps</h2>
          <p>Les entrées de temps saisies sur ce dossier apparaîtront ici.</p>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Date</th>
                <th>Responsable</th>
                <th className={s.numeric}>Durée</th>
                <th className={s.numeric}>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const meta = e.isWrittenOff
                  ? BILLING_STATUS_LABELS.WRITTEN_OFF
                  : !e.facturable
                    ? BILLING_STATUS_LABELS.NON_BILLABLE
                    : (BILLING_STATUS_LABELS[e.billingStatus ?? "NON_BILLED"] ??
                      BILLING_STATUS_LABELS.NON_BILLED);
                return (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.description ?? "Entrée de temps"}</strong>
                    </td>
                    <td>{dateShortFR(e.date)}</td>
                    <td>{e.user?.nom ?? "—"}</td>
                    <td className={s.numeric}>{hoursLabel(e.dureeMinutes)}</td>
                    <td className={s.numeric}>{moneyFR.format(e.montant)}</td>
                    <td>
                      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {debours.length > 0 ? (
        <>
          <div className={s.sectionHeader}>
            <div>
              <div className={s.sectionEyebrow}>Débours</div>
              <h2>Débours du dossier</h2>
            </div>
          </div>
          <div className={s.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date</th>
                  <th className={s.numeric}>Montant</th>
                  <th>Refacturable</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {debours.map((d) => {
                  const meta =
                    DEBOURS_STATUS_LABELS[d.statutDebours] ??
                    DEBOURS_STATUS_LABELS.NON_FACTURE;
                  return (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.description}</strong>
                      </td>
                      <td>{dateShortFR(d.date)}</td>
                      <td className={s.numeric}>{moneyFR.format(d.montant)}</td>
                      <td>{d.refacturable ? "Oui" : "Non"}</td>
                      <td>
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
