/**
 * Seed a personal TEST cabinet that mirrors the Derisier Law *configuration
 * profile* (interface, modules, disciplines, checklists, forfaits, debours,
 * taxonomy, LSO/trust compliance) so the CEO can exercise the exact same UI
 * that Derisier sees.
 *
 * Usage:
 *   node scripts/seed-test-cabinet.mjs
 *
 * Optional env overrides:
 *   TEST_CABINET_PASSWORD=...
 *
 * Doctrine / differences vs the real Derisier cabinet:
 * - Behavioural profile is CLONED verbatim from the canonical Derisier audit
 *   (same onglets/widgets/modules/checklists/forfaits/debours/taxonomy).
 * - Identity is NOT cloned: no real Barreau/LSO number, no real CRA HST /
 *   business numbers, dedicated test name + email. A test cabinet must never
 *   carry Derisier's real regulatory identifiers (they surface on invoices).
 * - No real client / matter data is copied. The cabinet starts empty.
 * - Single admin user = the CEO login. Idempotent: re-running updates config
 *   and the admin password in place without duplicating anything.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Test cabinet identity (NOT cloned from Derisier)
// ---------------------------------------------------------------------------
const CABINET_ID = "cabinet-test-2026";
const CABINET_NOM = "Cabinet Test";
const ADMIN_EMAIL = "keassahatd+test@gmail.com";
const ADMIN_NAME = "Admin Cabinet Test"; // modifiable dans Paramètres
const ADMIN_PASSWORD = process.env.TEST_CABINET_PASSWORD || "CabinetTest2026!";

// ---------------------------------------------------------------------------
// Behavioural profile — cloned verbatim from the Derisier canonical audit
// (see scripts/rebuild-derisier-from-audit.mjs)
// ---------------------------------------------------------------------------
const AUDIT = {
  language: "en",
  plan: "cabinet",
  monthlyPrice: 149,
  totalValue: 1800,
  practice: { domaines: ["real_estate", "immigration"], monthlyVolume: "1-5", clientele: "mixed" },
  billing: {
    mode: "flat_fee",
    frequency: "bimonthly",
    paymentDelay: "other",
    methods: ["cheque", "wire", "bank_draft", "credit_card", "interac", "cash"],
  },
  trust: { enabled: true, accountCount: 1, reconciliation: "never", inspectionIssues: false },
  team: { structure: "with_assistant", userCount: 2, techComfort: "intermediate" },
  priorities: ["trust_noncompliant", "case_tracking", "slow_billing"],
  timeline: "immediately",
  province: "ON",
};

const DOSSIER_TAXONOMY = {
  numbering: { seqWidth: 5, scope: "prefix" },
  subjects: [
    { code: "RE", prefix: "RE", labelEn: "Real Estate", labelFr: "Immobilier" },
    { code: "LAO", prefix: "LAO", labelEn: "Legal Aid Ontario", labelFr: "Aide juridique Ontario" },
    { code: "IMM", prefix: "IMM", labelEn: "Immigration", labelFr: "Immigration" },
    { code: "BS", prefix: "BS", labelEn: "Brief Service", labelFr: "Service ponctuel" },
    { code: "MIS", prefix: "MIS", labelEn: "Miscellaneous", labelFr: "Divers" },
    { code: "WE", prefix: "WE", labelEn: "Wills & Estates", labelFr: "Testaments & successions" },
    { code: "FA", prefix: "FA", labelEn: "Family", labelFr: "Famille" },
    { code: "BU", prefix: "BU", labelEn: "Business", labelFr: "Affaires" },
    { code: "AS", prefix: "AS", labelEn: "Other Services", labelFr: "Autres services" },
  ],
  submatters: {
    IMM: [
      { labelEn: "Humanitarian Application", labelFr: "Demande humanitaire" },
      { labelEn: "Sponsorship", labelFr: "Parrainage" },
      { labelEn: "Work Permit", labelFr: "Permis de travail" },
      { labelEn: "Visitor Visa", labelFr: "Permis de séjour" },
      { labelEn: "Study Permit", labelFr: "Permis d'étude" },
      { labelEn: "Immigration Appeals", labelFr: "Demande d'appel" },
      { labelEn: "Express Entry", labelFr: "Entrée express" },
      { labelEn: "Provincial Nominee", labelFr: "Programmes provinciaux" },
      { labelEn: "Citizenship Application", labelFr: "Demande de citoyenneté" },
      { labelEn: "Consultation", labelFr: "Consultation" },
    ],
    RE: [
      { labelEn: "Purchase Residential", labelFr: "Achat résidentiel" },
      { labelEn: "Purchase Commercial", labelFr: "Achat commercial" },
      { labelEn: "Sale", labelFr: "Vente" },
      { labelEn: "Sale Commercial", labelFr: "Vente commerciale" },
      { labelEn: "Condo Certificate Consultation", labelFr: "Consultation certificat de copropriété" },
      { labelEn: "Refinance", labelFr: "Refinancement" },
      { labelEn: "Express Closing", labelFr: "Fermeture expresse" },
    ],
    AS: [
      { labelEn: "Notarization", labelFr: "Document notarié" },
      { labelEn: "Demand Letters", labelFr: "Mise en demeure" },
      { labelEn: "Incorporation", labelFr: "Incorporation" },
      { labelEn: "Commercial lease", labelFr: "Bail commercial" },
      { labelEn: "Employment contract", labelFr: "Contrat d'employé" },
      { labelEn: "Wills", labelFr: "Testaments" },
    ],
  },
};

const CABINET_CONFIG = {
  devise: "CAD",
  tauxInteret: 0,
  formatFacture: "YYYY-NNNN",
  envoiFactureClient: { activer: true, lienExpirationJours: 30 },
  locale: AUDIT.language,
  province: AUDIT.province,
  billingMode: AUDIT.billing.mode,
  billingFrequency: AUDIT.billing.frequency,
  paymentDelay: AUDIT.billing.paymentDelay,
  paymentMethods: AUDIT.billing.methods,
  currentOffer: { planLabel: "Cabinet", monthlyPrice: AUDIT.monthlyPrice, totalValue: AUDIT.totalValue },
  // NOTE: taxNumbers intentionally omitted — do not clone Derisier's real CRA numbers.
  dossierTaxonomy: DOSSIER_TAXONOMY,
  trustBanking: {
    enabled: AUDIT.trust.enabled,
    accountCount: AUDIT.trust.accountCount,
    regulator: "LSO Bylaw 9",
    province: AUDIT.province,
    accounts: [
      {
        label: "Cabinet Test Trust Account",
        bank: "To confirm",
        accountNumber: "TEST-TRUST-PLACEHOLDER",
        currency: "CAD",
        reconciliation: AUDIT.trust.reconciliation,
        notes: "Placeholder trust account for the test cabinet. No real funds.",
      },
    ],
  },
  isTestCabinet: true,
  onboardingAudit: {
    rebuiltAt: new Date().toISOString(),
    priorities: AUDIT.priorities,
    timeline: AUDIT.timeline,
    monthlyVolume: AUDIT.practice.monthlyVolume,
    clientele: AUDIT.practice.clientele,
  },
};

const CABINET_INTERFACE = {
  ongletsActifs: JSON.stringify(["dashboard", "gestion", "finances", "outils", "parametres"]),
  ongletsMasques: JSON.stringify(["employees"]),
  disciplines: JSON.stringify(["immobilier", "immigration"]),
  widgets: JSON.stringify([
    "trust-reconciliation-alert",
    "active-files",
    "pending-billing",
    "upcoming-deadlines",
    "recent-documents",
    "quick-actions",
  ]),
  modules: JSON.stringify({
    locale: "en",
    intake: { language: "en" },
    facturation: {
      principal: "mixte",
      periodeFact: "bimonthly",
      joursRelance: 60,
      tauxInterets: 0,
      taxes: { mode: "hst", taux: 13 },
      methodesAcceptees: AUDIT.billing.methods,
      delayedTerms: AUDIT.billing.paymentDelay,
    },
    fideicommis: {
      regle: "bylaw9-lso",
      enabled: true,
      accountCount: AUDIT.trust.accountCount,
      interets: "LFO",
      reconciliation: "mensuelle",
      currentState: AUDIT.trust.reconciliation,
      alerteRetard: 20,
      protectionCroisee: true,
      onboardingPriority: "critical",
    },
    fintrac: { actif: true, typesDossiers: ["immobilier"] },
    pipeda: { actif: true, retention: { immobilier: 10, immigration: 7 } },
    operations: {
      monthlyVolume: AUDIT.practice.monthlyVolume,
      techComfort: AUDIT.team.techComfort,
      priorities: AUDIT.priorities,
    },
    subscriptions: { targetPlan: "cabinet", targetPriceMonthly: AUDIT.monthlyPrice, trialReady: false },
  }),
  checklistsParType: JSON.stringify({
    immobilier_achat: [
      "Retainer signed",
      "Conflict check completed",
      "FINTRAC identity verified",
      "Title search ordered",
      "Requisitions on title",
      "Statement of Adjustments drafted",
      "Title insurance ordered",
      "Closing funds received in trust",
      "Client signing complete",
      "Registration complete",
      "Post-closing confirmation sent",
    ],
    immobilier_vente: [
      "Retainer signed",
      "Conflict check completed",
      "Mortgage discharge instructions received",
      "Statement of Adjustments reviewed",
      "Client signing complete",
      "Closing funds flow confirmed",
      "Undertakings satisfied",
      "Post-closing reporting sent",
    ],
    immobilier_refinancement: [
      "Retainer signed",
      "Conflict check completed",
      "Lender instructions received",
      "Title search updated",
      "FINTRAC identity verified",
      "Signing package complete",
      "Funds disbursed from trust",
      "Registration complete",
    ],
    immigration_ee: [
      "Consultation and retainer signed",
      "CRS eligibility assessment complete",
      "ITA tracked with 60-day deadline",
      "Express Entry profile and NOC validated",
      "Background declaration complete",
      "Supporting documents gathered",
      "Medical exam tracked",
      "Police certificates tracked",
      "IRCC application submitted",
      "Biometrics tracked",
      "COPR received",
      "Landing and closure complete",
    ],
    immigration_parrainage: [
      "Consultation and retainer signed",
      "Conflict check complete",
      "Family documents gathered",
      "IMM forms prepared",
      "AIP tracked",
      "Medical and biometrics tracked",
      "COPR received",
      "Landing complete",
    ],
    immigration_travail: [
      "Consultation and retainer signed",
      "Eligibility reviewed",
      "Employer documents gathered",
      "Work permit package prepared",
      "IRCC submission complete",
      "Biometrics tracked",
      "Decision letter saved",
    ],
  }),
  modeFacturation: JSON.stringify({ principal: "mixte", cadence: "bimonthly", tauxHoraire: true }),
  conformite: JSON.stringify({
    lso_ontario: true,
    bylaw9: true,
    fintrac: true,
    pipeda: true,
    trust_reconciliation_required: true,
  }),
};

const FORFAIT_SERVICES = [
  { code: "IMMO-ACHAT", nom: "Real estate purchase", montant: 1500, categorie: "immobilier", sousType: "achat" },
  { code: "IMMO-VENTE", nom: "Real estate sale", montant: 1200, categorie: "immobilier", sousType: "vente" },
  { code: "IMMO-CONDO", nom: "Condo transaction", montant: 1800, categorie: "immobilier", sousType: "condo" },
  { code: "IMMO-REFI", nom: "Mortgage refinance", montant: 900, categorie: "immobilier", sousType: "hypotheque" },
  { code: "IMM-EE", nom: "Express Entry (Permanent Residence)", montant: 2500, categorie: "immigration", sousType: "ee" },
  { code: "IMM-PARR", nom: "Family sponsorship", montant: 2000, categorie: "immigration", sousType: "parrainage" },
  { code: "IMM-TRAV", nom: "Work permit", montant: 1800, categorie: "immigration", sousType: "travail" },
  { code: "IMM-CONSULT", nom: "Initial consultation", montant: 250, categorie: "immigration", sousType: null },
];

const DEBOURS_TYPES = [
  { nom: "IRCC Application Fee — Permanent Residence", categorie: "Government Fee", coutDefaut: 1365, gouvernementRef: "IRCC" },
  { nom: "IRCC Biometrics Fee", categorie: "Government Fee", coutDefaut: 85, gouvernementRef: "IRCC" },
  { nom: "IRCC Sponsorship Fee", categorie: "Government Fee", coutDefaut: 1080, gouvernementRef: "IRCC" },
  { nom: "IRCC Work Permit Fee", categorie: "Government Fee", coutDefaut: 155, gouvernementRef: "IRCC" },
  { nom: "IRCC Right of Permanent Residence Fee", categorie: "Government Fee", coutDefaut: 515, gouvernementRef: "IRCC" },
  { nom: "Title Search", categorie: "Real Estate Disbursement", coutDefaut: 250, gouvernementRef: null },
  { nom: "Title Insurance", categorie: "Real Estate Disbursement", coutDefaut: 300, gouvernementRef: null },
  { nom: "Registration Fee", categorie: "Real Estate Disbursement", coutDefaut: 75, gouvernementRef: "LRO" },
  { nom: "Courier / Process Fees", categorie: "Real Estate Disbursement", coutDefaut: 50, gouvernementRef: null },
];

const DEBOURS_TEMPLATES = [
  { dossierType: "immigration_ee", nom: "IRCC Application Fee — Permanent Residence", isRequired: true },
  { dossierType: "immigration_ee", nom: "IRCC Biometrics Fee", isRequired: true },
  { dossierType: "immigration_ee", nom: "IRCC Right of Permanent Residence Fee", isRequired: false },
  { dossierType: "immigration_parrainage", nom: "IRCC Sponsorship Fee", isRequired: true },
  { dossierType: "immigration_parrainage", nom: "IRCC Biometrics Fee", isRequired: true },
  { dossierType: "immigration_travail", nom: "IRCC Work Permit Fee", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Title Search", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Title Insurance", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Registration Fee", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Courier / Process Fees", isRequired: false },
  { dossierType: "immobilier_vente", nom: "Title Search", isRequired: true },
  { dossierType: "immobilier_vente", nom: "Courier / Process Fees", isRequired: false },
  { dossierType: "immobilier_condo", nom: "Title Search", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Title Insurance", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Registration Fee", isRequired: true },
  { dossierType: "immobilier_hypotheque", nom: "Title Search", isRequired: true },
  { dossierType: "immobilier_hypotheque", nom: "Registration Fee", isRequired: true },
];

async function ensureCabinet() {
  const existing = await prisma.cabinet.findFirst({
    where: { OR: [{ id: CABINET_ID }, { nom: { equals: CABINET_NOM, mode: "insensitive" } }] },
  });

  const data = {
    nom: CABINET_NOM,
    email: ADMIN_EMAIL,
    adresse: null,
    telephone: null,
    barreauNumero: null, // do not clone Derisier's real LSO number
    plan: AUDIT.plan,
    config: JSON.stringify(CABINET_CONFIG),
    // Dev bypass of the subscription paywall so the test cabinet can reach the
    // full interface without a real Stripe subscription. active status is what
    // lib/services/subscription-state.ts treats as "active".
    stripeSubscriptionStatus: "active",
    stripeCurrentPeriodEnd: new Date("2099-12-31T00:00:00Z"),
    stripeCancelAtPeriodEnd: false,
  };

  if (existing) {
    const cabinet = await prisma.cabinet.update({ where: { id: existing.id }, data });
    return { cabinet, created: false };
  }
  const cabinet = await prisma.cabinet.create({ data: { id: CABINET_ID, ...data } });
  return { cabinet, created: true };
}

async function ensureCabinetInterface(cabinetId) {
  await prisma.cabinetInterface.upsert({
    where: { cabinetId },
    create: { cabinetId, ...CABINET_INTERFACE },
    update: CABINET_INTERFACE,
  });
}

async function ensureAdminUser(cabinetId) {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existing = await prisma.user.findFirst({
    where: { cabinetId, email: { equals: ADMIN_EMAIL, mode: "insensitive" } },
  });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { email: ADMIN_EMAIL.toLowerCase(), passwordHash, nom: ADMIN_NAME, role: "admin_cabinet", isBillable: true },
    });
  }
  return prisma.user.create({
    data: {
      cabinetId,
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      nom: ADMIN_NAME,
      role: "admin_cabinet",
      isBillable: true,
    },
  });
}

async function upsertForfaitServices(cabinetId) {
  for (let index = 0; index < FORFAIT_SERVICES.length; index += 1) {
    const item = FORFAIT_SERVICES[index];
    await prisma.forfaitService.upsert({
      where: { cabinetId_code: { cabinetId, code: item.code } },
      create: {
        cabinetId,
        code: item.code,
        nom: item.nom,
        montant: item.montant,
        categorie: item.categorie,
        sousType: item.sousType,
        taxable: true,
        actif: true,
        sortOrder: index,
      },
      update: {
        nom: item.nom,
        montant: item.montant,
        categorie: item.categorie,
        sousType: item.sousType,
        taxable: true,
        actif: true,
        sortOrder: index,
      },
    });
  }
}

async function upsertDebours(cabinetId) {
  const typeIds = {};
  for (const item of DEBOURS_TYPES) {
    const existing = await prisma.deboursType.findFirst({ where: { cabinetId, nom: item.nom } });
    const payload = {
      cabinetId,
      nom: item.nom,
      categorie: item.categorie,
      description: item.gouvernementRef ? `${item.gouvernementRef} fee — non-taxable` : "Disbursement — non-taxable",
      taxable: false,
      isGovernment: Boolean(item.gouvernementRef),
      gouvernementRef: item.gouvernementRef,
      coutDefaut: item.coutDefaut,
      actif: true,
    };
    const row = existing
      ? await prisma.deboursType.update({ where: { id: existing.id }, data: payload })
      : await prisma.deboursType.create({ data: payload });
    typeIds[item.nom] = row.id;
  }

  for (const template of DEBOURS_TEMPLATES) {
    const deboursTypeId = typeIds[template.nom];
    if (!deboursTypeId) continue;
    await prisma.deboursTemplate.upsert({
      where: { cabinetId_dossierType_deboursTypeId: { cabinetId, dossierType: template.dossierType, deboursTypeId } },
      create: { cabinetId, dossierType: template.dossierType, deboursTypeId, isRequired: template.isRequired },
      update: { isRequired: template.isRequired },
    });
  }
}

async function main() {
  console.log("Seeding TEST cabinet (Derisier profile clone)...\n");

  const { cabinet, created } = await ensureCabinet();
  console.log(`${created ? "Created" : "Updated"} cabinet: ${cabinet.nom} (${cabinet.id})`);

  await ensureCabinetInterface(cabinet.id);
  console.log("Ensured CabinetInterface");

  const admin = await ensureAdminUser(cabinet.id);
  console.log(`Ensured admin user: ${admin.email}`);

  await upsertForfaitServices(cabinet.id);
  console.log("Upserted forfait services");

  await upsertDebours(cabinet.id);
  console.log("Upserted debours types and templates");

  const [forfaits, deboursTypes, deboursTemplates, clients, dossiers] = await Promise.all([
    prisma.forfaitService.count({ where: { cabinetId: cabinet.id } }),
    prisma.deboursType.count({ where: { cabinetId: cabinet.id } }),
    prisma.deboursTemplate.count({ where: { cabinetId: cabinet.id } }),
    prisma.client.count({ where: { cabinetId: cabinet.id } }),
    prisma.dossier.count({ where: { cabinetId: cabinet.id } }),
  ]);

  console.log("\n============================================================");
  console.log("Test cabinet ready (Derisier configuration profile)");
  console.log("============================================================");
  console.log(`Cabinet:          ${CABINET_NOM}`);
  console.log(`Plan:             ${AUDIT.plan}`);
  console.log(`Language:         ${AUDIT.language} / Province ${AUDIT.province}`);
  console.log(`Forfaits:         ${forfaits}`);
  console.log(`Debours types:    ${deboursTypes}`);
  console.log(`Debours templates:${deboursTemplates}`);
  console.log(`Clients:          ${clients} (empty test cabinet)`);
  console.log(`Dossiers:         ${dossiers} (empty test cabinet)`);
  console.log("\nCredentials (page /connexion):");
  console.log(`  Nom du cabinet: ${CABINET_NOM}`);
  console.log(`  Email:          ${ADMIN_EMAIL}`);
  console.log(`  Mot de passe:   ${ADMIN_PASSWORD}`);
  console.log("");
}

main()
  .catch((error) => {
    console.error("Test cabinet seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
