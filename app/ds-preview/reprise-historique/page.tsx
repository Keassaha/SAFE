"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Maquette — reprise de l'historique d'un cabinet à partir de ses anciennes
 * factures, déposées en vrac.
 *
 * Ce que l'écran doit prouver au CEO avant qu'une ligne soit codée :
 *
 *  1. le désordre du dépôt ne survit pas. Chaque carte porte son rang de dépôt
 *     (« fichier 7 sur 9 ») et se range pourtant à sa date. La chronologie se
 *     reforme sous les yeux pendant la validation ;
 *  2. un mois sans facture se voit. C'est ce qui permet de dire « il me manque
 *     avril » avant d'écrire quoi que ce soit ;
 *  3. le « payé » se demande, il ne se devine pas. Trois boutons par facture,
 *     jamais de statut présumé ;
 *  4. ce que le modèle n'a pas su lire est signalé, jamais comblé.
 *
 * Données fictives. Route de contrôle visuel, non branchée à la navigation.
 */
export const dynamic = "force-dynamic";

type Statut = "payee" | "partielle" | "impayee";

type Ligne = {
  date: string;
  description: string;
  duree: string;
  montant: string;
  illisible?: boolean;
};

type Facture = {
  id: string;
  numero: string;
  date: string;
  mois: string;
  rangDepot: number;
  fichier: string;
  client: string;
  clientNouveau: boolean;
  dossier: string;
  heures: string;
  montant: string;
  statutLu: Statut;
  datePaiement?: string;
  lignes: Ligne[];
};

const TOTAL_FICHIERS = 9;

const FACTURES: Facture[] = [
  {
    id: "f1",
    numero: "F-2026-011",
    date: "8 mars 2026",
    mois: "Mars 2026",
    rangDepot: 7,
    fichier: "scan_0043.pdf",
    client: "Société Kaboré et fils",
    clientNouveau: true,
    dossier: "Bail commercial, rue Laurier",
    heures: "6 h 15",
    montant: "2 875,00 $",
    statutLu: "payee",
    datePaiement: "2026-04-02",
    lignes: [
      { date: "24 févr.", description: "Étude du bail et des avenants", duree: "1 h 45", montant: "805,00 $" },
      { date: "27 févr.", description: "Appel avec le locateur", duree: "0 h 30", montant: "230,00 $" },
      { date: "2 mars", description: "Rédaction de la mise en demeure", duree: "2 h 30", montant: "1 150,00 $" },
      { date: "6 mars", description: "Signification et suivi", duree: "1 h 30", montant: "690,00 $" },
    ],
  },
  {
    id: "f2",
    numero: "F-2026-012",
    date: "21 mars 2026",
    mois: "Mars 2026",
    rangDepot: 2,
    fichier: "IMG_2291.jpeg",
    client: "Nadine Ouellet",
    clientNouveau: false,
    dossier: "Séparation de corps",
    heures: "3 h 00",
    montant: "1 125,00 $",
    statutLu: "payee",
    datePaiement: "2026-03-29",
    lignes: [],
  },
  {
    id: "f3",
    numero: "F-2026-015",
    date: "14 mai 2026",
    mois: "Mai 2026",
    rangDepot: 9,
    fichier: "facture mai (1).pdf",
    client: "Transport Gatineau-Ottawa inc.",
    clientNouveau: true,
    dossier: "Réclamation contractuelle",
    heures: "9 h 45",
    montant: "4 387,50 $",
    statutLu: "partielle",
    datePaiement: "2026-06-11",
    lignes: [],
  },
  {
    id: "f4",
    numero: "F-2026-016",
    date: "2 juin 2026",
    mois: "Juin 2026",
    rangDepot: 1,
    fichier: "doc scanné 12-06.pdf",
    client: "Nadine Ouellet",
    clientNouveau: false,
    dossier: "Séparation de corps",
    heures: "4 h 30",
    montant: "1 687,50 $",
    statutLu: "impayee",
    lignes: [],
  },
];

const STATUTS: { cle: Statut; libelle: string }[] = [
  { cle: "payee", libelle: "Payée" },
  { cle: "partielle", libelle: "Partielle" },
  { cle: "impayee", libelle: "Impayée" },
];

/** Segment de statut. La couleur ne sert qu'à l'état retenu. */
function ChoixStatut({
  valeur,
  onChange,
}: {
  valeur: Statut;
  onChange: (s: Statut) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-si-line bg-si-surface2 p-0.5" role="group" aria-label="Statut de paiement">
      {STATUTS.map((s) => {
        const actif = s.cle === valeur;
        const teinte =
          s.cle === "payee"
            ? "text-si-verified"
            : s.cle === "partielle"
              ? "text-si-amber-ink"
              : "text-si-danger-ink";
        return (
          <button
            key={s.cle}
            type="button"
            aria-pressed={actif}
            onClick={() => onChange(s.cle)}
            className={`min-h-8 rounded-[6px] px-3 text-[13px] font-medium transition-all ${
              actif
                ? `bg-si-surface shadow-[0_1px_2px_rgba(22,24,23,0.10)] ${teinte}`
                : "text-si-muted hover:text-si-ink"
            }`}
          >
            {s.libelle}
          </button>
        );
      })}
    </div>
  );
}

