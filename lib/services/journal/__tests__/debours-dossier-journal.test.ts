import { describe, expect, it, beforeEach, vi } from "vitest";
import type { DeboursDossier, DeboursType, PrismaClient } from "@prisma/client";
import {
  writeJournalForDeboursPaiement,
  DEBOURS_DOSSIER_JOURNAL_SOURCE_MODULE,
} from "../debours-dossier-journal";

/**
 * Tests unitaires du helper `writeJournalForDeboursPaiement`.
 *
 * Même pattern que `cabinet-expense-journal.test.ts`: client Prisma simulé,
 * dispatch du `findFirst` selon que la requête cible un `sourceId`
 * (idempotence) ou non (lecture du solde par `createJournalEntry`).
 */

interface MockJgeStore {
  existing?: { id: string } | null;
  /** Si défini, `create` lève cette erreur (simule un conflit concurrent P2002). */
  createThrows?: unknown;
  /** Si défini, le `findFirst` qui suit l'erreur retourne cette entrée. */
  existingAfterRace?: { id: string } | null;
  createCalls: Array<Record<string, unknown>>;
  findFirstCalls: Array<Record<string, unknown>>;
}

function buildMockClient(store: MockJgeStore): PrismaClient {
  let createAttempts = 0;
  const findFirst = vi.fn().mockImplementation(async (args) => {
    store.findFirstCalls.push(args);
    const where = (args?.where ?? {}) as Record<string, unknown>;
    const isIdempotencyCheck = "sourceId" in where && "sourceModule" in where;
    if (!isIdempotencyCheck) return null;
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
    journalGeneralEntry: { findFirst, create },
  } as unknown as PrismaClient;
}

function buildDebours(over: Partial<DeboursDossier> = {}): DeboursDossier {
  return {
    id: "deb_1",
    cabinetId: "cab_1",
    dossierId: "dos_1",
    clientId: "cli_1",
    deboursTypeId: "type_1",
    description: "Title Search Ontario",
    quantite: 1,
    montant: 250,
    taxable: false,
    date: new Date("2026-04-20"),
    payeParCabinet: true,
    refacturable: true,
    factureId: null,
    invoiceLineId: null,
    createdAt: new Date("2026-04-20"),
    updatedAt: new Date("2026-04-20"),
    ...over,
  } as DeboursDossier;
}

function buildDeboursType(over: Partial<DeboursType> = {}): DeboursType {
  return {
    id: "type_1",
    cabinetId: "cab_1",
    nom: "Title Search",
    categorie: "Real Estate Disbursement",
    description: null,
    taxable: false,
    isGovernment: false,
    gouvernementRef: null,
    coutDefaut: 250,
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as DeboursType;
}

let store: MockJgeStore;
let client: PrismaClient;

beforeEach(() => {
  store = { createCalls: [], findFirstCalls: [] };
  client = buildMockClient(store);
});

describe("writeJournalForDeboursPaiement — cas nominal", () => {
  it("écrit une sortie DEBOURS quand payeParCabinet=true", async () => {
    const debours = buildDebours();
    const deboursType = buildDeboursType();

    const result = await writeJournalForDeboursPaiement(debours, { client, deboursType });

    expect(result).toMatchObject({ created: true, journalId: "jge-1" });
    expect(store.createCalls).toHaveLength(1);

    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.cabinetId).toBe("cab_1");
    expect(data.typeTransaction).toBe("DEBOURS");
    expect(data.montantSortie).toBe(250);
    expect(data.montantEntree).toBe(0);
    expect(data.sourceModule).toBe(DEBOURS_DOSSIER_JOURNAL_SOURCE_MODULE);
    expect(data.sourceId).toBe("deb_1");
    expect(data.clientId).toBe("cli_1");
    expect(data.dossierId).toBe("dos_1");
    expect(data.categorie).toBe("Real Estate Disbursement");
    expect(data.description).toBe("Title Search Ontario");
    expect(data.reference).toBeNull();
  });

  it("le montant écrit est le total stocké (debours.montant), sans multiplier par quantite", async () => {
    // Confirme que `montant` est bien déjà total (cf. lib/actions/debours.ts:29).
    const debours = buildDebours({ montant: 1500, quantite: 3 });
    await writeJournalForDeboursPaiement(debours, { client });

    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.montantSortie).toBe(1500); // pas 4500
  });

  it("description fallback sur le nom du DeboursType si vide", async () => {
    const debours = buildDebours({ description: "" });
    const deboursType = buildDeboursType({ nom: "IRCC Application Fee" });

    await writeJournalForDeboursPaiement(debours, { client, deboursType });

    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.description).toBe("IRCC Application Fee");
  });

  it("fallback ultime 'Débours dossier' si tout est vide", async () => {
    const debours = buildDebours({ description: "" });
    await writeJournalForDeboursPaiement(debours, { client, deboursType: null });

    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.description).toBe("Débours dossier");
  });

  it("categorie = null si DeboursType non fourni", async () => {
    const debours = buildDebours();
    await writeJournalForDeboursPaiement(debours, { client });

    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.categorie).toBeNull();
  });

  it("utilisateurId est passé tel quel via opts (peut être null)", async () => {
    const debours = buildDebours();
    await writeJournalForDeboursPaiement(debours, { client, utilisateurId: "user_42" });
    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.utilisateurId).toBe("user_42");
  });
});

