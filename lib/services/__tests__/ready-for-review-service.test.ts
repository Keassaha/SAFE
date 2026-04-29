import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  emitReadyForReviewSignal,
  markSignalRead,
} from "@/lib/services/ready-for-review-service";

/**
 * Tests du service de signal "prêt pour revue avocat".
 * Doctrine: docs/product/READY_FOR_REVIEW_SIGNAL.md
 *
 * On mocke le client Prisma pour vérifier le contrat (where, dedupe, idempotence).
 */

interface MockSignalStore {
  /** Si défini, `findFirst` retourne cette entrée (simule un signal existant non lu). */
  existingPending?: { id: string } | null;
  /** Si défini, `create` lève cette erreur (simule course concurrente P2002). */
  createThrows?: unknown;
  /** Capture des create. */
  createCalls: Array<Record<string, unknown>>;
  /** Capture des findFirst. */
  findFirstCalls: Array<Record<string, unknown>>;
  /** Capture des updates. */
  updateCalls: Array<Record<string, unknown>>;
  /** Si défini, `findFirst` du markSignalRead retourne cette entrée. */
  signalForMark?:
    | { id: string; readAt: Date | null; avocatResponsableId: string | null }
    | null;
}

function buildMockClient(store: MockSignalStore): PrismaClient {
  const findFirst = vi.fn().mockImplementation(async (args: { where?: Record<string, unknown> }) => {
    store.findFirstCalls.push(args ?? {});
    const where = args?.where ?? {};
    // Heuristique : si on cherche par `id`, on retourne `signalForMark`.
    // Si on cherche par `dedupeKey + readAt: null`, on retourne `existingPending`.
    if ("id" in where) {
      return store.signalForMark ?? null;
    }
    if ("dedupeKey" in where) {
      return store.existingPending ?? null;
    }
    return null;
  });

  const create = vi.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => {
    if (store.createThrows !== undefined) {
      throw store.createThrows;
    }
    store.createCalls.push(args.data);
    return { id: `sig-${store.createCalls.length}` };
  });

  const update = vi.fn().mockImplementation(async (args: Record<string, unknown>) => {
    store.updateCalls.push(args);
    return { id: "sig-updated" };
  });

  return {
    dossierReadyForReviewSignal: { findFirst, create, update },
  } as unknown as PrismaClient;
}

let store: MockSignalStore;
let client: PrismaClient;

beforeEach(() => {
  store = { createCalls: [], findFirstCalls: [], updateCalls: [] };
  client = buildMockClient(store);
});

/* ═════════════════ Émission ═════════════════ */

describe("emitReadyForReviewSignal — cas nominal", () => {
  it("crée un signal quand aucun n'existe en pending", async () => {
    store.existingPending = null;

    const result = await emitReadyForReviewSignal(
      {
        cabinetId: "cab_1",
        dossierId: "dos_1",
        clientId: "cli_1",
        avocatResponsableId: "user_av",
        createdById: "user_assistante",
      },
      client,
    );

    expect(result).toMatchObject({ created: true, signalId: "sig-1" });
    expect(store.createCalls).toHaveLength(1);

    const data = store.createCalls[0]!;
    expect(data.cabinetId).toBe("cab_1");
    expect(data.dossierId).toBe("dos_1");
    expect(data.clientId).toBe("cli_1");
    expect(data.avocatResponsableId).toBe("user_av");
    expect(data.createdById).toBe("user_assistante");
    expect(data.dedupeKey).toBe("dos_1:user_av");
    expect(data.reason).toBe("preparation_complete");
  });

  it("dedupeKey utilise 'no_avocat' quand pas d'avocat assigné", async () => {
    store.existingPending = null;
    await emitReadyForReviewSignal(
      {
        cabinetId: "cab_1",
        dossierId: "dos_1",
        clientId: "cli_1",
        avocatResponsableId: null,
        createdById: "user_assistante",
      },
      client,
    );
    expect(store.createCalls[0]!.dedupeKey).toBe("dos_1:no_avocat");
  });

  it("respecte la raison custom si fournie", async () => {
    store.existingPending = null;
    await emitReadyForReviewSignal(
      {
        cabinetId: "cab_1",
        dossierId: "dos_1",
        clientId: "cli_1",
        avocatResponsableId: "user_av",
        createdById: null,
        reason: "manual_override",
      },
      client,
    );
    expect(store.createCalls[0]!.reason).toBe("manual_override");
  });
});

