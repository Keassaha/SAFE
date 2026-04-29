import { describe, expect, it } from "vitest";
import {
  classifyExpense,
  isCabinetExpense,
  isClientDisbursement,
  isRebillable,
  validateExpenseConsistency,
} from "@/lib/billing/expenses-doctrine";

describe("classifyExpense — doctrine du test décisif", () => {
  it("DeboursDossier explicite → client_disbursement", () => {
    expect(classifyExpense({ isDeboursDossier: true, dossierId: "d1" })).toBe("client_disbursement");
  });

  it("dossier + refacturable=true → client_disbursement", () => {
    expect(classifyExpense({ dossierId: "d1", refacturable: true })).toBe("client_disbursement");
  });

  it("dossier + catégorie 'frais gouvernementaux' → client_disbursement même sans flag", () => {
    expect(classifyExpense({ dossierId: "d1", categoryName: "Frais gouvernementaux IRCC" })).toBe("client_disbursement");
    expect(classifyExpense({ dossierId: "d1", categoryName: "Court filing fee" })).toBe("client_disbursement");
  });

  it("refacturable mais pas de dossier → ambiguous (à qualifier plus tard)", () => {
    expect(classifyExpense({ refacturable: true })).toBe("ambiguous");
  });

  it("Aucun lien client/dossier, non refacturable → cabinet_expense (loyer, abonnement)", () => {
    expect(classifyExpense({ categoryName: "Loyer" })).toBe("cabinet_expense");
    expect(classifyExpense({ categoryName: "Abonnement logiciel" })).toBe("cabinet_expense");
  });

  it("Dossier sans flag refacturable et catégorie ambiguë → cabinet_expense", () => {
    expect(classifyExpense({ dossierId: "d1", categoryName: "Repas client" })).toBe("cabinet_expense");
  });
});

describe("Raccourcis booléens", () => {
  it("isCabinetExpense", () => {
    expect(isCabinetExpense({ categoryName: "Loyer" })).toBe(true);
    expect(isCabinetExpense({ dossierId: "d1", refacturable: true })).toBe(false);
  });

  it("isClientDisbursement", () => {
    expect(isClientDisbursement({ dossierId: "d1", refacturable: true })).toBe(true);
    expect(isClientDisbursement({ refacturable: true })).toBe(false);
  });

  it("isRebillable strict: dossier + flag explicite", () => {
    expect(isRebillable({ dossierId: "d1", refacturable: true })).toBe(true);
    expect(isRebillable({ dossierId: "d1" })).toBe(false);
    expect(isRebillable({ refacturable: true })).toBe(false);
    expect(isRebillable({ isDeboursDossier: true, dossierId: "d1" })).toBe(true);
  });
});

describe("validateExpenseConsistency", () => {
  it("Refuse un débours dossier sans dossierId", () => {
    expect(validateExpenseConsistency({ isDeboursDossier: true })).toMatch(/dossierId/);
  });

  it("Accepte un débours dossier avec dossierId", () => {
    expect(validateExpenseConsistency({ isDeboursDossier: true, dossierId: "d1" })).toBeNull();
  });

  it("Accepte une dépense cabinet simple", () => {
    expect(validateExpenseConsistency({ categoryName: "Loyer" })).toBeNull();
  });
});
