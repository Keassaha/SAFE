import { ChronologieCorrespondance } from "@/components/correspondance/ChronologieCorrespondance";
import { ApercuListeEnvoyables, BoutonFactice } from "./apercu-envoi";
import type { EntreeCorrespondance } from "@/lib/services/correspondance/chronologie";

/**
 * Aperçu de la chronologie de correspondance, hors authentification.
 *
 * Sert à juger la composition sur des cas limites plutôt que sur un gabarit
 * (M1) : objet très long, envoi en échec avec son motif, ligne saisie à la
 * main sans destinataire, pièces en nombre inconnu, correspondance de plus de
 * trente jours qui bascule du temps relatif à la date. Ce sont les cas qui
 * cassent une mise en page, donc les seuls qui prouvent qu'elle tient.
 *
 * Les quatre états de l'écran sont montrés côte à côte : garni, vide,
 * chargement, erreur (PS-032).
 *
 * Cette route ne touche pas la base et n'est pas branchée à la navigation.
 */
export const dynamic = "force-dynamic";

/* Instant figé : sans cela, le temps relatif change à chaque capture et deux
   contrôles visuels ne sont plus comparables. */
const MAINTENANT = Date.parse("2026-09-05T15:00:00Z");
const MINUTE = 60_000;
const HEURE = 3_600_000;
const JOUR = 86_400_000;
const ilYA = (ms: number) => new Date(MAINTENANT - ms).toISOString();

const NORTHFIELD = { id: "d1", intitule: "Northfield — recouvrement de loyers", numero: "2026-0091" };
const TREMBLAY = { id: "d2", intitule: "Tremblay — garde et pension", numero: "2026-0104" };

const ENTREES: EntreeCorrespondance[] = [
  {
    id: "notification:a1",
    source: "document",
    sens: "sortant",
    etat: "envoye",
    date: ilYA(22 * MINUTE),
    objet: "Mise en demeure — Groupe immobilier Northfield et Associés inc.",
    interlocuteur: "contentieux@northfield-immobilier.ca",
    auteur: null,
    detail: null,
    nbPieces: 2,
    erreur: null,
    dossier: NORTHFIELD,
  },
  {
    id: "facture:a2",
    source: "facture",
    sens: "sortant",
    etat: "echec",
    date: ilYA(5 * HEURE),
    objet: "Facture 2026-0142 — Derisier Law",
    interlocuteur: "comptabilite@northfield-immobilier.ca",
    auteur: "Me Marjorie-Alexandra Derisier",
    detail: "Facture 2026-0142",
    nbPieces: 1,
    erreur: "Le domaine du destinataire a refusé le message.",
    dossier: NORTHFIELD,
  },
  {
    id: "facture:a3",
    source: "facture",
    sens: "sortant",
    etat: "envoye",
    date: ilYA(2 * JOUR),
    objet: "Facture 2026-0138 — Derisier Law",
    interlocuteur: "comptabilite@northfield-immobilier.ca",
    auteur: "Me Marjorie-Alexandra Derisier",
    detail: "Facture 2026-0138",
    nbPieces: 1,
    erreur: null,
    dossier: NORTHFIELD,
  },
  {
    id: "saisie:a4",
    source: "saisie",
    sens: "saisi",
    etat: "saisi",
    date: ilYA(9 * JOUR),
    objet: "Appel du greffe de la Cour supérieure au sujet de la date d'audition",
    // Ligne du cartable sans destinataire : l'expéditeur tient lieu de contrepartie.
    interlocuteur: "Greffe de la Cour supérieure",
    auteur: "Greffe de la Cour supérieure",
    detail: "appel telephonique",
    nbPieces: null,
    erreur: null,
    dossier: NORTHFIELD,
  },
  {
    id: "notification:a5",
    source: "notification",
    sens: "sortant",
    etat: "envoye",
    date: ilYA(64 * JOUR),
    objet: "Ouverture de votre dossier",
    interlocuteur: "j.tremblay@exemple.ca",
    auteur: null,
    detail: null,
    nbPieces: null,
    erreur: null,
    dossier: TREMBLAY,
  },
];

function Cas({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-si-muted">{titre}</h2>
      {children}
    </section>
  );
}

export default function ApercuCorrespondancePage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 bg-si-canvas p-8">
      <header>
        <h1 className="text-[20px] font-medium text-si-ink">Chronologie de correspondance</h1>
        <p className="mt-1 max-w-[65ch] text-[13px] text-si-muted">
          Onglet Correspondance du cartable, lot 0. Contrôle visuel sur cas limites.
        </p>
      </header>

      <Cas titre="Garni, vue d'un dossier (avec l'action du lot 0.5)">
        <ChronologieCorrespondance
          entrees={ENTREES}
          maintenant={MAINTENANT}
          action={<BoutonFactice />}
        />
      </Cas>

      <Cas titre="Lot 0.5 — le choix de la piece a transmettre">
        <ApercuListeEnvoyables />
      </Cas>

      <Cas titre="Garni, vue cabinet (le dossier s'affiche)">
        <ChronologieCorrespondance entrees={ENTREES} afficherDossier maintenant={MAINTENANT} />
      </Cas>

      <Cas titre="Garni, liste tronquée">
        <ChronologieCorrespondance entrees={ENTREES.slice(0, 2)} tronquee maintenant={MAINTENANT} />
      </Cas>

      <Cas titre="Vide">
        <ChronologieCorrespondance entrees={[]} maintenant={MAINTENANT} />
      </Cas>

      <Cas titre="Chargement">
        <ChronologieCorrespondance entrees={[]} chargement maintenant={MAINTENANT} />
      </Cas>

      <Cas titre="Erreur">
        <ChronologieCorrespondance
          entrees={[]}
          erreur="La correspondance n'a pas pu être chargée."
          maintenant={MAINTENANT}
        />
      </Cas>
    </main>
  );
}