describe("emitReadyForReviewSignal — déduplication applicative", () => {
  it("retourne already_pending sans rien créer si un signal non lu existe déjà", async () => {
    store.existingPending = { id: "sig-existing" };

    const result = await emitReadyForReviewSignal(
      {
        cabinetId: "cab_1",
        dossierId: "dos_1",
        clientId: "cli_1",
        avocatResponsableId: "user_av",
        createdById: "user_assistante",
      },
      client,
    );

    expect(result).toEqual({ created: false, reason: "already_pending" });
    expect(store.createCalls).toHaveLength(0);

    // Le check de dédup interroge bien dedupeKey + readAt:null + cabinetId
    const where = store.findFirstCalls[0]!.where as Record<string, unknown>;
    expect(where.dedupeKey).toBe("dos_1:user_av");
    expect(where.readAt).toBeNull();
    expect(where.cabinetId).toBe("cab_1");
  });
});

describe("emitReadyForReviewSignal — course concurrente (P2002)", () => {
  it("transforme un P2002 sur l'index dedupe en no-op idempotent", async () => {
    store.existingPending = null;
    store.createThrows = {
      code: "P2002",
      meta: { constraint: "DossierReadyForReviewSignal_dedupe_unread_key" },
    };

    const result = await emitReadyForReviewSignal(
      {
        cabinetId: "cab_1",
        dossierId: "dos_1",
        clientId: "cli_1",
        avocatResponsableId: "user_av",
        createdById: "user_assistante",
      },
      client,
    );

    expect(result).toEqual({ created: false, reason: "conflict_p2002" });
  });

  it("transforme un P2002 sur target ['dedupeKey'] en no-op", async () => {
    store.existingPending = null;
    store.createThrows = {
      code: "P2002",
      meta: { target: ["dedupeKey"] },
    };

    const result = await emitReadyForReviewSignal(
      {
        cabinetId: "cab_1",
        dossierId: "dos_1",
        clientId: "cli_1",
        avocatResponsableId: "user_av",
        createdById: null,
      },
      client,
    );

    expect(result).toEqual({ created: false, reason: "conflict_p2002" });
  });

  it("relance les autres erreurs (pas P2002)", async () => {
    store.existingPending = null;
    store.createThrows = new Error("network");

    await expect(
      emitReadyForReviewSignal(
        {
          cabinetId: "cab_1",
          dossierId: "dos_1",
          clientId: "cli_1",
          avocatResponsableId: null,
          createdById: null,
        },
        client,
      ),
    ).rejects.toThrow("network");
  });
});

/* ═════════════════ Marquage ═════════════════ */

describe("markSignalRead — comportement", () => {
  it("marque comme lu pour l'avocat destinataire", async () => {
    store.signalForMark = {
      id: "sig-1",
      readAt: null,
      avocatResponsableId: "user_av",
    };

    const result = await markSignalRead("sig-1", "cab_1", "user_av", false, client);

    expect(result).toEqual({ ok: true, alreadyRead: false });
    expect(store.updateCalls).toHaveLength(1);
    const data = (store.updateCalls[0]!.data as Record<string, unknown>);
    expect(data.readAt).toBeInstanceOf(Date);
    expect(data.acknowledgedById).toBe("user_av");
  });

  it("marque comme lu pour un admin (même si pas destinataire direct)", async () => {
    store.signalForMark = {
      id: "sig-1",
      readAt: null,
      avocatResponsableId: "user_other",
    };

    const result = await markSignalRead("sig-1", "cab_1", "user_admin", true, client);

    expect(result).toEqual({ ok: true, alreadyRead: false });
    expect(store.updateCalls).toHaveLength(1);
  });

  it("marque comme lu pour un signal sans avocat (n'importe quel utilisateur autorisé)", async () => {
    store.signalForMark = {
      id: "sig-1",
      readAt: null,
      avocatResponsableId: null,
    };

    const result = await markSignalRead("sig-1", "cab_1", "user_av_random", false, client);

    expect(result.ok).toBe(true);
  });

  it("refuse pour un avocat qui n'est pas destinataire", async () => {
    store.signalForMark = {
      id: "sig-1",
      readAt: null,
      avocatResponsableId: "user_av_owner",
    };

    const result = await markSignalRead("sig-1", "cab_1", "user_av_other", false, client);

    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(store.updateCalls).toHaveLength(0);
  });

  it("retourne not_found si le signal n'existe pas dans le cabinet", async () => {
    store.signalForMark = null;

    const result = await markSignalRead("sig-x", "cab_1", "user_av", false, client);

    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("idempotent: signal déjà lu → no-op { ok: true, alreadyRead: true }", async () => {
    store.signalForMark = {
      id: "sig-1",
      readAt: new Date("2026-04-29T10:00:00Z"),
      avocatResponsableId: "user_av",
    };

    const result = await markSignalRead("sig-1", "cab_1", "user_av", false, client);

    expect(result).toEqual({ ok: true, alreadyRead: true });
    expect(store.updateCalls).toHaveLength(0);
  });
});
