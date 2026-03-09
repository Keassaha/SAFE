/**
 * Données du wizard — Générateur de documents droit familial
 * Catégories, templates, définitions de champs (Arctic Steel / SAFE).
 */

export const WIZARD_COLORS = {
  deep950: "#090C12",
  deep900: "#0E1117",
  sl900: "#111318",
  sl800: "#1B1E26",
  sl700: "#2A2F3A",
  sl600: "#3D4451",
  sl500: "#555E6E",
  sl400: "#737D8E",
  sl300: "#969FAD",
  sl200: "#BEC4CE",
  sl100: "#E0E3E9",
  sl50: "#F2F3F6",
  white: "#FFFFFF",
  bl700: "#3460C1",
  bl600: "#4070DB",
  bl500: "#4B7BE5",
  bl400: "#6B9AFF",
  bl300: "#93B5FF",
  bl200: "#BDCFFF",
  bl100: "#E3EBFF",
  ok: "#4AAD7A",
  warn: "#D4943A",
  bad: "#D05858",
  purple: "#7C5CFC",
  warnBg: "rgba(212,148,58,.08)",
  badBg: "rgba(208,88,88,.08)",
} as const;

export const WIZARD_STEPS = [
  { id: "category", label: "Catégorie" },
  { id: "template", label: "Document" },
  { id: "fields", label: "Informations" },
  { id: "ai", label: "Rédaction IA" },
  { id: "preview", label: "Aperçu" },
] as const;

export interface WizardTemplate {
  id: string;
  name: string;
  form: string;
  ref: string;
  fields: string[];
}

export interface WizardCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  templates: WizardTemplate[];
}

