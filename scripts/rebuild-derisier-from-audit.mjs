/**
 * Rebuild Derisier Law from the canonical onboarding audit snapshot.
 *
 * Usage:
 *   node scripts/rebuild-derisier-from-audit.mjs
 *
 * Optional env overrides:
 *   DERISIER_ADMIN_PASSWORD=...
 *   DERISIER_ASSISTANT_PASSWORD=...
 *
 * Doctrine:
 * - Rebuild in place from the existing Derisier cabinet whenever possible.
 * - Do not hard-delete existing client/matter/billing data.
 * - Normalize cabinet + interface + pricing + disbursement templates to the audit.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const AUDIT = {
  language: "en",
  plan: "cabinet",
  monthlyPrice: 149,
  totalValue: 1800,
  cabinet: {
    nom: "Derisier Law",
    principalLawyer: "Marjorie-Alexandra Derisier",
    email: "info@derisierlaw.com",
    barreauNumero: "56246k",
    province: "ON",
    adresse: null,
    telephone: null,
    website: null,
  },
  practice: {
    domaines: ["real_estate", "immigration"],
    monthlyVolume: "1-5",
    clientele: "mixed",
  },
  billing: {
    mode: "flat_fee",
    frequency: "bimonthly",
    paymentDelay: "other",
    methods: ["cheque", "wire", "bank_draft", "credit_card", "interac", "cash"],
  },
  trust: {
    enabled: true,
    accountCount: 1,
    reconciliation: "never",
    inspectionIssues: false,
  },
  team: {
    structure: "with_assistant",
    userCount: 2,
    techComfort: "intermediate",
  },
  priorities: ["trust_noncompliant", "case_tracking", "slow_billing"],
  timeline: "immediately",
};

const DERISIER_IDS = [
  "derisier-law-on-2026",
];

const ADMIN_PASSWORD = process.env.DERISIER_ADMIN_PASSWORD || "DerisierLaw2026!";
const ASSISTANT_PASSWORD = process.env.DERISIER_ASSISTANT_PASSWORD || "Assistant2026!";

const CABINET_CONFIG = {
  devise: "CAD",
  tauxInteret: 0,
  formatFacture: "YYYY-NNNN",
  envoiFactureClient: {
    activer: true,
    lienExpirationJours: 30,
  },
  locale: AUDIT.language,
  province: AUDIT.cabinet.province,
  billingMode: AUDIT.billing.mode,
  billingFrequency: AUDIT.billing.frequency,
  paymentDelay: AUDIT.billing.paymentDelay,
  paymentMethods: AUDIT.billing.methods,
  currentOffer: {
    planLabel: "Cabinet",
    monthlyPrice: AUDIT.monthlyPrice,
    totalValue: AUDIT.totalValue,
  },
  trustBanking: {
    enabled: AUDIT.trust.enabled,
    accountCount: AUDIT.trust.accountCount,
    regulator: "LSO Bylaw 9",
    province: AUDIT.cabinet.province,
    accounts: [
      {
        label: "Derisier Law Trust Account",
        bank: "To confirm",
        accountNumber: "TO-CONFIRM-DERISIER-TRUST",
        currency: "CAD",
        reconciliation: AUDIT.trust.reconciliation,
        notes:
          "Initial trust account placeholder created from onboarding audit. Bank, branch and account number to be confirmed with the lawyer.",
      },
    ],
  },
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
      principal: "forfait",
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
    fintrac: {
      actif: true,
      typesDossiers: ["immobilier"],
    },
    pipeda: {
      actif: true,
      retention: { immobilier: 10, immigration: 7 },
    },
    operations: {
      monthlyVolume: AUDIT.practice.monthlyVolume,
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
  modeFacturation: JSON.stringify({
    principal: "forfait",
    cadence: "bimonthly",
    tauxHoraire: false,
  }),
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

async function findDerisierCabinet() {
  const cabinet = await prisma.cabinet.findFirst({
    where: {
      OR: [
        { id: { in: DERISIER_IDS } },
        { nom: { contains: "Derisier", mode: "insensitive" } },
        { email: { equals: AUDIT.cabinet.email, mode: "insensitive" } },
        {
          users: {
            some: {
              email: { equals: AUDIT.cabinet.email, mode: "insensitive" },
            },
          },
        },
      ],
    },
    include: {
      users: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return cabinet;
}

async function ensureCabinet() {
  const existing = await findDerisierCabinet();
  const data = {
    nom: AUDIT.cabinet.nom,
    adresse: AUDIT.cabinet.adresse,
    telephone: AUDIT.cabinet.telephone,
    email: AUDIT.cabinet.email,
    barreauNumero: AUDIT.cabinet.barreauNumero,
    plan: AUDIT.plan,
    config: JSON.stringify(CABINET_CONFIG),
  };

  if (existing) {
    const cabinet = await prisma.cabinet.update({
      where: { id: existing.id },
      data,
      include: { users: { orderBy: { createdAt: "asc" } } },
    });
    return { cabinet, created: false };
  }

  const cabinet = await prisma.cabinet.create({
    data: {
      id: DERISIER_IDS[0],
      ...data,
    },
    include: { users: { orderBy: { createdAt: "asc" } } },
  });
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
    where: {
      cabinetId,
      OR: [
        { email: { equals: AUDIT.cabinet.email, mode: "insensitive" } },
        { role: "admin_cabinet" },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email: AUDIT.cabinet.email.toLowerCase(),
        passwordHash,
        nom: `Me ${AUDIT.cabinet.principalLawyer}`,
        role: "admin_cabinet",
        isBillable: true,
      },
    });
  }

  return prisma.user.create({
    data: {
      cabinetId,
      email: AUDIT.cabinet.email.toLowerCase(),
      passwordHash,
      nom: `Me ${AUDIT.cabinet.principalLawyer}`,
      role: "admin_cabinet",
      isBillable: true,
    },
  });
}

async function ensureAssistantUser(cabinetId) {
  const passwordHash = await bcrypt.hash(ASSISTANT_PASSWORD, 12);
  const existing = await prisma.user.findFirst({
    where: {
      cabinetId,
      role: "assistante",
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        role: "assistante",
        isBillable: false,
      },
    });
  }

  return prisma.user.create({
    data: {
      cabinetId,
      email: "assistant@derisierlaw.com",
      passwordHash,
      nom: "Assistant Derisier",
      role: "assistante",
      isBillable: false,
    },
  });
}

/**
 * Ensures the cabinet-level trust banking metadata is in place for Derisier.
 *
 * Schema note: in this codebase, `TrustAccount` is a per-client / per-matter
 * ledger row, not a bank-level account. There is no "name / bank / account
 * number" column on TrustAccount. The cabinet-level "1 fiduciary bank account"
 * declared in the audit is therefore stored as structured metadata inside
 * `Cabinet.config.trustBanking` (already written by ensureCabinet via
 * CABINET_CONFIG), and per-client ledgers are created lazily when the first
 * trust funds arrive on a matter.
 *
 * This function is idempotent: it re-reads the cabinet config to confirm the
 * trust banking block is present and returns a small summary used by
 * logSummary. It does NOT create a TrustAccount row (no client to attach
 * to) and never writes a TrustTransaction (the placeholder must stay at 0
 * with no movement until the lawyer confirms bank details).
 */
