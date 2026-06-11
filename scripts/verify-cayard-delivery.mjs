/**
 * Vérifie que le cabinet CAYARD AVOCAT est prêt pour un test (concierge).
 *
 * Usage:
 *   node scripts/verify-cayard-delivery.mjs
 *
 * Lecture seule. Sort en code non-zéro si un test échoue.
 * Pair avec scripts/seed-cayard.mjs.
 *
 * Particularité vs Derisier : Cayard est livré AVEC des données de
 * démonstration (clients/dossiers/factures/fidéicommis) et SANS couche
 * assistante (file-assistante masquée, aucun user assistante).
 */
import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

// .env.local (dev) prime sur .env — Prisma via `node` ne lit que .env par défaut.
loadEnv({ path: ".env.local", override: true });
loadEnv({ path: ".env" });

const prisma = new PrismaClient();

const EXPECTED = {
  cabinetId: "cayard-avocat-qc-2026",
  cabinetName: "Entreprise individuelle (CAYARD AVOCAT)",
  adminEmail: "contact@cayard-avocat.ca",
  plan: "cabinet",
  monthlyPrice: 149,
  province: "QC",
  navTopLevelIds: ["dashboard", "gestion", "finances", "outils", "parametres"],
  hiddenNavIds: ["file-assistante", "employees"],
  disciplines: ["immigration", "droit_famille", "litige_civil"],
  forfaitCodesMin: ["IMM-EE", "FAM-DIVORCE", "LIT-CIVIL"],
};

