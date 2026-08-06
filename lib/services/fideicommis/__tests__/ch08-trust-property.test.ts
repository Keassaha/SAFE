import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-08 — Registre des autres biens, côté service.
 *
 * Ce qui est prouvé ici :
 *   1. les champs exigés dépendent de la province, et les champs de l'autre régime
 *      ne sont pas écrits ;
 *   2. un déplacement conserve l'historique et ROUVRE l'obligation d'aviser le
 *      client (art. 45 : « tout changement d'emplacement subséquent ») ;
 *   3. une remise sans destinataire est refusée ;
 *   4. un bien déjà remis ne se remet pas deux fois — le registre est permanent.
 */

let province: "QC" | "ON";
let propertyRow: Record<string, unknown> | null;
let createdData: Record<string, unknown> | null = null;
let updateData: Record<string, unknown> | null = null;

const prismaMock = {
  cabinet: { findUnique: vi.fn(async () => ({ config: JSON.stringify({ province }) })) },
  trustProperty: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      createdData = data;
      return { id: "prop-1" };
    }),
    findFirst: vi.fn(async () => propertyRow),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updateData = data;
      return { id: "prop-1" };
    }),
    updateMany: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updateData = data;
      return { count: 1 };
    }),
    findMany: vi.fn(async () => []),
    count: vi.fn(async () => 0),
  },
  dossier: { findMany: vi.fn(async () => []) },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));

const RECEIVED = new Date("2026-06-01T00:00:00Z");

const QC_BASE = {
  cabinetId: "cab1",
  clientId: "client-1",
  dossierId: "dossier-1",
  description: "Testament original de M. Tremblay",
  receivedAt: RECEIVED,
  storageLocation: "Coffre du bureau",
  purpose: "Conservation jusqu'au décès",
  userId: "user-1",
};

const ON_BASE = {
  cabinetId: "cab1",
  clientId: "client-1",
  description: "Share certificate no. 4412",
  receivedAt: RECEIVED,
  receivedFromName: "Broker X",
  estimatedValue: 25000,
  userId: "user-1",
};

