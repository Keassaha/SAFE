/**
 * Seed du Workspace SAFE Inc. + premiers Leads CRM.
 *
 * Crée :
 * - 1 Workspace singleton (mode PRECHAUFFAGE jusqu'au 2026-09-04)
 * - 1 Lead converti rattaché au Cabinet existant (votre cliente actuelle)
 * - 5 Leads fictifs à différents stages pour visualiser le pipeline
 * - Quelques LeadContacts + Activities par Lead
 *
 * Usage :
 *   node prisma/seeds/crm-workspace-and-leads.mjs
 *
 * Idempotent : peut être rejoué. Recherche par slug avant création.
 *
 * Pour personnaliser le Lead converti (lier à un Cabinet précis) :
 *   CLIENT_CABINET_NAME="Derisier Law" node prisma/seeds/crm-workspace-and-leads.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- Config ---
const PHASE_PRECHAUFFAGE_DEBUT = new Date("2026-06-04T00:00:00Z");
const PHASE_PRECHAUFFAGE_FIN = new Date("2026-09-04T00:00:00Z");
const CLIENT_CABINET_NAME = process.env.CLIENT_CABINET_NAME || "Derisier Law";

// --- Helpers ---
function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function upsertWorkspace() {
  let workspace = await prisma.workspace.findFirst({
    where: { nom: "SAFE Inc." },
  });

  if (workspace) {
    workspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        workMode: "PRECHAUFFAGE",
        phaseDateDebut: PHASE_PRECHAUFFAGE_DEBUT,
        phaseDateFin: PHASE_PRECHAUFFAGE_FIN,
        cibleAudienceLinkedIn: 1000,
        cibleConversationsQualifiees: 20,
      },
    });
    console.log(`     Workspace mis à jour (id: ${workspace.id})`);
  } else {
    workspace = await prisma.workspace.create({
      data: {
        nom: "SAFE Inc.",
        workMode: "PRECHAUFFAGE",
        phaseDateDebut: PHASE_PRECHAUFFAGE_DEBUT,
        phaseDateFin: PHASE_PRECHAUFFAGE_FIN,
        cibleAudienceLinkedIn: 1000,
        cibleConversationsQualifiees: 20,
      },
    });
    console.log(`     ✅ Workspace créé (id: ${workspace.id})`);
  }

  return workspace;
}

async function upsertConvertedLead(workspaceId) {
  // Cherche le Cabinet client existant
  const cabinet = await prisma.cabinet.findFirst({
    where: { nom: CLIENT_CABINET_NAME },
  });

  if (!cabinet) {
    console.warn(
      `     ⚠️  Cabinet '${CLIENT_CABINET_NAME}' introuvable, skip du Lead converti`,
    );
    console.warn(
      "       Passe CLIENT_CABINET_NAME=<nom exact> pour cibler un autre cabinet",
    );
    return null;
  }

  const slug = slugify(cabinet.nom);

  const existing = await prisma.lead.findUnique({ where: { slug } });
  if (existing) {
    console.log(`     Lead converti existe déjà (slug: ${slug})`);
    return existing;
  }

  const lead = await prisma.lead.create({
    data: {
      raisonSociale: cabinet.nom,
      slug,
      province: "ON",
      ville: cabinet.adresse?.split(",")?.[1]?.trim() || null,
      langue: "EN",
      siteWeb: null,

      tailleCabinet: "SOLO",
      domainesPratique: ["immobilier", "immigration"],
      modeFacturation: "FORFAIT",
      aTrustAccounting: true,
      logicielActuel: "Excel",
      nbAvocatsEstime: 1,
      nbAdjointsEstime: 1,

      sourceLead: "REFERRAL",
      stageLead: "LIVE",
      statutLead: "ACTIVE_CUSTOMER",
      modeleAdoption: "DUAL",

      score: 95,
      scoreFirmographique: 35,
      scoreEngagement: 40,
      scoreEnrichissement: 20,

      workspaceId,
      tags: ["client_actuel", "cliente_pilote", "founder_50"],
      notesPrivees: "Première cliente SAFE. Pilote dog food.",

      convertedAt: new Date("2026-05-01T00:00:00Z"),
      cabinetId: cabinet.id,
    },
  });

  console.log(`     ✅ Lead converti créé : ${lead.raisonSociale}`);
  return lead;
}

async function upsertSampleLead(workspaceId, sample) {
  const existing = await prisma.lead.findUnique({
    where: { slug: sample.slug },
  });
  if (existing) {
    console.log(`     Lead '${sample.raisonSociale}' existe déjà (skip)`);
    return existing;
  }

  const lead = await prisma.lead.create({
    data: {
      ...sample,
      workspaceId,
    },
  });
  console.log(`     ✅ Lead créé : ${lead.raisonSociale} (${lead.stageLead})`);
  return lead;
}

// --- 5 Leads fictifs pour visualiser le pipeline ---
const SAMPLE_LEADS = [
  {
    raisonSociale: "Cabinet Tremblay-Lapointe",
    slug: "tremblay-lapointe",
    province: "QC",
    ville: "Montréal",
    langue: "FR",
    tailleCabinet: "DEUX_CINQ",
    domainesPratique: ["droit_famille", "litige_civil"],
    modeFacturation: "MIXTE",
    aTrustAccounting: true,
    logicielActuel: "Juris Concept",
    nbAvocatsEstime: 3,
    sourceLead: "LINKEDIN_DM_WARM",
    stageLead: "CONSULTATION_PHASE2",
    statutLead: "QUALIFIED_AUDIT",
    modeleAdoption: "BOTTOM_UP",
    score: 78,
    scoreFirmographique: 32,
    scoreEngagement: 28,
    scoreEnrichissement: 18,
    tags: ["candidat_founder_50", "test_pilote_possible"],
  },
  {
    raisonSociale: "Étude juridique Bergeron",
    slug: "etude-bergeron",
    province: "QC",
    ville: "Québec",
    langue: "FR",
    tailleCabinet: "SOLO",
    domainesPratique: ["droit_famille"],
    modeFacturation: "FORFAIT",
    aTrustAccounting: true,
    logicielActuel: "aucun",
    nbAvocatsEstime: 1,
    sourceLead: "SEO_ORGANIC",
    stageLead: "AUDIT_COMPLETED",
    statutLead: "QUALIFIED_AUDIT",
    modeleAdoption: "TOP_DOWN",
    score: 65,
    scoreFirmographique: 30,
    scoreEngagement: 20,
    scoreEnrichissement: 15,
    tags: ["solo_famille"],
  },
  {
    raisonSociale: "Cabinet Gagnon Avocats",
    slug: "gagnon-avocats",
    province: "QC",
    ville: "Sherbrooke",
    langue: "FR",
    tailleCabinet: "SIX_DIX",
    domainesPratique: ["droit_affaires", "litige_civil"],
    modeFacturation: "HORAIRE",
    aTrustAccounting: false,
    logicielActuel: "Clio",
    nbAvocatsEstime: 7,
    sourceLead: "LINKEDIN_POST",
    stageLead: "CONVERSING",
    statutLead: "NURTURE_ONLY",
    modeleAdoption: "BOTTOM_UP",
    score: 52,
    scoreFirmographique: 25,
    scoreEngagement: 17,
    scoreEnrichissement: 10,
    tags: ["clio_user"],
  },
  {
    raisonSociale: "Boutique Immigration Dubé",
    slug: "boutique-immigration-dube",
    province: "ON",
    ville: "Ottawa",
    langue: "BILINGUE",
    tailleCabinet: "DEUX_CINQ",
    domainesPratique: ["immigration"],
    modeFacturation: "FORFAIT",
    aTrustAccounting: true,
    logicielActuel: "Excel",
    nbAvocatsEstime: 2,
    sourceLead: "LINKEDIN_DM_COLD",
    stageLead: "LEAD_MAGNET_SENT",
    statutLead: "NURTURE_ONLY",
    modeleAdoption: "BOTTOM_UP",
    score: 45,
    scoreFirmographique: 20,
    scoreEngagement: 15,
    scoreEnrichissement: 10,
    tags: ["immigration_on"],
  },
  {
    raisonSociale: "Cabinet Roy & Filles",
    slug: "roy-et-filles",
    province: "QC",
    ville: "Trois-Rivières",
    langue: "FR",
    tailleCabinet: "ONZE_VINGT",
    domainesPratique: ["droit_affaires", "fiscal"],
    modeFacturation: "HORAIRE",
    aTrustAccounting: true,
    logicielActuel: "ProLaw",
    nbAvocatsEstime: 14,
    sourceLead: "REFERRAL",
    stageLead: "AWARENESS",
    statutLead: "NURTURE_ONLY",
    score: 28,
    scoreFirmographique: 18,
    scoreEngagement: 5,
    scoreEnrichissement: 5,
    tags: ["referral_cliente_actuelle"],
  },
];

// --- Main ---
async function main() {
  console.log("\n🎯 Seed CRM : Workspace + premiers Leads");
  console.log("─".repeat(60));

  console.log("\n[1/3] Workspace singleton SAFE Inc...");
  const workspace = await upsertWorkspace();

  console.log("\n[2/3] Lead converti (cliente actuelle)...");
  const convertedLead = await upsertConvertedLead(workspace.id);

  console.log("\n[3/3] Leads fictifs (5) pour visualiser le pipeline...");
  for (const sample of SAMPLE_LEADS) {
    await upsertSampleLead(workspace.id, sample);
  }

  // Récap
  const counts = {
    workspace: await prisma.workspace.count(),
    lead: await prisma.lead.count(),
    leadContact: await prisma.leadContact.count(),
    activity: await prisma.activity.count(),
  };

  console.log("\n" + "─".repeat(60));
  console.log("Récapitulatif");
  console.log("─".repeat(60));
  console.log(`Workspaces : ${counts.workspace}`);
  console.log(`Leads      : ${counts.lead}`);
  console.log(`Contacts   : ${counts.leadContact}`);
  console.log(`Activities : ${counts.activity}`);
  console.log("─".repeat(60));

  console.log("\n✅ Seed CRM terminé.");
  if (convertedLead) {
    console.log(
      `   Lead pilote dog food : ${convertedLead.raisonSociale} (LIVE)`,
    );
  }
  console.log(`   Pipeline visualisable : 5 Leads à différents stages`);
  console.log(`   Phase Workspace : PRECHAUFFAGE (J+1 sur 90)\n`);
}

main()
  .catch((err) => {
    console.error("\n❌ Erreur seed CRM :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