async function ensureTrustAccount(cabinetId) {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });

  let trustBanking = null;
  try {
    const parsed = cabinet?.config ? JSON.parse(cabinet.config) : null;
    trustBanking = parsed?.trustBanking ?? null;
  } catch {
    trustBanking = null;
  }

  const ledgerRowCount = await prisma.trustAccount.count({ where: { cabinetId } });

  return {
    configured: Boolean(trustBanking?.enabled),
    accountCount: trustBanking?.accountCount ?? 0,
    primaryAccountLabel: trustBanking?.accounts?.[0]?.label ?? null,
    primaryAccountBank: trustBanking?.accounts?.[0]?.bank ?? null,
    ledgerRowCount,
  };
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
    const existing = await prisma.deboursType.findFirst({
      where: { cabinetId, nom: item.nom },
    });

    const payload = {
      cabinetId,
      nom: item.nom,
      categorie: item.categorie,
      description: item.gouvernementRef
        ? `${item.gouvernementRef} fee — non-taxable`
        : "Disbursement — non-taxable",
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
      where: {
        cabinetId_dossierType_deboursTypeId: {
          cabinetId,
          dossierType: template.dossierType,
          deboursTypeId,
        },
      },
      create: {
        cabinetId,
        dossierType: template.dossierType,
        deboursTypeId,
        isRequired: template.isRequired,
      },
      update: {
        isRequired: template.isRequired,
      },
    });
  }
}

