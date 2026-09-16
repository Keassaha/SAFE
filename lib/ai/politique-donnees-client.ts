/**
 * Ce qui a le droit de sortir de SAFE vers un service d'IA externe.
 *
 * Décision CEO du 2026-09-16 : « la sécurité est importante jusqu'à ce qu'on
 * trouve des alternatives sécuritaires ». La classification automatique des
 * documents est coupée, et la voie ouverte est une classification native, sans
 * envoi externe.
 *
 * Le tri appliqué ici est celui du RAPPORT entre ce qui sort et ce qu'on y
 * gagne, pas celui de la commodité :
 *
 * - **Coupé par défaut** : ce qui part sans que personne ne le décide, et ce qui
 *   emporte un dossier entier. Le résumé de dossier envoie le texte intégral de
 *   chaque pièce, les notes, les procédures et les jugements : c'est le cœur du
 *   secret professionnel, pour un gain de confort.
 * - **Permis, mais refusable** : la lecture d'UNE pièce comptable que quelqu'un
 *   a délibérément déposée pour qu'elle soit lue. Ce qui sort est un nom, un
 *   montant, une date, et ça supprime une vraie saisie. Un cabinet peut
 *   quand même le refuser.
 *
 * Aucune de ces fonctions ne se réactive en douce : tout passe par une variable
 * d'environnement serveur, cabinet par cabinet, sans joker.
 */

export type CapaciteIA =
  | "classification_documents"
  | "resume_dossier"
  | "lecture_preuve_paiement"
  | "lecture_recu_depense"
  | "lecture_facture_reprise";

interface ReglageCapacite {
  /** « coupee » = il faut inscrire le cabinet pour l'autoriser. « permise » = il faut l'inscrire pour la refuser. */
  defaut: "coupee" | "permise";
  variable: string;
  /** Ce qui sort réellement de SAFE, en clair. Sert l'inventaire autant que la lecture du code. */
  envoie: string;
}

export const CAPACITES_IA: Record<CapaciteIA, ReglageCapacite> = {
  classification_documents: {
    defaut: "coupee",
    variable: "SAFE_AI_DOCUMENT_CLASSIFICATION_CABINETS",
    envoie: "le nom et un extrait de CHAQUE document téléversé, automatiquement",
  },
  resume_dossier: {
    defaut: "coupee",
    variable: "SAFE_AI_RESUME_DOSSIER_CABINETS",
    envoie: "le dossier entier : texte intégral de chaque pièce, notes, procédures, jugements",
  },
  lecture_preuve_paiement: {
    defaut: "permise",
    variable: "SAFE_AI_LECTURE_PIECES_REFUSEE_CABINETS",
    envoie: "une notification de virement déposée par le cabinet",
  },
  lecture_recu_depense: {
    defaut: "permise",
    variable: "SAFE_AI_LECTURE_PIECES_REFUSEE_CABINETS",
    envoie: "un reçu de dépense déposé par le cabinet",
  },
  lecture_facture_reprise: {
    defaut: "permise",
    variable: "SAFE_AI_LECTURE_PIECES_REFUSEE_CABINETS",
    envoie: "une facture passée déposée par le cabinet pour reprendre son historique",
  },
};

function cabinetsListes(variable: string): string[] {
  return (process.env[variable] ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Ce cabinet peut-il employer cette capacité ? Une clé API présente ne vaut
 * jamais autorisation : c'est cette fonction qui décide, et elle seule.
 */
export function capaciteIAAutorisee(capacite: CapaciteIA, cabinetId: string): boolean {
  const reglage = CAPACITES_IA[capacite];
  const listes = cabinetsListes(reglage.variable);
  return reglage.defaut === "coupee" ? listes.includes(cabinetId) : !listes.includes(cabinetId);
}
