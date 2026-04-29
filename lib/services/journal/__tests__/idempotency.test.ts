import { describe, it, expect } from "vitest";
import {
  isJournalIdempotencyConflict,
  JOURNAL_IDEMPOTENCY_INDEX,
} from "../idempotency";

/**
 * Tests purs du détecteur de violation d'unicité du journal général.
 *
 * On simule la forme des erreurs Prisma (`PrismaClientKnownRequestError`)
 * sans en construire une vraie instance — duck typing volontaire pour rester
 * indépendant de la version Prisma exacte.
 */

describe("isJournalIdempotencyConflict", () => {
  it("matche par nom canonique de l'index dans meta.constraint", () => {
    const err = {
      code: "P2002",
      meta: { constraint: JOURNAL_IDEMPOTENCY_INDEX },
    };
    expect(isJournalIdempotencyConflict(err)).toBe(true);
  });

  it("matche par nom canonique de l'index dans meta.target (string)", () => {
    const err = {
      code: "P2002",
      meta: { target: JOURNAL_IDEMPOTENCY_INDEX },
    };
    expect(isJournalIdempotencyConflict(err)).toBe(true);
  });

  it("matche par composition des colonnes (cabinetId + sourceModule + sourceId)", () => {
    const err = {
      code: "P2002",
      meta: { target: ["cabinetId", "sourceModule", "sourceId"] },
    };
    expect(isJournalIdempotencyConflict(err)).toBe(true);
  });

  it("ignore une violation P2002 sur une autre colonne (ex: id)", () => {
    const err = {
      code: "P2002",
      meta: { target: ["id"] },
    };
    expect(isJournalIdempotencyConflict(err)).toBe(false);
  });

  it("ignore une violation P2002 sur une autre table (constraint inconnue)", () => {
    const err = {
      code: "P2002",
      meta: { constraint: "Invitation_token_key" },
    };
    expect(isJournalIdempotencyConflict(err)).toBe(false);
  });

  it("retourne false pour une erreur autre que P2002", () => {
    expect(isJournalIdempotencyConflict({ code: "P2003", meta: { constraint: JOURNAL_IDEMPOTENCY_INDEX } })).toBe(false);
    expect(isJournalIdempotencyConflict(new Error("network"))).toBe(false);
    expect(isJournalIdempotencyConflict(null)).toBe(false);
    expect(isJournalIdempotencyConflict(undefined)).toBe(false);
  });

  it("retourne false si meta absent même avec code P2002", () => {
    expect(isJournalIdempotencyConflict({ code: "P2002" })).toBe(false);
  });

  it("matche aussi via meta.modelName quand Prisma n'expose que ça", () => {
    const err = {
      code: "P2002",
      meta: { modelName: JOURNAL_IDEMPOTENCY_INDEX },
    };
    expect(isJournalIdempotencyConflict(err)).toBe(true);
  });
});