function CarteFacture({ facture }: { facture: Facture }) {
  const [statut, setStatut] = useState<Statut>(facture.statutLu);
  const [ouverte, setOuverte] = useState(facture.lignes.length > 0);

  return (
    <article className="safe-zoom rounded-xl border border-si-line bg-si-surface">
      <div className="flex items-start gap-5 p-4">
        {/* Date : la seule chose qui décide de la place de cette carte. */}
        <div className="w-[124px] shrink-0 pt-0.5">
          <div className="font-mono text-[13px] tabular-nums text-si-ink">{facture.date}</div>
          <div className="mt-0.5 font-mono text-[12px] text-si-muted">{facture.numero}</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-medium text-si-ink">{facture.client}</span>
            {facture.clientNouveau ? (
              <StatusBadge label="Nouveau client" variant="info" />
            ) : (
              <span className="text-[12px] text-si-subtle">fiche existante</span>
            )}
          </div>
          <div className="mt-1 truncate text-[13px] text-si-muted">{facture.dossier}</div>
          <div className="mt-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOuverte((v) => !v)}
              aria-expanded={ouverte}
              className="inline-flex items-center gap-1 text-[13px] text-si-body underline-offset-4 hover:text-si-ink hover:underline"
            >
              {ouverte ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {facture.heures} de travail, {facture.lignes.length || 5} prestations
            </button>
            <span className="text-si-subtle">·</span>
            <span className="font-mono text-[12px] text-si-subtle">
              {facture.fichier}, fichier {facture.rangDepot} sur {TOTAL_FICHIERS}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <div className="font-mono text-[16px] tabular-nums text-si-ink">{facture.montant}</div>
          <ChoixStatut valeur={statut} onChange={setStatut} />
          {statut !== "impayee" ? (
            <label className="flex items-center gap-2 text-[12px] text-si-muted">
              {statut === "partielle" ? "Reçu le" : "Payée le"}
              <input
                type="text"
                defaultValue={facture.datePaiement ?? ""}
                className="h-8 w-[112px] rounded-md border border-si-line bg-si-canvas px-2 text-center font-mono text-[12px] tabular-nums text-si-ink"
              />
            </label>
          ) : (
            <span className="text-[12px] text-si-danger-ink">Reste dû au cabinet</span>
          )}
        </div>
      </div>

      {ouverte && facture.lignes.length > 0 && (
        <div className="border-t border-si-line2 bg-si-canvas/60 px-4 py-3">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-[12px] font-medium text-si-body">Heures reprises</span>
            <span className="text-[12px] text-si-subtle">
              rangées par date de travail, marquées facturées, elles ne repartiront pas en facturation
            </span>
          </div>
          <table className="w-full">
            <tbody>
              {facture.lignes.map((l) => (
                <tr key={l.description} className="border-b border-si-line2 last:border-0">
                  <td className="w-[92px] py-1.5 font-mono text-[12px] tabular-nums text-si-muted">{l.date}</td>
                  <td className="py-1.5 text-[13px] text-si-ink">{l.description}</td>
                  <td className="w-[80px] py-1.5 text-right font-mono text-[12px] tabular-nums text-si-body">{l.duree}</td>
                  <td className="w-[96px] py-1.5 text-right font-mono text-[12px] tabular-nums text-si-ink">{l.montant}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2.5 text-[12px] text-si-amber-ink">
            Le taux horaire n'était pas lisible sur cette facture. Il a été déduit du montant et des heures, à vérifier.
          </p>
        </div>
      )}
    </article>
  );
}

function EnTeteMois({ mois }: { mois: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-si-muted">{mois}</span>
      <span className="h-px flex-1 bg-si-line" />
    </div>
  );
}

function MoisVide({ mois }: { mois: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-si-subtle">{mois}</span>
      <span className="h-px flex-1 bg-si-line" />
      <span className="text-[12px] text-si-amber-ink">Aucune facture déposée pour ce mois</span>
    </div>
  );
}

export default function ApercuRepriseHistorique() {
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[1080px] px-6 pb-6 pt-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            variant="dashboard"
            title="Reprise de l'historique"
            description="Neuf factures lues, déposées en vrac, rangées ici de la plus ancienne à la plus récente."
          />
          <div className="flex gap-2 pb-4">
            <Button variant="secondary">Ajouter des fichiers</Button>
          </div>
        </div>

        {/* Ce que la lecture a trouvé, avant toute écriture. */}
        <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-si-line bg-si-surface px-5 py-4">
          {[
            ["Période couverte", "mars → juin 2026"],
            ["Clients", "3, dont 2 à créer"],
            ["Heures reprises", "23 h 30"],
            ["Total facturé", "10 075,00 $"],
          ].map(([libelle, valeur]) => (
            <div key={libelle}>
              <div className="text-[12px] text-si-muted">{libelle}</div>
              <div className="mt-0.5 font-mono text-[15px] tabular-nums text-si-ink">{valeur}</div>
            </div>
          ))}
          <div className="ml-auto">
            <div className="text-[12px] text-si-muted">Reste dû</div>
            <div className="mt-0.5 font-mono text-[15px] tabular-nums text-si-danger-ink">3 881,25 $</div>
          </div>
        </div>

        <div className="space-y-3">
          <EnTeteMois mois="Mars 2026" />
          <CarteFacture facture={FACTURES[0]} />
          <CarteFacture facture={FACTURES[1]} />

          <MoisVide mois="Avril 2026" />

          <EnTeteMois mois="Mai 2026" />
          <CarteFacture facture={FACTURES[2]} />

          <EnTeteMois mois="Juin 2026" />
          <CarteFacture facture={FACTURES[3]} />
        </div>
      </div>

      {/* Barre de décision. Une seule action principale sur l'écran. */}
      <div className="barre-decision sticky bottom-0 border-t border-si-line bg-si-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-3">
          <p className="text-[13px] text-si-muted">
            À écrire : 4 factures, 23 h 30 déjà facturées, 2 clients, 3 encaissements.{" "}
            <span className="text-si-body">Rien n'est enregistré avant ce bouton.</span>
          </p>
          <Button variant="primary">Verser au dossier de chaque client</Button>
        </div>
      </div>
    </div>
  );
}
