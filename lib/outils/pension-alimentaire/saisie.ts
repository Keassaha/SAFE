/**
 * SAFE — Ce que l'écran saisit, traduit en ce que le moteur calcule.
 *
 * Même raison d'être que son jumeau du patrimoine familial : la lecture des champs ne
 * doit pas vivre dans un composant, sinon elle n'est vérifiable qu'en ouvrant un
 * navigateur. Ici tout est pur, et le composant ne garde que le rendu.
 */

import type { Entree, Parent, RevenusParent, SituationGarde } from "./calcul";

export interface SaisieParent {
  revenuAnnuel: string;
  cotisationsSyndicales: string;
  cotisationsProfessionnelles: string;
}

export interface Saisie {
  divorce: boolean;
  deuxParentsAuQuebec: boolean;
  pere: SaisieParent;
  mere: SaisieParent;
  nombreEnfants: string;
  fraisGarde: string;
  fraisEtudes: string;
  fraisParticuliers: string;
  situation: SituationGarde;
  parentNonGardien: Parent;
  joursNonGardien: string;
  enfantsChezPere: string;
  enfantsChezMere: string;
  joursPere: string;
  joursMere: string;
}

/** Voir le jumeau du patrimoine : un cabinet écrit « 1 250,50 $ », jamais « 1250.5 ». */
export function nombre(saisie: string): number {
  const n = Number(saisie.replace(/[\s $]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Les jours de garde se saisissent en JOURS, pas en pourcentage.
 *
 * Le formulaire calcule lui-même le pourcentage (lignes 515 et 530) en divisant par
 * 365. Demander un pourcentage ferait saisir une valeur déjà arrondie, et l'arrondi
 * d'un facteur intermédiaire est exactement ce que les deux calculateurs évitent.
 */
export function jours(saisie: string): number {
  const n = nombre(saisie);
  return n > 365 ? 365 : n < 0 ? 0 : n;
}

const parentVersModele = (p: SaisieParent): RevenusParent => ({
  revenuAnnuel: nombre(p.revenuAnnuel),
  cotisationsSyndicales: nombre(p.cotisationsSyndicales),
  cotisationsProfessionnelles: nombre(p.cotisationsProfessionnelles),
});

export function saisieVersEntree(s: Saisie): Entree {
  return {
    contexte: { divorce: s.divorce, deuxParentsAuQuebec: s.deuxParentsAuQuebec },
    pere: parentVersModele(s.pere),
    mere: parentVersModele(s.mere),
    nombreEnfants: Math.max(0, Math.round(nombre(s.nombreEnfants))),
    frais: {
      garde: nombre(s.fraisGarde),
      etudesPostsecondaires: nombre(s.fraisEtudes),
      particuliers: nombre(s.fraisParticuliers),
    },
    garde: {
      situation: s.situation,
      parentNonGardien: s.parentNonGardien,
      joursNonGardien: jours(s.joursNonGardien),
      enfantsChezPere: Math.max(0, Math.round(nombre(s.enfantsChezPere))),
      enfantsChezMere: Math.max(0, Math.round(nombre(s.enfantsChezMere))),
      joursPere: jours(s.joursPere),
      joursMere: jours(s.joursMere),
    },
  };
}

/** Le calcul n'a de sens qu'une fois les deux revenus et le nombre d'enfants donnés. */
export function saisieSuffisante(s: Saisie): boolean {
  return (
    nombre(s.nombreEnfants) >= 1 &&
    (nombre(s.pere.revenuAnnuel) > 0 || nombre(s.mere.revenuAnnuel) > 0)
  );
}
