import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  CabinetExpense,
  DeboursDossier,
  PrismaClient,
} from "@prisma/client";
import {
  hasMaterialCabinetExpenseChange,
  hasMaterialDeboursDossierChange,
  applyCabinetExpenseCorrection,
  applyDeboursDossierCorrection,
} from "../append-only-corrections";

/**
 * Tests unitaires des helpers de correction append-only.
 * Mock Prisma : on simule les écritures journal en mémoire pour vérifier que :
 *   - aucun update/delete n'est jamais effectué (append-only)
 *   - la CORRECTION + le re-jeu versionné suivent la doctrine
 *   - les changements non matériels sont ignorés
 */

interface MockedJournalEntry {
  id: string;
  cabinetId: string;
  dateTransaction: Date;
  typeTransaction: string;
  reference: string | null;
  clientId: string | null;
  dossierId: string | null;
  description: string;
  categorie: string | null;
  montantEntree: number;
  montantSortie: number;
  solde: number;
  sourceModule: string;
  sourceId: string | null;
  utilisateurId: string | null;
  createdAt: Date;
}

interface MockJournalStore {
  entries: MockedJournalEntry[];
  nextId: number;
  updateCalls: number;
  deleteCalls: number;
}

function buildMockClient(store: MockJournalStore): PrismaClient {
  const findFirst = vi.fn().mockImplementation(async (args: any) => {
    const where = args?.where ?? {};
    return (
      store.entries.find((e) => matchWhere(e, where)) ?? null
    );
  });

  const findMany = vi.fn().mockImplementation(async (args: any) => {
    const where = args?.where ?? {};
    return store.entries.filter((e) => matchWhere(e, where));
  });

  const create = vi.fn().mockImplementation(async (args: any) => {
    const data = args.data;
    const id = `jge-${++store.nextId}`;
    const entry: MockedJournalEntry = {
      id,
      cabinetId: data.cabinetId,
      dateTransaction: data.dateTransaction,
      typeTransaction: data.typeTransaction,
      reference: data.reference ?? null,
      clientId: data.clientId ?? null,
      dossierId: data.dossierId ?? null,
      description: data.description,
      categorie: data.categorie ?? null,
      montantEntree: data.montantEntree ?? 0,
      montantSortie: data.montantSortie ?? 0,
      solde: data.solde ?? 0,
      sourceModule: data.sourceModule,
      sourceId: data.sourceId ?? null,
      utilisateurId: data.utilisateurId ?? null,
      createdAt: new Date(),
    };
    store.entries.push(entry);
    return { id };
  });

  const update = vi.fn().mockImplementation(async () => {
    store.updateCalls += 1;
    throw new Error("APPEND-ONLY VIOLATION: journalGeneralEntry.update should never be called");
  });

  const deleteOp = vi.fn().mockImplementation(async () => {
    store.deleteCalls += 1;
    throw new Error("APPEND-ONLY VIOLATION: journalGeneralEntry.delete should never be called");
  });

  return {
    journalGeneralEntry: { findFirst, findMany, create, update, delete: deleteOp },
  } as unknown as PrismaClient;
}

function matchWhere(entry: MockedJournalEntry, where: any): boolean {
  if (where.cabinetId && entry.cabinetId !== where.cabinetId) return false;
  if (where.sourceModule && entry.sourceModule !== where.sourceModule) return false;

  if (where.sourceId !== undefined) {
    if (entry.sourceId !== where.sourceId) return false;
  }

  if (where.OR) {
    const orMatches = where.OR.some((cond: any) => {
      if (cond.sourceId !== undefined) {
        if (typeof cond.sourceId === "string") return entry.sourceId === cond.sourceId;
        if (cond.sourceId.startsWith) return entry.sourceId?.startsWith(cond.sourceId.startsWith);
      }
      return false;
    });
    if (!orMatches) return false;
  }
  return true;
}

