import { describe, expect, it } from "vitest";
import {
  CASH_THRESHOLD_CAD,
  cashRuleScope,
  evaluateCashAcceptance,
  getCashDeclarationDuty,
  getCashExemption,
  getCashExemptions,
  getCashReceiptFields,
  getCashRefundRule,
  payerSignatureMayBeWaived,
  QC_DECLARATION_DEADLINE_DAYS,
  resolveConversionRateDate,
  toCad,
} from "../cash";

/**
 * CH-05 — Règles sur les sommes reçues en espèces.
 *
 * Ferme M-05 de l'audit, qui relevait trois défauts SIMULTANÉS dont deux opposés :
 * sur-blocage (aucune exception), sous-blocage (aucune agrégation), et absence
 * complète des art. 70 à 73.
 *
 * Sources : B-1 r.5 art. 69 à 73 · By-Law 9 s. 4 à 6, 19.
 */

const NEVER_HOLIDAY = () => false;

/* ════════════════════════════════════════════════════════════════
   Périmètre — deux régimes qui ne visent pas la même chose
   ════════════════════════════════════════════════════════════════ */

describe("Périmètre de la règle du seuil", () => {
  it("Québec : le seuil ne vise que la réception EN FIDÉICOMMIS (art. 69)", () => {
    expect(cashRuleScope("QC").scope).toBe("TRUST_ONLY");
  });

  it("Ontario : le seuil vise TOUTE somme rattachée à un dossier client (s. 4(1))", () => {
    expect(cashRuleScope("ON").scope).toBe("ANY_CLIENT_FILE");
  });

  it("au Québec, des espèces hors fidéicommis ne tombent pas sous le seuil", () => {
    // Des espèces reçues directement en paiement d'une facture ne relèvent pas de
    // l'art. 69. Le reçu de l'art. 70 reste exigé, mais pas le seuil.
    const v = evaluateCashAcceptance("QC", {
      amountCad: 20000,
      alreadyReceivedCad: 0,
      intoTrust: false,
    });
    expect(v).toMatchObject({ status: "OK", reason: "out_of_scope" });
  });

  it("en Ontario, les mêmes espèces hors fiducie tombent bien sous le seuil", () => {
    const v = evaluateCashAcceptance("ON", {
      amountCad: 20000,
      alreadyReceivedCad: 0,
      intoTrust: false,
    });
    expect(v.status).toBe("REFUSED");
  });
});

/* ════════════════════════════════════════════════════════════════
   Agrégation par dossier — le sous-blocage corrigé
   ════════════════════════════════════════════════════════════════ */

describe("Seuil agrégé par dossier", () => {
  it("laisse passer un versement isolé sous le seuil", () => {
    const v = evaluateCashAcceptance("ON", {
      amountCad: 3000,
      alreadyReceivedCad: 0,
      intoTrust: true,
    });
    expect(v).toMatchObject({ status: "OK", reason: "below_threshold" });
  });

  it("REFUSE le versement qui fait franchir le seuil au CUMUL du dossier", () => {
    // C'était le sous-blocage : trois versements de 3 000 $ passaient tous les trois
    // alors que la s. 4(1) vise « an aggregate amount ».
    const v = evaluateCashAcceptance("ON", {
      amountCad: 3000,
      alreadyReceivedCad: 6000,
      intoTrust: true,
    });
    expect(v).toMatchObject({ status: "REFUSED", code: "CASH_THRESHOLD_EXCEEDED" });
    if (v.status === "REFUSED") expect(v.aggregateCad).toBe(9000);
  });

  it("refuse exactement au seuil, qui est « 7 500 $ OU PLUS »", () => {
    const v = evaluateCashAcceptance("QC", {
      amountCad: CASH_THRESHOLD_CAD,
      alreadyReceivedCad: 0,
      intoTrust: true,
    });
    expect(v.status).toBe("REFUSED");
  });

  it("laisse passer un cent sous le seuil", () => {
    const v = evaluateCashAcceptance("QC", {
      amountCad: 7499.99,
      alreadyReceivedCad: 0,
      intoTrust: true,
    });
    expect(v.status).toBe("OK");
  });
});

