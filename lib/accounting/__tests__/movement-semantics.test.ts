import { describe, expect, it } from "vitest";
import { describeMovement, type MovementInput } from "@/lib/accounting/movement-semantics";

function entry(partial: Partial<MovementInput>): MovementInput {
  return {
    typeTransaction: "AJUSTEMENT",
    sourceModule: "AJUSTEMENT_MANUEL",
    montantEntree: 0,
    montantSortie: 0,
    ...partial,
  };
}

describe("describeMovement", () => {
  it("FACTURE émise → augmente le dû, aucun impact trésorerie", () => {
    const v = describeMovement(
      entry({ typeTransaction: "FACTURE", sourceModule: "FACTURATION", montantEntree: 1150 }),
    );
    expect(v.kind).toBe("INVOICE_ISSUED");
    expect(v.increasesDue).toBe(1150);
    expect(v.reducesDue).toBe(0);
    expect(v.cashImpact).toBe(0);
    expect(v.relatedBalance).toBe("RECEIVABLE");
    expect(v.tone).toBe("warning");
  });

  it("note de crédit (FACTURE à net négatif) → réduit le dû", () => {
    const v = describeMovement(
      entry({ typeTransaction: "FACTURE", sourceModule: "FACTURATION", montantSortie: 200 }),
    );
    expect(v.kind).toBe("CREDIT_NOTE");
    expect(v.reducesDue).toBe(200);
    expect(v.increasesDue).toBe(0);
    expect(v.cashImpact).toBe(0);
    expect(v.relatedBalance).toBe("RECEIVABLE");
  });

  it("PAIEMENT reçu → réduit le dû et entre en trésorerie (vert)", () => {
    const v = describeMovement(
      entry({ typeTransaction: "PAIEMENT", sourceModule: "PAIEMENTS", montantEntree: 500 }),
    );
    expect(v.kind).toBe("PAYMENT_RECEIVED");
    expect(v.reducesDue).toBe(500);
    expect(v.cashImpact).toBe(500);
    expect(v.tone).toBe("positive");
  });

  it("DÉPENSE → sortie de trésorerie, ne touche pas le dû", () => {
    const v = describeMovement(
      entry({ typeTransaction: "DEPENSE", sourceModule: "DEPENSES", montantSortie: 80 }),
    );
    expect(v.kind).toBe("EXPENSE");
    expect(v.cashImpact).toBe(-80);
    expect(v.increasesDue).toBe(0);
    expect(v.reducesDue).toBe(0);
    expect(v.relatedBalance).toBe("OPERATING_CASH");
    expect(v.tone).toBe("reduction");
  });

  it("DÉBOURS récupérable → sortie de trésorerie, suivi à part (jamais aux comptes à recevoir)", () => {
    const v = describeMovement(
      entry({ typeTransaction: "DEBOURS", sourceModule: "DEBOURS", montantSortie: 150 }),
    );
    expect(v.kind).toBe("DISBURSEMENT");
    expect(v.cashImpact).toBe(-150);
    expect(v.relatedBalance).toBe("DISBURSEMENTS");
    expect(v.relatedBalance).not.toBe("RECEIVABLE");
  });

  it("FIDÉICOMMIS (dépôt) → reste séparé : aucun impact sur la trésorerie du cabinet", () => {
    const dep = describeMovement(
      entry({ typeTransaction: "DEPOT_FIDEICOMMIS", sourceModule: "FIDEICOMMIS", montantEntree: 5000 }),
    );
    expect(dep.kind).toBe("TRUST_DEPOSIT");
    expect(dep.cashImpact).toBe(0);
    expect(dep.relatedBalance).toBe("TRUST");

    const ret = describeMovement(
      entry({ typeTransaction: "RETRAIT_FIDEICOMMIS", sourceModule: "FIDEICOMMIS", montantSortie: 5000 }),
    );
    expect(ret.kind).toBe("TRUST_WITHDRAWAL");
    expect(ret.cashImpact).toBe(0);
    expect(ret.relatedBalance).toBe("TRUST");
  });

  it("CORRECTION issue du module FIDEICOMMIS → ajuste le fidéicommis, pas le cabinet", () => {
    const v = describeMovement(
      entry({ typeTransaction: "CORRECTION", sourceModule: "FIDEICOMMIS", montantEntree: 10 }),
    );
    expect(v.kind).toBe("CORRECTION_TRUST");
    expect(v.cashImpact).toBe(0);
    expect(v.relatedBalance).toBe("TRUST");
  });

  it("AJUSTEMENT cash → impact trésorerie signé selon la direction", () => {
    const credit = describeMovement(
      entry({ typeTransaction: "AJUSTEMENT", sourceModule: "AJUSTEMENT_MANUEL", montantEntree: 40 }),
    );
    expect(credit.cashImpact).toBe(40);
    const debit = describeMovement(
      entry({ typeTransaction: "AJUSTEMENT", sourceModule: "AJUSTEMENT_MANUEL", montantSortie: 40 }),
    );
    expect(debit.cashImpact).toBe(-40);
    expect(debit.tone).toBe("reduction");
  });
});
