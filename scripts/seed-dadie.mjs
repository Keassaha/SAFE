/**
 * Seed / configure l'espace de travail DADIÉ AVOCAT (Gatineau, QC).
 *
 * Monté à partir de l'audit gratuit réel du 2026-08-10
 * (AuditSubmission cmsnhcnlb0000lc04d0r3gw28, lead cmsnjf5k000050yncnok8zjm6).
 *
 * Modèle : scripts/seed-cayard.mjs, avec la différence structurante suivante :
 *   Cayard facture au FORFAIT  → catalogue ForfaitService + RegistreTache
 *   Dadié facture à l'HEURE    → TimeEntry, et les factures sont bâties depuis
 *                                les heures. Pas de catalogue de forfaits.
 *
 * Cabinet solo sans adjointe : couche assistante masquée, aucun utilisateur
 * autre que l'avocat. Le module « Fiche de temps » reste visible, c'est le
 * coeur de son mode de facturation.
 *
 * Usage :
 *   node scripts/seed-dadie.mjs              # applique (idempotent)
 *   node scripts/seed-dadie.mjs --dry-run    # n'écrit rien, affiche le plan
 *
 * Override mot de passe (optionnel) :
 *   DADIE_ADMIN_PASSWORD=...
 *
 * Idempotent : tout est upserté par id stable (préfixe "dadie-"). Re-jouable
 * sans rien dupliquer. N'altère JAMAIS un autre cabinet (cabinetId distinct).
 *
 * Aucun courriel n'est envoyé. Les accès se remettent de vive voix, en démo.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";

// .env.local (dev) prime sur .env — Prisma via `node` ne lit que .env par défaut.
loadEnv({ path: ".env.local", override: true });
loadEnv({ path: ".env" });

// Cible explicite. Sans SEED_DATABASE_URL, le script vise la base des .env
// locaux (dev). Viser la production doit être un geste conscient, pas un effet
// de bord d'un fichier d'environnement mal rangé.
const prisma = new PrismaClient(
  process.env.SEED_DATABASE_URL
    ? { datasources: { db: { url: process.env.SEED_DATABASE_URL } } }
    : undefined,
);

const DRY_RUN = process.argv.includes("--dry-run");
const CABINET_ID = "dadie-avocat-qc-2026";
const ADMIN_EMAIL = "jjd@dadieavocat.ca";
const ADMIN_PASSWORD = process.env.DADIE_ADMIN_PASSWORD || "DadieAvocat2026!";

// Taux horaire retenu : milieu de la fourchette déclarée (150-250 $/h), et
// valeur que son propre rapport d'audit a utilisée pour chiffrer le ROI.
const TAUX_HORAIRE = 200;

const round2 = (n) => Math.round(n * 100) / 100;

// ---- Audit (soumission du 2026-08-10, réponses telles que remplies) ---------

const AUDIT = {
  submissionId: "cmsnhcnlb0000lc04d0r3gw28",
  leadId: "cmsnjf5k000050yncnok8zjm6",
  date: "2026-08-10",
  language: "fr",
  // Plan technique "cabinet" comme Cayard : c'est ce palier qui débloque
  // fidéicommis et portail client. L'offre commerciale réelle est dans
  // CABINET_CONFIG.currentOffer, elle ne se lit pas dans Cabinet.plan.
  plan: "cabinet",
  cabinet: {
    nom: "DADIÉ AVOCAT, entreprise individuelle",
    displayName: "DADIÉ AVOCAT",
    principalLawyer: "Agboko Jean-Jacques Dadié",
    email: ADMIN_EMAIL,
    province: "QC",
    location: "Gatineau, QC",
    formeJuridique: "Entreprise individuelle",
    siteWeb: "https://dadieavocat.ca/",
    barreauNumero: null, // jamais affiché sur facture (règle marque SAFE)
    adresse: null,
    telephone: "8733444743",
    // Il a écrit « Gatineau , Ottawa ». La province déclarée est QC, donc le
    // cabinet est configuré Barreau du Québec / RCNEPA. Si une part de sa
    // pratique est menée sous permis ontarien, la configuration LSO est à
    // ajouter : ce n'est pas déduit ici, ça se confirme avec lui.
    secondaryLocationToConfirm: "Ottawa, ON",
  },
  practice: {
    domaines: ["droit_famille", "litige_civil", "immigration", "droit_administratif"],
    domainesLabel: "Droit de la famille et civil, droit administratif, immigration (renvoi)",
    anciennete: "moins_2_ans",
    dossiersActifs: "10-30",
    nouveauxParMois: "5-15",
    typeClientele: "particuliers",
    // « reg » dans l'audit : régulière, pas occasionnelle. Registres séparés
    // et grille tarifaire réglementée : exposition plus forte que Cayard.
    aideJuridique: "reguliere",
  },
  billing: {
    mode: "horaire",
    tauxHoraire: TAUX_HORAIRE,
    fourchetteDeclaree: "150-250",
    methods: ["cheque", "interac", "virement", "carte"],
    visibiliteCreances: false, // suivi manuel aujourd'hui
    delaiReglementJours: 45, // fourchette déclarée 31-60
  },
  team: {
    userCount: 1,
    adjointe: false,
    comptable: "externe",
    outilActuel: "QuickBooks",
    satisfactionOutil: 4, // sur 10
    utilisateurPrincipal: "l'avocat lui-même",
  },
  trust: {
    // « peu » : compte en fidéicommis existant mais peu mouvementé. Reste
    // central : c'est la moitié de ce qu'il demande à automatiser.
    usage: "peu",
    externalise: true,
  },
  priorities: [
    "La gestion de mes dossiers et mon compte en fideicommis",
    "Réduire la charge administrative",
    "Réduire le coût des outils",
  ],
  frustrations: ["charge administrative", "coût des outils"],
  heuresAdminParSemaine: "2-5",
  urgence: "urgent",
  evolution: "ralenti",
  // Chiffres du rapport généré (rapport JSON de la soumission).
  recovery: {
    valeurRecuperableAnnuelle: 19320,
    heuresRecuperablesParSemaine: 2.1,
    economieMensuelle: 436,
    economiePourcent: 81,
  },
  risque: { score: 23, verdict: "a_surveiller", constats: 3 },
  bundle: {
    id: "qc-small-business-hourly",
    confidence: "high",
    alternatives: ["qc-generalist-foundation-hourly", "qc-solo-family-flat-fee"],
  },
};

// ---- Cabinet.config (JSON) --------------------------------------------------

const CABINET_CONFIG = {
  devise: "CAD",
  tauxInteret: 0,
  formatFacture: "YYYY-NNNN",
  envoiFactureClient: { activer: true, lienExpirationJours: 30 },
  locale: AUDIT.language,
  province: AUDIT.cabinet.province,
  displayName: AUDIT.cabinet.displayName,
  formeJuridique: AUDIT.cabinet.formeJuridique,
  siteWeb: AUDIT.cabinet.siteWeb,
  billingMode: AUDIT.billing.mode,
  tauxHoraireDefaut: TAUX_HORAIRE,
  paymentMethods: AUDIT.billing.methods,
  // Offre commerciale réelle (décision CEO 2026-07-27, offre fondatrice).
  // Le rapport qu'il a reçu annonce 99 $/mois : le générateur de rapport
  // n'a pas encore été aligné. Écart à traiter avant l'appel.
  currentOffer: {
    planLabel: "SAFE Solo (offre fondatrice)",
    monthlyPrice: 50,
    monthlyPriceAfter12Months: 79,
    priceQuotedInReport: 99,
    maxUsers: 1,
    note: "50 $/mois pendant 12 mois, puis tarif fondateur gelé à 79 $/mois.",
  },
  trustBanking: {
    enabled: true,
    accountCount: 1,
    regulator: "RCNEPA (Barreau du Québec)",
    province: "QC",
    accounts: [
      {
        label: "DADIÉ AVOCAT — Compte en fidéicommis",
        bank: "À confirmer",
        accountNumber: "À-CONFIRMER-DADIE-FIDEICOMMIS",
        currency: "CAD",
        reconciliation: "mensuelle",
        notes:
          "Compte en fidéicommis peu mouvementé, tenu à l'externe aujourd'hui. Banque, succursale et numéro à confirmer à l'embarquement. Reprise des soldes d'ouverture obligatoire avant tout mouvement dans SAFE.",
      },
    ],
  },
  onboardingAudit: {
    submissionId: AUDIT.submissionId,
    leadId: AUDIT.leadId,
    date: AUDIT.date,
    domaines: AUDIT.practice.domaines,
    domainesLabel: AUDIT.practice.domainesLabel,
    anciennete: AUDIT.practice.anciennete,
    dossiersActifs: AUDIT.practice.dossiersActifs,
    nouveauxParMois: AUDIT.practice.nouveauxParMois,
    aideJuridique: AUDIT.practice.aideJuridique,
    usersPrevus: AUDIT.team.userCount,
    outilActuel: AUDIT.team.outilActuel,
    satisfactionOutil: AUDIT.team.satisfactionOutil,
    priorities: AUDIT.priorities,
    urgence: AUDIT.urgence,
    risque: AUDIT.risque,
    bundle: AUDIT.bundle,
    delaiReglementJours: AUDIT.billing.delaiReglementJours,
    valeurRecuperableAnnuelle: AUDIT.recovery.valeurRecuperableAnnuelle,
    heuresRecuperablesParSemaine: AUDIT.recovery.heuresRecuperablesParSemaine,
    aConfirmer: [
      "Pratique menée à Ottawa : permis ontarien et règles LSO applicables ?",
      "Coordonnées bancaires du compte en fidéicommis",
      "Grille tarifaire d'aide juridique (CSJ) et modalités de reddition",
      "Numéro de membre du Barreau (jamais affiché sur facture)",
    ],
  },
};

// ---- CabinetInterface (JSON) ------------------------------------------------
//
// Rappel filtrage (components/layout/SidebarNav.tsx) :
//   - ongletsActifs  = whitelist des items TOP-LEVEL uniquement
//   - les enfants (clients, dossiers, file-assistante, ...) ne sont coupés
//     que par ongletsMasques.
// « temps » (Fiche de temps) reste visible : il facture à l'heure, c'est son
// écran central. « mes-heures » (soumission d'heures employé) est masqué : pas
// d'employé. « file-assistante » et « employees » masqués : pas d'adjointe.

const CABINET_INTERFACE = {
  ongletsActifs: JSON.stringify(["dashboard", "gestion", "finances", "outils", "parametres"]),
  ongletsMasques: JSON.stringify(["file-assistante", "employees", "mes-heures"]),
  disciplines: JSON.stringify(AUDIT.practice.domaines),
  widgets: JSON.stringify([
    "pending-billing", // heures non facturées : sa fuite d'argent n°1
    "active-files",
    "trust-reconciliation-alert",
    "upcoming-deadlines",
    "recent-documents",
    "quick-actions",
  ]),
  modules: JSON.stringify({
    locale: "fr",
    intake: { language: "fr" },
    facturation: {
      principal: "horaire",
      tauxHoraireDefaut: TAUX_HORAIRE,
      periodeFact: "mensuel",
      joursRelance: 30,
      tauxInterets: 0,
      taxes: { mode: "tps_tvq", province: "QC", rates: { tps: 5.0, tvq: 9.975 } },
      methodesAcceptees: AUDIT.billing.methods,
      // Il ne sait pas ce qu'on lui doit sans calcul manuel : les relances
      // automatiques et le suivi des créances sont la valeur immédiate.
      relancesAutomatiques: true,
      suiviCreancesTempsReel: true,
    },
    fideicommis: {
      regle: "rcnepa-qc",
      enabled: true,
      accountCount: 1,
      reconciliation: "mensuelle",
      alerteRetard: 30,
      protectionCroisee: true,
      onboardingPriority: "high", // usage faible, mais demande explicite
    },
    aideJuridique: {
      actif: true,
      frequence: "reguliere",
      registresSepares: true,
      tarifsReglementes: true,
      // Régulière et non occasionnelle : la reddition à la Commission des
      // services juridiques est un flux courant, pas une exception.
      redditionCsj: true,
    },
    fintrac: { actif: false },
    privacy: { regime: "loi25-qc", actif: true, retention: { defaut: 7 } },
    operations: {
      priorities: AUDIT.priorities,
      utilisateurPrincipal: AUDIT.team.utilisateurPrincipal,
      migrationDepuis: AUDIT.team.outilActuel,
    },
    subscriptions: {
      targetPlan: "solo",
      targetPriceMonthly: 50,
      trialReady: true,
    },
  }),
  checklistsParType: JSON.stringify({
    droit_famille_garde: [
      "Consultation + mandat signé",
      "Vérification de conflit",
      "Provision en fidéicommis reçue",
      "Demande introductive / réponse",
      "Formulaire de fixation des pensions alimentaires",
      "Médiation / négociation",
      "Jugement",
      "Fermeture du dossier",
    ],
    droit_famille_divorce: [
      "Consultation + mandat signé",
      "Vérification de conflit",
      "Provision en fidéicommis reçue",
      "Demande introductive / réponse",
      "Inventaire patrimoine + pensions",
      "Médiation / négociation",
      "Jugement",
      "Fermeture du dossier",
    ],
    droit_famille_aide_juridique: [
      "Mandat d'aide juridique reçu (numéro)",
      "Tarif réglementé appliqué (grille CSJ)",
      "Registre d'aide juridique séparé tenu",
      "Pièces justificatives conservées",
      "Reddition à la Commission des services juridiques",
      "Fermeture + reddition",
    ],
    immigration_renvoi: [
      "Consultation + mandat signé",
      "Vérification de conflit",
      "Mesure de renvoi obtenue et datée",
      "Délais de recours calculés (impératifs)",
      "Demande de sursis / contrôle judiciaire",
      "Preuve et affidavits",
      "Audition",
      "Décision + suites",
    ],
    litige_civil: [
      "Consultation + mandat signé",
      "Vérification de conflit",
      "Provision en fidéicommis (s'il y a lieu)",
      "Mise en demeure",
      "Procédures introductives",
      "Gestion d'instance",
      "Audition / règlement",
      "Jugement + exécution",
    ],
    droit_administratif: [
      "Consultation + mandat signé",
      "Vérification de conflit",
      "Décision contestée obtenue et datée",
      "Délais de contestation calculés (impératifs)",
      "Recours déposé",
      "Mémoire et preuve",
      "Audition",
      "Décision + suites",
    ],
  }),
  modeFacturation: JSON.stringify({
    principal: "horaire",
    cadence: "mensuel",
    tauxHoraire: true,
    tauxDefaut: TAUX_HORAIRE,
  }),
  conformite: JSON.stringify({
    barreau_qc: true,
    rcnepa: true,
    fideicommis_qc: true,
    reconciliation_mensuelle_requise: true,
    verif_conflits: true,
    aide_juridique: true,
    loi25: true,
  }),
};

// ---- Débours (Québec / Outaouais) -------------------------------------------

const DEBOURS_TYPES = [
  { nom: "Frais de greffe (Cour supérieure)", categorie: "Frais judiciaire", coutDefaut: 213, gouvernementRef: "MJQ" },
  { nom: "Frais de greffe (Cour du Québec)", categorie: "Frais judiciaire", coutDefaut: 111, gouvernementRef: "MJQ" },
  { nom: "Frais d'huissier", categorie: "Débours judiciaire", coutDefaut: 150, gouvernementRef: null },
  { nom: "Frais CISR — dépôt de recours", categorie: "Frais gouvernemental", coutDefaut: 0, gouvernementRef: "CISR" },
  { nom: "Frais IRCC — Biométrie", categorie: "Frais gouvernemental", coutDefaut: 85, gouvernementRef: "IRCC" },
  { nom: "Copies certifiées / poste", categorie: "Débours administratif", coutDefaut: 40, gouvernementRef: null },
  { nom: "Traduction certifiée", categorie: "Débours administratif", coutDefaut: 120, gouvernementRef: null },
];

const DEBOURS_TEMPLATES = [
  { dossierType: "droit_famille_garde", nom: "Frais de greffe (Cour supérieure)", isRequired: true },
  { dossierType: "droit_famille_garde", nom: "Frais d'huissier", isRequired: false },
  { dossierType: "immigration_renvoi", nom: "Frais CISR — dépôt de recours", isRequired: true },
  { dossierType: "immigration_renvoi", nom: "Traduction certifiée", isRequired: false },
  { dossierType: "litige_civil", nom: "Frais de greffe (Cour du Québec)", isRequired: true },
  { dossierType: "litige_civil", nom: "Frais d'huissier", isRequired: false },
  { dossierType: "droit_administratif", nom: "Copies certifiées / poste", isRequired: false },
];

// ---- Données de démonstration (sobres, crédibles, Outaouais) ----------------

const CLIENTS = [
  {
    id: "dadie-client-lemay",
    typeClient: "personne_physique",
    prenom: "Sandrine",
    nom: "Lemay",
    email: "s.lemay@example.com",
    telephone: "(819) 555-0134",
    city: "Gatineau",
    province: "QC",
    langue: "FR",
    conflictChecked: true,
    allowTrustPayments: true,
  },
  {
    id: "dadie-client-diallo",
    typeClient: "personne_physique",
    prenom: "Ibrahim",
    nom: "Diallo",
    email: "i.diallo@example.com",
    telephone: "(819) 555-0177",
    city: "Gatineau",
    province: "QC",
    langue: "FR",
    conflictChecked: true,
  },
  {
    id: "dadie-client-9312",
    typeClient: "personne_morale",
    raisonSociale: "9312-4477 Québec inc.",
    contact: "Martine Bélanger",
    email: "comptes@9312quebec.example.com",
    telephone: "(819) 555-0205",
    city: "Gatineau",
    province: "QC",
    langue: "FR",
    conflictChecked: true,
  },
];

const DOSSIERS = [
  {
    id: "dadie-dossier-famille",
    clientId: "dadie-client-lemay",
    numeroDossier: "FAM-2026-001",
    intitule: "Lemay — Garde et pension alimentaire",
    type: "droit_famille",
    sousType: "garde",
    statut: "actif",
    modeFacturation: "horaire",
    tauxHoraire: TAUX_HORAIRE,
    resumeDossier:
      "Garde partagée contestée et fixation de la pension alimentaire. Provision reçue en fidéicommis.",
    soldeFiducieDossier: 1500,
    autoriserPaiementFiducie: true,
  },
  {
    id: "dadie-dossier-immigration",
    clientId: "dadie-client-diallo",
    numeroDossier: "IMM-2026-002",
    intitule: "Diallo — Contestation d'une mesure de renvoi",
    type: "immigration",
    sousType: "renvoi",
    statut: "actif",
    modeFacturation: "horaire",
    tauxHoraire: TAUX_HORAIRE,
    resumeDossier:
      "Mesure de renvoi contestée. Délais de recours impératifs : le calcul des échéances est critique.",
  },
  {
    id: "dadie-dossier-litige",
    clientId: "dadie-client-9312",
    numeroDossier: "LIT-2026-003",
    intitule: "9312-4477 Québec inc. — Recouvrement de créance",
    type: "litige_civil",
    sousType: null,
    statut: "actif",
    modeFacturation: "horaire",
    tauxHoraire: TAUX_HORAIRE,
    resumeDossier: "Recours en recouvrement contre un client défaillant. Mise en demeure envoyée.",
  },
  {
    id: "dadie-dossier-aide-juridique",
    clientId: "dadie-client-lemay",
    numeroDossier: "AJ-2026-004",
    intitule: "Lemay — Mandat d'aide juridique (famille)",
    type: "droit_famille",
    sousType: "aide_juridique",
    statut: "actif",
    modeFacturation: "horaire",
    tauxHoraire: 0,
    resumeDossier:
      "Mandat d'aide juridique. Tarif réglementé (grille CSJ) et registre séparé obligatoires. Facturation à la Commission des services juridiques, pas au client. Aide juridique RÉGULIÈRE : flux courant, à cadrer à l'embarquement.",
  },
];

// ---- Heures (le coeur du mode horaire) --------------------------------------
//
// Trois états volontairement représentés :
//   - facturées   → rattachées à une facture émise
//   - à facturer  → travail réel, jamais facturé. C'est exactement l'argent
//                   qu'il ne voit pas aujourd'hui (suivi manuel).
//   - non facturable → aide juridique, réglée par la CSJ au tarif réglementé.

const TIME_ENTRIES = [
  // Dossier famille → facture 2026-0001 (payée)
  { id: "dadie-time-001", dossierId: "dadie-dossier-famille", clientId: "dadie-client-lemay", date: "2026-06-03", minutes: 90, description: "Consultation initiale et ouverture de dossier", typeActivite: "consultation", invoiceId: "dadie-invoice-0001" },
  { id: "dadie-time-002", dossierId: "dadie-dossier-famille", clientId: "dadie-client-lemay", date: "2026-06-06", minutes: 150, description: "Rédaction de la demande introductive d'instance", typeActivite: "redaction", invoiceId: "dadie-invoice-0001" },
  { id: "dadie-time-003", dossierId: "dadie-dossier-famille", clientId: "dadie-client-lemay", date: "2026-06-11", minutes: 60, description: "Formulaire de fixation des pensions alimentaires", typeActivite: "redaction", invoiceId: "dadie-invoice-0001" },

  // Dossier famille → travail réel jamais facturé
  { id: "dadie-time-004", dossierId: "dadie-dossier-famille", clientId: "dadie-client-lemay", date: "2026-07-21", minutes: 75, description: "Négociation avec la partie adverse", typeActivite: "negociation", invoiceId: null },
  { id: "dadie-time-005", dossierId: "dadie-dossier-famille", clientId: "dadie-client-lemay", date: "2026-08-04", minutes: 45, description: "Préparation de l'audition", typeActivite: "preparation", invoiceId: null },

  // Dossier immigration → facture 2026-0002 (en retard)
  { id: "dadie-time-006", dossierId: "dadie-dossier-immigration", clientId: "dadie-client-diallo", date: "2026-06-16", minutes: 120, description: "Analyse de la mesure de renvoi et calcul des délais", typeActivite: "analyse", invoiceId: "dadie-invoice-0002" },
  { id: "dadie-time-007", dossierId: "dadie-dossier-immigration", clientId: "dadie-client-diallo", date: "2026-06-19", minutes: 180, description: "Demande de sursis et affidavits", typeActivite: "redaction", invoiceId: "dadie-invoice-0002" },

  // Dossier immigration → à facturer
  { id: "dadie-time-008", dossierId: "dadie-dossier-immigration", clientId: "dadie-client-diallo", date: "2026-07-30", minutes: 90, description: "Preuve documentaire complémentaire", typeActivite: "preparation", invoiceId: null },

  // Dossier litige → facture 2026-0003 (envoyée)
  { id: "dadie-time-009", dossierId: "dadie-dossier-litige", clientId: "dadie-client-9312", date: "2026-07-14", minutes: 60, description: "Analyse du dossier et mise en demeure", typeActivite: "redaction", invoiceId: "dadie-invoice-0003" },
  { id: "dadie-time-010", dossierId: "dadie-dossier-litige", clientId: "dadie-client-9312", date: "2026-07-22", minutes: 120, description: "Procédures introductives", typeActivite: "redaction", invoiceId: "dadie-invoice-0003" },

  // Dossier litige → à facturer
  { id: "dadie-time-011", dossierId: "dadie-dossier-litige", clientId: "dadie-client-9312", date: "2026-08-06", minutes: 60, description: "Suivi de la gestion d'instance", typeActivite: "suivi", invoiceId: null },

  // Aide juridique → non facturable au client (réglé par la CSJ)
  { id: "dadie-time-012", dossierId: "dadie-dossier-aide-juridique", clientId: "dadie-client-lemay", date: "2026-07-08", minutes: 120, description: "Mandat d'aide juridique — travail au tarif réglementé (grille CSJ à configurer)", typeActivite: "aide_juridique", invoiceId: null, aideJuridique: true },
  { id: "dadie-time-013", dossierId: "dadie-dossier-aide-juridique", clientId: "dadie-client-lemay", date: "2026-07-29", minutes: 90, description: "Mandat d'aide juridique — travail au tarif réglementé (grille CSJ à configurer)", typeActivite: "aide_juridique", invoiceId: null, aideJuridique: true },
];

// TPS 5 % / TVQ 9,975 % (Québec).
function taxTotals(montantHT) {
  const subtotalTaxable = round2(montantHT);
  const tps = round2((subtotalTaxable * 5.0) / 100);
  const tvq = round2((subtotalTaxable * 9.975) / 100);
  const taxTotal = round2(tps + tvq);
  const total = round2(subtotalTaxable + taxTotal);
  return { subtotalTaxable, tps, tvq, taxTotal, total };
}

const INVOICES = [
  {
    id: "dadie-invoice-0001",
    numero: "2026-0001",
    clientId: "dadie-client-lemay",
    dossierId: "dadie-dossier-famille",
    emission: "2026-06-15",
    echeance: "2026-07-15",
    state: "paid",
  },
  {
    id: "dadie-invoice-0002",
    numero: "2026-0002",
    clientId: "dadie-client-diallo",
    dossierId: "dadie-dossier-immigration",
    emission: "2026-06-25",
    echeance: "2026-07-25",
    state: "overdue", // reflète son délai réel de règlement (31-60 jours)
  },
  {
    id: "dadie-invoice-0003",
    numero: "2026-0003",
    clientId: "dadie-client-9312",
    dossierId: "dadie-dossier-litige",
    emission: "2026-07-28",
    echeance: "2026-08-27",
    state: "issued",
  },
];

/** Heures d'une facture, et montant hors taxes correspondant. */
function entriesForInvoice(invoiceId) {
  return TIME_ENTRIES.filter((t) => t.invoiceId === invoiceId);
}