/* ════════════════════════════════════════════════════════════════
   Exceptions — le sur-blocage corrigé
   ════════════════════════════════════════════════════════════════ */

describe("Exceptions au seuil", () => {
  it("le Québec en compte sept cas pour six paragraphes (art. 69)", () => {
    // L'art. 69 compte six paragraphes, mais le 69(3) en couvre deux situations
    // distinctes : « conformément à une ordonnance de la Cour OU pour payer une
    // amende ou une sanction ». On les sépare pour que l'utilisateur choisisse le
    // cas réel, tout en pointant le même paragraphe.
    expect(getCashExemptions("QC")).toHaveLength(7);
    const refs = new Set(getCashExemptions("QC").map((e) => e.reference));
    expect(refs.size).toBe(6);
  });

  it("ACCEPTE l'avance d'honoraires au Québec, que le contrôle brut bloquait", () => {
    // C'est l'exception la plus courante en pratique, et elle était refusée. Un
    // garde-fou qui refuse une opération licite pousse au contournement.
    const v = evaluateCashAcceptance("QC", {
      amountCad: 10000,
      alreadyReceivedCad: 0,
      intoTrust: true,
      exemption: "AVANCE_HONORAIRES_OU_DEBOURS",
    });
    expect(v).toMatchObject({ status: "OK", reason: "exempt" });
  });

  it("REFUSE en Ontario une exception qui n'existe qu'au Québec", () => {
    // Le dépôt pour mise en liberté (art. 69(5)) n'a pas d'équivalent dans la s. 6.
    // Accorder une dispense inexistante serait pire que l'absence de contrôle : le
    // système validerait l'illicite.
    const v = evaluateCashAcceptance("ON", {
      amountCad: 10000,
      alreadyReceivedCad: 0,
      intoTrust: true,
      exemption: "DEPOT_MISE_EN_LIBERTE",
    });
    expect(v).toMatchObject({ status: "REFUSED", code: "EXEMPTION_NOT_AVAILABLE_IN_PROVINCE" });
  });

  it("REFUSE au Québec l'exception ontarienne du cautionnement", () => {
    const v = evaluateCashAcceptance("QC", {
      amountCad: 10000,
      alreadyReceivedCad: 0,
      intoTrust: true,
      exemption: "HONORAIRES_DEBOURS_OU_CAUTIONNEMENT",
    });
    expect(v).toMatchObject({ status: "REFUSED", code: "EXEMPTION_NOT_AVAILABLE_IN_PROVINCE" });
  });

  it("énumère les exceptions admises dans le refus (PR-2)", () => {
    const v = evaluateCashAcceptance("ON", {
      amountCad: 10000,
      alreadyReceivedCad: 0,
      intoTrust: true,
      exemption: "DEPOT_MISE_EN_LIBERTE",
    });
    if (v.status === "REFUSED") expect(v.remedyFr).toContain("cautionnement");
  });

  it("cite l'article de chaque exception", () => {
    expect(getCashExemption("QC", "AVANCE_HONORAIRES_OU_DEBOURS")!.reference).toBe(
      "B-1 r.5, art. 69(6)",
    );
    expect(getCashExemption("ON", "HONORAIRES_DEBOURS_OU_CAUTIONNEMENT")!.reference).toBe(
      "By-Law 9, s. 6(e)",
    );
  });

  it("marque l'exception ontarienne qui engage un remboursement en espèces", () => {
    // La s. 6(e) conditionne EXPRESSÉMENT l'exception : « provided that any refund
    // out of such receipts is also made in cash ».
    expect(getCashExemption("ON", "HONORAIRES_DEBOURS_OU_CAUTIONNEMENT")!.refundMustBeCash).toBe(true);
    // L'art. 69(6) québécois ne pose PAS cette condition : c'est l'art. 72 qui régit
    // le remboursement, et sur le seul critère du montant.
    expect(getCashExemption("QC", "AVANCE_HONORAIRES_OU_DEBOURS")!.refundMustBeCash).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════
   Reçu — art. 70 / s. 19(1)
   ════════════════════════════════════════════════════════════════ */

describe("Reçu d'espèces", () => {
  it("exige les six mentions de l'art. 70 plus les deux signatures", () => {
    const keys = getCashReceiptFields("QC").map((f) => f.key);
    expect(keys).toEqual([
      "date",
      "payerName",
      "amount",
      "clientName",
      "dossierRef",
      "purpose",
      "licenseeSignature",
      "payerSignature",
    ]);
  });

  it("N'EXIGE PAS l'objet sur le reçu ontarien", () => {
    // La s. 19(1) énumère date, payeur, montant, client, n° de dossier et les
    // signatures. Elle ne mentionne pas l'objet, contrairement à l'art. 70(6).
    const purpose = getCashReceiptFields("ON").find((f) => f.key === "purpose")!;
    expect(purpose.required).toBe(false);
  });

  it("s'applique SANS SEUIL : un reçu est exigé pour 50 $ comme pour 50 000 $", () => {
    // L'art. 70 vise « une somme en espèces » et la s. 19(1) « every licensee who
    // receives cash ». Aucun montant minimal.
    expect(getCashReceiptFields("QC").filter((f) => f.required).length).toBeGreaterThan(0);
    expect(getCashReceiptFields("ON").filter((f) => f.required).length).toBeGreaterThan(0);
  });

  it("admet en Ontario l'absence de signature du payeur après efforts raisonnables", () => {
    const on = payerSignatureMayBeWaived("ON");
    expect(on.allowed).toBe(true);
    expect(on.reference).toBe("By-Law 9, s. 19(2)");
  });

  it("N'ADMET PAS cette dispense au Québec, où elle n'existe pas", () => {
    const qc = payerSignatureMayBeWaived("QC");
    expect(qc.allowed).toBe(false);
    expect(qc.reference).toBe("B-1 r.5, art. 70 al. 2");
  });
});

/* ════════════════════════════════════════════════════════════════
   Déclaration — art. 71, sans équivalent ontarien
   ════════════════════════════════════════════════════════════════ */

describe("Déclaration au directeur de l'inspection", () => {
  const RECEIVED = new Date("2026-06-10T00:00:00Z");

  it("est exigée au Québec dès 7 500 $, dans les 30 jours", () => {
    const d = getCashDeclarationDuty({ province: "QC", amountCad: 8000, receivedAt: RECEIVED });
    expect(d.required).toBe(true);
    expect(QC_DECLARATION_DEADLINE_DAYS).toBe(30);
    expect(d.dueAt?.toISOString().slice(0, 10)).toBe("2026-07-10");
    expect(d.recipientFr).toContain("Directeur de l'inspection professionnelle");
  });

  it("énumère les trois pièces à transmettre", () => {
    const d = getCashDeclarationDuty({ province: "QC", amountCad: 8000, receivedAt: RECEIVED });
    expect(d.contentsFr).toHaveLength(3);
    expect(d.contentsFr.join(" ")).toContain("copie du reçu");
    expect(d.contentsFr.join(" ")).toContain("déclaration signée");
  });

  it("n'est pas exigée sous le seuil, mais le reçu l'est toujours", () => {
    const d = getCashDeclarationDuty({ province: "QC", amountCad: 500, receivedAt: RECEIVED });
    expect(d.required).toBe(false);
    expect(d.noteFr).toContain("Le reçu de l'art. 70 reste exigé");
  });

  it("N'EXISTE PAS en Ontario, et le dit", () => {
    // By-Law 9 n'impose aucune déclaration. En créer une inventerait une obligation.
    const d = getCashDeclarationDuty({ province: "ON", amountCad: 50000, receivedAt: RECEIVED });
    expect(d.required).toBe(false);
    expect(d.dueAt).toBeNull();
    expect(d.noteFr).toContain("n'impose aucune déclaration");
  });
});

/* ════════════════════════════════════════════════════════════════
   Remboursement — art. 72 / s. 6(e)
   ════════════════════════════════════════════════════════════════ */

describe("Remboursement d'une somme reçue en espèces", () => {
  it("Québec : remboursement EN ESPÈCES obligatoire dès 7 500 $ (art. 72)", () => {
    const r = getCashRefundRule({ province: "QC", originalAmountCad: 9000 });
    expect(r.mustBeCash).toBe(true);
    expect(r.reference).toBe("B-1 r.5, art. 72");
    expect(r.receiptFieldsFr).toHaveLength(5);
  });

  it("Québec : sous le seuil, l'art. 72 ne s'applique pas", () => {
    const r = getCashRefundRule({ province: "QC", originalAmountCad: 2000 });
    expect(r.mustBeCash).toBe(false);
    expect(r.noteFr).toContain("règles ordinaires de l'art. 57");
  });

  it("Ontario : la condition tient à l'EXCEPTION invoquée, pas au montant", () => {
    // s. 6(e) : l'exception n'est acquise que si tout remboursement se fait en
    // espèces. Un petit montant reçu sous cette exception engage donc le cabinet.
    const avecExemption = getCashRefundRule({
      province: "ON",
      originalAmountCad: 1000,
      exemptionInvoked: "HONORAIRES_DEBOURS_OU_CAUTIONNEMENT",
    });
    expect(avecExemption.mustBeCash).toBe(true);

    const sansExemption = getCashRefundRule({ province: "ON", originalAmountCad: 50000 });
    expect(sansExemption.mustBeCash).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════
   Conversion — art. 73 / s. 4(2)
   ════════════════════════════════════════════════════════════════ */

describe("Conversion des espèces en devise étrangère", () => {
  it("retient le taux du jour de réception hors jour férié", () => {
    const c = resolveConversionRateDate({
      province: "QC",
      receivedAt: new Date("2026-06-10T12:00:00Z"),
      isHoliday: NEVER_HOLIDAY,
    });
    expect(c.rateDate.toISOString().slice(0, 10)).toBe("2026-06-10");
    expect(c.usedPrecedingBusinessDay).toBe(false);
    expect(c.reference).toBe("B-1 r.5, art. 73");
  });

  it("recule au dernier jour ouvrable si la réception tombe un jour férié", () => {
    const ferie = new Set(["2026-06-24", "2026-06-23"]);
    const c = resolveConversionRateDate({
      province: "QC",
      receivedAt: new Date("2026-06-24T12:00:00Z"),
      isHoliday: (d) => ferie.has(d.toISOString().slice(0, 10)),
    });
    expect(c.rateDate.toISOString().slice(0, 10)).toBe("2026-06-22");
    expect(c.usedPrecedingBusinessDay).toBe(true);
  });

  it("cite l'article ontarien pour un cabinet ontarien", () => {
    const c = resolveConversionRateDate({
      province: "ON",
      receivedAt: new Date("2026-06-10T12:00:00Z"),
      isHoliday: NEVER_HOLIDAY,
    });
    expect(c.reference).toBe("By-Law 9, s. 4(2)");
  });

  it("ne boucle pas indéfiniment si tout est déclaré férié", () => {
    const c = resolveConversionRateDate({
      province: "QC",
      receivedAt: new Date("2026-06-10T12:00:00Z"),
      isHoliday: () => true,
    });
    expect(c.rateDate).toBeInstanceOf(Date);
  });

  it("convertit et arrondit au cent", () => {
    expect(toCad(1000, 1.3745)).toBe(1374.5);
    expect(toCad(333.33, 1.37)).toBe(456.66);
  });

  it("l'agrégation se fait sur les montants CONVERTIS", () => {
    // Le seuil est exprimé en dollars canadiens : 6 000 USD ne sont pas 6 000 $ CAD.
    const usd = toCad(6000, 1.37);
    const v = evaluateCashAcceptance("ON", {
      amountCad: usd,
      alreadyReceivedCad: 0,
      intoTrust: true,
    });
    expect(usd).toBeGreaterThan(CASH_THRESHOLD_CAD);
    expect(v.status).toBe("REFUSED");
  });
});