function buildExpense(over: Partial<CabinetExpense> = {}): CabinetExpense {
  return {
    id: "exp_1",
    cabinetId: "cab_1",
    transactionImportId: null,
    date: new Date("2026-04-15"),
    descriptionBancaire: "VIDEOTRON",
    fournisseurNormalise: "Vidéotron",
    categoryId: null,
    categoryName: "Télécommunications",
    sousCategorie: null,
    montant: 100,
    montantHt: null,
    tps: null,
    tvq: null,
    montantTtc: 100,
    typeTransaction: "DEPENSE",
    dossierId: null,
    refacturable: false,
    statutValidation: "VALIDE",
    confidence: 0.92,
    createdById: "user_1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as CabinetExpense;
}

function buildDebours(over: Partial<DeboursDossier> = {}): DeboursDossier {
  return {
    id: "deb_1",
    cabinetId: "cab_1",
    dossierId: "dos_1",
    clientId: "cli_1",
    deboursTypeId: null,
    description: "Title Search",
    quantite: 1,
    montant: 250,
    taxable: false,
    date: new Date("2026-04-20"),
    payeParCabinet: true,
    refacturable: true,
    factureId: null,
    invoiceLineId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as DeboursDossier;
}

/**
 * Pré-charge une écriture journal initiale pour simuler un état "déjà journalisé".
 */
function seedInitialEntry(
  store: MockJournalStore,
  args: {
    cabinetId: string;
    sourceModule: "DEPENSES" | "DEBOURS";
    sourceId: string;
    montantSortie?: number;
    montantEntree?: number;
  },
): void {
  const id = `jge-seed-${++store.nextId}`;
  store.entries.push({
    id,
    cabinetId: args.cabinetId,
    dateTransaction: new Date("2026-04-15"),
    typeTransaction: args.sourceModule === "DEPENSES" ? "DEPENSE" : "DEBOURS",
    reference: null,
    clientId: null,
    dossierId: null,
    description: "seed",
    categorie: null,
    montantEntree: args.montantEntree ?? 0,
    montantSortie: args.montantSortie ?? 0,
    solde: 0,
    sourceModule: args.sourceModule,
    sourceId: args.sourceId,
    utilisateurId: null,
    createdAt: new Date(),
  });
}

let store: MockJournalStore;
let client: PrismaClient;

beforeEach(() => {
  store = { entries: [], nextId: 0, updateCalls: 0, deleteCalls: 0 };
  client = buildMockClient(store);
});

/* ════════════════════════════════════════════════════════════════
   DÉTECTION
   ════════════════════════════════════════════════════════════════ */

describe("hasMaterialCabinetExpenseChange — détection", () => {
  it("description seule changée → non matériel", () => {
    const before = buildExpense({ descriptionBancaire: "VIDEOTRON A" });
    const after = buildExpense({ descriptionBancaire: "VIDEOTRON LTEE" });
    expect(hasMaterialCabinetExpenseChange(before, after).material).toBe(false);
  });

  it("fournisseur normalisé seul changé → non matériel", () => {
    const before = buildExpense({ fournisseurNormalise: "Vidéotron" });
    const after = buildExpense({ fournisseurNormalise: "Videotron" });
    expect(hasMaterialCabinetExpenseChange(before, after).material).toBe(false);
  });

  it("refacturable changé → non matériel", () => {
    const before = buildExpense({ refacturable: false });
    const after = buildExpense({ refacturable: true });
    expect(hasMaterialCabinetExpenseChange(before, after).material).toBe(false);
  });

  it("montant changé → matériel", () => {
    const before = buildExpense({ montant: 100 });
    const after = buildExpense({ montant: 130 });
    const r = hasMaterialCabinetExpenseChange(before, after);
    expect(r.material).toBe(true);
    expect(r.reasons.join(" ")).toMatch(/montant: 100 → 130/);
  });

  it("date changée → matériel", () => {
    const before = buildExpense({ date: new Date("2026-04-15") });
    const after = buildExpense({ date: new Date("2026-04-16") });
    expect(hasMaterialCabinetExpenseChange(before, after).material).toBe(true);
  });

  it("typeTransaction DEPENSE → IGNORE → matériel", () => {
    const before = buildExpense({ typeTransaction: "DEPENSE" });
    const after = buildExpense({ typeTransaction: "IGNORE" });
    expect(hasMaterialCabinetExpenseChange(before, after).material).toBe(true);
  });

  it("dossierId apparaît → matériel", () => {
    const before = buildExpense({ dossierId: null });
    const after = buildExpense({ dossierId: "dos_42" });
    expect(hasMaterialCabinetExpenseChange(before, after).material).toBe(true);
  });
});

describe("hasMaterialDeboursDossierChange — détection", () => {
  it("description seule changée → non matériel", () => {
    const before = buildDebours({ description: "Title Search" });
    const after = buildDebours({ description: "Title Search ON" });
    expect(hasMaterialDeboursDossierChange(before, after).material).toBe(false);
  });

  it("taxable changé → non matériel", () => {
    expect(
      hasMaterialDeboursDossierChange(
        buildDebours({ taxable: false }),
        buildDebours({ taxable: true }),
      ).material,
    ).toBe(false);
  });

  it("montant changé → matériel", () => {
    expect(
      hasMaterialDeboursDossierChange(
        buildDebours({ montant: 250 }),
        buildDebours({ montant: 300 }),
      ).material,
    ).toBe(true);
  });

  it("payeParCabinet true → false → matériel (annulation)", () => {
    const r = hasMaterialDeboursDossierChange(
      buildDebours({ payeParCabinet: true }),
      buildDebours({ payeParCabinet: false }),
    );
    expect(r.material).toBe(true);
    expect(r.reasons.join(" ")).toMatch(/annulation/);
  });

  it("payeParCabinet false → true → NON matériel ici (création initiale ailleurs)", () => {
    expect(
      hasMaterialDeboursDossierChange(
        buildDebours({ payeParCabinet: false }),
        buildDebours({ payeParCabinet: true }),
      ).material,
    ).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════
   APPLICATION CABINET EXPENSE
   ════════════════════════════════════════════════════════════════ */

describe("applyCabinetExpenseCorrection — comportement", () => {
  it("changement non matériel → noop (pas d'écriture)", async () => {
    const before = buildExpense();
    const after = buildExpense({ descriptionBancaire: "RENAMED" });
    const r = await applyCabinetExpenseCorrection(before, after, { client });
    expect(r).toEqual({ action: "noop", reason: "not_material" });
    expect(store.entries.length).toBe(0);
  });

  it("matériel mais pas d'écriture initiale → noop (rien à corriger)", async () => {
    const before = buildExpense({ montant: 100 });
    const after = buildExpense({ montant: 130 });
    const r = await applyCabinetExpenseCorrection(before, after, { client });
    expect(r).toEqual({ action: "noop", reason: "no_prior_journal_entry" });
    expect(store.entries.length).toBe(0);
  });

  it("changement de montant 100 → 130 : CORRECTION + re-jeu DEPENSE v2", async () => {
    seedInitialEntry(store, {
      cabinetId: "cab_1",
      sourceModule: "DEPENSES",
      sourceId: "exp_1",
      montantSortie: 100,
    });
    const before = buildExpense({ montant: 100 });
    const after = buildExpense({ montant: 130 });

    const r = await applyCabinetExpenseCorrection(before, after, { client, utilisateurId: "u1" });

    expect(r.action).toBe("corrected");
    if (r.action !== "corrected") return;
    expect(r.netCancelled).toBe(100);
    expect(r.replayVersion).toBe(2);
    expect(r.reasons.join(" ")).toMatch(/montant: 100 → 130/);

    // 1 seed + 1 correction + 1 re-jeu = 3 entrées
    expect(store.entries.length).toBe(3);

    const correction = store.entries.find((e) => e.typeTransaction === "CORRECTION")!;
    expect(correction.montantEntree).toBe(100); // annule la sortie
    expect(correction.montantSortie).toBe(0);
    expect(correction.sourceModule).toBe("CORRECTION_SYSTEME");
    expect(correction.sourceId).toBeNull(); // pas dans l'index unique
    expect(correction.reference).toBe("correction:CabinetExpense:exp_1");

    const replay = store.entries.find((e) => e.sourceId === "exp_1#v2")!;
    expect(replay.typeTransaction).toBe("DEPENSE");
    expect(replay.montantSortie).toBe(130);
    expect(replay.montantEntree).toBe(0);
    expect(replay.sourceModule).toBe("DEPENSES");

    expect(store.updateCalls).toBe(0);
    expect(store.deleteCalls).toBe(0);
  });

  it("changement vers IGNORE : CORRECTION sans re-jeu", async () => {
    seedInitialEntry(store, {
      cabinetId: "cab_1",
      sourceModule: "DEPENSES",
      sourceId: "exp_1",
      montantSortie: 100,
    });
    const before = buildExpense({ typeTransaction: "DEPENSE", montant: 100 });
    const after = buildExpense({ typeTransaction: "IGNORE", montant: 100 });

    const r = await applyCabinetExpenseCorrection(before, after, { client });
    expect(r.action).toBe("corrected");
    if (r.action !== "corrected") return;
    expect(r.replayId).toBeUndefined();

    // 1 seed + 1 correction = 2 entrées (pas de re-jeu)
    expect(store.entries.length).toBe(2);
    const correction = store.entries.find((e) => e.typeTransaction === "CORRECTION")!;
    expect(correction.montantEntree).toBe(100);
  });

  it("CREDIT → DEPENSE : sens inversé, correction inverse", async () => {
    seedInitialEntry(store, {
      cabinetId: "cab_1",
      sourceModule: "DEPENSES",
      sourceId: "exp_1",
      montantEntree: 50,
    });
    const before = buildExpense({ typeTransaction: "CREDIT", montant: 50 });
    const after = buildExpense({ typeTransaction: "DEPENSE", montant: 50 });

    const r = await applyCabinetExpenseCorrection(before, after, { client });
    expect(r.action).toBe("corrected");
    if (r.action !== "corrected") return;
    expect(r.netCancelled).toBe(-50); // entrée nette à annuler

    const correction = store.entries.find((e) => e.typeTransaction === "CORRECTION")!;
    // Annule l'entrée → écrit en sortie.
    expect(correction.montantSortie).toBe(50);
    expect(correction.montantEntree).toBe(0);
    const replay = store.entries.find((e) => e.sourceId === "exp_1#v2")!;
    expect(replay.montantSortie).toBe(50); // nouvelle DEPENSE
  });

  it("re-jeu après une correction antérieure: utilise v3", async () => {
    seedInitialEntry(store, {
      cabinetId: "cab_1",
      sourceModule: "DEPENSES",
      sourceId: "exp_1",
      montantSortie: 100,
    });
    seedInitialEntry(store, {
      cabinetId: "cab_1",
      sourceModule: "DEPENSES",
      sourceId: "exp_1#v2",
      montantSortie: 130,
    });
    const before = buildExpense({ montant: 130 });
    const after = buildExpense({ montant: 150 });

    const r = await applyCabinetExpenseCorrection(before, after, { client });
    expect(r.action).toBe("corrected");
    if (r.action !== "corrected") return;
    // Effet net cumulé = 100 + 130 = 230 sortie
    expect(r.netCancelled).toBe(230);
    expect(r.replayVersion).toBe(3);

    const replay = store.entries.find((e) => e.sourceId === "exp_1#v3")!;
    expect(replay.montantSortie).toBe(150);
  });
});

/* ════════════════════════════════════════════════════════════════
   APPLICATION DEBOURS DOSSIER
   ════════════════════════════════════════════════════════════════ */

describe("applyDeboursDossierCorrection — comportement", () => {
  it("changement non matériel → noop", async () => {
    const before = buildDebours();
    const after = buildDebours({ description: "renamed" });
    const r = await applyDeboursDossierCorrection(before, after, { client });
    expect(r).toEqual({ action: "noop", reason: "not_material" });
  });

  it("payeParCabinet true → false : CORRECTION sans re-jeu", async () => {
    seedInitialEntry(store, {
      cabinetId: "cab_1",
      sourceModule: "DEBOURS",
      sourceId: "deb_1",
      montantSortie: 250,
    });
    const before = buildDebours({ payeParCabinet: true });
    const after = buildDebours({ payeParCabinet: false });

    const r = await applyDeboursDossierCorrection(before, after, { client });
    expect(r.action).toBe("corrected");
    if (r.action !== "corrected") return;
    expect(r.replayId).toBeUndefined(); // pas payé → pas de re-jeu

    const correction = store.entries.find((e) => e.typeTransaction === "CORRECTION")!;
    expect(correction.montantEntree).toBe(250);
    expect(correction.sourceModule).toBe("CORRECTION_SYSTEME");
    expect(correction.clientId).toBe("cli_1");
    expect(correction.dossierId).toBe("dos_1");
    expect(correction.reference).toBe("correction:DeboursDossier:deb_1");

    expect(store.updateCalls).toBe(0);
    expect(store.deleteCalls).toBe(0);
  });

  it("changement de montant 250 → 300 : CORRECTION + re-jeu DEBOURS v2", async () => {
    seedInitialEntry(store, {
      cabinetId: "cab_1",
      sourceModule: "DEBOURS",
      sourceId: "deb_1",
      montantSortie: 250,
    });
    const before = buildDebours({ montant: 250 });
    const after = buildDebours({ montant: 300 });

    const r = await applyDeboursDossierCorrection(before, after, { client });
    expect(r.action).toBe("corrected");
    if (r.action !== "corrected") return;
    expect(r.netCancelled).toBe(250);
    expect(r.replayVersion).toBe(2);

    const replay = store.entries.find((e) => e.sourceId === "deb_1#v2")!;
    expect(replay.typeTransaction).toBe("DEBOURS");
    expect(replay.montantSortie).toBe(300);
    expect(replay.clientId).toBe("cli_1");
    expect(replay.dossierId).toBe("dos_1");
  });

  it("matériel mais pas d'écriture initiale → noop", async () => {
    const before = buildDebours({ montant: 250 });
    const after = buildDebours({ montant: 300 });
    const r = await applyDeboursDossierCorrection(before, after, { client });
    expect(r).toEqual({ action: "noop", reason: "no_prior_journal_entry" });
  });
});

/* ════════════════════════════════════════════════════════════════
   APPEND-ONLY GLOBAL
   ════════════════════════════════════════════════════════════════ */

describe("Append-only — invariants globaux", () => {
  it("aucun update / delete sur journalGeneralEntry tout au long des scénarios", async () => {
    seedInitialEntry(store, {
      cabinetId: "cab_1",
      sourceModule: "DEPENSES",
      sourceId: "exp_1",
      montantSortie: 100,
    });

    await applyCabinetExpenseCorrection(
      buildExpense({ montant: 100 }),
      buildExpense({ montant: 130 }),
      { client },
    );
    await applyCabinetExpenseCorrection(
      buildExpense({ montant: 130 }),
      buildExpense({ montant: 130, descriptionBancaire: "x" }),
      { client },
    );
    await applyDeboursDossierCorrection(
      buildDebours(),
      buildDebours({ description: "y" }),
      { client },
    );

    expect(store.updateCalls).toBe(0);
    expect(store.deleteCalls).toBe(0);
  });

  it("audit trail compréhensible: 3 lignes avec références croisées via reference", async () => {
    seedInitialEntry(store, {
      cabinetId: "cab_1",
      sourceModule: "DEPENSES",
      sourceId: "exp_1",
      montantSortie: 100,
    });
    await applyCabinetExpenseCorrection(
      buildExpense({ montant: 100 }),
      buildExpense({ montant: 130 }),
      { client },
    );

    const initial = store.entries.find((e) => e.sourceId === "exp_1")!;
    const correction = store.entries.find((e) => e.typeTransaction === "CORRECTION")!;
    const replay = store.entries.find((e) => e.sourceId === "exp_1#v2")!;

    expect(correction.reference).toBe("correction:CabinetExpense:exp_1");
    expect(replay.reference).toBe(`replay-after:${correction.id}`);
    expect(initial.sourceId).toBe("exp_1");
    expect(replay.sourceId).toMatch(/^exp_1#v\d+$/);
  });
});
