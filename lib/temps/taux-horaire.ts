/**
 * SAFE — D'où vient le taux horaire d'une heure travaillée.
 *
 * Le produit portait QUATRE cascades différentes, écrites à quatre endroits :
 *
 *   1. la modale de saisie de temps  : dossier → avocat → 0
 *   2. le tiroir de temps v2          : dossier → 0
 *   3. la fin d'un document           : corps de requête → dossier → 150 $ EN DUR
 *   4. l'écran de facturation         : rien, toujours 0
 *
 * Quatre écrans, quatre réponses possibles pour la même heure. Et la branche
 * « avocat » ne servait jamais : `User.defaultHourlyRate` n'était réglable par
 * AUCUNE interface du produit, donc toujours vide.
 *
 * Une seule règle désormais, ici, pure et testée :
 *
 *   le dossier, puis l'avocat, puis le cabinet.
 *
 * Le dossier prime parce qu'un mandat négocié à un taux particulier doit
 * l'emporter sur le taux ordinaire de celui qui y travaille. Le cabinet ferme
 * la marche pour qu'un nouveau cabinet ne parte jamais de zéro.
 *
 * Ce que cette fonction ne fait PAS : décider à la place de l'utilisateur.
 * Elle propose un chiffre et dit d'où il vient ; le champ reste modifiable
 * partout, et le taux déjà posé sur une heure enregistrée n'est jamais
 * réécrit rétroactivement.
 */

export type SourceDuTaux = "dossier" | "avocat" | "cabinet" | "aucune";

export interface SourcesDuTaux {
  /** `Dossier.tauxHoraire` — le taux négocié pour ce mandat. */
  dossier?: number | null;
  /** `User.defaultHourlyRate` — ce que cet avocat est facturé au client. */
  avocat?: number | null;
  /** `Cabinet.config.tauxHoraireDefaut` — le repli du cabinet. */
  cabinet?: number | null;
}

export interface TauxResolu {
  /** Le taux à proposer. 0 quand rien n'est réglé nulle part. */
  taux: number;
  /** D'où il vient, pour pouvoir le dire à l'écran. */
  source: SourceDuTaux;
}

/**
 * Un taux n'est utilisable que s'il est un nombre fini strictement positif.
 * Zéro n'est pas « un taux à zéro », c'est « pas de taux » : le produit refuse
 * déjà d'enregistrer un temps facturable à 0, et un `null` mal converti en
 * `Number()` donne 0 sans prévenir.
 */
function utilisable(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

export function resoudreTauxHoraire(sources: SourcesDuTaux): TauxResolu {
  if (utilisable(sources.dossier)) return { taux: sources.dossier, source: "dossier" };
  if (utilisable(sources.avocat)) return { taux: sources.avocat, source: "avocat" };
  if (utilisable(sources.cabinet)) return { taux: sources.cabinet, source: "cabinet" };
  return { taux: 0, source: "aucune" };
}