function montantHTForInvoice(invoiceId) {
  return round2(
    entriesForInvoice(invoiceId).reduce(
      (sum, t) => sum + (t.minutes / 60) * TAUX_HORAIRE,
      0,
    ),
  );
}

// ---- Exécution --------------------------------------------------------------

async function ensureCabinet() {
  // Essai 30 jours — débloque l'accès à l'app comme un cabinet réellement
  // embarqué. Même mécanique que Derisier et Cayard (status "trialing").
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);
  const data = {
    nom: AUDIT.cabinet.nom,
    adresse: AUDIT.cabinet.location,
    telephone: AUDIT.cabinet.telephone,
    email: AUDIT.cabinet.email,
    barreauNumero: AUDIT.cabinet.barreauNumero,
    plan: AUDIT.plan,
    config: JSON.stringify(CABINET_CONFIG),
    stripeSubscriptionStatus: "trialing",
    stripeTrialEnd: trialEnd,
  };
  return prisma.cabinet.upsert({
    where: { id: CABINET_ID },
    create: { id: CABINET_ID, ...data },
    update: data,
  });
}

async function ensureInterface() {
  await prisma.cabinetInterface.upsert({
    where: { cabinetId: CABINET_ID },
    create: { cabinetId: CABINET_ID, ...CABINET_INTERFACE },
    update: CABINET_INTERFACE,
  });
}

