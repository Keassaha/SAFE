import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  approveMatter,
  sendBackToAssistant,
  resolveNavetteMessage,
  markNavetteRead,
  markReadyForReview,
} from "../navette-service";

/**
 * Le contrat SERVEUR des décisions de la navette.
 *
 * Ce qui est vérifié : une décision porte l'identifiant de la demande jusque
 * dans le `where` de l'écriture, elle ne ferme que celle-là, et elle échoue
 * quand quelqu'un a tranché avant. Les refus de permission sont testés à part
 * (navette-permissions.test.ts) ; ici on vérifie que le service les applique.
 */

const CABINET = "cab-1";
const AVOCATE = "u-avocate";
const ADJOINTE = "u-adjointe";

interface Store {
  message: Record<string, unknown> | null;
  /** Nombre de lignes touchées par l'update conditionnel (0 = déjà tranché). */
  updateManyCount: number;
  updateManyCalls: Array<Record<string, unknown>>;
  createCalls: Array<Record<string, unknown>>;
  updateCalls: Array<Record<string, unknown>>;
}

let store: Store;
let client: PrismaClient;

function demandeOuverte(over: Record<string, unknown> = {}) {
  return {
    id: "req-1",
    dossierId: "dos-1",
    type: "ready_for_review",
    authorId: ADJOINTE,
    recipientId: AVOCATE,
    resolvedAt: null,
    confidentiel: false,
    readAt: null,
    ...over,
  };
}

beforeEach(() => {
  store = { message: demandeOuverte(), updateManyCount: 1, updateManyCalls: [], createCalls: [], updateCalls: [] };
  client = {
    dossierNavetteMessage: {
      findFirst: vi.fn(async () => store.message),
      updateMany: vi.fn(async (args: Record<string, unknown>) => {
        store.updateManyCalls.push(args);
        return { count: store.updateManyCount };
      }),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.createCalls.push(args.data);
        return { id: `msg-${store.createCalls.length}` };
      }),
      update: vi.fn(async (args: Record<string, unknown>) => {
        store.updateCalls.push(args);
        return { id: "msg-u" };
      }),
    },
    dossier: {
      findFirst: vi.fn(async () => ({
        cabinetId: CABINET,
        avocatResponsableId: AVOCATE,
        assistantJuridiqueId: ADJOINTE,
        clientId: "cli-1",
      })),
    },
  } as unknown as PrismaClient;
});

/* ═════════════════ Approuver ═════════════════ */

describe("approveMatter — vise une demande, et elle seule", () => {
  it("ferme la demande visée par son identifiant, pas le dossier entier", async () => {
    const res = await approveMatter(
      { cabinetId: CABINET, requestId: "req-1", userId: AVOCATE, role: "avocat" },
      client,
    );
    expect(res).toMatchObject({ ok: true, dossierId: "dos-1" });

    expect(store.updateManyCalls).toHaveLength(1);
    const where = store.updateManyCalls[0].where as Record<string, unknown>;
    expect(where).toMatchObject({ id: "req-1", cabinetId: CABINET, resolvedAt: null });
    // La régression corrigée : plus aucun filtre « toutes les demandes du dossier ».
    expect(where).not.toHaveProperty("dossierId");
    expect(where).not.toHaveProperty("type");
  });

  it("l'approbation garde le lien vers la demande approuvée", async () => {
    await approveMatter({ cabinetId: CABINET, requestId: "req-1", userId: AVOCATE, role: "avocat" }, client);
    expect(store.createCalls[0]).toMatchObject({
      type: "approved",
      parentId: "req-1",
      recipientId: ADJOINTE,
      dossierId: "dos-1",
    });
  });

  it("une seconde approbation est refusée : rien n'est écrit", async () => {
    store.updateManyCount = 0; // quelqu'un a tranché entre-temps
    const res = await approveMatter(
      { cabinetId: CABINET, requestId: "req-1", userId: AVOCATE, role: "avocat" },
      client,
    );
    expect(res).toEqual({ ok: false, error: "already_resolved" });
    expect(store.createCalls).toHaveLength(0);
  });

  it("approuver une demande déjà résolue est refusé avant toute écriture", async () => {
    store.message = demandeOuverte({ resolvedAt: new Date() });
    const res = await approveMatter(
      { cabinetId: CABINET, requestId: "req-1", userId: AVOCATE, role: "avocat" },
      client,
    );
    expect(res).toEqual({ ok: false, error: "already_resolved" });
    expect(store.updateManyCalls).toHaveLength(0);
  });

  it("un avocat qui n'est pas visé ne peut pas approuver", async () => {
    const res = await approveMatter(
      { cabinetId: CABINET, requestId: "req-1", userId: "u-autre", role: "avocat" },
      client,
    );
    expect(res).toEqual({ ok: false, error: "forbidden" });
    expect(store.createCalls).toHaveLength(0);
  });

  it("une demande introuvable dans ce cabinet ne s'approuve pas", async () => {
    store.message = null;
    const res = await approveMatter(
      { cabinetId: CABINET, requestId: "req-1", userId: AVOCATE, role: "avocat" },
      client,
    );
    expect(res).toEqual({ ok: false, error: "not_found" });
  });
});

