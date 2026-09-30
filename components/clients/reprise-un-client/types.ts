import type { FactureSaisie } from "@/lib/services/reprise-un-client/saisie";
import type { ContexteRepriseUnClient } from "@/lib/services/reprise-un-client/contexte";

export type { ContexteRepriseUnClient };

export type Etape = 1 | 2 | 3 | 4;

export interface IdentiteSaisie {
  typeClient: "personne_physique" | "personne_morale";
  prenom: string;
  nom: string;
  raisonSociale: string;
  occupation: string;
  natureActivites: string;
  email: string;
  telephone: string;
  langue: string;
  adresse: string;
}

export type ChoixClient =
  | { mode: "existant"; id: string; nom: string }
  | { mode: "nouveau"; identite: IdentiteSaisie };

export interface MandatSaisi {
  intitule: string;
  objetDuMandat: string;
  tauxHoraire: string;
  enCours: boolean;
  dateOuverture: string;
  avocatResponsableId: string;
}

export type ChoixMandat =
  | { mode: "existant"; id: string; intitule: string; tauxHoraire: number | null }
  | { mode: "nouveau"; mandat: MandatSaisi };

export interface SectionsSaisies {
  identite: { etat: "A_FAIRE" | "VERIFIEE" | "EXEMPTEE"; pieceVue: string; ouConservee: string; faiteLe: string; motifExemption: string };
  fonds: { montant: string; arreteAu: string; recuATitreDe: string };
  echeances: { id: string; date: string; libelle: string }[];
  parties: { id: string; nomAffiche: string; role: "partie_adverse" | "tiers" }[];
}

export interface EtatConflits {
  phase: "attente" | "verification" | "fait" | "erreur";
  nombre: number;
  details: { label: string; reason: string }[];
  /** Nom vérifié, pour ne pas relancer la vérification à chaque rendu. */
  pour: string;
}

export type StatutFacture = "lecture" | "a_verifier" | "enregistree" | "deja_reprise";

export interface EntreeFacture {
  id: string;
  source: "pdf" | "main";
  statut: StatutFacture;
  fichier?: File;
  fichierNom: string;
  hash?: string;
  mimeType?: string;
  /** Ce que la lecture a proposé, pour marquer en ambre ce qu'on a repris par-dessus. */
  lu?: FactureSaisie;
  saisie: FactureSaisie;
  lectureEchouee?: boolean;
  raisonLecture?: string;
  clientLu?: string | null;
  dejaRepriseLe?: string;
  erreur?: string;
  invoiceId?: string;
}

export interface Ids {
  clientId: string;
  dossierId: string;
}
