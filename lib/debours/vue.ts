/**
 * SAFE — Les débours vus par client, et ce qu'ils totalisent.
 *
 * Un débours est une somme que le cabinet AVANCE pour le compte d'un client :
 * frais de greffe, huissier, traduction certifiée, timbres judiciaires. Ce
 * n'est pas une dépense du cabinet (le loyer, Telus, l'assurance), et ça ne se
 * range ni ne se récupère de la même façon.
 *
 * La page les listait à plat, cent lignes au maximum, sans filtre ni tri. On
 * ne pouvait pas répondre à la seule question qu'on se pose devant : « qu'est-ce
 * que j'ai avancé pour ce client, et qu'est-ce qui n'est pas encore rentré ? »
 *
 * Fonctions PURES : l'écran les appelle, les tests aussi.
 */

import type { DeboursStatut } from "@prisma/client";

export interface DeboursLigne {
  id: string;
  date: string;
  description: string;
  quantite: number;
  montant: number;
  taxable: boolean;
  payeParCabinet: boolean;
  refacturable: boolean;
  statutDebours: DeboursStatut;
  clientId: string;
  clientNom: string;
  dossierId: string;
  dossierLabel: string;
  factureId: string | null;
  factureNumero: string | null;
}

export interface GroupeClient {
  clientId: string;
  clientNom: string;
  lignes: DeboursLigne[];
  /** Nombre de dossiers distincts touchés. */
  nbDossiers: number;
  /** Ce qui reste à porter sur une facture. */
  aRefacturer: number;
  /** Tout ce que le groupe représente, radiations comprises. */
  total: number;
}

/**
 * Ce qui reste à refacturer : refacturable, pas encore porté sur une facture,
 * et pas radié.
 *
 * Une radiation n'est PAS une suppression : le cabinet a bel et bien sorti
 * l'argent, il renonce seulement à le récupérer. La ligne reste visible, son
 * montant sort du « à refacturer ».
 */
export function resteARefacturer(l: DeboursLigne): boolean {
  return l.refacturable && l.statutDebours === "NON_FACTURE";
}

export interface FiltresDebours {
  clientId?: string;
  /** "" = tous. */
  statut?: DeboursStatut | "";
  /** Mois au format AAAA-MM. "" = tous. */
  mois?: string;
}

export function filtrer(lignes: DeboursLigne[], f: FiltresDebours): DeboursLigne[] {
  return lignes.filter((l) => {
    if (f.clientId && l.clientId !== f.clientId) return false;
    if (f.statut && l.statutDebours !== f.statut) return false;
    if (f.mois && l.date.slice(0, 7) !== f.mois) return false;
    return true;
  });
}

/** Regroupe par client, du plus gros reste à refacturer au plus petit. */
export function grouperParClient(lignes: DeboursLigne[]): GroupeClient[] {
  const par = new Map<string, DeboursLigne[]>();
  for (const l of lignes) {
    const liste = par.get(l.clientId);
    if (liste) liste.push(l);
    else par.set(l.clientId, [l]);
  }

  const groupes: GroupeClient[] = [];
  for (const [clientId, liste] of par) {
    groupes.push({
      clientId,
      clientNom: liste[0].clientNom,
      lignes: liste,
      nbDossiers: new Set(liste.map((l) => l.dossierId)).size,
      aRefacturer: arrondi(
        liste.filter(resteARefacturer).reduce((s, l) => s + l.montant, 0),
      ),
      total: arrondi(liste.reduce((s, l) => s + l.montant, 0)),
    });
  }

  /* Le client dont il reste le plus à récupérer passe devant : c'est celui
     dont l'argent dort le plus longtemps. À égalité, l'ordre alphabétique,
     pour que la page ne bouge pas d'un rendu à l'autre. */
  groupes.sort(
    (a, b) => b.aRefacturer - a.aRefacturer || a.clientNom.localeCompare(b.clientNom, "fr"),
  );
  return groupes;
}

export interface TotauxDebours {
  /** À porter sur une facture. */
  aRefacturer: number;
  /** Sorti du compte du cabinet et pas encore rentré. */
  avanceNonRembourse: number;
  /** Rentré : facturé ET encaissé. */
  recouvre: number;
  /** Abandonné : le cabinet absorbe le coût. */
  radie: number;
}

export function totaux(lignes: DeboursLigne[]): TotauxDebours {
  let aRefacturer = 0;
  let avanceNonRembourse = 0;
  let recouvre = 0;
  let radie = 0;

  for (const l of lignes) {
    if (resteARefacturer(l)) aRefacturer += l.montant;
    /* « Avancé, pas encore remboursé » ne compte que ce qui est SORTI du
       compte du cabinet. Un débours payé directement par le client n'a jamais
       quitté ce compte : le compter ici gonflerait une créance imaginaire. */
    if (l.payeParCabinet && (l.statutDebours === "NON_FACTURE" || l.statutDebours === "FACTURE")) {
      avanceNonRembourse += l.montant;
    }
    if (l.statutDebours === "RECOUVRE") recouvre += l.montant;
    if (l.statutDebours === "RADIE") radie += l.montant;
  }

  return {
    aRefacturer: arrondi(aRefacturer),
    avanceNonRembourse: arrondi(avanceNonRembourse),
    recouvre: arrondi(recouvre),
    radie: arrondi(radie),
  };
}

/** Les mois présents, du plus récent au plus ancien. */
export function moisPresents(lignes: DeboursLigne[]): string[] {
  return [...new Set(lignes.map((l) => l.date.slice(0, 7)))].sort().reverse();
}

function arrondi(n: number): number {
  return Math.round(n * 100) / 100;
}
