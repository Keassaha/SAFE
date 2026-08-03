import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-12 — Cycle de vie du cabinet, côté service.
 *
 * Ce qui est prouvé ici :
 *   1. un original du client ne se détruit pas sans une des DEUX portes de l'art. 19,
 *      et l'autorisation du client est bien lue (elle ne l'était pas : la colonne et le
 *      paramètre portent des noms différents) ;
 *   2. un document non marqué passe — le garde-fou ne requalifie rien rétroactivement ;
 *   3. une échéance non qualifiée est traitée comme un rappel interne, jamais devinée
 *      depuis son intitulé ;
 *   4. un dossier fermé sans date de fermeture figure quand même à la liste de l'art. 9,
 *      et il est signalé ;
 *   5. un cabinet sans cessionnaire désigné est signalé en permanence, pas au moment où
 *      il est trop tard.
 */

let province: "QC" | "ON";
let documentRow: Record<string, unknown> | null;
let dossierRows: Array<Record<string, unknown>>;
let calendarRows: Array<Record<string, unknown>>;
let successionRow: Record<string, unknown> | null;

let upsertArgs: Record<string, unknown> | null = null;

const prismaMock = {
  cabinet: { findUnique: vi.fn(async () => ({ config: JSON.stringify({ province }) })) },
  document: {
    findFirst: vi.fn(async () => documentRow),
    findMany: vi.fn(async () => []),
    update: vi.fn(async () => ({ id: "doc-1" })),
  },
  dossier: {
    findMany: vi.fn(async (_args: { where: Record<string, never> }) => dossierRows),
  },
  calendarEvent: { findMany: vi.fn(async () => calendarRows) },
  practiceSuccessionPlan: {
    findUnique: vi.fn(async () => successionRow),
    upsert: vi.fn(async (args: Record<string, unknown>) => {
      upsertArgs = args;
      return { id: "plan-1" };
    }),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));

const NOW = new Date("2026-08-03T12:00:00Z");

beforeEach(() => {
  province = "QC";
  documentRow = null;
  dossierRows = [];
  calendarRows = [];
  successionRow = null;
  upsertArgs = null;
  vi.clearAllMocks();
});

/* ════════════════════════════════════════════════════════════════
   Art. 19
   ════════════════════════════════════════════════════════════════ */

describe("Originaux du client (art. 19)", () => {
  it("bloque la destruction d'un original non libéré", async () => {
    const { assertDocumentDestroyable, PracticeLifecycleError } = await import(
      "../practice-lifecycle-service"
    );
    documentRow = {
      isClientOriginal: true,
      clientAuthorizedDestroyAt: null,
      returnOfferedAt: null,
    };
    await expect(
      assertDocumentDestroyable({ cabinetId: "cab", documentId: "doc-1" }),
    ).rejects.toBeInstanceOf(PracticeLifecycleError);
  });

  it("LIT BIEN l'autorisation du client", async () => {
    // La colonne s'appelle `clientAuthorizedDestroyAt`, le paramètre du module pur
    // `clientAuthorizedAt`. Un cast masquait l'écart, et l'autorisation était ignorée.
    const { assertDocumentDestroyable } = await import("../practice-lifecycle-service");
    documentRow = {
      isClientOriginal: true,
      clientAuthorizedDestroyAt: new Date("2026-05-01"),
      returnOfferedAt: null,
    };
    await expect(
      assertDocumentDestroyable({ cabinetId: "cab", documentId: "doc-1" }),
    ).resolves.toBeUndefined();
  });

  it("accepte aussi l'offre de reprise, la seconde porte de l'art. 19", async () => {
    const { assertDocumentDestroyable } = await import("../practice-lifecycle-service");
    documentRow = {
      isClientOriginal: true,
      clientAuthorizedDestroyAt: null,
      returnOfferedAt: new Date("2026-05-01"),
    };
    await expect(
      assertDocumentDestroyable({ cabinetId: "cab", documentId: "doc-1" }),
    ).resolves.toBeUndefined();
  });

  it("NE REQUALIFIE PAS l'existant : un document non marqué passe", async () => {
    // Requalifier rétroactivement bloquerait des suppressions légitimes sans que
    // personne ne comprenne pourquoi, et la réaction serait de contourner le garde-fou.
    const { assertDocumentDestroyable } = await import("../practice-lifecycle-service");
    documentRow = {
      isClientOriginal: false,
      clientAuthorizedDestroyAt: null,
      returnOfferedAt: null,
    };
    await expect(
      assertDocumentDestroyable({ cabinetId: "cab", documentId: "doc-1" }),
    ).resolves.toBeUndefined();
  });

  it("porte l'article et la porte de sortie dans le refus", async () => {
    const { assertDocumentDestroyable } = await import("../practice-lifecycle-service");
    documentRow = {
      isClientOriginal: true,
      clientAuthorizedDestroyAt: null,
      returnOfferedAt: null,
    };
    await assertDocumentDestroyable({ cabinetId: "cab", documentId: "doc-1" }).catch(
      (e: Error) => {
        expect(e.message).toContain("art. 19");
        expect(e.message).toContain("OU");
      },
    );
  });
});