/* ═════════════════ Demander une correction ═════════════════ */

describe("sendBackToAssistant — le motif n'est pas facultatif", () => {
  it("refuse un motif vide, sans lire la base", async () => {
    const res = await sendBackToAssistant(
      { cabinetId: CABINET, requestId: "req-1", userId: AVOCATE, role: "avocat", body: "   " },
      client,
    );
    expect(res).toEqual({ ok: false, error: "forbidden" });
    expect(store.updateManyCalls).toHaveLength(0);
    expect(store.createCalls).toHaveLength(0);
  });

  it("écrit le motif, le renvoie à l'autrice, et ferme la demande visée", async () => {
    const res = await sendBackToAssistant(
      { cabinetId: CABINET, requestId: "req-1", userId: AVOCATE, role: "avocat", body: "Il manque l'annexe B." },
      client,
    );
    expect(res).toMatchObject({ ok: true, dossierId: "dos-1" });
    expect(store.createCalls[0]).toMatchObject({
      type: "sent_back",
      body: "Il manque l'annexe B.",
      parentId: "req-1",
      recipientId: ADJOINTE,
    });
    expect(store.updateManyCalls[0].where).toMatchObject({ id: "req-1" });
  });
});

/* ═════════════════ Marquer traité ═════════════════ */

describe("resolveNavetteMessage — le dossier vient du message", () => {
  it("un utilisateur hors destinataire ne peut pas résoudre", async () => {
    store.message = demandeOuverte({ type: "sent_back", recipientId: ADJOINTE });
    const res = await resolveNavetteMessage("req-1", CABINET, "u-tiers", "assistante", client);
    expect(res).toMatchObject({ ok: false, error: "forbidden" });
    expect(store.updateManyCalls).toHaveLength(0);
  });

  it("le destinataire résout, et le dossier renvoyé vient de la base", async () => {
    store.message = demandeOuverte({ type: "sent_back", recipientId: ADJOINTE, dossierId: "dos-9" });
    const res = await resolveNavetteMessage("req-1", CABINET, ADJOINTE, "assistante", client);
    expect(res).toEqual({ ok: true, dossierId: "dos-9" });
  });

  it("deux clics concurrents : le second est refusé", async () => {
    store.message = demandeOuverte({ type: "sent_back", recipientId: ADJOINTE });
    store.updateManyCount = 0;
    const res = await resolveNavetteMessage("req-1", CABINET, ADJOINTE, "assistante", client);
    expect(res).toMatchObject({ ok: false, error: "already_resolved" });
  });
});

/* ═════════════════ Marquer lu ═════════════════ */

describe("markNavetteRead — lire suppose le droit de voir", () => {
  it("l'assistante ne marque pas lu un message confidentiel", async () => {
    store.message = { id: "m-1", dossierId: "dos-1", readAt: null, confidentiel: true };
    const res = await markNavetteRead("m-1", CABINET, ADJOINTE, "assistante", client);
    expect(res).toMatchObject({ ok: false, error: "forbidden" });
    expect(store.updateCalls).toHaveLength(0);
  });

  it("la comptabilité, hors navette, ne marque rien comme lu", async () => {
    store.message = { id: "m-1", dossierId: "dos-1", readAt: null, confidentiel: false };
    const res = await markNavetteRead("m-1", CABINET, "u-compta", "comptabilite", client);
    expect(res).toMatchObject({ ok: false, error: "forbidden" });
    expect(store.updateCalls).toHaveLength(0);
  });

  it("un participant autorisé marque lu une seule fois", async () => {
    store.message = { id: "m-1", dossierId: "dos-1", readAt: null, confidentiel: false };
    expect(await markNavetteRead("m-1", CABINET, AVOCATE, "avocat", client)).toEqual({ ok: true, dossierId: "dos-1" });
    expect(store.updateCalls).toHaveLength(1);

    store.message = { id: "m-1", dossierId: "dos-1", readAt: new Date(), confidentiel: false };
    await markNavetteRead("m-1", CABINET, AVOCATE, "avocat", client);
    expect(store.updateCalls).toHaveLength(1); // l'horodatage d'origine ne bouge pas
  });
});

/* ═════════════════ Soumettre pour révision ═════════════════ */

describe("markReadyForReview — une seule demande vivante", () => {
  it("refuse une seconde soumission tant que la première est ouverte", async () => {
    store.message = { id: "req-1" }; // une demande ouverte existe déjà
    const res = await markReadyForReview(
      { cabinetId: CABINET, dossierId: "dos-1", authorId: ADJOINTE, authorRole: "assistante" },
      client,
    );
    expect(res).toEqual({ ok: false, error: "already_pending" });
    expect(store.createCalls).toHaveLength(0);
  });
});
