/**
 * Cabinet Derisier en LOCAL, pour essayer la rémunération d'Aaliyah.
 * Doctrine : docs/product/SPEC_REMUNERATION_AALIYAH.md
 *
 * Aucune donnée personnelle copiée de la production : pas de vrai client, pas de
 * vrai dossier, pas de vraie adresse. Seuls la taxonomie des sujets (déjà dans le
 * dépôt) et les prénoms des deux utilisatrices sont repris. Les dossiers sont des
 * dossiers d'essai, nommés comme tels, et l'entente porte des montants d'exemple.
 *
 * Refuse de tourner ailleurs que sur une base locale.
 *
 *   npx tsx scripts/creer-cabinet-derisier-local.ts
 *
 * Identifiants d'essai (locaux seulement) :
 *   Me Derisier  derisier@derisier.test  / EssaiDerisier2026
 *   Aaliyah      aaliyah@derisier.test   / EssaiAaliyah2026
 */
import { PrismaClient, type DossierType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DERISIER_DOSSIER_TAXONOMY, subjectCodeToDossierType } from "../lib/dossiers/taxonomy";

const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
  console.error("Refus : DATABASE_URL ne pointe pas vers une base locale.");
  process.exit(1);
}

const prisma = new PrismaClient();

const CABINET_ID = "derisier-local";
const AVOCATE = { id: "derisier-local-avocate", email: "derisier@derisier.test", password: "EssaiDerisier2026" };
const ADJOINTE = { id: "derisier-local-aaliyah", email: "aaliyah@derisier.test", password: "EssaiAaliyah2026" };

const DOSSIERS: Array<{ code: string; seq: number; intitule: string; statut?: "actif" | "cloture" }> = [
  { code: "IMM", seq: 1, intitule: "Dossier d'essai · permis d'études" },
  { code: "IMM", seq: 2, intitule: "Dossier d'essai · parrainage", statut: "cloture" },
  { code: "IMM", seq: 3, intitule: "Dossier d'essai · permis de travail" },
  { code: "FA", seq: 1, intitule: "Dossier d'essai · garde" },
  { code: "RE", seq: 1, intitule: "Dossier d'essai · achat résidentiel" },
  { code: "BU", seq: 1, intitule: "Dossier d'essai · incorporation" },
  { code: "WE", seq: 1, intitule: "Dossier d'essai · testament" },
  { code: "LAO", seq: 1, intitule: "Dossier d'essai · aide juridique famille" },
  { code: "LAO", seq: 2, intitule: "Dossier d'essai · aide juridique immigration" },
];

async function main() {
  const cabinet = await prisma.cabinet.upsert({
    where: { id: CABINET_ID },
    create: {
      id: CABINET_ID,
      nom: "Derisier Law (essai local)",
      adresse: "Ontario, Canada",
      email: AVOCATE.email,
      plan: "professionnel",
      config: JSON.stringify({ dossierTaxonomy: DERISIER_DOSSIER_TAXONOMY }),
    },
    update: { config: JSON.stringify({ dossierTaxonomy: DERISIER_DOSSIER_TAXONOMY }) },
  });

  const avocate = await prisma.user.upsert({
    where: { id: AVOCATE.id },
    create: {
      id: AVOCATE.id,
      cabinetId: cabinet.id,
      email: AVOCATE.email,
      passwordHash: await bcrypt.hash(AVOCATE.password, 12),
      nom: "Me Derisier",
      role: "admin_cabinet",
      isBillable: true,
    },
    update: { passwordHash: await bcrypt.hash(AVOCATE.password, 12) },
  });

  const adjointe = await prisma.user.upsert({
    where: { id: ADJOINTE.id },
    create: {
      id: ADJOINTE.id,
      cabinetId: cabinet.id,
      email: ADJOINTE.email,
      passwordHash: await bcrypt.hash(ADJOINTE.password, 12),
      nom: "Aaliyah",
      role: "assistante",
      isBillable: false,
    },
    update: { passwordHash: await bcrypt.hash(ADJOINTE.password, 12) },
  });

  const employee =
    (await prisma.employee.findFirst({ where: { cabinetId: cabinet.id, userId: adjointe.id } })) ??
    (await prisma.employee.create({
      data: {
        cabinetId: cabinet.id,
        userId: adjointe.id,
        firstName: "Aaliyah",
        lastName: "",
        fullName: "Aaliyah",
        email: ADJOINTE.email,
        hireDate: new Date("2026-01-05T12:00:00Z"),
        role: "LEGAL_ASSISTANT",
        jobTitle: "Adjointe juridique",
        employmentType: "employee",
        supervisorId: null,
      },
    }));

  const client =
    (await prisma.client.findFirst({ where: { cabinetId: cabinet.id, raisonSociale: "Client d'essai" } })) ??
    (await prisma.client.create({
      data: { cabinetId: cabinet.id, typeClient: "personne_morale", raisonSociale: "Client d'essai" },
    }));

  for (const d of DOSSIERS) {
    const numero = `2026-${d.code}-${String(d.seq).padStart(5, "0")}`;
    const exists = await prisma.dossier.findFirst({ where: { cabinetId: cabinet.id, numeroDossier: numero } });
    if (exists) continue;
    await prisma.dossier.create({
      data: {
        cabinetId: cabinet.id,
        clientId: client.id,
        avocatResponsableId: avocate.id,
        numeroDossier: numero,
        matterCode: d.code,
        type: subjectCodeToDossierType(d.code) as DossierType,
        intitule: d.intitule,
        statut: d.statut ?? "actif",
      },
    });
  }

  // Entente d'EXEMPLE : les vrais montants sont saisis par Me Derisier à l'écran.
  const hasPlan = await prisma.employeeCompensationPlan.count({ where: { employeeId: employee.id } });
  if (!hasPlan) {
    await prisma.employeeCompensationPlan.create({
      data: {
        cabinetId: cabinet.id,
        employeeId: employee.id,
        createdById: avocate.id,
        monthlySalary: 2000,
        legalAidHourlyRate: 25,
        legalAidSubjectCode: "LAO",
        grid: { IMM: 150, RE: 120, FA: 100, BU: 100, WE: 80 },
        effectiveFrom: new Date("2026-09-01T00:00:00Z"),
      },
    });
  }

  console.log("Cabinet Derisier local prêt :", cabinet.id);
  console.log("Identifiants : voir l'en-tête de ce script.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