async function ensureAdminUser() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existing = await prisma.user.findFirst({
    where: { cabinetId: CABINET_ID, email: { equals: ADMIN_EMAIL, mode: "insensitive" } },
  });
  const data = {
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    nom: "Me Agboko Jean-Jacques Dadié",
    role: "admin_cabinet",
    isBillable: true,
    defaultHourlyRate: TAUX_HORAIRE,
  };
  if (existing) {
    return prisma.user.update({ where: { id: existing.id }, data });
  }
  return prisma.user.create({ data: { id: "dadie-user-avocat", cabinetId: CABINET_ID, ...data } });
}

async function upsertDebours() {
  const typeIds = {};
  for (const t of DEBOURS_TYPES) {
    const existing = await prisma.deboursType.findFirst({
      where: { cabinetId: CABINET_ID, nom: t.nom },
    });
    const payload = {
      cabinetId: CABINET_ID,
      nom: t.nom,
      categorie: t.categorie,
      description: t.gouvernementRef ? `${t.gouvernementRef} — non taxable` : "Débours — non taxable",
      taxable: false,
      isGovernment: Boolean(t.gouvernementRef),
      gouvernementRef: t.gouvernementRef,
      coutDefaut: t.coutDefaut,
      actif: true,
    };
    const row = existing
      ? await prisma.deboursType.update({ where: { id: existing.id }, data: payload })
      : await prisma.deboursType.create({ data: payload });
    typeIds[t.nom] = row.id;
  }
  for (const tpl of DEBOURS_TEMPLATES) {
    const deboursTypeId = typeIds[tpl.nom];
    if (!deboursTypeId) continue;
    await prisma.deboursTemplate.upsert({
      where: {
        cabinetId_dossierType_deboursTypeId: {
          cabinetId: CABINET_ID,
          dossierType: tpl.dossierType,
          deboursTypeId,
        },
      },
      create: { cabinetId: CABINET_ID, dossierType: tpl.dossierType, deboursTypeId, isRequired: tpl.isRequired },
      update: { isRequired: tpl.isRequired },
    });
  }
}

