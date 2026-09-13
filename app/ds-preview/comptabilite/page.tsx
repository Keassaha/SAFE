"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { JournauxOnglets } from "@/components/comptabilite/JournauxOnglets";
import { JournalBrutTable } from "@/components/comptabilite/JournalBrutTable";
import { MovementsTable } from "@/components/comptabilite/MovementsTable";
import { MovementLegend } from "@/components/comptabilite/MovementLegend";
import { RegistreBarreOutils, registreChampClass, registreSelectClass } from "@/components/ui/registre";
import type { JournalEntryRow } from "@/types/journal";

/**
 * Contrôle visuel de la Comptabilité, hors authentification : la rangée
 * d'onglets avec ses boutons, la barre du journal, le journal brut puis la vue
 * expliquée, sur des cas limites (client long, écriture du cabinet sans client,
 * pièce longue). Ne touche pas la base, n'est pas branchée à la navigation.
 */
const ligne = (o: Partial<JournalEntryRow> & { id: string }): JournalEntryRow => ({
  dateTransaction: new Date("2026-09-11T12:00:00Z"),
  typeTransaction: "PAIEMENT",
  reference: null,
  clientId: null,
  clientName: null,
  dossierId: null,
  dossierLabel: null,
  description: "",
  categorie: null,
  documentIdentifier: null,
  montantEntree: 0,
  montantSortie: 0,
  sourceModule: "FACTURATION",
  sourceId: null,
  utilisateurId: null,
  utilisateurName: null,
  createdAt: new Date("2026-09-11T12:00:00Z"),
  annuleId: null,
  motifCode: null,
  motifTexte: null,
  estAnnulee: false,
  annulable: false,
  ...o,
} as JournalEntryRow);

const ENTREES: JournalEntryRow[] = [
  ligne({ id: "e1", typeTransaction: "PAIEMENT", clientName: "Groupe immobilier Northfield et Associés inc.", dossierLabel: "2026-0042", documentIdentifier: "2026-0042", montantEntree: 12500, description: "Paiement facture 2026-0042", categorie: "bank_transfer" }),
  ligne({ id: "e2", typeTransaction: "FACTURE", dateTransaction: new Date("2026-09-10T12:00:00Z"), clientName: "Ouellet, Marie-Ève", dossierLabel: "2026-0039", documentIdentifier: "2026-0039", montantEntree: 18940, description: "Facture 2026-0039" }),
  ligne({ id: "e3", typeTransaction: "DEPENSE", dateTransaction: new Date("2026-09-08T12:00:00Z"), documentIdentifier: "Bureau en gros", montantSortie: 312.4, description: "Fournitures", categorie: "fournitures", sourceModule: "DEPENSES" }),
  ligne({ id: "e4", typeTransaction: "DEBOURS", dateTransaction: new Date("2026-09-05T12:00:00Z"), clientName: "Succession de feu Roland Bergeron", dossierLabel: "2026-0037", documentIdentifier: "Greffe de la Cour supérieure du Québec, district de Montréal", montantSortie: 214, description: "Frais de cour", categorie: "frais_de_cour" }),
  ligne({ id: "e5", typeTransaction: "AJUSTEMENT", dateTransaction: new Date("2026-09-02T12:00:00Z"), documentIdentifier: "AJ-2026-09", montantEntree: 1284300.5, description: "Régularisation de solde d'ouverture", annulable: true, sourceModule: "AJUSTEMENT_MANUEL" }),
];

const ONGLETS = [
  { id: "general", label: "Journal général", count: 143 },
  { id: "depenses", label: "Journal des dépenses", count: 58 },
  { id: "paiements", label: "Paiements", count: 57 },
] as const;

export default function ApercuComptabilite() {
  const [actif, setActif] = useState<"general" | "depenses" | "paiements">("general");
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[1240px] px-6 py-10">
        <div className="flex items-end justify-between gap-3">
          <PageHeader variant="dashboard" title="Comptabilité" description="Données fictives. Contrôle visuel des composants réels sur leurs cas limites." />
          <span className="pb-4 text-[13px] text-si-muted underline decoration-si-line underline-offset-2">Masquer l'aide</span>
        </div>
        <MovementLegend />
        <section className="safe-feuille mt-6 overflow-hidden">
          <JournauxOnglets
            items={[...ONGLETS]}
            actif={actif}
            onChoisir={setActif}
            ariaLabel="Onglets comptabilité"
            actions={
              <>
                <Button variant="secondary">Exporter CSV</Button>
                <Button variant="primary">Nouvelle écriture</Button>
              </>
            }
          />
          <RegistreBarreOutils
            recherche={<input className={`${registreChampClass} w-full px-3`} placeholder="Référence, description, client…" readOnly />}
            filtres={
              <div className="flex items-center gap-2 text-[13px] text-si-muted">
                <select className={registreSelectClass} disabled><option>Ce mois</option></select>
                <select className={registreSelectClass} disabled><option>Tous les types</option></select>
                <span className="font-medium text-si-ink-strong underline decoration-si-line underline-offset-2">Mouvements expliqués</span>
                <span>143 écritures</span>
              </div>
            }
          />
          <JournalBrutTable entries={ENTREES} onAnnuler={() => undefined} />
        </section>
        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">La vue expliquée, mêmes lignes</p>
        <section className="safe-feuille mt-2 overflow-hidden">
          <MovementsTable entries={ENTREES} onAnnuler={() => undefined} />
        </section>
      </div>
    </div>
  );
}