beforeEach(() => {
  province = "QC";
  propertyRow = null;
  createdData = null;
  updateData = null;
  prismaMock.trustProperty.create.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Inscription — art. 43
   ════════════════════════════════════════════════════════════════ */

describe("Inscription d'un bien", () => {
  it("inscrit un bien québécois complet", async () => {
    const { recordTrustProperty } = await import("../trust-property-service");
    const r = await recordTrustProperty(QC_BASE);

    expect(r.id).toBe("prop-1");
    expect(createdData?.description).toBe("Testament original de M. Tremblay");
    expect(createdData?.province).toBe("QC");
  });

  it("REFUSE une inscription québécoise sans lieu de garde (art. 45)", async () => {
    const { recordTrustProperty } = await import("../trust-property-service");

    await expect(
      recordTrustProperty({ ...QC_BASE, storageLocation: null }),
    ).rejects.toMatchObject({ code: "MISSING_REQUIRED_FIELDS" });
    expect(prismaMock.trustProperty.create).not.toHaveBeenCalled();
  });

  it("REFUSE une inscription ontarienne sans valeur (s. 18(9))", async () => {
    province = "ON";
    const { recordTrustProperty } = await import("../trust-property-service");

    await expect(
      recordTrustProperty({ ...ON_BASE, estimatedValue: null }),
    ).rejects.toMatchObject({ code: "MISSING_REQUIRED_FIELDS" });
  });

  it("REFUSE une inscription ontarienne sans détenteur précédent", async () => {
    province = "ON";
    const { recordTrustProperty } = await import("../trust-property-service");

    await expect(
      recordTrustProperty({ ...ON_BASE, receivedFromName: null }),
    ).rejects.toMatchObject({ code: "MISSING_REQUIRED_FIELDS" });
  });

  it("N'ÉCRIT PAS les champs ontariens sur un bien québécois", async () => {
    // Un registre québécois ne doit pas porter de colonnes ontariennes vides. Le
    // service n'écrit que ce que la province exige.
    const { recordTrustProperty } = await import("../trust-property-service");
    await recordTrustProperty({ ...QC_BASE, estimatedValue: 5000, receivedFromName: "Tiers" });

    expect(createdData?.estimatedValue).toBeUndefined();
    expect(createdData?.receivedFromName).toBeUndefined();
  });

  it("N'ÉCRIT PAS les champs québécois sur un bien ontarien", async () => {
    province = "ON";
    const { recordTrustProperty } = await import("../trust-property-service");
    await recordTrustProperty({
      ...ON_BASE,
      // Passés par l'appelant, mais non exigés par la s. 18(9).
      ...({ storageLocation: "Vault", purpose: "Custody" } as Record<string, string>),
    });

    expect(createdData?.storageLocation).toBeUndefined();
    expect(createdData?.purpose).toBeUndefined();
  });

  it("amorce l'historique des lieux dès l'inscription (Québec)", async () => {
    const { recordTrustProperty } = await import("../trust-property-service");
    await recordTrustProperty(QC_BASE);

    const history = JSON.parse(String(createdData?.storageHistoryJson));
    expect(history).toHaveLength(1);
    expect(history[0].location).toBe("Coffre du bureau");
  });

  it("renvoie les obligations d'information quand le bien vient d'un tiers", async () => {
    const { recordTrustProperty } = await import("../trust-property-service");
    const r = await recordTrustProperty({ ...QC_BASE, fromThirdParty: true });

    expect(r.noticeDuties.map((d) => d.code)).toContain("THIRD_PARTY_RECEIPT");
  });

  it("ne renvoie AUCUNE obligation d'information en Ontario", async () => {
    province = "ON";
    const { recordTrustProperty } = await import("../trust-property-service");
    const r = await recordTrustProperty({ ...ON_BASE, fromThirdParty: true });

    expect(r.noticeDuties).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════════════════════════
   Déplacement — art. 45
   ════════════════════════════════════════════════════════════════ */

describe("Déplacement d'un bien", () => {
  beforeEach(() => {
    propertyRow = {
      id: "prop-1",
      province: "QC",
      storageLocation: "Coffre du bureau",
      storageHistoryJson: JSON.stringify([{ location: "Coffre du bureau", from: RECEIVED }]),
    };
  });

  it("conserve l'historique plutôt que d'écraser le lieu", async () => {
    // Écraser ferait perdre la trace du déplacement, alors que l'art. 45 vise
    // précisément « tout changement d'emplacement subséquent ».
    const { moveTrustProperty } = await import("../trust-property-service");

    await moveTrustProperty({
      cabinetId: "cab1",
      propertyId: "prop-1",
      newLocation: "Coffre-fort de la succursale",
      movedAt: new Date("2026-07-01T00:00:00Z"),
      userId: "user-1",
    });

    const history = JSON.parse(String(updateData?.storageHistoryJson));
    expect(history).toHaveLength(2);
    expect(history[1].location).toBe("Coffre-fort de la succursale");
  });

  it("ROUVRE l'obligation d'aviser le client", async () => {
    // La notification précédente portait sur l'ancien emplacement : elle ne couvre
    // pas le nouveau.
    const { moveTrustProperty } = await import("../trust-property-service");

    const r = await moveTrustProperty({
      cabinetId: "cab1",
      propertyId: "prop-1",
      newLocation: "Coffre-fort de la succursale",
      movedAt: new Date("2026-07-01T00:00:00Z"),
      userId: "user-1",
    });

    expect(updateData?.storageNotifiedAt).toBeNull();
    expect(r.noticeRequired).toBe(true);
    expect(r.reference).toBe("B-1 r.5, art. 45");
  });

  it("n'exige AUCUNE notification pour un bien ontarien", async () => {
    propertyRow = { ...propertyRow!, province: "ON" };
    const { moveTrustProperty } = await import("../trust-property-service");

    const r = await moveTrustProperty({
      cabinetId: "cab1",
      propertyId: "prop-1",
      newLocation: "New vault",
      movedAt: new Date("2026-07-01T00:00:00Z"),
      userId: "user-1",
    });

    expect(r.noticeRequired).toBe(false);
  });

  it("repart d'un historique vide si le JSON est illisible", async () => {
    propertyRow = { ...propertyRow!, storageHistoryJson: "{ pas du json" };
    const { moveTrustProperty } = await import("../trust-property-service");

    await moveTrustProperty({
      cabinetId: "cab1",
      propertyId: "prop-1",
      newLocation: "Nouveau coffre",
      movedAt: new Date("2026-07-01T00:00:00Z"),
      userId: "user-1",
    });

    const history = JSON.parse(String(updateData?.storageHistoryJson));
    expect(history).toHaveLength(1);
  });
});

/* ════════════════════════════════════════════════════════════════
   Remise — art. 43
   ════════════════════════════════════════════════════════════════ */

describe("Remise d'un bien", () => {
  beforeEach(() => {
    propertyRow = { id: "prop-1", releasedAt: null, description: "Testament" };
  });

  it("consigne la remise et son destinataire", async () => {
    const { releaseTrustProperty } = await import("../trust-property-service");

    await releaseTrustProperty({
      cabinetId: "cab1",
      propertyId: "prop-1",
      releasedAt: new Date("2026-08-01T00:00:00Z"),
      releasedToName: "Mme Tremblay",
      userId: "user-1",
    });

    expect(updateData?.releasedToName).toBe("Mme Tremblay");
  });

  it("REFUSE une remise sans destinataire", async () => {
    // L'art. 43 et la s. 18(9) exigent tous deux « le nom de la personne à qui il le
    // remet ». Une remise anonyme ne prouve rien.
    const { releaseTrustProperty } = await import("../trust-property-service");

    await expect(
      releaseTrustProperty({
        cabinetId: "cab1",
        propertyId: "prop-1",
        releasedAt: new Date("2026-08-01T00:00:00Z"),
        releasedToName: "   ",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ code: "RELEASE_RECIPIENT_REQUIRED" });
  });

  it("REFUSE de remettre deux fois : le registre est permanent", async () => {
    propertyRow = { id: "prop-1", releasedAt: new Date("2026-07-15T00:00:00Z"), description: "T" };
    const { releaseTrustProperty } = await import("../trust-property-service");

    await expect(
      releaseTrustProperty({
        cabinetId: "cab1",
        propertyId: "prop-1",
        releasedAt: new Date("2026-08-01T00:00:00Z"),
        releasedToName: "Mme Tremblay",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ code: "ALREADY_RELEASED" });
  });
});

/* ════════════════════════════════════════════════════════════════
   Fermeture de dossier
   ════════════════════════════════════════════════════════════════ */

describe("Fermeture d'un dossier", () => {
  it("ne signale rien quand aucun bien n'est détenu", async () => {
    prismaMock.trustProperty.count = vi.fn(async () => 0) as never;
    const { checkPropertiesBeforeDossierClosure } = await import("../trust-property-service");

    expect(
      await checkPropertiesBeforeDossierClosure({ cabinetId: "cab1", dossierId: "dossier-1" }),
    ).toBeNull();
  });

  it("signale les biens encore détenus", async () => {
    prismaMock.trustProperty.count = vi.fn(async () => 3) as never;
    const { checkPropertiesBeforeDossierClosure } = await import("../trust-property-service");

    const b = await checkPropertiesBeforeDossierClosure({
      cabinetId: "cab1",
      dossierId: "dossier-1",
    });
    expect(b?.count).toBe(3);
  });
});

/* ════════════════════════════════════════════════════════════════
   Conservation
   ════════════════════════════════════════════════════════════════ */

describe("Conservation", () => {
  it("expose 7 ans depuis la fermeture au Québec", async () => {
    const { getPropertyRetention } = await import("../trust-property-service");
    const r = await getPropertyRetention("cab1");
    expect(r).toMatchObject({ years: 7, anchor: "FILE_CLOSURE" });
  });

  it("expose 10 ans depuis la fin d'exercice en Ontario", async () => {
    province = "ON";
    const { getPropertyRetention } = await import("../trust-property-service");
    const r = await getPropertyRetention("cab1");
    expect(r).toMatchObject({ years: 10, anchor: "FISCAL_YEAR_END" });
  });
});
