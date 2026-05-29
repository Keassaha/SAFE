/**
 * LOT 3A+B — Taxonomie de dossiers Derisier Law (demande Aaliyah Regimbald, 2026-05).
 *
 * Écrit `Cabinet.config.dossierTaxonomy` (JSON) : Sujets → préfixes + sous-matières
 * bilingues. Active la numérotation `{année}-{PRÉFIXE}-{séquence 5 chiffres}`
 * (ex. 2026-IMM-00001) à la création de dossier.
 *
 * Source d'autorité : email Aaliyah 2026-05 + décisions Q1-Q3
 * (docs/product/SPEC_LOT3_PREFIXES_SUJETS_SOUSMATIERES.md). Le catalogue ci-dessous
 * est la copie .mjs de `DERISIER_DOSSIER_TAXONOMY` (lib/dossiers/taxonomy.ts) —
 * garder les deux synchronisés.
 *
 * Idempotent, additif (fusionne dans config sans écraser le reste).
 *
 * Dry-run par défaut :
 *   node scripts/configure-derisier-dossier-taxonomy-2026-05.mjs
 * Application :
 *   APPLY_DERISIER_TAXONOMY=YES node scripts/configure-derisier-dossier-taxonomy-2026-05.mjs --apply
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CABINET_ID = "derisier-law-on-2026";

const IMM_SUBMATTERS = [
  { labelEn: "Humanitarian Application", labelFr: "Demande humanitaire" },
  { labelEn: "Sponsorship", labelFr: "Parrainage" },
  { labelEn: "Work Permit", labelFr: "Permis de travail" },
  { labelEn: "Visitor Visa", labelFr: "Permis de séjour" },
  { labelEn: "Study Permit", labelFr: "Permis d'étude" },
  { labelEn: "Immigration Appeals", labelFr: "Demande d'appel" },
  { labelEn: "Express Entry", labelFr: "Entrée express" },
  { labelEn: "Provincial Nominee", labelFr: "Programmes provinciaux" },
  { labelEn: "PR Pilot Projects", labelFr: "PR Pilot Projects" },
  { labelEn: "Refugee Claim Forms", labelFr: "Refugee Claim Forms" },
  { labelEn: "Refugee Claim Representation", labelFr: "Refugee Claim Representation" },
  { labelEn: "Invitation Letter", labelFr: "Lettre d'invitation" },
  { labelEn: "Student Support Affidavit", labelFr: "Déclaration solennelle pour étudiant" },
  { labelEn: "Complex Affidavits", labelFr: "Déclaration solennelle complexe" },
  { labelEn: "Submission letter response to immigration without follow-up", labelFr: "Réponse de soumission à l'immigration sans suivi" },
  { labelEn: "Submission letter response to immigration with follow-up", labelFr: "Réponse de soumission à l'immigration avec suivi" },
  { labelEn: "Temporary Resident Permit", labelFr: "Permis de séjour temporaire" },
  { labelEn: "Citizenship Application", labelFr: "Demande de citoyenneté" },
  { labelEn: "Humanitarian Sponsorship", labelFr: "Parrainage humanitaire" },
  { labelEn: "US Waiver", labelFr: "US Waiver" },
  { labelEn: "Procuration / Proxy", labelFr: "Procuration" },
  { labelEn: "Travel Documents / Declaration in Lieu of Guarantor", labelFr: "Documents de voyage / Déclaration tenant lieu de répondant" },
  { labelEn: "Travel Documents / Declaration in Lieu of Guarantor (1 form)", labelFr: "Documents de voyage / Déclaration tenant lieu de répondant (1 formulaire)" },
  { labelEn: "Travel Documents / Application and Declaration in Lieu of Guarantor (Respondent)", labelFr: "Documents de voyage / Demande et déclaration tenant lieu de répondant" },
  { labelEn: "Consultation", labelFr: "Consultation" },
];

const RE_SUBMATTERS = [
  { labelEn: "Purchase Residential", labelFr: "Achat résidentiel" },
  { labelEn: "Purchase Commercial", labelFr: "Achat commercial" },
  { labelEn: "Sale", labelFr: "Vente" },
  { labelEn: "Sale Commercial", labelFr: "Vente commerciale" },
  { labelEn: "Condo Certificate Consultation", labelFr: "Consultation certificat de copropriété" },
  { labelEn: "Refinance", labelFr: "Refinancement" },
  { labelEn: "Express Closing", labelFr: "Fermeture expresse" },
];

const AS_SUBMATTERS = [
  { labelEn: "Notarization", labelFr: "Document notarié" },
  { labelEn: "Cease and Desist Letters", labelFr: "Lettres de cessation et d'abstention" },
  { labelEn: "Demand Letters", labelFr: "Mise en demeure" },
  { labelEn: "Incorporation", labelFr: "Incorporation" },
  { labelEn: "Divorce opinion letter", labelFr: "Lettre d'opinion de divorce" },
  { labelEn: "Commercial lease", labelFr: "Bail commercial" },
  { labelEn: "Employment contract", labelFr: "Contrat d'employé" },
  { labelEn: "Wills", labelFr: "Testaments" },
];

const DOSSIER_TAXONOMY = {
  numbering: { format: "year-prefix-seq", seqWidth: 5, scope: "prefix" },
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
    IMM: IMM_SUBMATTERS,
    RE: RE_SUBMATTERS,
    AS: AS_SUBMATTERS,
  },
};

const APPLY = process.argv.includes("--apply") && process.env.APPLY_DERISIER_TAXONOMY === "YES";

async function main() {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: CABINET_ID },
    select: { nom: true, config: true },
  });
  if (!cabinet) throw new Error(`Cabinet ${CABINET_ID} introuvable`);

  console.log(`Cabinet ciblé: ${cabinet.nom} (${CABINET_ID})`);
  console.log(`Mode: ${APPLY ? "APPLICATION" : "simulation seulement"}\n`);

  let config = {};
  try {
    config = cabinet.config ? JSON.parse(cabinet.config) : {};
  } catch {
    config = {};
  }

  const hadTaxonomy = Boolean(config.dossierTaxonomy);
  console.log(`dossierTaxonomy existant: ${hadTaxonomy ? "oui (sera remplacé)" : "(aucun)"}`);
  console.log(`Sujets configurés: ${DOSSIER_TAXONOMY.subjects.length}`);
  console.log(`  ${DOSSIER_TAXONOMY.subjects.map((s) => `${s.code}→${s.prefix}`).join(" · ")}`);
  console.log(
    `Sous-matières: IMM=${IMM_SUBMATTERS.length}, RE=${RE_SUBMATTERS.length}, AS=${AS_SUBMATTERS.length}`,
  );
  console.log(
    `Numérotation: {année}-{PRÉFIXE}-{séquence ${DOSSIER_TAXONOMY.numbering.seqWidth} chiffres}, scope=${DOSSIER_TAXONOMY.numbering.scope}`,
  );
  console.log("  Exemple: 2026-IMM-00001, 2026-RE-00001");

  // Fusion additive : on ne touche qu'à dossierTaxonomy.
  config.dossierTaxonomy = DOSSIER_TAXONOMY;

  if (!APPLY) {
    console.log("\nSimulation terminée. Pour appliquer:");
    console.log(
      "  APPLY_DERISIER_TAXONOMY=YES node scripts/configure-derisier-dossier-taxonomy-2026-05.mjs --apply",
    );
    return;
  }

  // ---- APPLICATION ----
  await prisma.cabinet.update({
    where: { id: CABINET_ID },
    data: { config: JSON.stringify(config) },
  });
  console.log("\n✓ dossierTaxonomy appliqué sur le cabinet.");

  // ---- VÉRIFICATION ----
  const updated = await prisma.cabinet.findUnique({
    where: { id: CABINET_ID },
    select: { config: true },
  });
  const tax = JSON.parse(updated.config).dossierTaxonomy;
  console.log("\n=== Vérification ===");
  console.log(`Sujets en base: ${tax?.subjects?.length ?? 0}`);
  console.log(`Clés sous-matières: ${Object.keys(tax?.submatters ?? {}).join(", ")}`);
  console.log(`seqWidth: ${tax?.numbering?.seqWidth}, scope: ${tax?.numbering?.scope}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
