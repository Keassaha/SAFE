import Link from "next/link";
import { prisma } from "@/lib/db";
import type { DossierFinancialSummary } from "@/lib/dossiers/financial-summary";
import { routes } from "@/lib/routes";
import s from "../../../v2.module.css";
import { moneyFR, dateShortFR } from "../../../_components/primitives";

const TRUST_TYPE_LABELS: Record<string, string> = {
  deposit: "Dépôt",
  withdrawal: "Retrait",
  correction: "Correction",
};

/**
 * Onglet Fidéicommis — lecture seule (le fidéicommis ne se manipule jamais
 * depuis la préversion : les écritures passent par les écrans dédiés).
 */
export async function TrustTab({
  cabinetId,
  dossierId,
  numeroDossier,
  summary,
}: {
  cabinetId: string;
  dossierId: string;
  numeroDossier: string;
  summary: DossierFinancialSummary;
}) {
  const transactions = await prisma.trustTransaction.findMany({
    where: { cabinetId, dossierId },
    orderBy: { date: "desc" },
    take: 50,
    select: {
      id: true,
      date: true,
      type: true,
      amount: true,
      note: true,
      description: true,
      balanceAfter: true,
    },
  });

  return (
    <section className={s.fullSection}>
      <div className={s.sectionHeader}>
        <div>
          <div className={s.sectionEyebrow}>Fidéicommis</div>
          <h2>Fonds détenus pour ce dossier</h2>
          <p>Le solde et les mouvements restent rattachés au dossier.</p>
        </div>
        <div className={s.sectionActions}>
          <Link href={routes.comptes} className={s.secondaryButton}>
            Gérer en fiducie
          </Link>
        </div>
      </div>

      <div className={s.trustHero}>
        <div>
          <small>Solde disponible</small>
          <strong>{moneyFR.format(summary.trustBalance)}</strong>
          <span>Compte général en fidéicommis · {numeroDossier}</span>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className={s.emptyState}>
          <h2>Aucun mouvement de fiducie</h2>
          <p>Les dépôts et retraits liés à ce dossier apparaîtront ici.</p>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Mouvement</th>
                <th>Note</th>
                <th className={s.numeric}>Entrée</th>
                <th className={s.numeric}>Sortie</th>
                <th className={s.numeric}>Solde après</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isIn = tx.type === "deposit" || (tx.type === "correction" && tx.amount >= 0);
                const abs = Math.abs(tx.amount);
                return (
                  <tr key={tx.id}>
                    <td>{dateShortFR(tx.date)}</td>
                    <td>
                      <strong>{TRUST_TYPE_LABELS[tx.type] ?? tx.type}</strong>
                    </td>
                    <td>{tx.description ?? tx.note ?? "—"}</td>
                    <td className={s.numeric}>{isIn ? moneyFR.format(abs) : "—"}</td>
                    <td className={s.numeric}>{!isIn ? moneyFR.format(abs) : "—"}</td>
                    <td className={s.numeric}>
                      {tx.balanceAfter != null ? moneyFR.format(tx.balanceAfter) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
