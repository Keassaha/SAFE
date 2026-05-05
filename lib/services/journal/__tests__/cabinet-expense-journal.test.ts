import { describe, expect, it, beforeEach, vi } from "vitest";
import type { CabinetExpense, PrismaClient } from "@prisma/client";
import {
  writeJournalForCabinetExpense,
  CABINET_EXPENSE_JOURNAL_SOURCE_MODULE,
} from "../cabinet-expense-journal";

/**
 * Tests unitaires du helper `writeJournalForCabinetExpense`.
 *
 * On injecte un client Prisma simulé (mock) afin de garder les tests purs:
 * pas de base de données, pas de fixtures lourdes. La forme du mock reflète
 * l'API réelle de `prisma.journalGeneralEntry` (`findFirst` + `create`).
 */

interface MockJgeStore {
  /** Si défini, `findFirst` retourne cette entrée pour le check d'idempotence. */
  existing?: { id: string } | null;
  /** Si défini, `create` lève cette erreur (simule un conflit concurrent P2002). */
  createThrows?: unknown;
  /** Si défini, le `findFirst` qui suit l'erreur retourne cette entrée. */
  existingAfterRace?: { id: string } | null;
  /** Capture des arguments de `create` pour assertions. */
  createCalls: Array<Record<string, unknown>>;
  /** Capture des arguments de `findFirst` (utile pour vérifier qu'on saute le check). */
  findFirstCalls: Array<Record<string, unknown>>;
}

function buildMockClient(store: MockJgeStore): PrismaClient {
  let createAttempts = 0;
  const findFirst = vi.fn().mockImplementation(async (args) => {
    store.findFirstCalls.push(args);
    const where = (args?.where ?? {}) as Record<string, unknown>;
    const isIdempotencyCheck = "sourceId" in where && "sourceModule" in where;
    if (!isIdempotencyCheck) return null; // lecture du solde précédent
    // Si on a déjà tenté un create (P2002) et qu'une "gagnante" est définie,
    // on retourne cette gagnante au refind après catch.
    if (createAttempts > 0 && store.existingAfterRace !== undefined) {
      return store.existingAfterRace;
    }
    return store.existing ?? null;
  });
  const create = vi.fn().mockImplementation(async (args) => {
    createAttempts += 1;
    if (store.createThrows !== undefined) {
      throw store.createThrows;
    }
    store.createCalls.push(args);
    return { id: `jge-${store.createCalls.length}` };
  });
  return {
    $executeRaw: vi.fn().mockResolvedValue(undefined),
    journalGeneralEntry: { findFirst, create },
  } as unknown as PrismaClient;
}

function buildExpense(over: Partial<CabinetExpense> = {}): CabinetExpense {
  return {
    id: "exp_1",
    cabinetId: "cab_1",
    transactionImportId: null,
    date: new Date("2026-04-15"),
    descriptionBancaire: "VIDEOTRON LTEE PREAUTORISE",
    fournisseurNormalise: "Vidéotron",
    categoryId: null,
    categoryName: "Télécommunications",
    sousCategorie: null,
    montant: 89.5,
    montantHt: null,
    tps: null,
    tvq: null,
    montantTtc: 89.5,
    typeTransaction: "DEPENSE",
    dossierId: null,
    refacturable: false,
    statutValidation: "VALIDE",
    confidence: 0.92,
    createdById: "user_1",
    createdAt: new Date("2026-04-15"),
    updatedAt: new Date("2026-04-15"),
    ...over,
  } as CabinetExpense;
}

let store: MockJgeStore;
let client: PrismaClient;

beforeEach(() => {
  store = { createCalls: [], findFirstCalls: [] };
  client = buildMockClient(store);
});

