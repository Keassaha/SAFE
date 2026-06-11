/**
 * Seed / configure le cabinet potentiel CAYARD AVOCAT (Québec).
 *
 * Modèle : calqué sur scripts/rebuild-derisier-from-audit.mjs, mais en version
 * SIMPLE pour un cabinet sans adjointe :
 *   - pas de couche assistante (file assistante masquée dans la nav)
 *   - pas d'utilisateur "assistante"
 *   - pas de navette / wording assistante
 *
 * Usage :
 *   node scripts/seed-cayard.mjs              # applique (idempotent)
 *   node scripts/seed-cayard.mjs --dry-run    # n'écrit rien, affiche le plan
 *
 * Override mot de passe (optionnel) :
 *   CAYARD_ADMIN_PASSWORD=...
 *
 * Idempotent : tout est upserté par id stable (préfixe "cayard-"). Re-jouable
 * sans rien dupliquer. N'altère JAMAIS Derisier (cabinetId distinct).
 *
 * Note schéma : TrustAccount est un registre par client/par dossier (pas un
 * compte bancaire). Le compte en fidéicommis "banque" du cabinet est décrit
 * dans Cabinet.config.trustBanking ; les mouvements vivent dans TrustTransaction.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";

// .env.local (dev) prime sur .env — Prisma via `node` ne lit que .env par défaut.
loadEnv({ path: ".env.local", override: true });
loadEnv({ path: ".env" });

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");
const CABINET_ID = "cayard-avocat-qc-2026";
const ADMIN_EMAIL = "contact@cayard-avocat.ca";
const ADMIN_PASSWORD = process.env.CAYARD_ADMIN_PASSWORD || "CayardAvocat2026!";

const round2 = (n) => Math.round(n * 100) / 100;

// ---- Audit (rapport-audit-CAYARD-AVOCAT.pdf, réf. A 2026 0609 CMQ) ----------

const AUDIT = {
  language: "fr",
  plan: "cabinet",
  monthlyPrice: 149,
  cabinet: {
    nom: "Entreprise individuelle (CAYARD AVOCAT)",
    displayName: "CAYARD AVOCAT",
    principalLawyer: "Cayard",
    email: ADMIN_EMAIL,
    province: "QC",
    location: "Québec, QC",
    formeJuridique: "Entreprise individuelle",
    barreauNumero: null, // à confirmer — jamais affiché sur facture
    adresse: null,
    telephone: null,
  },
  practice: {
    domaines: ["immigration", "droit_famille", "litige_civil"],
    domainesLabel: "Droit de l'immigration, droit de la famille, litige civil",
    anciennete: "moins_2_ans",
    dossiersActifs: "10-30",
    aideJuridique: "occasionnelle",
  },
  billing: {
    mode: "forfait",
    methods: ["cheque", "interac", "virement", "carte", "comptant"],
    visibiliteCreances: false, // calcul manuel requis aujourd'hui
    delaiReglementJours: 22,
  },
  trust: {
    enabled: true,
    gereActivement: true,
    accountCount: 1,
    reconciliation: "mensuelle",
  },
  team: {
    structure: "solo", // pas d'adjointe
    userCount: 2,
    techComfort: "intermediate",
    outilActuel: "Excel / papier",
    satisfactionOutil: 6,
  },
  recovery: {
    valeurRecuperableAnnuelle: 15811,
    valeurRecuperableMensuelle: 1318,
    heuresRecuperablesParSemaine: 2.1,
    tauxRealisation: 0.6,
  },
  score: { global: 1, sur: 100, repartition: { critique: 0, eleve: 0, modere: 0, faible: 1 } },
  priorities: ["comptabilite_administration", "fideicommis"],
  timeline: "dans_le_mois",
  urgence: "urgent",
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
  billingMode: AUDIT.billing.mode,
  paymentMethods: AUDIT.billing.methods,
  currentOffer: {
    planLabel: "Cabinet",
    monthlyPrice: AUDIT.monthlyPrice,
    maxUsers: 3,
  },
  trustBanking: {
    enabled: true,
    accountCount: 1,
    regulator: "RCNEPA (Barreau du Québec)",
    province: "QC",
    accounts: [
      {
        label: "CAYARD AVOCAT — Compte en fidéicommis",
        bank: "À confirmer",
        accountNumber: "À-CONFIRMER-CAYARD-FIDEICOMMIS",
        currency: "CAD",
        reconciliation: "mensuelle",
        notes:
          "Compte en fidéicommis géré activement. Banque, succursale et numéro à confirmer avec l'avocat lors de l'embarquement.",
      },
    ],
  },
  onboardingAudit: {
    ref: "A 2026 0609 CMQ",
    date: "2026-06-09",
    domaines: AUDIT.practice.domaines,
    domainesLabel: AUDIT.practice.domainesLabel,
    anciennete: AUDIT.practice.anciennete,
    dossiersActifs: AUDIT.practice.dossiersActifs,
    aideJuridique: AUDIT.practice.aideJuridique,
    usersPrevus: AUDIT.team.userCount,
    outilActuel: AUDIT.team.outilActuel,
    satisfactionOutil: AUDIT.team.satisfactionOutil,
    priorities: AUDIT.priorities,
    timeline: AUDIT.timeline,
    urgence: AUDIT.urgence,
    score: AUDIT.score,
    delaiReglementJours: AUDIT.billing.delaiReglementJours,
    valeurRecuperableAnnuelle: AUDIT.recovery.valeurRecuperableAnnuelle,
    valeurRecuperableMensuelle: AUDIT.recovery.valeurRecuperableMensuelle,
    heuresRecuperablesParSemaine: AUDIT.recovery.heuresRecuperablesParSemaine,
  },
};

// ---- CabinetInterface (JSON) ------------------------------------------------
//
// Différence clé vs Derisier : "file-assistante" est dans ongletsMasques.
// Rappel filtrage (components/layout/SidebarNav.tsx) :
//   - ongletsActifs = whitelist des items TOP-LEVEL uniquement
//   - les enfants (clients, dossiers, file-assistante, ...) ne sont coupés
//     que par ongletsMasques. Donc pour retirer la couche assistante, il FAUT
//     mettre "file-assistante" dans ongletsMasques.

const CABINET_INTERFACE = {
  ongletsActifs: JSON.stringify(["dashboard", "gestion", "finances", "outils", "parametres"]),
  // Masque la couche assistante + les modules d'équipe inutiles pour un solo.
  ongletsMasques: JSON.stringify(["file-assistante", "employees", "mes-heures"]),
  disciplines: JSON.stringify(AUDIT.practice.domaines),
  widgets: JSON.stringify([
    "trust-reconciliation-alert",
    "active-files",
    "pending-billing",
    "upcoming-deadlines",
    "recent-documents",
    "quick-actions",
  ]),
  modules: JSON.stringify({
    locale: "fr",
    intake: { language: "fr" },
    facturation: {
      principal: "forfait",
      periodeFact: "mensuel",
      joursRelance: 30,
      tauxInterets: 0,
      taxes: { mode: "tps_tvq", province: "QC", rates: { tps: 5.0, tvq: 9.975 } },
      methodesAcceptees: AUDIT.billing.methods,
    },
    fideicommis: {
      regle: "rcnepa-qc",
      enabled: true,
      accountCount: 1,
      reconciliation: "mensuelle",
      alerteRetard: 30,
      protectionCroisee: true,
      onboardingPriority: "critical", // géré activement → central
    },
    aideJuridique: {
      actif: true,
      frequence: "occasionnelle",
      // Conformité tarifaire + registres séparés (point d'exposition audit, FAIBLE).
      registresSepares: true,
      tarifsReglementes: true,
    },
    fintrac: { actif: false },
    privacy: { regime: "loi25-qc", actif: true, retention: { defaut: 7 } },
    operations: {
      techComfort: AUDIT.team.techComfort,
      priorities: AUDIT.priorities,
    },
    subscriptions: {
      targetPlan: "cabinet",
      targetPriceMonthly: AUDIT.monthlyPrice,
      trialReady: false,
    },
  }),
  checklistsParType: JSON.stringify({
    immigration_ee: [
      "Consultation + mandat signé",
      "Évaluation admissibilité (CRS / EE)",
      "ITA reçue (délai 60 jours suivi)",
      "Profil Entrée express + CNP validé",
      "Déclaration antécédents",
      "Documents rassemblés",
      "Examen médical (validité 12 mois)",
      "Certificats de police (sans trou)",
      "Soumission IRCC",
      "Biométrie suivie",
      "COPR reçue",
      "Établissement + fermeture",
    ],
    immigration_parrainage: [
      "Consultation + mandat signé",
      "Vérification de conflit",
      "Documents familiaux",
      "Formulaires IMM préparés",
      "AIP suivi",
      "Examen médical + biométrie",
      "COPR reçue",
      "Établissement",
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
      "Facturation à la Commission des services juridiques",
      "Fermeture + reddition",
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
  }),
  modeFacturation: JSON.stringify({ principal: "forfait", cadence: "mensuel", tauxHoraire: false }),
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

// ---- Catalogue de forfaits (Québec) -----------------------------------------

const FORFAIT_SERVICES = [
  { code: "IMM-CONSULT", nom: "Consultation initiale (immigration)", montant: 200, categorie: "immigration", sousType: null },
  { code: "IMM-EE", nom: "Entrée express (résidence permanente)", montant: 2500, categorie: "immigration", sousType: "ee" },
  { code: "IMM-PARR", nom: "Parrainage familial", montant: 2000, categorie: "immigration", sousType: "parrainage" },
  { code: "FAM-DIVORCE", nom: "Divorce / séparation (forfait)", montant: 2200, categorie: "droit_famille", sousType: "divorce" },
  { code: "FAM-GARDE", nom: "Garde et pension alimentaire", montant: 1800, categorie: "droit_famille", sousType: "garde" },
  { code: "FAM-AJ", nom: "Mandat d'aide juridique (tarif réglementé)", montant: 0, categorie: "droit_famille", sousType: "aide_juridique" },
  { code: "LIT-CIVIL", nom: "Litige civil (forfait de base)", montant: 1800, categorie: "litige_civil", sousType: null },
  { code: "LIT-MED", nom: "Mise en demeure", montant: 350, categorie: "litige_civil", sousType: "mise_en_demeure" },
];

// ---- Débours (Québec) -------------------------------------------------------

const DEBOURS_TYPES = [
  { nom: "Frais IRCC — Résidence permanente", categorie: "Frais gouvernemental", coutDefaut: 1365, gouvernementRef: "IRCC" },
  { nom: "Frais IRCC — Biométrie", categorie: "Frais gouvernemental", coutDefaut: 85, gouvernementRef: "IRCC" },
  { nom: "Frais IRCC — Parrainage", categorie: "Frais gouvernemental", coutDefaut: 1080, gouvernementRef: "IRCC" },
  { nom: "Frais de greffe (Cour supérieure)", categorie: "Frais judiciaire", coutDefaut: 213, gouvernementRef: "MJQ" },
  { nom: "Frais d'huissier", categorie: "Débours judiciaire", coutDefaut: 150, gouvernementRef: null },
  { nom: "Copies certifiées / poste", categorie: "Débours administratif", coutDefaut: 40, gouvernementRef: null },
];

const DEBOURS_TEMPLATES = [
  { dossierType: "immigration_ee", nom: "Frais IRCC — Résidence permanente", isRequired: true },
  { dossierType: "immigration_ee", nom: "Frais IRCC — Biométrie", isRequired: true },
  { dossierType: "immigration_parrainage", nom: "Frais IRCC — Parrainage", isRequired: true },
  { dossierType: "immigration_parrainage", nom: "Frais IRCC — Biométrie", isRequired: true },
  { dossierType: "droit_famille_divorce", nom: "Frais de greffe (Cour supérieure)", isRequired: true },
  { dossierType: "droit_famille_divorce", nom: "Frais d'huissier", isRequired: false },
  { dossierType: "litige_civil", nom: "Frais de greffe (Cour supérieure)", isRequired: true },
  { dossierType: "litige_civil", nom: "Frais d'huissier", isRequired: false },
];

// ---- Données de démonstration (sobres, crédibles) ---------------------------

const CLIENTS = [
  {
    id: "cayard-client-mbarki",
    typeClient: "personne_physique",
    prenom: "Nadia",
    nom: "Mbarki",
    email: "nadia.mbarki@example.com",
    telephone: "(418) 555-0142",
    city: "Québec",
    province: "QC",
    langue: "FR",
    conflictChecked: true,
  },
  {
    id: "cayard-client-caron",
    typeClient: "personne_physique",
    prenom: "Jean-Philippe",
    nom: "Caron",
    email: "jp.caron@example.com",
    telephone: "(418) 555-0188",
    city: "Lévis",
    province: "QC",
    langue: "FR",
    conflictChecked: true,
    allowTrustPayments: true,
  },
  {
    id: "cayard-client-lafleur",
    typeClient: "personne_morale",
    raisonSociale: "Boucherie Lafleur inc.",
    contact: "Martin Lafleur",
    email: "comptes@boucherielafleur.example.com",
    telephone: "(418) 555-0210",
    city: "Québec",
    province: "QC",
    langue: "FR",
    conflictChecked: true,
  },
];

const DOSSIERS = [
  {
    id: "cayard-dossier-immigration",
    clientId: "cayard-client-mbarki",
    numeroDossier: "IMM-2026-001",
    intitule: "Mbarki — Entrée express (résidence permanente)",
    type: "immigration",
    sousType: "ee",
    statut: "actif",
    modeFacturation: "forfait",
    resumeDossier: "Demande de résidence permanente via Entrée express. ITA reçue, suivi du délai de 60 jours.",
    irccStatut: "preparation",
    cnpCode: "21232",
  },
  {
    id: "cayard-dossier-famille",
    clientId: "cayard-client-caron",
    numeroDossier: "FAM-2026-002",
    intitule: "Caron — Divorce et partage du patrimoine",
    type: "droit_famille",
    sousType: "divorce",
    statut: "actif",
    modeFacturation: "forfait",
    resumeDossier: "Divorce avec provision reçue en fidéicommis. Partage du patrimoine familial.",
    soldeFiducieDossier: 3000,
    autoriserPaiementFiducie: true,
  },
  {
    id: "cayard-dossier-litige",
    clientId: "cayard-client-lafleur",
    numeroDossier: "LIT-2026-003",
    intitule: "Boucherie Lafleur inc. — Recouvrement commercial",
    type: "litige_civil",
    sousType: null,
    statut: "actif",
    modeFacturation: "forfait",
    resumeDossier: "Recours en recouvrement contre un fournisseur. Mise en demeure envoyée.",
  },
  {
    id: "cayard-dossier-aide-juridique",
    clientId: "cayard-client-caron",
    numeroDossier: "AJ-2026-004",
    intitule: "Caron — Mandat d'aide juridique (famille)",
    type: "droit_famille",
    sousType: "aide_juridique",
    statut: "actif",
    modeFacturation: "forfait",
    resumeDossier:
      "Mandat d'aide juridique occasionnel. Tarif réglementé (grille CSJ) et registre séparé à tenir. Point d'exposition audit (FAIBLE).",
  },
];

// Lignes : { dossierId, forfaitCode, montantHT } pour le RegistreTache.
const REGISTRE = [
  { id: "cayard-tache-imm", dossierId: "cayard-dossier-immigration", clientId: "cayard-client-mbarki", code: "IMM-EE", montant: 2500 },
  { id: "cayard-tache-fam", dossierId: "cayard-dossier-famille", clientId: "cayard-client-caron", code: "FAM-DIVORCE", montant: 2200 },
  { id: "cayard-tache-lit", dossierId: "cayard-dossier-litige", clientId: "cayard-client-lafleur", code: "LIT-CIVIL", montant: 1800 },
];

// TPS 5 % / TVQ 9,975 % (Québec).
function forfaitTotals(montantHT) {
  const subtotalTaxable = round2(montantHT);
  const tps = round2((subtotalTaxable * 5.0) / 100);
  const tvq = round2((subtotalTaxable * 9.975) / 100);
  const taxTotal = round2(tps + tvq);
  const total = round2(subtotalTaxable + taxTotal);
  return { subtotalTaxable, tps, tvq, taxTotal, total };
}

const INVOICES = [
  {
    id: "cayard-invoice-0001",
    numero: "2026-0001",
    clientId: "cayard-client-mbarki",
    dossierId: "cayard-dossier-immigration",
    description: "Forfait — Entrée express (résidence permanente)",
    montantHT: 2500,
    emission: "2026-05-05",
    echeance: "2026-06-04",
    state: "paid", // payée
  },
  {
    id: "cayard-invoice-0002",
    numero: "2026-0002",
    clientId: "cayard-client-caron",
    dossierId: "cayard-dossier-famille",
    description: "Forfait — Divorce et partage du patrimoine",
    montantHT: 2200,
    emission: "2026-04-20",
    echeance: "2026-05-20",
    state: "overdue", // IMPAYÉE / en retard
  },
  {
    id: "cayard-invoice-0003",
    numero: "2026-0003",
    clientId: "cayard-client-lafleur",
    dossierId: "cayard-dossier-litige",
    description: "Forfait — Litige civil (recouvrement)",
    montantHT: 1800,
    emission: "2026-05-28",
    echeance: "2026-06-27",
    state: "issued", // envoyée, non échue
  },
];

// ---- Exécution --------------------------------------------------------------

async function ensureCabinet() {
  // Essai 30 jours (offre audit) — débloque l'accès à l'app comme un cabinet
  // réellement embarqué. Même mécanique que Derisier (status "trialing").
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
    nom: "Me Cayard",
    role: "admin_cabinet",
    isBillable: true,
  };
  if (existing) {
    return prisma.user.update({ where: { id: existing.id }, data });
  }
  return prisma.user.create({ data: { id: "cayard-user-avocat", cabinetId: CABINET_ID, ...data } });
}

async function upsertForfaits() {
  for (let i = 0; i < FORFAIT_SERVICES.length; i += 1) {
    const f = FORFAIT_SERVICES[i];
    const payload = {
      nom: f.nom,
      montant: f.montant,
      categorie: f.categorie,
      sousType: f.sousType,
      taxable: f.code !== "FAM-AJ", // aide juridique : tarif réglementé, hors taxe ici
      actif: true,
      sortOrder: i,
    };
    await prisma.forfaitService.upsert({
      where: { cabinetId_code: { cabinetId: CABINET_ID, code: f.code } },
      create: { cabinetId: CABINET_ID, code: f.code, ...payload },
      update: payload,
    });
  }
}

async function upsertDebours() {
  const typeIds = {};
  for (const t of DEBOURS_TYPES) {
    const existing = await prisma.deboursType.findFirst({ where: { cabinetId: CABINET_ID, nom: t.nom } });
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
      where: { cabinetId_dossierType_deboursTypeId: { cabinetId: CABINET_ID, dossierType: tpl.dossierType, deboursTypeId } },
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

async function upsertRegistre() {
  for (const r of REGISTRE) {
    const forfait = await prisma.forfaitService.findUnique({
      where: { cabinetId_code: { cabinetId: CABINET_ID, code: r.code } },
    });
    const payload = {
      cabinetId: CABINET_ID,
      dossierId: r.dossierId,
      clientId: r.clientId,
      forfaitServiceId: forfait?.id ?? null,
      description: forfait?.nom ?? r.code,
      montantBase: r.montant,
      ajustement: 0,
      rabais: 0,
      montantFinal: r.montant,
      taxable: true,
      statut: "facture",
    };
    await prisma.registreTache.upsert({
      where: { id: r.id },
      create: { id: r.id, ...payload },
      update: payload,
    });
  }
}

async function upsertInvoices(adminId) {
  for (const inv of INVOICES) {
    const t = forfaitTotals(inv.montantHT);
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

    const lineData = {
      invoiceId: inv.id,
      description: inv.description,
      quantite: 1,
      tauxUnitaire: inv.montantHT,
      montant: inv.montantHT,
      lineType: "fee",
      sourceType: "registre_tache",
      taxable: true,
      gstAmount: t.tps,
      qstAmount: t.tvq,
      lineSubtotal: inv.montantHT,
      lineTotal: t.total,
      sortOrder: 0,
    };
    await prisma.invoiceLine.upsert({
      where: { id: `${inv.id}-line` },
      create: { id: `${inv.id}-line`, ...lineData },
      update: lineData,
    });
  }
}

async function upsertTrust(adminId) {
  // Compte (registre) en fidéicommis pour le dossier famille Caron.
  const account = await prisma.trustAccount.upsert({
    where: {
      cabinetId_clientId_matterId: {
        cabinetId: CABINET_ID,
        clientId: "cayard-client-caron",
        matterId: "cayard-dossier-famille",
      },
    },
    create: {
      id: "cayard-trust-caron",
      cabinetId: CABINET_ID,
      clientId: "cayard-client-caron",
      matterId: "cayard-dossier-famille",
      currentBalance: 3000,
      currency: "CAD",
    },
    update: { currentBalance: 3000 },
  });

  const txData = {
    cabinetId: CABINET_ID,
    trustAccountId: account.id,
    clientId: "cayard-client-caron",
    dossierId: "cayard-dossier-famille",
    date: new Date("2026-04-15"),
    amount: 3000,
    type: "deposit",
    balanceAfter: 3000,
    modePaiement: "VIREMENT",
    description: "Provision reçue en fidéicommis (dossier divorce Caron)",
    reference: "FID-2026-001",
    createdById: adminId,
  };
  await prisma.trustTransaction.upsert({
    where: { id: "cayard-trust-tx-001" },
    create: { id: "cayard-trust-tx-001", ...txData },
    update: txData,
  });

  // Reflète le solde côté client.
  await prisma.client.update({
    where: { id: "cayard-client-caron" },
    data: {
      trustAccountBalance: 3000,
      allowTrustPayments: true,
      lastTrustTransactionDate: new Date("2026-04-15"),
    },
  });
}

async function upsertConformite(adminId) {
  // Élément de conformité : vérification de conflit sur le dossier immigration.
  const data = {
    cabinetId: CABINET_ID,
    dossierId: "cayard-dossier-immigration",
    checkedById: adminId,
    clientName: "Nadia Mbarki",
    conflictsFound: false,
    resolution: "confirmed_no_conflict",
    resolvedAt: new Date("2026-05-01"),
    resolutionNotes: "Aucun conflit identifié. Mandat confirmé.",
  };
  await prisma.conflictCheck.upsert({
    where: { id: "cayard-conflict-001" },
    create: { id: "cayard-conflict-001", ...data },
    update: data,
  });
}

function logPlan() {
  const r = AUDIT.recovery;
  console.log("Plan (dry-run) — rien n'est écrit.\n");
  console.log(`Cabinet:        ${AUDIT.cabinet.nom} (id ${CABINET_ID})`);
  console.log(`Affiché:        ${AUDIT.cabinet.displayName} — ${AUDIT.cabinet.location}`);
  console.log(`Admin:          ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (admin_cabinet)`);
  console.log(`Plan:           Cabinet ${AUDIT.monthlyPrice}$/mois (jusqu'à 3 utilisateurs)`);
  console.log(`Facturation:    forfait · TPS/TVQ`);
  console.log(`Fidéicommis:    actif (géré activement) · RCNEPA`);
  console.log(`Récupérable:    ${r.valeurRecuperableAnnuelle}$/an · ${r.heuresRecuperablesParSemaine} h/sem`);
  console.log(`Forfaits:       ${FORFAIT_SERVICES.length}`);
  console.log(`Clients:        ${CLIENTS.length} · Dossiers: ${DOSSIERS.length} · Factures: ${INVOICES.length}`);
  console.log(`Couche assistante: MASQUÉE (file-assistante hors nav, aucun user assistante)`);
}

async function logSummary() {
  const [users, clients, dossiers, invoices, forfaits, trustTx, conflicts] = await Promise.all([
    prisma.user.findMany({ where: { cabinetId: CABINET_ID }, orderBy: { createdAt: "asc" } }),
    prisma.client.count({ where: { cabinetId: CABINET_ID } }),
    prisma.dossier.count({ where: { cabinetId: CABINET_ID } }),
    prisma.invoice.findMany({ where: { cabinetId: CABINET_ID }, select: { numero: true, statut: true, montantTotal: true, balanceDue: true } }),
    prisma.forfaitService.count({ where: { cabinetId: CABINET_ID } }),
    prisma.trustTransaction.count({ where: { cabinetId: CABINET_ID } }),
    prisma.conflictCheck.count({ where: { cabinetId: CABINET_ID } }),
  ]);

  console.log("\n============================================================");
  console.log("CAYARD AVOCAT — cabinet configuré");
  console.log("============================================================");
  console.log(`Cabinet:        ${AUDIT.cabinet.displayName} (id ${CABINET_ID})`);
  console.log(`Plan:           Cabinet ${AUDIT.monthlyPrice}$/mois`);
  console.log(`Facturation:    forfait · TPS/TVQ`);
  console.log(`Fidéicommis:    actif · ${trustTx} mouvement(s)`);
  console.log(`Conformité:     ${conflicts} vérification(s) de conflit`);
  console.log(`Forfaits:       ${forfaits}`);
  console.log(`Clients:        ${clients} · Dossiers: ${dossiers}`);
  console.log(`Factures:`);
  invoices.forEach((i) => console.log(`  - ${i.numero} [${i.statut}] total ${i.montantTotal}$ · solde ${i.balanceDue}$`));
  console.log(`\nUtilisateurs:`);
  users.forEach((u) => console.log(`  - ${u.nom} <${u.email}> [${u.role}]`));
  console.log(`\nIdentifiants de test:`);
  console.log(`  Cabinet (à saisir au login): ${AUDIT.cabinet.nom}`);
  console.log(`  Courriel:  ${ADMIN_EMAIL}`);
  console.log(`  Mot de passe: ${ADMIN_PASSWORD}`);
  console.log(`\nCouche assistante: MASQUÉE (aucun user assistante, file-assistante hors nav).`);
  console.log("");
}

async function main() {
  console.log(`Configuration CAYARD AVOCAT${DRY_RUN ? " (dry-run)" : ""}...\n`);

  if (DRY_RUN) {
    logPlan();
    return;
  }

  const cabinet = await ensureCabinet();
  console.log(`Cabinet prêt: ${cabinet.nom} (${cabinet.id})`);

  await ensureInterface();
  console.log("CabinetInterface appliquée (sans couche assistante)");

  const admin = await ensureAdminUser();
  console.log(`Utilisateur admin: ${admin.email}`);

  await upsertForfaits();
  console.log("Forfaits upsertés");

  await upsertDebours();
  console.log("Types et gabarits de débours upsertés");

  await upsertClients();
  console.log("Clients de démonstration upsertés");

  await upsertDossiers(admin.id);
  console.log("Dossiers de démonstration upsertés");

  await upsertRegistre();
  console.log("Registre de tâches forfaitaires upserté");

  await upsertInvoices(admin.id);
  console.log("Factures de démonstration upsertées");

  await upsertTrust(admin.id);
  console.log("Mouvement de fidéicommis upserté");

  await upsertConformite(admin.id);
  console.log("Élément de conformité upserté");

  await logSummary();
}

main()
  .catch((e) => {
    console.error("Échec seed Cayard:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