describe("writeJournalForDeboursPaiement — no-op explicites", () => {
  it("payeParCabinet=false → no-op sans toucher au journal", async () => {
    const debours = buildDebours({ payeParCabinet: false });
    const result = await writeJournalForDeboursPaiement(debours, { client });

    expect(result).toEqual({ created: false, reason: "not_paid_by_cabinet" });
    expect(store.findFirstCalls).toHaveLength(0);
    expect(store.createCalls).toHaveLength(0);
  });

  it("montant = 0 → no-op explicite", async () => {
    const debours = buildDebours({ montant: 0 });
    const result = await writeJournalForDeboursPaiement(debours, { client });

    expect(result).toEqual({ created: false, reason: "amount_zero" });
    expect(store.createCalls).toHaveLength(0);
  });
});

describe("writeJournalForDeboursPaiement — idempotence", () => {
  it("retourne created=false sans rien écrire si une entrée existe déjà", async () => {
    store.existing = { id: "jge-already" };
    const debours = buildDebours();

    const result = await writeJournalForDeboursPaiement(debours, { client });

    expect(result).toEqual({
      created: false,
      journalId: "jge-already",
      reason: "already_journalized",
    });
    expect(store.createCalls).toHaveLength(0);
    // La requête d'idempotence cible bien (cabinetId, sourceModule, sourceId).
    expect(store.findFirstCalls[0]!.where).toEqual({
      cabinetId: "cab_1",
      sourceModule: DEBOURS_DOSSIER_JOURNAL_SOURCE_MODULE,
      sourceId: "deb_1",
    });
  });

  it("un second appel sur le même client ne re-crée pas après une 1ère écriture", async () => {
    const debours = buildDebours();

    await writeJournalForDeboursPaiement(debours, { client });
    expect(store.createCalls).toHaveLength(1);

    // Simule l'état post-création.
    store.existing = { id: "jge-1" };

    const result2 = await writeJournalForDeboursPaiement(debours, { client });
    expect(result2).toMatchObject({ created: false, reason: "already_journalized" });
    expect(store.createCalls).toHaveLength(1);
  });

  it("transition false → true: l'écriture est créée à la 2ème invocation", async () => {
    const unpaid = buildDebours({ payeParCabinet: false });
    const r1 = await writeJournalForDeboursPaiement(unpaid, { client });
    expect(r1.reason).toBe("not_paid_by_cabinet");
    expect(store.createCalls).toHaveLength(0);

    // Simule le passage à payeParCabinet=true via un update.
    const paid = { ...unpaid, payeParCabinet: true };
    const r2 = await writeJournalForDeboursPaiement(paid, { client });
    expect(r2).toMatchObject({ created: true });
    expect(store.createCalls).toHaveLength(1);
  });
});

describe("writeJournalForDeboursPaiement — course concurrente (P2002)", () => {
  it("transforme un P2002 sur l'index d'idempotence en no-op idempotent", async () => {
    store.existing = null;
    store.createThrows = {
      code: "P2002",
      meta: { target: ["cabinetId", "sourceModule", "sourceId"] },
    };
    store.existingAfterRace = { id: "jge-winner" };

    const debours = buildDebours();
    const result = await writeJournalForDeboursPaiement(debours, { client });

    expect(result).toEqual({
      created: false,
      journalId: "jge-winner",
      reason: "already_journalized",
    });
    expect(store.createCalls).toHaveLength(0);
  });

  it("rejette les autres erreurs", async () => {
    store.existing = null;
    store.createThrows = new Error("connection refused");

    const debours = buildDebours();
    await expect(writeJournalForDeboursPaiement(debours, { client })).rejects.toThrow("connection refused");
  });

  it("rejette un P2002 qui ne concerne pas l'index d'idempotence", async () => {
    store.existing = null;
    store.createThrows = {
      code: "P2002",
      meta: { target: ["id"] },
    };

    const debours = buildDebours();
    await expect(writeJournalForDeboursPaiement(debours, { client })).rejects.toMatchObject({
      code: "P2002",
    });
  });
});
