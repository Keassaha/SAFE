import { describe, expect, it } from "vitest";
import {
  electronicTransferRegime,
  evaluateDualControl,
  evaluateLicenceHandling,
  evaluateRequisitionOrder,
  evaluateSignatory,
  findMissingConfirmationFields,
  getConfirmationFields,
  getCountersignatureDuty,
  getLedgerTransferRule,
  getPermittedWithdrawalMethods,
} from "../electronic-transfer";

/**
 * CH-07 — Virements électroniques et pouvoir de signature.
 *
 * Ferme ON-15 à ON-21, ON-28 et ON-01 de l'audit.
 *
 * Le point central : le régime est ASYMÉTRIQUE. La s. 12 By-Law 9 impose un appareil
 * complet dont B-1 r.5 n'a aucun équivalent. Imposer le Form 9A à un cabinet
 * québécois inventerait une obligation.
 */

const NOW = new Date("2026-07-15T12:00:00Z");

/* ════════════════════════════════════════════════════════════════
   Applicabilité — le point le plus important
   ════════════════════════════════════════════════════════════════ */

describe("Applicabilité du régime des virements", () => {
  it("s'applique en Ontario (s. 12)", () => {
    const r = electronicTransferRegime("ON");
    expect(r.applies).toBe(true);
    expect(r.reference).toBe("By-Law 9, s. 12");
  });

  it("NE s'applique PAS au Québec, et le dit", () => {
    // B-1 r.5 art. 58 permet le virement sans réquisition, sans double contrôle et
    // sans formulaire. Imposer le Form 9A ici inventerait une obligation.
    const r = electronicTransferRegime("QC");
    expect(r.applies).toBe(false);
    expect(r.reference).toBe("B-1 r.5, art. 58");
    expect(r.noteFr).toContain("ni réquisition, ni double contrôle");
  });

  it("le virement électronique est un mode distinct en Ontario seulement", () => {
    expect(getPermittedWithdrawalMethods("ON").methods).toContain("ELECTRONIC_TRANSFER");
    // L'art. 58 énumère le chèque à l'ordre de l'avocat et le virement vers un compte
    // non fiduciaire. Il n'isole pas le virement électronique comme catégorie.
    expect(getPermittedWithdrawalMethods("QC").methods).not.toContain("ELECTRONIC_TRANSFER");
  });
});

/* ════════════════════════════════════════════════════════════════
   Double contrôle — s. 12(2)1 et l'exemption 12(3)
   ════════════════════════════════════════════════════════════════ */

describe("Double contrôle", () => {
  it("accepte deux personnes distinctes", () => {
    const v = evaluateDualControl({
      dataEnteredByUserId: "u1",
      authorizedByUserId: "u2",
      isSolePractitioner: false,
    });
    expect(v).toMatchObject({ status: "OK", reason: "dual_control" });
  });

  it("REFUSE la même personne aux deux étapes", () => {
    const v = evaluateDualControl({
      dataEnteredByUserId: "u1",
      authorizedByUserId: "u1",
      isSolePractitioner: false,
    });
    expect(v).toMatchObject({ status: "REFUSED", code: "SAME_PERSON_BOTH_STEPS" });
  });

  it("ADMET la même personne pour le praticien véritablement seul (s. 12(3))", () => {
    const v = evaluateDualControl({
      dataEnteredByUserId: "u1",
      authorizedByUserId: "u1",
      isSolePractitioner: true,
    });
    expect(v).toMatchObject({ status: "OK", reason: "sole_practitioner_exemption" });
    if (v.status === "OK") expect(v.reference).toBe("By-Law 9, s. 12(3)");
  });

  it("REFUSE quand une étape manque", () => {
    const v = evaluateDualControl({
      dataEnteredByUserId: "u1",
      authorizedByUserId: null,
      isSolePractitioner: true,
    });
    expect(v).toMatchObject({ status: "REFUSED", code: "DUAL_CONTROL_REQUIRED" });
  });

  it("explique ce qu'il faut faire à la place (PR-2)", () => {
    const v = evaluateDualControl({
      dataEnteredByUserId: "u1",
      authorizedByUserId: "u1",
      isSolePractitioner: false,
    });
    if (v.status === "REFUSED") expect(v.remedyFr).toContain("deux personnes distinctes");
  });
});

/* ════════════════════════════════════════════════════════════════
   Ordre chronologique — s. 12(2)4
   ════════════════════════════════════════════════════════════════ */