async function upsertClients() {
  for (const c of CLIENTS) {
    const { id, ...rest } = c;
    await prisma.client.upsert({
      where: { id },
      create: { id, cabinetId: CABINET_ID, status: "actif", ...rest },
      update: { cabinetId: CABINET_ID, ...rest },
    });
  }
}

async function upsertDossiers(adminId) {
  for (const d of DOSSIERS) {
    const { id, ...rest } = d;
    await prisma.dossier.upsert({
      where: { id },
      create: { id, cabinetId: CABINET_ID, avocatResponsableId: adminId, ...rest },
      update: { cabinetId: CABINET_ID, avocatResponsableId: adminId, ...rest },
    });
  }
}

async function upsertInvoices(adminId) {
  for (const inv of INVOICES) {
    const montantHT = montantHTForInvoice(inv.id);
    const t = taxTotals(montantHT);
    const paid = inv.state === "paid";
    const statut = paid ? "payee" : inv.state === "overdue" ? "en_retard" : "envoyee";
    const invoiceStatus = paid ? "PAID" : inv.state === "overdue" ? "OVERDUE" : "ISSUED";
    const paymentStatus = paid ? "PAID" : "UNPAID";
    const montantPaye = paid ? t.total : 0;

    const invoiceData = {
      cabinetId: CABINET_ID,
      clientId: inv.clientId,
      dossierId: inv.dossierId,
      numero: inv.numero,
      dateEmission: new Date(inv.emission),
      dateEcheance: new Date(inv.echeance),
      statut,
      invoiceStatus,
      paymentStatus,
      currency: "CAD",
      montantTotal: t.total,
      montantPaye,
      balanceDue: round2(t.total - montantPaye),
      subtotalTaxable: t.subtotalTaxable,
      tps: t.tps,
      tvq: t.tvq,
      subtotalFees: t.subtotalTaxable,
      subtotalBeforeTax: t.subtotalTaxable,
      taxGst: t.tps,
      taxQst: t.tvq,
      taxTotal: t.taxTotal,
      totalInvoiceAmount: t.total,
      totalPaidAmount: montantPaye,
      sentAt: new Date(inv.emission),
      validatedAt: new Date(inv.emission),
      validatedById: adminId,
      createdById: adminId,
    };

    await prisma.invoice.upsert({
      where: { id: inv.id },
      create: { id: inv.id, ...invoiceData },
      update: invoiceData,
    });

    // Une ligne par prestation : c'est la lisibilité que le mode horaire exige.
    const entries = entriesForInvoice(inv.id);
    for (let i = 0; i < entries.length; i += 1) {
      const e = entries[i];
      const heures = round2(e.minutes / 60);
      const montant = round2(heures * TAUX_HORAIRE);
      const lt = taxTotals(montant);
      const lineId = `${e.id}-line`;
      const lineData = {
        invoiceId: inv.id,
        description: `${e.date} — ${e.description} (${heures} h × ${TAUX_HORAIRE} $)`,
        quantite: heures,
        tauxUnitaire: TAUX_HORAIRE,
        montant,
        lineType: "fee",
        sourceType: "time_entry",
        taxable: true,
        gstAmount: lt.tps,
        qstAmount: lt.tvq,
        lineSubtotal: montant,
        lineTotal: lt.total,
        sortOrder: i,
      };
      await prisma.invoiceLine.upsert({
        where: { id: lineId },
        create: { id: lineId, ...lineData },
        update: lineData,
      });
    }
  }
}

