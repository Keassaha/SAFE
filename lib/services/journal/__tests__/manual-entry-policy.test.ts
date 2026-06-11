import { describe, it, expect } from "vitest";
import {
  isManualEntryTypeAllowed,
  MANUAL_ALLOWED_TYPES,
} from "../manual-entry-policy";

describe("manual-entry-policy — saisie manuelle au journal (séparation des flux)", () => {
  it.each([
    "FACTURE",
    "PAIEMENT",
    "DEPOT_FIDEICOMMIS",
    "RETRAIT_FIDEICOMMIS",
    "DEPENSE",
    "DEBOURS",
  ] as const)(
    "REFUSE le type %s (anti double-comptage : doit passer par son module métier)",
    (type) => {
      expect(isManualEntryTypeAllowed(type)).toBe(false);
    },
  );

  it.each(["AJUSTEMENT", "CORRECTION"] as const)(
    "ACCEPTE le type %s (ajustement / correction documenté)",
    (type) => {
      expect(isManualEntryTypeAllowed(type)).toBe(true);
    },
  );

  it("la liste autorisée est exactement {AJUSTEMENT, CORRECTION}", () => {
    expect([...MANUAL_ALLOWED_TYPES].sort()).toEqual(["AJUSTEMENT", "CORRECTION"]);
  });
});