export const WIZARD_CATEGORIES: WizardCategory[] = [
  {
    id: "divorce",
    label: "Divorce & Séparation",
    icon: "divorce",
    color: WIZARD_COLORS.bl500,
    templates: [
      { id: "divorce-conteste", name: "Demande en divorce (contestée)", form: "Formulaire I", ref: "Loi sur le divorce, art. 8; CPC art. 141, 409", fields: ["demandeur", "defendeur", "mariage", "enfants", "regime", "motifs", "conclusions"] },
      { id: "divorce-conjoint", name: "Demande conjointe en divorce", form: "Modèle ministériel", ref: "Loi sur le divorce, art. 8; CPC art. 303", fields: ["epoux1", "epoux2", "mariage", "enfants", "accord"] },
      { id: "separation-corps", name: "Séparation de corps", form: "—", ref: "CCQ art. 493-515", fields: ["demandeur", "defendeur", "mariage", "motifs", "conclusions"] },
      { id: "dissolution-uc", name: "Dissolution d'union civile", form: "—", ref: "CCQ art. 521.12-521.19", fields: ["parties", "union", "motifs"] },
      { id: "union-parentale", name: "Demande — Union parentale (TUF)", form: "SJ-1326", ref: "CCQ art. 521.19+", fields: ["parties", "enfants", "patrimoine", "conclusions"] },
    ],
  },
  {
    id: "garde",
    label: "Garde & Droits d'accès",
    icon: "garde",
    color: WIZARD_COLORS.ok,
    templates: [
      { id: "garde-demande", name: "Demande en garde d'enfants", form: "—", ref: "CCQ art. 599, 605; Loi sur le divorce, art. 16", fields: ["demandeur", "defendeur", "enfants", "typeGarde", "motifs"] },
      { id: "plan-parental", name: "Plan parental", form: "—", ref: "Loi sur le divorce, art. 7.1-7.5", fields: ["parent1", "parent2", "enfants", "calendrier", "decisions", "communication"] },
      { id: "modification-garde", name: "Demande en modification de garde", form: "—", ref: "Loi sur le divorce, art. 17; CCQ art. 612", fields: ["demandeur", "defendeur", "jugementOriginal", "changements", "conclusions"] },
      { id: "eval-psychosociale", name: "Demande d'évaluation psychosociale", form: "Formulaires IV-VI", ref: "CPC art. 425", fields: ["parties", "enfants", "motifs", "typeEvaluation"] },
      { id: "acces-supervise", name: "Demande de droits d'accès supervisés", form: "Annexe A RCSMF", ref: "CPC art. 37 RCSMF", fields: ["parties", "enfants", "motifs", "organisme"] },
    ],
  },
  {
    id: "pension",
    label: "Pension alimentaire",
    icon: "pension",
    color: WIZARD_COLORS.warn,
    templates: [
      { id: "pa-enfants", name: "Formulaire de fixation — PA enfants", form: "Annexe I", ref: "RLRQ c. C-25.01, r. 12", fields: ["parent1Revenu", "parent2Revenu", "nbEnfants", "typeGarde", "fraisGarde", "fraisSpeciaux"] },
      { id: "pa-conjoint", name: "Demande de PA pour ex-conjoint", form: "Formulaire III", ref: "CCQ art. 585-596; Loi sur le divorce, art. 15.2", fields: ["demandeur", "defendeur", "revenus", "depenses", "bilan"] },
      { id: "pa-modification", name: "Demande en modification de PA", form: "—", ref: "Loi sur le divorce, art. 17; CCQ art. 594", fields: ["demandeur", "defendeur", "jugementOriginal", "changements"] },
      { id: "etat-revenus", name: "État des revenus et dépenses (Form. III)", form: "Formulaire III", ref: "RCSMF", fields: ["revenus", "depensesHabitation", "depensesTransport", "depensesPersonnelles", "actifs", "passifs"] },
    ],
  },
  {
    id: "patrimoine",
    label: "Patrimoine & Partage",
    icon: "patrimoine",
    color: WIZARD_COLORS.purple,
    templates: [
      { id: "patrimoine-familial", name: "Calcul du patrimoine familial", form: "Excel Montréal", ref: "CCQ art. 414-426", fields: ["residences", "vehicules", "reer", "regimesRetraite", "meubles", "dettes"] },
      { id: "acquets", name: "Liquidation de la société d'acquêts", form: "—", ref: "CCQ art. 448-484", fields: ["acquets1", "acquets2", "propres1", "propres2"] },
      { id: "prestation-comp", name: "Demande de prestation compensatoire", form: "—", ref: "CCQ art. 427-430", fields: ["demandeur", "defendeur", "contributions", "enrichissement"] },
      { id: "patrimoine-up", name: "Patrimoine d'union parentale (TUF)", form: "SJ-1329", ref: "CCQ art. 521.19+", fields: ["parties", "biensCouverts", "valeurs"] },
    ],
  },
  {
    id: "urgence",
    label: "Mesures provisoires & Urgentes",
    icon: "urgence",
    color: WIZARD_COLORS.bad,
    templates: [
      { id: "sauvegarde", name: "Ordonnance de sauvegarde", form: "—", ref: "CPC art. 49, 509", fields: ["demandeur", "defendeur", "urgence", "mesuresDemandees"] },
      { id: "mesures-provisoires", name: "Demande de mesures provisoires", form: "—", ref: "CPC art. 409-414", fields: ["demandeur", "defendeur", "mesures", "faits"] },
      { id: "protection-civile", name: "Ordonnance de protection civile", form: "—", ref: "CPC art. 509-512", fields: ["victime", "intimé", "faits", "mesures"] },
      { id: "usage-exclusif", name: "Usage exclusif de la résidence", form: "—", ref: "CCQ art. 401, 410", fields: ["demandeur", "defendeur", "residence", "motifs"] },
      { id: "provision-frais", name: "Provision pour frais", form: "—", ref: "CCQ art. 502", fields: ["demandeur", "defendeur", "capacite", "besoin"] },
    ],
  },
  {
    id: "entente",
    label: "Ententes & Médiation",
    icon: "entente",
    color: "#4AAD7A",
    templates: [
      { id: "projet-accord", name: "Projet d'accord (divorce conjoint)", form: "Modèle ministériel", ref: "CPC art. 303", fields: ["epoux1", "epoux2", "garde", "pension", "patrimoine", "divers"] },
      { id: "consentement", name: "Consentement à jugement", form: "—", ref: "CPC", fields: ["parties", "termes", "conditions"] },
      { id: "transaction", name: "Transaction (règlement)", form: "—", ref: "CCQ art. 2631-2637", fields: ["parties", "concessions", "conditions", "renunciations"] },
      { id: "entente-mediation", name: "Résumé d'entente de médiation", form: "—", ref: "CPC art. 417", fields: ["parties", "mediateur", "pointsConvenus", "pointsNonResolus"] },
    ],
  },
  {
    id: "correspondance",
    label: "Correspondance juridique",
    icon: "correspondance",
    color: WIZARD_COLORS.sl500,
    templates: [
      { id: "mise-en-demeure", name: "Mise en demeure", form: "—", ref: "CCQ art. 1594-1600", fields: ["destinataire", "faits", "fondement", "delai", "conclusions"] },
      { id: "lettre-client", name: "Lettre au client", form: "—", ref: "—", fields: ["client", "objet", "contenu", "recommandations"] },
      { id: "mandat", name: "Mandat / Lettre d'engagement", form: "—", ref: "Code de déontologie", fields: ["client", "portee", "honoraires", "conditions"] },
      { id: "avis-comparution", name: "Avis de comparution", form: "—", ref: "CPC art. 119", fields: ["tribunal", "dossier", "parties", "avocat"] },
      { id: "lettre-negociation", name: "Lettre de négociation", form: "—", ref: "—", fields: ["destinataire", "contexte", "proposition", "delai"] },
    ],
  },
  {
    id: "special",
    label: "Procédures spéciales",
    icon: "special",
    color: "#313D55",
    templates: [
      { id: "adoption", name: "Requête en adoption", form: "—", ref: "CCQ art. 559-576", fields: ["adoptants", "enfant", "consentements", "conditions"] },
      { id: "changement-nom", name: "Demande de changement de nom", form: "SJ-224", ref: "CCQ art. 57-64", fields: ["demandeur", "nomActuel", "nomDemande", "motifs"] },
      { id: "decheance-ap", name: "Demande en déchéance de l'autorité parentale", form: "—", ref: "CCQ art. 606-612", fields: ["demandeur", "defendeur", "enfant", "motifs"] },
      { id: "tutelle", name: "Demande de tutelle au mineur", form: "—", ref: "CCQ art. 177-199", fields: ["demandeur", "mineur", "motifs", "conseil"] },
    ],
  },
];