async function upsertTimeEntries(adminId) {
  for (const e of TIME_ENTRIES) {
    const aj = Boolean(e.aideJuridique);
    const heures = round2(e.minutes / 60);
    // Aide juridique : réglée par la Commission des services juridiques au
    // tarif réglementé. Aucun taux inventé ici, la grille CSJ se configure
    // avec l'avocat. Montant 0 tant qu'elle n'est pas saisie.
    const taux = aj ? 0 : TAUX_HORAIRE;
    const montant = round2(heures * taux);
    const facturee = Boolean(e.invoiceId);

    const payload = {
      cabinetId: CABINET_ID,
      dossierId: e.dossierId,
      clientId: e.clientId,
      userId: adminId,
      date: new Date(e.date),
      workDate: new Date(e.date),
      dureeMinutes: e.minutes,
      durationHours: heures,
      description: e.description,
      typeActivite: e.typeActivite,
      facturable: !aj,
      statut: facturee ? "facture" : "valide",
      tauxHoraire: taux,
      hourlyRate: taux,
      montant,
      feeAmount: montant,
      taxable: !aj,
      billingStatus: aj ? "NON_BILLABLE" : facturee ? "BILLED" : "READY_TO_BILL",
      invoiceId: e.invoiceId ?? null,
      invoiceLineId: e.invoiceId ? `${e.id}-line` : null,
      internalNote: aj
        ? "Aide juridique : facturé à la Commission des services juridiques au tarif réglementé. Grille CSJ à configurer, registre séparé obligatoire."
        : null,
      approvedById: adminId,
      approvedAt: new Date(e.date),
    };

    await prisma.timeEntry.upsert({
      where: { id: e.id },
      create: { id: e.id, ...payload },
      update: payload,
    });
  }
}