describe("writeJournalForCabinetExpense — DEPENSE (cas nominal)", () => {
  it("crée une entrée DEPENSE en sortie avec le bon mapping", async () => {
    const expense = buildExpense();
    const result = await writeJournalForCabinetExpense(expense, { client });

    expect(result).toMatchObject({ created: true, journalId: "jge-1" });
    expect(store.createCalls).toHaveLength(1);

    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.cabinetId).toBe("cab_1");
    expect(data.typeTransaction).toBe("DEPENSE");
    expect(data.montantSortie).toBe(89.5);
    expect(data.montantEntree).toBe(0);
    expect(data.sourceModule).toBe(CABINET_EXPENSE_JOURNAL_SOURCE_MODULE);
    expect(data.sourceId).toBe("exp_1");
    expect(data.categorie).toBe("Télécommunications");
    expect(data.dossierId).toBeNull();
    // La référence n'est jamais utilisée pour l'idempotence ; elle reste null.
    expect(data.reference).toBeNull();
    // Description = "Fournisseur — descriptionBancaire" (les deux diffèrent).
    expect(data.description).toBe("Vidéotron — VIDEOTRON LTEE PREAUTORISE");
  });

  it("propage dossierId quand la dépense y est rattachée", async () => {
    const expense = buildExpense({ dossierId: "dos_42" });
    await writeJournalForCabinetExpense(expense, { client });

    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.dossierId).toBe("dos_42");
  });

  it("description fallback sur le fournisseur seul si la description bancaire est vide", async () => {
    const expense = buildExpense({
      fournisseurNormalise: "Stripe",
      descriptionBancaire: "",
    });
    await writeJournalForCabinetExpense(expense, { client });
    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.description).toBe("Stripe");
  });

  it("description fallback sur la description bancaire si pas de fournisseur normalisé", async () => {
    const expense = buildExpense({
      fournisseurNormalise: null,
      descriptionBancaire: "BOUTIQUE LOCALE 1234 MTL",
    });
    await writeJournalForCabinetExpense(expense, { client });
    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.description).toBe("BOUTIQUE LOCALE 1234 MTL");
  });

  it("utilisateurId fallback sur createdById si non passé en options", async () => {
    const expense = buildExpense({ createdById: "user_42" });
    await writeJournalForCabinetExpense(expense, { client });
    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.utilisateurId).toBe("user_42");
  });
});

describe("writeJournalForCabinetExpense — idempotence", () => {
  it("retourne created=false sans rien écrire si une entrée existe déjà", async () => {
    store.existing = { id: "jge-already" };
    const expense = buildExpense();

    const result = await writeJournalForCabinetExpense(expense, { client });

    expect(result).toEqual({
      created: false,
      journalId: "jge-already",
      reason: "already_journalized",
    });
    expect(store.createCalls).toHaveLength(0);
    // La requête d'idempotence cible bien (cabinetId, sourceModule, sourceId).
    expect(store.findFirstCalls[0]!.where).toEqual({
      cabinetId: "cab_1",
      sourceModule: CABINET_EXPENSE_JOURNAL_SOURCE_MODULE,
      sourceId: "exp_1",
    });
  });

  it("un second appel sur le même client (existing post-création) ne re-crée pas", async () => {
    const expense = buildExpense();

    // 1er appel : pas d'existing, on crée.
    await writeJournalForCabinetExpense(expense, { client });
    expect(store.createCalls).toHaveLength(1);

    // Simule l'état post-création: l'entrée existe désormais.
    store.existing = { id: "jge-1" };

    // 2ème appel : le helper trouve l'existant et n'écrit pas.
    const result2 = await writeJournalForCabinetExpense(expense, { client });
    expect(result2).toMatchObject({ created: false, reason: "already_journalized" });
    expect(store.createCalls).toHaveLength(1); // toujours 1, pas 2
  });
});

