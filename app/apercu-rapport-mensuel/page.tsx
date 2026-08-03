import { notFound } from "next/navigation";
import { getReportBlocks } from "@/lib/compliance/monthly-report";
import { MonthlyReportScreen } from "@/components/fideicommis/MonthlyReportScreen";

/**
 * Prévisualisation de l'écran du rapport mensuel, avec des données de démonstration.
 *
 * ⚠️ DÉVELOPPEMENT SEULEMENT. La route renvoie 404 en production. Elle existe pour
 * contrôler le rendu sans base de données ni session, et parce que la vérification
 * visuelle d'un écran ne devrait pas dépendre d'un jeu de données réel.
 *
 * Les données sont VOLONTAIREMENT imparfaites : un écart avec la banque non motivé,
 * une carte-client débitrice, un chèque qui circule depuis plus de six mois, aucun
 * relevé rattaché. Un écran de conformité se juge sur les cas qui posent problème,
 * pas sur un mois exemplaire (méta-règle M1 : partir du contenu réel, cas limites
 * compris).
 */

export const dynamic = "force-dynamic";

const BLOCKS = getReportBlocks("QC");

export default function ApercuRapportMensuelPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-[var(--si-canvas)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-wide text-[var(--si-muted)]">
            Prévisualisation, données de démonstration
          </p>
          <h1 className="mt-1 text-2xl text-[var(--si-ink)]">Rapport comptable mensuel</h1>
          <p className="mt-1 text-sm text-[var(--si-muted)]">
            Les sept blocs de l'article 41 du Règlement sur la comptabilité en fidéicommis des
            avocats.
          </p>
        </header>

        <MonthlyReportScreen
          province="QC"
          canEdit
          blocks={BLOCKS}
          accounts={[{ id: "acc-1", label: "Compte général en fidéicommis", last4: "4417" }]}
          reports={[
            {
              id: "rep-1",
              periode: "2026-06",
              status: "complete",
              accountLabel: "Compte général en fidéicommis",
              certifiedAt: null,
              deadline: {
                dueAt: null,
                daysRemaining: null,
                overdue: false,
                reference: "B-1 r.5, art. 40",
                noteFr:
                  "Le Québec n'impose aucun délai en jours : l'art. 40 exige un registre à jour des rapports mensuels.",
              },
            },
            {
              id: "rep-2",
              periode: "2026-05",
              status: "certified",
              accountLabel: "Compte général en fidéicommis",
              certifiedAt: "2026-06-14T00:00:00.000Z",
              deadline: {
                dueAt: null,
                daysRemaining: null,
                overdue: false,
                reference: "B-1 r.5, art. 40",
                noteFr: "Rapport certifié.",
              },
            },
          ]}
          defaultPeriode="2026-07"
          defaultAccountId="acc-1"
          depositCandidates={[
            {
              id: "t1",
              receivedDate: "2026-06-29T00:00:00.000Z",
              amount: 3200,
              clientName: "Succession Lavoie",
              dossierRef: "2026-041",
            },
          ]}
          detail={{
            id: "rep-1",
            periode: "2026-06",
            status: "complete",
            accountLabel: "Compte général en fidéicommis",
            accountLast4: "4417",
            totalReceipts: 48750.0,
            totalDisbursements: 39215.4,
            bankStatementBalance: 62480.15,
            journalBalance: 58105.15,
            ledgerSumBalance: 58105.15,
            outstandingChequesTotal: 4200.0,
            depositsInTransitTotal: 0,
            reconciledBalance: 58280.15,
            ecartBanque: 175.0,
            ecartCartesClients: 0,
            certifiedAt: null,
            declarationText: null,
            bankStatement: null,
            documents: [
              { id: "d1", nom: "Relevé Desjardins juin 2026.pdf" },
              { id: "d2", nom: "Relevé Desjardins mai 2026.pdf" },
            ],
            deadline: {
              dueAt: null,
              daysRemaining: null,
              overdue: false,
              reference: "B-1 r.5, art. 40",
              noteFr:
                "Le Québec n'impose aucun délai en jours : l'art. 40 exige un registre à jour des rapports mensuels.",
            },
            ledgerLines: [
              {
                clientName: "Succession Lavoie",
                dossierRef: "2026-041 — Liquidation successorale",
                lastEntryDate: "2026-06-28T00:00:00.000Z",
                balance: 31500,
              },
              {
                clientName: "9412-8830 Québec inc.",
                dossierRef: "2026-017 — Vente d'actifs",
                lastEntryDate: "2026-06-19T00:00:00.000Z",
                balance: 18400,
              },
              {
                clientName: "Marie-Claude Bergeron",
                dossierRef: "2025-233 — Séparation de corps",
                lastEntryDate: "2026-06-30T00:00:00.000Z",
                balance: 8455.15,
              },
              {
                clientName: "Groupe Tessier et Fils",
                dossierRef: "2026-052 — Mise en demeure",
                lastEntryDate: "2026-06-11T00:00:00.000Z",
                balance: -250,
              },
            ],
            chequeLines: [
              {
                chequeNumber: 1042,
                issueDate: "2026-06-24T00:00:00.000Z",
                amount: 2800,
                payeeName: "Officier de la publicité foncière",
                clientName: "9412-8830 Québec inc.",
                dossierRef: "2026-017",
                stale: false,
              },
              {
                chequeNumber: 1019,
                issueDate: "2025-11-08T00:00:00.000Z",
                amount: 1400,
                payeeName: "Huissiers Provost",
                clientName: "Marie-Claude Bergeron",
                dossierRef: "2025-233",
                stale: true,
              },
            ],
            depositLines: [],
            discrepancies: [],
          }}
        />
      </div>
    </div>
  );
}