async function upsertTrust(adminId) {
  // Provision modeste : il déclare un usage « peu » du fidéicommis.
  const account = await prisma.trustAccount.upsert({
    where: {
      cabinetId_clientId_matterId: {
        cabinetId: CABINET_ID,
        clientId: "dadie-client-lemay",
        matterId: "dadie-dossier-famille",
      },
    },
    create: {
      id: "dadie-trust-lemay",
      cabinetId: CABINET_ID,
      clientId: "dadie-client-lemay",
      matterId: "dadie-dossier-famille",
      currentBalance: 1500,
      currency: "CAD",
    },
    update: { currentBalance: 1500 },
  });

  const txData = {
    cabinetId: CABINET_ID,
    trustAccountId: account.id,
    clientId: "dadie-client-lemay",
    dossierId: "dadie-dossier-famille",
    date: new Date("2026-06-03"),
    amount: 1500,
    type: "deposit",
    balanceAfter: 1500,
    modePaiement: "VIREMENT",
    description: "Provision reçue en fidéicommis (dossier garde Lemay)",
    reference: "FID-2026-001",
    createdById: adminId,
  };
  await prisma.trustTransaction.upsert({
    where: { id: "dadie-trust-tx-001" },
    create: { id: "dadie-trust-tx-001", ...txData },
    update: txData,
  });

  await prisma.client.update({
    where: { id: "dadie-client-lemay" },
    data: {
      trustAccountBalance: 1500,
      allowTrustPayments: true,
      lastTrustTransactionDate: new Date("2026-06-03"),
    },
  });
}