describe("Réquisition signée AVANT la saisie", () => {
  it("accepte une réquisition antérieure à la saisie", () => {
    const v = evaluateRequisitionOrder({
      signedAt: new Date("2026-07-10T09:00:00Z"),
      dataEnteredAt: new Date("2026-07-10T10:00:00Z"),
    });
    expect(v.status).toBe("OK");
  });

  it("REFUSE une réquisition signée APRÈS la saisie", () => {
    // L'ordre est la substance de la règle. Une réquisition signée après coup ne
    // vérifie rien, elle régularise. Vérifier seulement son existence laisserait
    // passer exactement ce que la s. 12(2)4 veut empêcher.
    const v = evaluateRequisitionOrder({
      signedAt: new Date("2026-07-10T11:00:00Z"),
      dataEnteredAt: new Date("2026-07-10T10:00:00Z"),
    });
    expect(v).toMatchObject({ status: "REFUSED", code: "REQUISITION_SIGNED_AFTER_ENTRY" });
  });

  it("REFUSE l'absence de réquisition", () => {
    const v = evaluateRequisitionOrder({ signedAt: null, dataEnteredAt: new Date() });
    expect(v).toMatchObject({ status: "REFUSED", code: "REQUISITION_NOT_SIGNED" });
  });
});

/* ════════════════════════════════════════════════════════════════
   Confirmation — s. 12(2)3
   ════════════════════════════════════════════════════════════════ */