const checks = [];
function record(name, pass, detail = "") {
  checks.push({ name, pass, detail });
}
function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function main() {
  console.log("Vérification de la préparation CAYARD AVOCAT...\n");

  const cabinet = await prisma.cabinet.findUnique({ where: { id: EXPECTED.cabinetId } });
  record("Cabinet Cayard existe", Boolean(cabinet), cabinet ? `id=${cabinet.id}` : "introuvable");
  if (!cabinet) return reportAndExit();

  record("Cabinet plan = cabinet", cabinet.plan === EXPECTED.plan, `actual=${cabinet.plan}`);
  record("Cabinet nom correct", cabinet.nom === EXPECTED.cabinetName, `actual=${cabinet.nom}`);
  record("Cabinet email correct", cabinet.email?.toLowerCase() === EXPECTED.adminEmail, `actual=${cabinet.email}`);

  const config = safeJsonParse(cabinet.config);
  record("Cabinet.config JSON valide", Boolean(config));
  if (config) {
    record("config.province = QC", config.province === EXPECTED.province, `actual=${config.province}`);
    record("config.currentOffer.monthlyPrice = 149", config.currentOffer?.monthlyPrice === EXPECTED.monthlyPrice, `actual=${config.currentOffer?.monthlyPrice}`);
    record("config.displayName = CAYARD AVOCAT", config.displayName === "CAYARD AVOCAT", `actual=${config.displayName}`);
    record("config.trustBanking présent (fidéicommis actif)", Boolean(config.trustBanking?.enabled));
    const a = config.onboardingAudit;
    record("config.onboardingAudit.valeurRecuperableAnnuelle = 15811", a?.valeurRecuperableAnnuelle === 15811, `actual=${a?.valeurRecuperableAnnuelle}`);
    record("config.onboardingAudit.heuresRecuperablesParSemaine = 2.1", a?.heuresRecuperablesParSemaine === 2.1, `actual=${a?.heuresRecuperablesParSemaine}`);
    record("config.onboardingAudit.usersPrevus = 2", a?.usersPrevus === 2, `actual=${a?.usersPrevus}`);
    record("config.onboardingAudit.dossiersActifs = 10-30", a?.dossiersActifs === "10-30", `actual=${a?.dossiersActifs}`);
  }

  const ci = await prisma.cabinetInterface.findUnique({ where: { cabinetId: cabinet.id } });
  record("CabinetInterface existe", Boolean(ci));
  if (ci) {
    const actifs = safeJsonParse(ci.ongletsActifs) ?? [];
    const masques = safeJsonParse(ci.ongletsMasques) ?? [];
    const disciplines = safeJsonParse(ci.disciplines) ?? [];
    const modules = safeJsonParse(ci.modules) ?? {};

    record("ongletsActifs = nav top-level réels", EXPECTED.navTopLevelIds.every((id) => actifs.includes(id)), `actual=[${actifs.join(", ")}]`);
    record("COUCHE ASSISTANTE masquée (file-assistante)", masques.includes("file-assistante"), `actual=[${masques.join(", ")}]`);
    record("disciplines = immigration + famille + litige", EXPECTED.disciplines.every((d) => disciplines.includes(d)), `actual=[${disciplines.join(", ")}]`);
    record("modules.facturation.principal = forfait", modules?.facturation?.principal === "forfait", `actual=${modules?.facturation?.principal}`);
    record("modules.facturation.taxes.mode = tps_tvq (QC)", modules?.facturation?.taxes?.mode === "tps_tvq", `actual=${modules?.facturation?.taxes?.mode}`);
    record("modules.fideicommis.enabled = true", modules?.fideicommis?.enabled === true, `actual=${modules?.fideicommis?.enabled}`);
    record("modules.aideJuridique.actif = true", modules?.aideJuridique?.actif === true, `actual=${modules?.aideJuridique?.actif}`);
    record("PAS de module assistante", !("assistante" in (modules ?? {})) && !("navette" in (modules ?? {})), "ok");
  }

  const users = await prisma.user.findMany({ where: { cabinetId: cabinet.id } });
  const admin = users.find((u) => u.email?.toLowerCase() === EXPECTED.adminEmail);
  record("Utilisateur admin existe", Boolean(admin), admin ? `role=${admin.role}` : "manquant");
  record("Admin role = admin_cabinet", admin?.role === "admin_cabinet", `actual=${admin?.role}`);
  const hasAssistant = users.some((u) => u.role === "assistante");
  record("AUCUN utilisateur assistante", !hasAssistant, `assistantes=${users.filter((u) => u.role === "assistante").length}`);

  const forfaits = await prisma.forfaitService.findMany({ where: { cabinetId: cabinet.id }, select: { code: true, actif: true } });
  const codes = new Set(forfaits.map((f) => f.code));
  for (const code of EXPECTED.forfaitCodesMin) {
    record(`Forfait '${code}' présent et actif`, codes.has(code) && forfaits.find((f) => f.code === code)?.actif === true);
  }

  const clientCount = await prisma.client.count({ where: { cabinetId: cabinet.id } });
  record("3 clients de démonstration", clientCount === 3, `count=${clientCount}`);

  const dossierCount = await prisma.dossier.count({ where: { cabinetId: cabinet.id } });
  record("4 dossiers de démonstration", dossierCount === 4, `count=${dossierCount}`);

  const aideJuridique = await prisma.dossier.count({ where: { cabinetId: cabinet.id, sousType: "aide_juridique" } });
  record("Au moins 1 dossier d'aide juridique", aideJuridique >= 1, `count=${aideJuridique}`);

  const invoices = await prisma.invoice.findMany({ where: { cabinetId: cabinet.id }, select: { statut: true, balanceDue: true } });
  record("Au moins 3 factures forfaitaires", invoices.length >= 3, `count=${invoices.length}`);
  const unpaid = invoices.filter((i) => i.balanceDue > 0);
  record("Au moins 1 facture impayée", unpaid.length >= 1, `impayées=${unpaid.length}`);

  const trustTx = await prisma.trustTransaction.count({ where: { cabinetId: cabinet.id } });
  record("Au moins 1 mouvement de fidéicommis", trustTx >= 1, `count=${trustTx}`);

  const conflicts = await prisma.conflictCheck.count({ where: { cabinetId: cabinet.id } });
  record("Au moins 1 élément de conformité (conflit)", conflicts >= 1, `count=${conflicts}`);

  // Garde-fou : ne pas toucher Derisier.
  const derisier = await prisma.cabinet.findFirst({ where: { nom: { contains: "Derisier", mode: "insensitive" } } });
  record("Derisier toujours présent et distinct", !derisier || derisier.id !== cabinet.id, derisier ? `derisierId=${derisier.id}` : "absent (ok)");

  return reportAndExit();
}

function reportAndExit() {
  console.log("============================================================");
  console.log("Vérification livraison CAYARD AVOCAT");
  console.log("============================================================");
  let passed = 0, failed = 0;
  for (const c of checks) {
    const icon = c.pass ? "PASS" : "FAIL";
    const tail = c.detail ? `  (${c.detail})` : "";
    console.log(`[${icon}] ${c.name}${tail}`);
    if (c.pass) passed += 1;
    else failed += 1;
  }
  console.log("------------------------------------------------------------");
  console.log(`Total: ${checks.length}  Réussis: ${passed}  Échoués: ${failed}`);
  console.log("");
  process.exitCode = failed === 0 ? 0 : 1;
}

main()
  .catch((e) => {
    console.error("Script de vérification échoué:", e);
    process.exit(2);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