async function upsertConformite(adminId) {
  const checks = [
    {
      id: "dadie-conflict-001",
      dossierId: "dadie-dossier-immigration",
      clientName: "Ibrahim Diallo",
      resolvedAt: "2026-06-16",
      notes: "Aucun conflit identifié. Mandat confirmé.",
    },
    {
      id: "dadie-conflict-002",
      dossierId: "dadie-dossier-famille",
      clientName: "Sandrine Lemay",
      resolvedAt: "2026-06-03",
      notes: "Aucun conflit identifié. Provision en fidéicommis autorisée.",
    },
  ];
  for (const c of checks) {
    const data = {
      cabinetId: CABINET_ID,
      dossierId: c.dossierId,
      checkedById: adminId,
      clientName: c.clientName,
      conflictsFound: false,
      resolution: "confirmed_no_conflict",
      resolvedAt: new Date(c.resolvedAt),
      resolutionNotes: c.notes,
    };
    await prisma.conflictCheck.upsert({
      where: { id: c.id },
      create: { id: c.id, ...data },
      update: data,
    });
  }
}

function heuresNonFacturees() {
  return TIME_ENTRIES.filter((t) => !t.invoiceId && !t.aideJuridique);
}

function logPlan() {
  const r = AUDIT.recovery;
  const nf = heuresNonFacturees();
  const minutesNF = nf.reduce((s, t) => s + t.minutes, 0);
  console.log("Plan (dry-run) — rien n'est écrit.\n");
  console.log(`Cabinet:        ${AUDIT.cabinet.nom} (id ${CABINET_ID})`);
  console.log(`Affiché:        ${AUDIT.cabinet.displayName} — ${AUDIT.cabinet.location}`);
  console.log(`Admin:          ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (admin_cabinet)`);
  console.log(`Offre:          SAFE Solo fondatrice 50 $/mois (rapport annonçait 99 $)`);
  console.log(`Facturation:    HORAIRE ${TAUX_HORAIRE} $/h · TPS/TVQ`);
  console.log(`Fidéicommis:    actif (usage faible) · RCNEPA`);
  console.log(`Aide juridique: RÉGULIÈRE · registres séparés · grille CSJ à configurer`);
  console.log(`Récupérable:    ${r.valeurRecuperableAnnuelle}$/an · ${r.heuresRecuperablesParSemaine} h/sem`);
  console.log(`Clients:        ${CLIENTS.length} · Dossiers: ${DOSSIERS.length} · Factures: ${INVOICES.length}`);
  console.log(`Heures:         ${TIME_ENTRIES.length} entrées`);
  console.log(`  dont à facturer: ${nf.length} entrées · ${round2(minutesNF / 60)} h · ${round2((minutesNF / 60) * TAUX_HORAIRE)} $`);
  console.log(`Débours:        ${DEBOURS_TYPES.length} types · ${DEBOURS_TEMPLATES.length} gabarits`);
  console.log(`Couche assistante: MASQUÉE (aucun user assistante, file-assistante hors nav)`);
  console.log(`Fiche de temps: VISIBLE (mode horaire)`);
  console.log(`\nÀ confirmer avec l'avocat:`);
  CABINET_CONFIG.onboardingAudit.aConfirmer.forEach((q) => console.log(`  - ${q}`));
}

