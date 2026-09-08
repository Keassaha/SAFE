"use client";

/**
 * Cas de contrôle du sélecteur d'envoi (lot 0.5), hors authentification.
 *
 * Le vrai composant, sur des cas limites choisis pour casser la mise en page :
 * un titre de document très long, un brouillon, un montant à sept chiffres, et
 * les deux avertissements qui se posent avant la liste.
 */

import { Mail } from "lucide-react";
import { ListeEnvoyables } from "@/components/correspondance/ListeEnvoyables";

const DOCUMENTS = [
  { id: "d1", titre: "Mise en demeure de payer les arrérages de loyer et de quitter les lieux", type: "lettre", statut: "final" },
  { id: "d2", titre: "Lettre au greffe", type: "lettre", statut: "brouillon" },
  { id: "d3", titre: "Convention de règlement hors cour", type: "contrat", statut: "final" },
];

const FACTURES = [
  { id: "f1", numero: "2026-0142", invoiceStatus: "DRAFT", montantTotal: 1284300.5 },
  { id: "f2", numero: "2026-0143", invoiceStatus: "READY_TO_ISSUE", montantTotal: 920.75 },
];

const rien = () => {};

/** Le bouton seul, pour juger l'en-tête de la chronologie. Il n'ouvre rien. */
export function BoutonFactice() {
  return (
    <span className="inline-flex min-h-tap items-center gap-1.5 rounded-md bg-si-ink-strong px-4 text-sm font-medium text-si-surface">
      <Mail className="h-4 w-4" aria-hidden />
      Nouvel envoi
    </span>
  );
}

function Panneau({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] text-si-muted">{titre}</p>
      <div className="rounded-lg border border-si-line bg-si-surface px-5 py-4">{children}</div>
    </div>
  );
}

export function ApercuListeEnvoyables() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Panneau titre="Cas courant">
        <ListeEnvoyables
          documents={DOCUMENTS}
          factures={FACTURES}
          onChoisirDocument={rien}
          onChoisirFacture={rien}
        />
      </Panneau>

      <Panneau titre="Client sans courriel, dossier ferme">
        <ListeEnvoyables
          documents={DOCUMENTS.slice(0, 1)}
          factures={[]}
          clientAUnCourriel={false}
          dossierFerme
          onChoisirDocument={rien}
          onChoisirFacture={rien}
        />
      </Panneau>

      <Panneau titre="Rien a transmettre">
        <ListeEnvoyables documents={[]} factures={[]} onChoisirDocument={rien} onChoisirFacture={rien} />
      </Panneau>

      <Panneau titre="Chargement">
        <ListeEnvoyables documents={[]} factures={[]} chargement onChoisirDocument={rien} onChoisirFacture={rien} />
      </Panneau>
    </div>
  );
}