/* ════════════════════════════════════════════════════════════════
   Art. 9
   ════════════════════════════════════════════════════════════════ */

describe("Liste des dossiers fermés (art. 9)", () => {
  it("INCLUT un dossier fermé sans date de fermeture, et le signale", async () => {
    // L'exclure le ferait disparaître de la liste que l'inspecteur demande, ce qui
    // transformerait un défaut de saisie en absence pure et simple.
    const { getClosedMattersList } = await import("../practice-lifecycle-service");
    dossierRows = [
      { id: "d1", reference: "2020-001", clientId: "c1", dateCloture: null },
      { id: "d2", reference: "2023-014", clientId: "c2", dateCloture: new Date("2023-06-01") },
    ];
    const l = await getClosedMattersList({ cabinetId: "cab", now: NOW });
    expect(l).toHaveLength(2);
    expect(l.find((x) => x.dossierId === "d1")!.missingClosureDate).toBe(true);
    expect(l.find((x) => x.dossierId === "d2")!.missingClosureDate).toBe(false);
  });

  it("interroge la base sur une fenêtre de sept ans", async () => {
    const { getClosedMattersList } = await import("../practice-lifecycle-service");
    await getClosedMattersList({ cabinetId: "cab", now: NOW });
    const where = prismaMock.dossier.findMany.mock.calls[0]![0].where as unknown as {
      OR: Array<{ dateCloture: { gte?: Date } | null }>;
    };
    const borne = where.OR[0]!.dateCloture!.gte!;
    expect(borne.toISOString().slice(0, 10)).toBe("2019-08-03");
  });
});

/* ════════════════════════════════════════════════════════════════
   Art. 7
   ════════════════════════════════════════════════════════════════ */

describe("Échéances (art. 7)", () => {
  it("NE DEVINE PAS la nature d'une échéance depuis son intitulé", async () => {
    // Se tromper dans un sens afficherait un faux calme ; dans l'autre, les vraies
    // prescriptions se noieraient sous des alertes critiques.
    const { getDeadlineAlerts } = await import("../practice-lifecycle-service");
    calendarRows = [
      {
        dossierId: "d1",
        title: "Prescription du recours en dommages",
        date: new Date("2026-08-10T00:00:00Z"),
        deadlineKind: null,
        dossier: { reference: "2024-003" },
      },
    ];
    const l = await getDeadlineAlerts({ cabinetId: "cab", now: NOW });
    expect(l[0]!.kind).toBe("INTERNAL");
    expect(l[0]!.alert.severity).not.toBe("CRITICAL");
  });

  it("traite une prescription QUALIFIÉE comme critique", async () => {
    const { getDeadlineAlerts } = await import("../practice-lifecycle-service");
    calendarRows = [
      {
        dossierId: "d1",
        title: "Échéance",
        date: new Date("2026-08-20T00:00:00Z"),
        deadlineKind: "PRESCRIPTION",
        dossier: { reference: "2024-003" },
      },
    ];
    const l = await getDeadlineAlerts({ cabinetId: "cab", now: NOW });
    expect(l[0]!.kind).toBe("PRESCRIPTION");
    expect(l[0]!.alert.severity).toBe("CRITICAL");
  });

  it("ignore une valeur de nature inconnue au lieu de la propager", async () => {
    const { getDeadlineAlerts } = await import("../practice-lifecycle-service");
    calendarRows = [
      {
        dossierId: "d1",
        title: "Échéance",
        date: new Date("2026-08-20T00:00:00Z"),
        deadlineKind: "PEREMPTION_INVENTEE",
        dossier: null,
      },
    ];
    const l = await getDeadlineAlerts({ cabinetId: "cab", now: NOW });
    expect(l[0]!.kind).toBe("INTERNAL");
  });

  it("continue de signaler une prescription dépassée", async () => {
    const { getDeadlineAlerts } = await import("../practice-lifecycle-service");
    calendarRows = [
      {
        dossierId: "d1",
        title: "Échéance",
        date: new Date("2026-05-01T00:00:00Z"),
        deadlineKind: "PRESCRIPTION",
        dossier: null,
      },
    ];
    const l = await getDeadlineAlerts({ cabinetId: "cab", now: NOW });
    expect(l[0]!.alert.overdue).toBe(true);
    expect(l[0]!.alert.messageFr).toContain("assureur");
  });
});

