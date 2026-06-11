/**
 * Verify that the Derisier Law cabinet is ready for concierge delivery.
 *
 * Usage:
 *   node scripts/verify-derisier-delivery.mjs
 *
 * Read-only. Reports pass/fail per check and exits non-zero if any check
 * fails. Pairs with scripts/rebuild-derisier-from-audit.mjs.
 *
 * Schema reminder: TrustAccount is a per-client/per-matter ledger, not a
 * bank-level account. The bank-level trust account metadata lives in
 * Cabinet.config.trustBanking. A 0 ledger row count is expected and OK.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXPECTED = {
  cabinetIds: ["derisier-law-on-2026"],
  cabinetName: "Derisier Law",
  adminEmail: "info@derisierlaw.com",
  assistantEmail: "natalya@derisierlaw.com",
  plan: "cabinet",
  monthlyPrice: 149,
  locale: "en",
  province: "ON",
  hstNumber: "748964277RT0001",
  trustAccountLabel: "Derisier Law Trust Account",
  trustAccountBank: "To confirm",
  navTopLevelIds: ["dashboard", "gestion", "finances", "outils", "parametres"],
  hiddenNavIds: ["employees"],
  disciplines: ["immobilier", "immigration"],
  taxonomySubjectCodes: ["RE", "LAO", "IMM", "BS", "MIS", "WE", "FA", "BU"],
  forfaitCodesMin: ["IMMO-ACHAT", "IMMO-VENTE", "IMM-EE", "IMM-PARR", "IMM-TRAV"],
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
  console.log("Verifying Derisier delivery readiness...\n");

  const cabinet = await prisma.cabinet.findFirst({
    where: {
      OR: [
        { id: { in: EXPECTED.cabinetIds } },
        { nom: { contains: "Derisier", mode: "insensitive" } },
        { email: { equals: EXPECTED.adminEmail, mode: "insensitive" } },
      ],
    },
  });

  record("Cabinet Derisier exists", Boolean(cabinet), cabinet ? `id=${cabinet.id}` : "no row found");
  if (!cabinet) {
    return reportAndExit();
  }

  record("Cabinet plan = cabinet", cabinet.plan === EXPECTED.plan, `actual=${cabinet.plan}`);
  record("Cabinet name = Derisier Law", cabinet.nom === EXPECTED.cabinetName, `actual=${cabinet.nom}`);
  record(
    "Cabinet contact email matches audit",
    cabinet.email?.toLowerCase() === EXPECTED.adminEmail,
    `actual=${cabinet.email}`
  );

  const config = safeJsonParse(cabinet.config);
  record("Cabinet.config is valid JSON", Boolean(config));

  if (config) {
    record(
      "config.locale = en",
      config.locale === EXPECTED.locale,
      `actual=${config.locale}`
    );
    record(
      "config.province = ON",
      config.province === EXPECTED.province,
      `actual=${config.province}`
    );
    record(
      "config.currentOffer.monthlyPrice = 149",
      config.currentOffer?.monthlyPrice === EXPECTED.monthlyPrice,
      `actual=${config.currentOffer?.monthlyPrice}`
    );
    record(
      "config.taxNumbers.hstNumber matches Aaliyah GST/HST number",
      config.taxNumbers?.hstNumber === EXPECTED.hstNumber,
      `actual=${config.taxNumbers?.hstNumber}`
    );
    const taxonomy = config.dossierTaxonomy;
    const subjectCodes = new Set((taxonomy?.subjects ?? []).map((subject) => subject.code));
    const taxonomySubjectsOk = EXPECTED.taxonomySubjectCodes.every((code) => subjectCodes.has(code));
    record(
      "config.dossierTaxonomy has Aaliyah subject prefixes",
      taxonomySubjectsOk,
      `actual=[${[...subjectCodes].join(", ")}]`
    );
    record(
      "config.dossierTaxonomy numbering = prefix scope / 5 digits",
      taxonomy?.numbering?.scope === "prefix" && taxonomy?.numbering?.seqWidth === 5,
      `actual=${taxonomy?.numbering?.scope ?? "(none)"}/${taxonomy?.numbering?.seqWidth ?? "(none)"}`
    );
    record(
      "config.dossierTaxonomy submatters include IMM + RE",
      Array.isArray(taxonomy?.submatters?.IMM) &&
        taxonomy.submatters.IMM.length >= 20 &&
        Array.isArray(taxonomy?.submatters?.RE) &&
        taxonomy.submatters.RE.length >= 7,
      `IMM=${taxonomy?.submatters?.IMM?.length ?? 0}, RE=${taxonomy?.submatters?.RE?.length ?? 0}`
    );
    record(
      "config.trustBanking present",
      Boolean(config.trustBanking),
      config.trustBanking ? "ok" : "missing"
    );
    if (config.trustBanking) {
      const acct = config.trustBanking.accounts?.[0];
      record(
        "config.trustBanking.accounts[0] present",
        Boolean(acct),
        acct ? "ok" : "missing"
      );
      if (acct) {
        record(
          "trustBanking[0].label = Derisier Law Trust Account",
          acct.label === EXPECTED.trustAccountLabel,
          `actual=${acct.label}`
        );
        record(
          "trustBanking[0].bank = To confirm",
          acct.bank === EXPECTED.trustAccountBank,
          `actual=${acct.bank}`
        );
        record(
          "trustBanking[0].currency = CAD",
          acct.currency === "CAD",
          `actual=${acct.currency}`
        );
      }
    }
  }

  const cabinetInterface = await prisma.cabinetInterface.findUnique({
    where: { cabinetId: cabinet.id },
  });
  record("CabinetInterface exists", Boolean(cabinetInterface));

  if (cabinetInterface) {
    const ongletsActifs = safeJsonParse(cabinetInterface.ongletsActifs) ?? [];
    const ongletsMasques = safeJsonParse(cabinetInterface.ongletsMasques) ?? [];
    const disciplines = safeJsonParse(cabinetInterface.disciplines) ?? [];
    const modules = safeJsonParse(cabinetInterface.modules) ?? {};

    const navIdsValid = EXPECTED.navTopLevelIds.every((id) => ongletsActifs.includes(id));
    record(
      "ongletsActifs match real SidebarNav IDs",
      navIdsValid,
      `actual=[${ongletsActifs.join(", ")}]`
    );

    const hidesEmployees = ongletsMasques.includes("employees");
    record(
      "ongletsMasques hides 'employees' (small team)",
      hidesEmployees,
      `actual=[${ongletsMasques.join(", ")}]`
    );

    const disciplinesOk =
      disciplines.includes("immobilier") && disciplines.includes("immigration");
    record(
      "disciplines = immobilier + immigration",
      disciplinesOk,
      `actual=[${disciplines.join(", ")}]`
    );

    record(
      "modules.facturation.principal = mixte",
      modules?.facturation?.principal === "mixte",
      `actual=${modules?.facturation?.principal}`
    );
    record(
      "modules.fideicommis.regle = bylaw9-lso",
      modules?.fideicommis?.regle === "bylaw9-lso",
      `actual=${modules?.fideicommis?.regle}`
    );
    record(
      "modules.fintrac.actif = true",
      modules?.fintrac?.actif === true,
      `actual=${modules?.fintrac?.actif}`
    );
    record(
      "modules.pipeda.actif = true",
      modules?.pipeda?.actif === true,
      `actual=${modules?.pipeda?.actif}`
    );
    record(
      "modules.subscriptions.targetPriceMonthly = 149",
      modules?.subscriptions?.targetPriceMonthly === EXPECTED.monthlyPrice,
      `actual=${modules?.subscriptions?.targetPriceMonthly}`
    );
  }

  const users = await prisma.user.findMany({
    where: { cabinetId: cabinet.id },
    orderBy: { createdAt: "asc" },
  });
  record(
    "At least 2 users",
    users.length >= 2,
    `count=${users.length}`
  );
  const admin = users.find((u) => u.email?.toLowerCase() === EXPECTED.adminEmail);
  record(
    "Admin user info@derisierlaw.com exists",
    Boolean(admin),
    admin ? `role=${admin.role}` : "missing"
  );
  record(
    "Admin role = admin_cabinet",
    admin?.role === "admin_cabinet",
    `actual=${admin?.role}`
  );
  const assistant = users.find((u) => u.email?.toLowerCase() === EXPECTED.assistantEmail);
  record(
    "Assistant user natalya@derisierlaw.com exists",
    Boolean(assistant),
    assistant ? `role=${assistant.role}` : "missing"
  );
  record(
    "Assistant role = assistante",
    assistant?.role === "assistante",
    `actual=${assistant?.role}`
  );

  const forfaits = await prisma.forfaitService.findMany({
    where: { cabinetId: cabinet.id },
    select: { code: true, nom: true, montant: true, actif: true },
  });
  record(
    "ForfaitService rows >= 8",
    forfaits.length >= 8,
    `count=${forfaits.length}`
  );
  const codes = new Set(forfaits.map((f) => f.code));
  for (const code of EXPECTED.forfaitCodesMin) {
    record(`ForfaitService '${code}' present and active`, codes.has(code) && forfaits.find((f) => f.code === code)?.actif === true);
  }

  const deboursTypeCount = await prisma.deboursType.count({ where: { cabinetId: cabinet.id } });
  record(
    "DeboursType rows >= 7",
    deboursTypeCount >= 7,
    `count=${deboursTypeCount}`
  );
  const deboursTplCount = await prisma.deboursTemplate.count({ where: { cabinetId: cabinet.id } });
  record(
    "DeboursTemplate rows >= 10",
    deboursTplCount >= 10,
    `count=${deboursTplCount}`
  );

  const clientCount = await prisma.client.count({ where: { cabinetId: cabinet.id } });
  record(
    "No operational clients are present before delivery",
    clientCount === 0,
    `count=${clientCount}`
  );

  const dossierCount = await prisma.dossier.count({ where: { cabinetId: cabinet.id } });
  record(
    "No operational dossiers are present before delivery",
    dossierCount === 0,
    `count=${dossierCount}`
  );

  const invoiceCount = await prisma.invoice.count({ where: { cabinetId: cabinet.id } });
  record(
    "No operational invoices are present before delivery",
    invoiceCount === 0,
    `count=${invoiceCount}`
  );

  const trustLedgerCount = await prisma.trustAccount.count({ where: { cabinetId: cabinet.id } });
  record(
    "TrustAccount ledger count is documented (0 OK — created lazily)",
    true,
    `count=${trustLedgerCount}`
  );

  return reportAndExit();
}

function reportAndExit() {
  console.log("============================================================");
  console.log("Derisier delivery verification");
  console.log("============================================================");
  let passed = 0;
  let failed = 0;
  for (const c of checks) {
    const icon = c.pass ? "PASS" : "FAIL";
    const tail = c.detail ? `  (${c.detail})` : "";
    console.log(`[${icon}] ${c.name}${tail}`);
    if (c.pass) passed += 1;
    else failed += 1;
  }
  console.log("------------------------------------------------------------");
  console.log(`Total: ${checks.length}  Passed: ${passed}  Failed: ${failed}`);
  console.log("");
  process.exitCode = failed === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error("Verification script failed:", error);
    process.exit(2);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