async function logSummary(cabinetId, trust) {
  const [users, forfaits, deboursTypes, deboursTemplates, dossiers] = await Promise.all([
    prisma.user.findMany({ where: { cabinetId }, orderBy: { createdAt: "asc" } }),
    prisma.forfaitService.count({ where: { cabinetId } }),
    prisma.deboursType.count({ where: { cabinetId } }),
    prisma.deboursTemplate.count({ where: { cabinetId } }),
    prisma.dossier.count({ where: { cabinetId } }),
  ]);

  console.log("\n============================================================");
  console.log("Derisier rebuilt from canonical onboarding audit");
  console.log("============================================================");
  console.log(`Cabinet:         ${AUDIT.cabinet.nom}`);
  console.log(`Plan:            ${AUDIT.plan}`);
  console.log(`Target price:    ${AUDIT.monthlyPrice}$/mois`);
  console.log(`Language:        ${AUDIT.language}`);
  console.log(`Practices:       ${AUDIT.practice.domaines.join(", ")}`);
  console.log(`Billing:         ${AUDIT.billing.mode} / ${AUDIT.billing.frequency}`);
  console.log(
    `Trust account:   ${
      trust.configured
        ? `yes (${trust.accountCount} row(s))` +
          (trust.primaryAccountLabel ? ` — ${trust.primaryAccountLabel}` : "") +
          (trust.primaryAccountBank ? ` @ ${trust.primaryAccountBank}` : "")
        : "no"
    }`
  );
  console.log(`Trust ledgers:   ${trust.ledgerRowCount} per-client/per-matter ledger row(s)`);
  console.log(`Dossiers:        ${dossiers}`);
  console.log(`Forfaits:        ${forfaits}`);
  console.log(`Debours types:   ${deboursTypes}`);
  console.log(`Debours templates:${deboursTemplates}`);
  console.log("\nUsers:");
  users.forEach((user) => {
    console.log(`- ${user.nom} <${user.email}> [${user.role}]`);
  });
  console.log("\nCredentials:");
  console.log(`- Admin:     ${AUDIT.cabinet.email} / ${ADMIN_PASSWORD}`);
  const assistant = users.find((user) => user.role === "assistante");
  if (assistant) {
    console.log(`- Assistant: ${assistant.email} / ${ASSISTANT_PASSWORD}`);
  }
  console.log("");
}

async function main() {
  console.log("Rebuilding Derisier Law from canonical audit...\n");

  const { cabinet, created } = await ensureCabinet();
  console.log(`${created ? "Created" : "Updated"} cabinet: ${cabinet.nom} (${cabinet.id})`);

  await ensureCabinetInterface(cabinet.id);
  console.log("Updated CabinetInterface");

  const admin = await ensureAdminUser(cabinet.id);
  console.log(`Ensured admin user: ${admin.email}`);

  const assistant = await ensureAssistantUser(cabinet.id);
  console.log(`Ensured assistant user: ${assistant.email}`);

  const trust = await ensureTrustAccount(cabinet.id);
  console.log(
    `Ensured trust banking metadata: ${trust.configured ? "yes" : "no"}` +
      (trust.primaryAccountLabel ? ` (${trust.primaryAccountLabel})` : "")
  );

  await upsertForfaitServices(cabinet.id);
  console.log("Upserted forfait services");

  await upsertDebours(cabinet.id);
  console.log("Upserted debours types and templates");

  await logSummary(cabinet.id, trust);
}

main()
  .catch((error) => {
    console.error("Derisier rebuild failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