async function logSummary() {
  const [users, clients, dossiers, invoices, entries, trustTx, conflicts, debours] =
    await Promise.all([
      prisma.user.findMany({ where: { cabinetId: CABINET_ID }, orderBy: { createdAt: "asc" } }),
      prisma.client.count({ where: { cabinetId: CABINET_ID } }),
      prisma.dossier.count({ where: { cabinetId: CABINET_ID } }),
      prisma.invoice.findMany({
        where: { cabinetId: CABINET_ID },
        select: { numero: true, statut: true, montantTotal: true, balanceDue: true },
        orderBy: { numero: "asc" },
      }),
      prisma.timeEntry.findMany({
        where: { cabinetId: CABINET_ID },
        select: { billingStatus: true, durationHours: true, montant: true },
      }),
      prisma.trustTransaction.count({ where: { cabinetId: CABINET_ID } }),
      prisma.conflictCheck.count({ where: { cabinetId: CABINET_ID } }),
      prisma.deboursType.count({ where: { cabinetId: CABINET_ID } }),
    ]);

  const aFacturer = entries.filter((e) => e.billingStatus === "READY_TO_BILL");
  const heuresAF = round2(aFacturer.reduce((s, e) => s + (e.durationHours ?? 0), 0));
  const montantAF = round2(aFacturer.reduce((s, e) => s + (e.montant ?? 0), 0));
  const impayes = round2(invoices.reduce((s, i) => s + (i.balanceDue ?? 0), 0));

  console.log("\n============================================================");
  console.log("DADIÉ AVOCAT — espace de travail configuré");
  console.log("============================================================");
  console.log(`Cabinet:        ${AUDIT.cabinet.displayName} (id ${CABINET_ID})`);
  console.log(`Offre:          SAFE Solo fondatrice 50 $/mois pendant 12 mois`);
  console.log(`Facturation:    horaire ${TAUX_HORAIRE} $/h · TPS/TVQ`);
  console.log(`Fidéicommis:    ${trustTx} mouvement(s) · RCNEPA`);
  console.log(`Conformité:     ${conflicts} vérification(s) de conflit · ${debours} types de débours`);
  console.log(`Clients:        ${clients} · Dossiers: ${dossiers}`);
  console.log(`Heures:         ${entries.length} entrées`);
  console.log(`Factures:`);
  invoices.forEach((i) =>
    console.log(`  - ${i.numero} [${i.statut}] total ${i.montantTotal} $ · solde ${i.balanceDue} $`),
  );
  console.log(`\nCe que l'écran doit lui montrer en premier:`);
  console.log(`  Heures travaillées jamais facturées : ${heuresAF} h = ${montantAF} $`);
  console.log(`  Créances impayées :                   ${impayes} $`);
  console.log(`\nUtilisateurs:`);
  users.forEach((u) => console.log(`  - ${u.nom} <${u.email}> [${u.role}] ${u.defaultHourlyRate ?? "—"} $/h`));
  console.log(`\nIdentifiants (à remettre de vive voix, aucun courriel envoyé):`);
  console.log(`  Cabinet (à saisir au login): ${AUDIT.cabinet.nom}`);
  console.log(`  Courriel:     ${ADMIN_EMAIL}`);
  console.log(`  Mot de passe: ${ADMIN_PASSWORD}`);
  console.log(`\nÀ confirmer avec l'avocat:`);
  CABINET_CONFIG.onboardingAudit.aConfirmer.forEach((q) => console.log(`  - ${q}`));
  console.log("");
}

async function main() {
  console.log(`Configuration DADIÉ AVOCAT${DRY_RUN ? " (dry-run)" : ""}...\n`);

  if (DRY_RUN) {
    logPlan();
    return;
  }

  const cabinet = await ensureCabinet();
  console.log(`Cabinet prêt: ${cabinet.nom} (${cabinet.id})`);

  await ensureInterface();
  console.log("CabinetInterface appliquée (horaire, sans couche assistante)");

  const admin = await ensureAdminUser();
  console.log(`Utilisateur admin: ${admin.email}`);

  await upsertDebours();
  console.log("Types et gabarits de débours upsertés");

  await upsertClients();
  console.log("Clients de démonstration upsertés");

  await upsertDossiers(admin.id);
  console.log("Dossiers de démonstration upsertés");

  // Les factures d'abord : les heures s'y rattachent par invoiceId/invoiceLineId.
  await upsertInvoices(admin.id);
  console.log("Factures et lignes de prestation upsertées");

  await upsertTimeEntries(admin.id);
  console.log("Fiches de temps upsertées");

  await upsertTrust(admin.id);
  console.log("Mouvement de fidéicommis upserté");

  await upsertConformite(admin.id);
  console.log("Éléments de conformité upsertés");

  await logSummary();
}

main()
  .catch((e) => {
    console.error("Échec seed Dadié:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
