import { describe, expect, it } from "vitest";
import {
  checkChequePayee,
  evaluateDepositDelay,
  findChequeSequenceGaps,
  findMissingDocuments,
  findMissingEntryFields,
  getExpectedDocuments,
  getRequiredEntryFields,
  isChequeStale,
} from "../trust-records";

/**
 * CH-02 — Exigences de tenue du journal de caisse en fidéicommis.
 *
 * Sources : B-1 r.5 art. 32, 34, 38, 39, 50, 57, 61 · By-Law 9 s. 7(1), 11, 18.
 */

/* ════════════════════════════════════════════════════════════════
   Champs exigés — art. 38
   ════════════════════════════════════════════════════════════════ */

describe("Champs exigés sur une recette (art. 38(1))", () => {
  it("exige le payeur, l'objet et l'indication espèces", () => {
    const fields = getRequiredEntryFields("RECEIPT", "QC").map((f) => f.field);
    expect(fields).toEqual(["payerName", "purposeCode", "isCash"]);
  });

  it("signale le payeur manquant, avec son article", () => {
    const missing = findMissingEntryFields(
      { direction: "RECEIPT", purposeCode: "AVANCE_HONORAIRES" },
      "QC",
    );
    expect(missing.map((m) => m.field)).toContain("payerName");
    expect(missing.find((m) => m.field === "payerName")?.reference).toBe("B-1 r.5, art. 38(1)c");
  });

  it("cite l'article ontarien pour un cabinet ontarien (PR-7)", () => {
    const missing = findMissingEntryFields({ direction: "RECEIPT" }, "ON");
    expect(missing[0]!.reference).toBe("By-Law 9, s. 18(1)");
  });

  it("ne signale rien quand la recette est complète", () => {
    const missing = findMissingEntryFields(
      { direction: "RECEIPT", payerName: "Jean Tremblay", purposeCode: "AVANCE_HONORAIRES" },
      "QC",
    );
    expect(missing).toHaveLength(0);
  });

  it("traite un payeur composé d'espaces comme absent", () => {
    const missing = findMissingEntryFields(
      { direction: "RECEIPT", payerName: "   ", purposeCode: "REGLEMENT" },
      "QC",
    );
    expect(missing.map((m) => m.field)).toContain("payerName");
  });
});

