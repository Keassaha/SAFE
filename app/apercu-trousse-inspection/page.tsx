import { notFound } from "next/navigation";
import { getPresentationDuties } from "@/lib/compliance/inspection-access";
import { InspectionKitScreen } from "@/components/conformite/InspectionKitScreen";

/**
 * Prévisualisation de la trousse d'inspection, avec des données de démonstration.
 *
 * ⚠️ DÉVELOPPEMENT SEULEMENT. 404 en production.
 *
 * Les données sont volontairement imparfaites : deux mois sans rapport, un registre
 * indisponible, un rapport non certifié. Un écran de conformité se juge sur les cas
 * qui posent problème, pas sur une période exemplaire (méta-règle M1).
 */

export const dynamic = "force-dynamic";

export default function ApercuTroussePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const manifeste = [
    "TROUSSE D'INSPECTION",
    "",
    "Cabinet : Cabinet Derisier",
    "Régime : Barreau du Québec",
    "Période : 2025-07-01 au 2026-06-30",
    "Produite le : 2026-08-04T12:00:00.000Z",
    "",
    "⚠️ 3 pièce(s) manquante(s) ou incomplète(s) :",
    "   - Livre des honoraires et déboursés (B-1 r.5, art. 34) : Registre indisponible pour ce cabinet.",
    "   - Rapport comptable mensuel 2026-04 (B-1 r.5, art. 41) : Aucun rapport n'a été produit pour ce mois.",
    "   - Rapport comptable mensuel 2026-06 (B-1 r.5, art. 41) : Rapport produit mais non certifié.",
    "",
    "Cette trousse ne certifie pas la conformité du cabinet. Elle rassemble ce qui existe",
    "et nomme ce qui manque.",
  ].join("\n");

  return (
    <div className="min-h-screen bg-[var(--si-canvas)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-wide text-[var(--si-muted)]">
            Prévisualisation, données de démonstration
          </p>
          <h1 className="mt-1 text-2xl text-[var(--si-ink)]">Trousse d'inspection</h1>
        </header>

        <InspectionKitScreen
          from="2025-07-01"
          to="2026-06-30"
          province="QC"
          cabinetName="Cabinet Derisier"
          missingCount={3}
          manifestFingerprint="4f3c9a17bd82e6041c7fa9be2d5310ef8873ba90c4e17d62f0aa3915bc48de77"
          manifest={manifeste}
          duties={getPresentationDuties("QC")}
          items={[
            {
              kind: "REGISTER",
              filename: "registres/TRUST_CASH_JOURNAL.csv",
              titleFr: "Journal des recettes et déboursés en fidéicommis",
              reference: "B-1 r.5, art. 38",
              rowCount: 412,
              fingerprint: "9a1f7c4e2b83d05617fa9be2d5310ef8873ba90c4e17d62f0aa3915bc48de771",
              missingReasonFr: null,
            },
            {
              kind: "REGISTER",
              filename: "registres/CLIENT_LEDGERS.csv",
              titleFr: "Cartes-clients (grand livre du fidéicommis)",
              reference: "B-1 r.5, art. 39",
              rowCount: 87,
              fingerprint: "2c8e0d5a91b74f3627fa9be2d5310ef8873ba90c4e17d62f0aa3915bc48de772",
              missingReasonFr: null,
            },
            {
              kind: "REGISTER",
              filename: "registres/CHEQUE_REGISTER.csv",
              titleFr: "Registre des chèques",
              reference: "B-1 r.5, art. 61",
              rowCount: 64,
              fingerprint: "7b3d1e9f05a2c84737fa9be2d5310ef8873ba90c4e17d62f0aa3915bc48de773",
              missingReasonFr: null,
            },
            {
              kind: "REGISTER",
              filename: "registres/FEES_BOOK.csv",
              titleFr: "Livre des honoraires et déboursés",
              reference: "B-1 r.5, art. 34",
              rowCount: 0,
              fingerprint: null,
              missingReasonFr: "Registre indisponible pour ce cabinet.",
            },
            {
              kind: "MONTHLY_REPORT",
              filename: "rapports-mensuels/2026-03.txt",
              titleFr: "Rapport comptable mensuel 2026-03",
              reference: "B-1 r.5, art. 41",
              rowCount: 1,
              fingerprint: "5e2a8c1b7d940f3647fa9be2d5310ef8873ba90c4e17d62f0aa3915bc48de774",
              missingReasonFr: null,
            },
            {
              kind: "MONTHLY_REPORT",
              filename: "rapports-mensuels/2026-04.txt",
              titleFr: "Rapport comptable mensuel 2026-04",
              reference: "B-1 r.5, art. 41",
              rowCount: 0,
              fingerprint: null,
              missingReasonFr: "Aucun rapport n'a été produit pour ce mois.",
            },
            {
              kind: "MONTHLY_REPORT",
              filename: "rapports-mensuels/2026-06.txt",
              titleFr: "Rapport comptable mensuel 2026-06",
              reference: "B-1 r.5, art. 41",
              rowCount: 1,
              fingerprint: "8d4b2f6a3c951e0757fa9be2d5310ef8873ba90c4e17d62f0aa3915bc48de775",
              missingReasonFr: "Rapport produit mais non certifié.",
            },
            {
              kind: "SHORTFALL_LOG",
              filename: "soldes-debiteurs.csv",
              titleFr: "Soldes débiteurs constatés et comblés",
              reference: "B-1 r.5, art. 59, 60",
              rowCount: 2,
              fingerprint: "1f7e3a9d5c284b6067fa9be2d5310ef8873ba90c4e17d62f0aa3915bc48de776",
              missingReasonFr: null,
            },
          ]}
        />
      </div>
    </div>
  );
}