describe("Confirmation de l'institution", () => {
  it("énumère les six éléments exigés", () => {
    const keys = getConfirmationFields().map((f) => f.key);
    expect(keys).toEqual([
      "sourceAccountNumber",
      "recipientInstitution",
      "recipientName",
      "recipientAccountNumber",
      "institutionReceivedAt",
      "confirmationSentAt",
    ]);
  });

  it("cite le sous-alinéa de chaque élément", () => {
    expect(getConfirmationFields()[0]!.reference).toBe("s. 12(2)3i");
    expect(getConfirmationFields()[5]!.reference).toBe("s. 12(2)3vi");
  });

  it("signale les éléments manquants", () => {
    const missing = findMissingConfirmationFields({
      sourceAccountNumber: "12345",
      recipientInstitution: "  ",
      recipientName: "Cabinet Tremblay",
    });
    expect(missing.map((f) => f.key)).toEqual(
      expect.arrayContaining([
        "recipientInstitution",
        "recipientAccountNumber",
        "institutionReceivedAt",
        "confirmationSentAt",
      ]),
    );
  });

  it("ne signale rien quand les six sont là", () => {
    const complete = Object.fromEntries(getConfirmationFields().map((f) => [f.key, "valeur"]));
    expect(findMissingConfirmationFields(complete)).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════════════════════════
   Contresignature — s. 12(5)
   ════════════════════════════════════════════════════════════════ */

describe("Contresignature de la confirmation", () => {
  it("échoit le jour bancaire suivant l'envoi", () => {
    const d = getCountersignatureDuty({
      confirmationSentAt: new Date("2026-07-14T16:00:00Z"),
    });
    expect(d.dueAt.toISOString().slice(0, 10)).toBe("2026-07-15");
    expect(d.reference).toBe("By-Law 9, s. 12(5)");
  });

  it("saute les jours non bancaires", () => {
    const ferme = new Set(["2026-07-18", "2026-07-19"]);
    const d = getCountersignatureDuty({
      confirmationSentAt: new Date("2026-07-17T16:00:00Z"),
      isBankingDay: (x) => !ferme.has(x.toISOString().slice(0, 10)),
    });
    expect(d.dueAt.toISOString().slice(0, 10)).toBe("2026-07-20");
  });

  it("énumère les quatre gestes exigés", () => {
    const d = getCountersignatureDuty({ confirmationSentAt: NOW });
    expect(d.steps.map((s) => s.key)).toEqual([
      "printed",
      "compared",
      "annotated",
      "countersigned",
    ]);
    expect(d.steps[2]!.labelFr).toContain("numéro de dossier");
  });

  it("ne boucle pas si tout est déclaré non bancaire", () => {
    const d = getCountersignatureDuty({
      confirmationSentAt: NOW,
      isBankingDay: () => false,
    });
    expect(d.dueAt).toBeInstanceOf(Date);
  });
});

/* ════════════════════════════════════════════════════════════════
   Signataires et cautionnement — s. 11(b), 12(2)4ii
   ════════════════════════════════════════════════════════════════ */

describe("Pouvoir de signature", () => {
  const base = {
    hasSigningAuthority: true,
    bondAmount: 100000,
    bondExpiryDate: new Date("2027-01-01T00:00:00Z"),
    maxBalancePreviousFiscalYear: 80000,
    now: NOW,
  };

  it("un titulaire de permis signe sans cautionnement", () => {
    const v = evaluateSignatory({ ...base, isLicensee: true, bondAmount: null });
    expect(v).toMatchObject({ status: "OK", reason: "licensee" });
  });

  it("un délégué cautionné suffisamment peut signer", () => {
    const v = evaluateSignatory({ ...base, isLicensee: false });
    expect(v).toMatchObject({ status: "OK", reason: "bonded_delegate" });
  });

  it("REFUSE un délégué sans pouvoir de signature", () => {
    const v = evaluateSignatory({ ...base, isLicensee: false, hasSigningAuthority: false });
    expect(v).toMatchObject({ status: "REFUSED", code: "NO_SIGNING_AUTHORITY" });
  });

  it("REFUSE un délégué non cautionné", () => {
    const v = evaluateSignatory({ ...base, isLicensee: false, bondAmount: null });
    expect(v).toMatchObject({ status: "REFUSED", code: "BOND_MISSING" });
  });

  it("REFUSE un cautionnement INFÉRIEUR au solde maximal de l'exercice précédent", () => {
    // Le montant n'est pas arbitraire : la s. 11(b) le fixe « at least equal to the
    // maximum balance on deposit during the immediately preceding fiscal year ».
    const v = evaluateSignatory({
      ...base,
      isLicensee: false,
      bondAmount: 50000,
      maxBalancePreviousFiscalYear: 80000,
    });
    expect(v).toMatchObject({ status: "REFUSED", code: "BOND_INSUFFICIENT" });
    if (v.status === "REFUSED") expect(v.messageFr).toContain("80000.00");
  });

  it("REFUSE un cautionnement échu", () => {
    const v = evaluateSignatory({
      ...base,
      isLicensee: false,
      bondExpiryDate: new Date("2026-01-01T00:00:00Z"),
    });
    expect(v).toMatchObject({ status: "REFUSED", code: "BOND_EXPIRED" });
  });
});

/* ════════════════════════════════════════════════════════════════
   Transferts entre cartes-clients — s. 18(4)
   ════════════════════════════════════════════════════════════════ */

describe("Transferts entre cartes-clients", () => {
  it("sont PERMIS, avec objet obligatoire, dans les deux régimes", () => {
    // SAFE les interdisait de façon absolue. C'est plus strict que les deux
    // règlements : la s. 18(4) en exige le REGISTRE, donc les suppose. Le
    // sur-blocage poussait au contournement par retrait puis dépôt, ce qui casse le
    // lien et rend ce registre impossible à produire.
    for (const p of ["QC", "ON"] as const) {
      const r = getLedgerTransferRule(p);
      expect(r.permitted, p).toBe(true);
      expect(r.purposeRequired, p).toBe(true);
    }
  });

  it("cite la s. 18(4) en Ontario et l'art. 56(3) au Québec", () => {
    expect(getLedgerTransferRule("ON").reference).toBe("By-Law 9, s. 18(4)");
    expect(getLedgerTransferRule("QC").reference).toContain("art. 56(3)");
  });
});

/* ════════════════════════════════════════════════════════════════
   Statut de permis — s. 2, 2.2, 2.3
   ════════════════════════════════════════════════════════════════ */

describe("Titulaire failli ou suspendu", () => {
  it("laisse manier les fonds à un permis actif", () => {
    const v = evaluateLicenceHandling({ province: "ON", status: "ACTIVE" });
    expect(v.mayHandleTrustFunds).toBe(true);
  });

  it("INTERDIT au titulaire failli de manier des fonds en fiducie (s. 2(1))", () => {
    const v = evaluateLicenceHandling({ province: "ON", status: "BANKRUPT" });
    expect(v.mayHandleTrustFunds).toBe(false);
    expect(v.reference).toBe("By-Law 9, s. 2(1)");
    // La s. 2(2) préserve le paiement des honoraires : le message le dit, plutôt que
    // de laisser croire à une interdiction totale.
    expect(v.messageFr).toContain("s. 2(2)");
  });

  it("donne 30 jours au suspendu pour retirer les fonds (s. 2.3(1))", () => {
    const v = evaluateLicenceHandling({
      province: "ON",
      status: "SUSPENDED",
      suspendedFrom: new Date("2026-06-01T00:00:00Z"),
    });
    expect(v.withdrawalDueAt?.toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("renvoie au régime québécois de cessation d'exercice, sans délai de 30 jours", () => {
    // B-1 r.5 traite la cessation aux art. 74 à 82 avec une logique différente :
    // cession à un avocat en exercice, prise de possession par le syndic. Appliquer
    // le délai ontarien ici serait une règle inventée.
    const v = evaluateLicenceHandling({ province: "QC", status: "SUSPENDED" });
    expect(v.reference).toBe("B-1 r.5, art. 74 à 82");
    expect(v.withdrawalDueAt).toBeNull();
  });
});