describe("Champs exigés sur un débours (art. 38(2))", () => {
  it("exige le bénéficiaire, l'objet et le mode de retrait", () => {
    const missing = findMissingEntryFields({ direction: "DISBURSEMENT" }, "QC");
    expect(missing.map((m) => m.field)).toEqual(
      expect.arrayContaining(["payeeName", "purposeCode", "modePaiement"]),
    );
  });

  it("exige le numéro de chèque QUAND le débours se fait par chèque", () => {
    // Le texte dit « le numéro de chèque, LE CAS ÉCHÉANT » : l'exiger sur un virement
    // serait ajouter au règlement.
    const parCheque = findMissingEntryFields(
      {
        direction: "DISBURSEMENT",
        payeeName: "Ville de Montréal",
        purposeCode: "PAIEMENT_TIERS",
        modePaiement: "CHEQUE",
      },
      "QC",
    );
    expect(parCheque.map((m) => m.field)).toContain("chequeNumber");

    const parVirement = findMissingEntryFields(
      {
        direction: "DISBURSEMENT",
        payeeName: "Ville de Montréal",
        purposeCode: "PAIEMENT_TIERS",
        modePaiement: "VIREMENT",
      },
      "QC",
    );
    expect(parVirement).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════════════════════════
   Bénéficiaire d'un chèque — art. 57 al. 2 / s. 11(a)
   ════════════════════════════════════════════════════════════════ */

describe("Bénéficiaire d'un chèque en fidéicommis", () => {
  it("accepte un bénéficiaire nominatif", () => {
    expect(checkChequePayee("Ville de Montréal", "QC").valid).toBe(true);
  });

  it("REFUSE un chèque en blanc (art. 57 al. 2)", () => {
    const r = checkChequePayee("  ", "QC");
    expect(r.valid).toBe(false);
    expect(r.code).toBe("PAYEE_BLANK");
  });

  it("REFUSE « cash », « caisse », « porteur », quelles que soient casse et accents", () => {
    for (const p of ["cash", "CASH", "Caisse", "caisse ", "Porteur", "au porteur", "Bearer"]) {
      const r = checkChequePayee(p, "QC");
      expect(r.valid, `« ${p} » aurait dû être refusé`).toBe(false);
      expect(r.code).toBe("PAYEE_TO_CASH_OR_BEARER");
    }
  });

  it("n'écarte PAS un vrai nom contenant un mot interdit", () => {
    // « Caisse Desjardins » est un bénéficiaire parfaitement légitime. Refuser sur
    // simple présence du mot bloquerait un paiement licite, ce qui pousse au
    // contournement (PR-2).
    expect(checkChequePayee("Caisse Desjardins de Québec", "QC").valid).toBe(true);
  });

  it("cite l'article de la province", () => {
    expect(checkChequePayee("cash", "QC").reference).toBe("B-1 r.5, art. 57 al. 2");
    expect(checkChequePayee("cash", "ON").reference).toBe("By-Law 9, s. 11(a)");
  });
});

/* ════════════════════════════════════════════════════════════════
   Séquence des chèques — art. 61
   ════════════════════════════════════════════════════════════════ */

describe("Numérotation consécutive des chèques (art. 61)", () => {
  it("ne signale rien sur une séquence continue", () => {
    expect(findChequeSequenceGaps([101, 102, 103, 104])).toEqual([]);
  });

  it("détecte les numéros manquants", () => {
    expect(findChequeSequenceGaps([101, 104, 105])).toEqual([102, 103]);
  });

  it("tolère un ordre de saisie quelconque", () => {
    expect(findChequeSequenceGaps([105, 101, 103])).toEqual([102, 104]);
  });

  it("ne signale rien avec zéro ou un seul chèque", () => {
    expect(findChequeSequenceGaps([])).toEqual([]);
    expect(findChequeSequenceGaps([101])).toEqual([]);
  });

  it("signale un chèque en circulation depuis plus de six mois", () => {
    const now = new Date("2026-07-31T00:00:00Z");
    expect(isChequeStale(new Date("2026-01-01T00:00:00Z"), now)).toBe(true);
    expect(isChequeStale(new Date("2026-06-01T00:00:00Z"), now)).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════
   Pièces justificatives — art. 32 / s. 18(10)
   ════════════════════════════════════════════════════════════════ */

describe("Pièces attendues selon le mode", () => {
  it("recette par chèque : copie du chèque reçu + bordereau de dépôt", () => {
    const e = getExpectedDocuments("RECEIPT", "CHEQUE", "QC").map((d) => d.role);
    expect(e).toEqual(["CHEQUE_RECU", "BORDEREAU_DEPOT"]);
  });

  it("recette par virement : confirmation de l'opération", () => {
    expect(getExpectedDocuments("RECEIPT", "VIREMENT", "QC").map((d) => d.role)).toEqual([
      "CONFIRMATION_VIREMENT",
    ]);
  });

  it("recette en espèces : reçu signé (art. 70, sans seuil)", () => {
    const e = getExpectedDocuments("RECEIPT", "ESPECES", "QC");
    expect(e.map((d) => d.role)).toEqual(["RECU_ESPECES"]);
    expect(e[0]!.reference).toBe("B-1 r.5, art. 70");
  });

  it("débours par chèque : chèque compensé", () => {
    expect(getExpectedDocuments("DISBURSEMENT", "CHEQUE", "QC").map((d) => d.role)).toEqual([
      "CHEQUE_COMPENSE",
    ]);
  });

  it("liste ce qui manque parmi les pièces attendues", () => {
    const expected = getExpectedDocuments("RECEIPT", "CHEQUE", "QC");
    const missing = findMissingDocuments(expected, ["CHEQUE_RECU"]);
    expect(missing.map((d) => d.role)).toEqual(["BORDEREAU_DEPOT"]);
  });

  it("ne réclame rien quand tout est joint", () => {
    const expected = getExpectedDocuments("RECEIPT", "CHEQUE", "QC");
    expect(findMissingDocuments(expected, ["CHEQUE_RECU", "BORDEREAU_DEPOT"])).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════════════════════════
   Délai de dépôt — art. 50 / s. 7(1)
   ════════════════════════════════════════════════════════════════ */

describe("Délai de dépôt", () => {
  it("mesure l'écart entre réception et dépôt", () => {
    const v = evaluateDepositDelay({
      receivedAt: new Date("2026-06-01T09:00:00Z"),
      depositedAt: new Date("2026-06-04T09:00:00Z"),
      province: "QC",
    });
    expect(v.days).toBe(3);
    expect(v.late).toBe(true);
  });

  it("ne signale rien pour un dépôt le jour même ou le lendemain", () => {
    expect(
      evaluateDepositDelay({
        receivedAt: new Date("2026-06-01T09:00:00Z"),
        depositedAt: new Date("2026-06-02T09:00:00Z"),
        province: "QC",
      }).late,
    ).toBe(false);
  });

  it("reste muet quand une des deux dates manque", () => {
    const v = evaluateDepositDelay({
      receivedAt: null,
      depositedAt: new Date("2026-06-02T09:00:00Z"),
      province: "QC",
    });
    expect(v.days).toBeNull();
    expect(v.late).toBe(false);
  });

  it("dit explicitement que le repère n'est PAS un délai réglementaire", () => {
    // Aucun des deux textes ne chiffre un nombre de jours. Présenter le seuil comme
    // une règle du Barreau serait inventer une exigence.
    const qc = evaluateDepositDelay({ receivedAt: null, depositedAt: null, province: "QC" });
    expect(qc.noteFr).toContain("sans chiffrer de nombre de jours");
    expect(qc.reference).toBe("B-1 r.5, art. 50");

    const on = evaluateDepositDelay({ receivedAt: null, depositedAt: null, province: "ON" });
    expect(on.reference).toBe("By-Law 9, s. 7(1)");
  });
});