describe("writeJournalForCabinetExpense — CREDIT (remboursement fournisseur)", () => {
  it("crée une entrée AJUSTEMENT en entrée", async () => {
    const expense = buildExpense({ typeTransaction: "CREDIT", montant: 50 });
    const result = await writeJournalForCabinetExpense(expense, { client });

    expect(result).toMatchObject({ created: true });
    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.typeTransaction).toBe("AJUSTEMENT");
    expect(data.montantEntree).toBe(50);
    expect(data.montantSortie).toBe(0);
    expect(data.sourceId).toBe("exp_1");
    expect(data.sourceModule).toBe(CABINET_EXPENSE_JOURNAL_SOURCE_MODULE);
  });
});

describe("writeJournalForCabinetExpense — types non journalisables", () => {
  it("IGNORE → no-op, sans toucher au journal", async () => {
    const expense = buildExpense({ typeTransaction: "IGNORE" });
    const result = await writeJournalForCabinetExpense(expense, { client });

    expect(result).toEqual({ created: false, reason: "type_not_journalizable" });
    expect(store.findFirstCalls).toHaveLength(0);
    expect(store.createCalls).toHaveLength(0);
  });

  it("TRANSFERT → no-op (out of scope V2)", async () => {
    const expense = buildExpense({ typeTransaction: "TRANSFERT" });
    const result = await writeJournalForCabinetExpense(expense, { client });
    expect(result.reason).toBe("type_not_journalizable");
    expect(store.createCalls).toHaveLength(0);
  });

  it("AUTRE → no-op", async () => {
    const expense = buildExpense({ typeTransaction: "AUTRE" });
    const result = await writeJournalForCabinetExpense(expense, { client });
    expect(result.reason).toBe("type_not_journalizable");
    expect(store.createCalls).toHaveLength(0);
  });
});

describe("writeJournalForCabinetExpense — montant nul", () => {
  it("amount = 0 → no-op explicite", async () => {
    const expense = buildExpense({ montant: 0, montantTtc: 0 });
    const result = await writeJournalForCabinetExpense(expense, { client });

    expect(result).toEqual({ created: false, reason: "amount_zero" });
    expect(store.createCalls).toHaveLength(0);
  });
});

describe("writeJournalForCabinetExpense — course concurrente (P2002)", () => {
  it("transforme un P2002 sur l'index d'idempotence en no-op idempotent", async () => {
    // Scénario : findFirst initial retourne null (pas d'écriture connue)
    // → create lance un P2002 (un autre process a écrit entre-temps)
    // → le helper relit findFirst, trouve le gagnant, retourne already_journalized.
    store.existing = null;
    store.createThrows = {
      code: "P2002",
      meta: { constraint: "JournalGeneralEntry_idempotency_key" },
    };
    store.existingAfterRace = { id: "jge-winner" };

    const expense = buildExpense();
    const result = await writeJournalForCabinetExpense(expense, { client });

    expect(result).toEqual({
      created: false,
      journalId: "jge-winner",
      reason: "already_journalized",
    });
    // Aucune écriture côté ce caller.
    expect(store.createCalls).toHaveLength(0);
    // Deux findFirst d'idempotence : l'initial + le refind après le P2002.
    const idempotencyCalls = store.findFirstCalls.filter(
      (c) => "sourceId" in (c.where as Record<string, unknown>),
    );
    expect(idempotencyCalls).toHaveLength(2);
  });

  it("rejette les autres erreurs (ex: P2003 ou erreur réseau)", async () => {
    store.existing = null;
    store.createThrows = new Error("network down");

    const expense = buildExpense();
    await expect(writeJournalForCabinetExpense(expense, { client })).rejects.toThrow("network down");
  });

  it("rejette un P2002 qui ne concerne PAS l'index d'idempotence", async () => {
    store.existing = null;
    store.createThrows = {
      code: "P2002",
      meta: { target: ["id"] }, // collision sur le PK, pas notre index
    };

    const expense = buildExpense();
    await expect(writeJournalForCabinetExpense(expense, { client })).rejects.toMatchObject({
      code: "P2002",
    });
  });
});
