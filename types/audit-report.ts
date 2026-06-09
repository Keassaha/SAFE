export type Variant = "cream" | "white";

export interface AuditReport {
  meta: {
    ref: string;
    date: string;
    confidentiel: boolean;
  };
  cabinet: {
    raisonSociale: string;
    contact: string;
    localisation: string;
    formeJuridique: string;
    domaines: string[];
    anciennete: string;
    dossiersActifs: string;
    facturation: string;
    fideicommis: string;
    utilisateurs: number;
    outilActuel: string;
    satisfactionOutil: number;
  };
  butAudit: string;
  score: {
    valeur: number;
    libelle: string;
    repartition: { critique: number; eleve: number; modere: number; faible: number };
  };
  cout: {
    heuresAdminDeclarees: { min: number; max: number };
    fourchetteTaux: { min: number; max: number };
    delaiReglementDeclare: number;
    tauxRecuperation: number;
    semainesFacturables: number;
    casClientDelaiSafe: number | null;
    valeurAffichee: "nette" | "brute";
    tauxHoraire: number;
    heuresRecuperablesSemaine: number;
    valeurSemaine: number;
    valeurRecuperableBrute: number;
    valeurRecuperableNette: number;
    annuel: number;
    mensuel: number;
    delaiMoyenCanada: number;
    delaiMoyenCanadaSource: string;
    delaiCibleSafe: number;
    delaiCibleSafeSource: string;
  };
  drivers: {
    label: string;
    valeur: string;
    note: string;
  }[];
  risques: {
    niveau: "Critique" | "Élevé" | "Modéré" | "Faible";
    titre: string;
    reference: string;
    source: string;
    ceQueMontrent: string;
    impact: string;
    ceQueSafeCorrige: string;
  }[];
  barreau: {
    reference: string;
    sujet: string;
    statut: "À surveiller" | "Couvert par SAFE";
    description: string;
  }[];
  barreauDisclaimer: string;
  opportunites: {
    titre: string;
    description: string;
  }[];
  marche: {
    composant: string;
    detail: string;
    mensuel: number;
    source: string;
  }[];
  offre: {
    plans: {
      nom: string;
      prix: number | null;
      periode: string;
      recommande: boolean;
      description: string;
      features: string[];
    }[];
    pourquoi: string;
    garanties: { titre: string; detail: string }[];
  };
  etapes: {
    titre: string;
    description: string;
  }[];
  citationFondateur: string;
  annexe: {
    numero: string;
    titre: string;
    reponses: { code: string; question: string; reponse: string }[];
  }[];
}