/* ════════════════════════════════════════════════════════════════
   Art. 74-82
   ════════════════════════════════════════════════════════════════ */

describe("Cessionnaire désigné (art. 74 à 82)", () => {
  it("signale un cabinet québécois sans plan de cession", async () => {
    // L'obligation la plus facile à manquer : elle se tient à froid, et rien ne la
    // rappelle.
    const { getSuccessionStatus } = await import("../practice-lifecycle-service");
    const s = await getSuccessionStatus("cab");
    expect(s.hasPlan).toBe(false);
    expect(s.missing.map((d) => d.id)).toContain("CESS-78-CESSIONNAIRE");
  });

  it("se tait une fois le cessionnaire désigné", async () => {
    const { getSuccessionStatus } = await import("../practice-lifecycle-service");
    successionRow = { successorName: "Me Autre", successorConfirmedAt: null, lastReviewedAt: null };
    const s = await getSuccessionStatus("cab");
    expect(s.missing).toHaveLength(0);
  });

  it("distingue un cessionnaire nommé d'un cessionnaire qui a confirmé", async () => {
    // Un cessionnaire qui ignore qu'il l'est n'en est pas un. Le règlement n'exige pas
    // la preuve de son accord, mais un refus découvert le jour venu laisse sans plan.
    const { getSuccessionStatus } = await import("../practice-lifecycle-service");
    successionRow = { successorName: "Me Autre", successorConfirmedAt: null, lastReviewedAt: null };
    const s = await getSuccessionStatus("cab");
    expect(s.successorName).toBe("Me Autre");
    expect(s.successorConfirmedAt).toBeNull();
  });

  it("refuse un plan sans nom", async () => {
    const { setSuccessionPlan, PracticeLifecycleError } = await import(
      "../practice-lifecycle-service"
    );
    await expect(
      setSuccessionPlan({ cabinetId: "cab", successorName: "   ", userId: "u1", now: NOW }),
    ).rejects.toBeInstanceOf(PracticeLifecycleError);
  });

  it("horodate la révision à l'enregistrement", async () => {
    const { setSuccessionPlan } = await import("../practice-lifecycle-service");
    await setSuccessionPlan({
      cabinetId: "cab",
      successorName: "Me Autre",
      userId: "u1",
      now: NOW,
    });
    expect((upsertArgs as { create: Record<string, unknown> }).create.lastReviewedAt).toEqual(NOW);
  });

  it("NE SIGNALE RIEN en Ontario, faute de texte lu", async () => {
    // Le LSO impose un plan de succession, relevé en recherche web mais jamais lu dans
    // un texte officiel. L'imposer par symétrie serait inventer une règle.
    const { getSuccessionStatus } = await import("../practice-lifecycle-service");
    province = "ON";
    const s = await getSuccessionStatus("cab");
    expect(s.missing).toEqual([]);
    expect(s.duties).toEqual([]);
  });
});