interface FieldOption {
  key: string;
  label: string;
  type: string;
  options?: string[];
  placeholder?: string;
}

interface FieldDef {
  label: string;
  type: string;
  fields?: FieldOption[];
  options?: string[];
  placeholder?: string;
}

export const WIZARD_FIELD_DEFS: Record<string, FieldDef> = {
  demandeur: { label: "Demandeur(esse)", type: "group", fields: [
    { key: "nom", label: "Nom complet", type: "text" },
    { key: "adresse", label: "Adresse", type: "text" },
    { key: "ddn", label: "Date de naissance", type: "date" },
    { key: "occupation", label: "Occupation", type: "text" },
  ]},
  defendeur: { label: "Défendeur(esse)", type: "group", fields: [
    { key: "nom", label: "Nom complet", type: "text" },
    { key: "adresse", label: "Adresse", type: "text" },
    { key: "ddn", label: "Date de naissance", type: "date" },
    { key: "occupation", label: "Occupation", type: "text" },
  ]},
  mariage: { label: "Mariage", type: "group", fields: [
    { key: "dateMariage", label: "Date du mariage", type: "date" },
    { key: "lieuMariage", label: "Lieu du mariage", type: "text" },
    { key: "regime", label: "Régime matrimonial", type: "select", options: ["Société d'acquêts", "Séparation de biens", "Communauté de biens", "Contrat de mariage spécifique"] },
  ]},
  enfants: { label: "Enfants", type: "repeater", fields: [
    { key: "prenom", label: "Prénom", type: "text" },
    { key: "nom", label: "Nom", type: "text" },
    { key: "ddn", label: "Date de naissance", type: "date" },
    { key: "residenceActuelle", label: "Résidence actuelle", type: "select", options: ["Avec le demandeur", "Avec le défendeur", "Garde partagée", "Autre"] },
  ]},
  motifs: { label: "Motifs & faits allégués", type: "textarea", placeholder: "Décrivez les faits pertinents et les motifs de votre demande..." },
  conclusions: { label: "Conclusions recherchées", type: "textarea", placeholder: "Indiquez les ordonnances demandées au tribunal..." },
  typeGarde: { label: "Type de garde demandée", type: "select", options: ["Garde exclusive (demandeur)", "Garde exclusive (défendeur)", "Garde partagée (50/50)", "Garde partagée (autre répartition)", "Garde divisée"] },
  urgence: { label: "Nature de l'urgence", type: "textarea", placeholder: "Décrivez la situation d'urgence justifiant cette demande..." },
  mesuresDemandees: { label: "Mesures demandées", type: "textarea", placeholder: "Listez les mesures provisoires demandées..." },
  destinataire: { label: "Destinataire", type: "group", fields: [
    { key: "nom", label: "Nom / Raison sociale", type: "text" },
    { key: "adresse", label: "Adresse", type: "text" },
  ]},
  faits: { label: "Exposé des faits", type: "textarea", placeholder: "Décrivez chronologiquement les faits pertinents..." },
  fondement: { label: "Fondement juridique", type: "textarea", placeholder: "Articles de loi, jurisprudence..." },
  delai: { label: "Délai accordé", type: "select", options: ["5 jours", "10 jours", "15 jours", "30 jours", "Autre"] },
  parent1Revenu: { label: "Revenus — Parent 1", type: "group", fields: [
    { key: "emploi", label: "Revenu d'emploi", type: "number" },
    { key: "autonome", label: "Travail autonome", type: "number" },
    { key: "prestations", label: "Prestations (AE, RQAP)", type: "number" },
    { key: "placements", label: "Revenus de placements", type: "number" },
    { key: "locatif", label: "Revenus locatifs", type: "number" },
    { key: "autre", label: "Autres revenus", type: "number" },
  ]},
  parent2Revenu: { label: "Revenus — Parent 2", type: "group", fields: [
    { key: "emploi", label: "Revenu d'emploi", type: "number" },
    { key: "autonome", label: "Travail autonome", type: "number" },
    { key: "prestations", label: "Prestations (AE, RQAP)", type: "number" },
    { key: "placements", label: "Revenus de placements", type: "number" },
    { key: "locatif", label: "Revenus locatifs", type: "number" },
    { key: "autre", label: "Autres revenus", type: "number" },
  ]},
  nbEnfants: { label: "Nombre d'enfants", type: "select", options: ["1", "2", "3", "4", "5", "6+"] },
  fraisGarde: { label: "Frais de garde annuels", type: "number" },
  fraisSpeciaux: { label: "Frais spéciaux annuels", type: "number" },
  parties: { label: "Parties", type: "textarea", placeholder: "Identifiez les parties..." },
  client: { label: "Client", type: "group", fields: [
    { key: "nom", label: "Nom complet", type: "text" },
    { key: "courriel", label: "Courriel", type: "text" },
    { key: "dossier", label: "No dossier", type: "text" },
  ]},
  objet: { label: "Objet", type: "text" },
  contenu: { label: "Contenu de la lettre", type: "textarea", placeholder: "Rédigez le contenu..." },
  recommandations: { label: "Recommandations", type: "textarea", placeholder: "Vos recommandations au client..." },
  tribunal: { label: "Tribunal", type: "select", options: ["Cour supérieure — Chambre de la famille", "Cour du Québec — TUF", "Cour d'appel du Québec"] },
  dossier: { label: "Numéro de dossier", type: "text" },
  avocat: { label: "Avocat(e)", type: "text" },
  // Fallbacks pour champs non définis
  regime: { label: "Régime matrimonial", type: "textarea", placeholder: "Précisez le régime..." },
  accord: { label: "Accord / Entente", type: "textarea", placeholder: "Résumé de l'accord..." },
  union: { label: "Union civile", type: "textarea", placeholder: "Détails de l'union..." },
  patrimoine: { label: "Patrimoine", type: "textarea", placeholder: "Éléments du patrimoine..." },
  parent1: { label: "Parent 1", type: "textarea", placeholder: "Identification du parent 1..." },
  parent2: { label: "Parent 2", type: "textarea", placeholder: "Identification du parent 2..." },
  calendrier: { label: "Calendrier de garde", type: "textarea", placeholder: "Décrivez le calendrier..." },
  decisions: { label: "Décisions importantes", type: "textarea", placeholder: "Santé, éducation, etc." },
  communication: { label: "Communication entre parents", type: "textarea", placeholder: "Modalités de communication..." },
  jugementOriginal: { label: "Jugement ou ordonnance visé", type: "textarea", placeholder: "Référence et date..." },
  changements: { label: "Changements invoqués", type: "textarea", placeholder: "Décrivez les changements..." },
  typeEvaluation: { label: "Type d'évaluation", type: "textarea", placeholder: "Standard, élargie, etc." },
  organisme: { label: "Organisme de supervision", type: "text" },
  revenus: { label: "Revenus", type: "textarea", placeholder: "Détail des revenus..." },
  depenses: { label: "Dépenses", type: "textarea", placeholder: "Détail des dépenses..." },
  bilan: { label: "Bilan (actifs / passifs)", type: "textarea", placeholder: "Résumé du bilan..." },
  depensesHabitation: { label: "Dépenses d'habitation", type: "number" },
  depensesTransport: { label: "Dépenses de transport", type: "number" },
  depensesPersonnelles: { label: "Dépenses personnelles", type: "number" },
  actifs: { label: "Actifs", type: "textarea", placeholder: "Liste des actifs..." },
  passifs: { label: "Passifs", type: "textarea", placeholder: "Liste des passifs..." },
  residences: { label: "Résidences", type: "textarea", placeholder: "Valeur des résidences..." },
  vehicules: { label: "Véhicules", type: "textarea", placeholder: "Valeur des véhicules..." },
  reer: { label: "REER", type: "textarea", placeholder: "Valeur des REER..." },
  regimesRetraite: { label: "Régimes de retraite", type: "textarea", placeholder: "Valeur des régimes..." },
  meubles: { label: "Meubles", type: "textarea", placeholder: "Valeur des meubles..." },
  dettes: { label: "Dettes", type: "textarea", placeholder: "Dettes..." },
  acquets1: { label: "Acquêts partie 1", type: "textarea", placeholder: "..." },
  acquets2: { label: "Acquêts partie 2", type: "textarea", placeholder: "..." },
  propres1: { label: "Biens propres partie 1", type: "textarea", placeholder: "..." },
  propres2: { label: "Biens propres partie 2", type: "textarea", placeholder: "..." },
  contributions: { label: "Contributions", type: "textarea", placeholder: "Contributions invoquées..." },
  enrichissement: { label: "Enrichissement sans cause", type: "textarea", placeholder: "..." },
  biensCouverts: { label: "Biens couverts", type: "textarea", placeholder: "..." },
  valeurs: { label: "Valeurs", type: "textarea", placeholder: "Valeurs des biens..." },
  mesures: { label: "Mesures demandées", type: "textarea", placeholder: "..." },
  residence: { label: "Résidence familiale", type: "textarea", placeholder: "Adresse et description..." },
  capacite: { label: "Capacité de payer", type: "textarea", placeholder: "..." },
  besoin: { label: "Besoin du demandeur", type: "textarea", placeholder: "..." },
  victime: { label: "Victime / Demandeur", type: "group", fields: [{ key: "nom", label: "Nom", type: "text" }, { key: "adresse", label: "Adresse", type: "text" }]},
  "intimé": { label: "Intimé", type: "group", fields: [{ key: "nom", label: "Nom", type: "text" }, { key: "adresse", label: "Adresse", type: "text" }]},
  epoux1: { label: "Époux(se) 1", type: "group", fields: [{ key: "nom", label: "Nom", type: "text" }, { key: "adresse", label: "Adresse", type: "text" }]},
  epoux2: { label: "Époux(se) 2", type: "group", fields: [{ key: "nom", label: "Nom", type: "text" }, { key: "adresse", label: "Adresse", type: "text" }]},
  garde: { label: "Garde des enfants", type: "textarea", placeholder: "Entente sur la garde..." },
  pension: { label: "Pension alimentaire", type: "textarea", placeholder: "Entente sur la pension..." },
  divers: { label: "Divers", type: "textarea", placeholder: "Autres dispositions..." },
  termes: { label: "Termes du jugement", type: "textarea", placeholder: "..." },
  conditions: { label: "Conditions", type: "textarea", placeholder: "..." },
  concessions: { label: "Concessions", type: "textarea", placeholder: "..." },
  renunciations: { label: "Renunciations", type: "textarea", placeholder: "..." },
  mediateur: { label: "Médiateur", type: "text" },
  pointsConvenus: { label: "Points convenus", type: "textarea", placeholder: "..." },
  pointsNonResolus: { label: "Points non résolus", type: "textarea", placeholder: "..." },
  contexte: { label: "Contexte", type: "textarea", placeholder: "..." },
  proposition: { label: "Proposition", type: "textarea", placeholder: "..." },
  portee: { label: "Portée du mandat", type: "textarea", placeholder: "..." },
  honoraires: { label: "Honoraires", type: "textarea", placeholder: "..." },
  adoptants: { label: "Adoptant(s)", type: "textarea", placeholder: "..." },
  enfant: { label: "Enfant", type: "textarea", placeholder: "..." },
  consentements: { label: "Consentements", type: "textarea", placeholder: "..." },
  nomActuel: { label: "Nom actuel", type: "text" },
  nomDemande: { label: "Nom demandé", type: "text" },
  mineur: { label: "Mineur", type: "textarea", placeholder: "..." },
  conseil: { label: "Conseil de tutelle", type: "textarea", placeholder: "..." },
};
