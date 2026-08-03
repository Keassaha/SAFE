import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-10 — Solde débiteur et intérêts, côté service.
 *
 * Ce qui est prouvé ici :
 *   1. la détection est IDEMPOTENTE — consulter l'écran dix fois ne crée pas dix
 *      incidents pour un seul problème ;
 *   2. un découvert comblé se clôt tout seul, mais RESTE au dossier : c'est ce qu'un
 *      inspecteur cherche, non pas l'état à une date mais ce qui s'est passé ;
 *   3. le service ne CALCULE aucun intérêt — ni B-1 r.10 ni la s. 57 n'ont été lus ;
 *   4. le bénéficiaire, lui, est imposé et dépend de la province et du type de compte ;
 *   5. le renflouement ne peut pas être saisi deux fois.
 */

let province: "QC" | "ON";
let openRows: Array<Record<string, unknown>>;
let balanceGroups: Array<{ clientId: string; dossierId: string | null; _sum: { amount: number } }>;
let accountType: "GENERAL" | "PARTICULIER";

const created: Array<Record<string, unknown>> = [];
const updated: Array<{ id: string; data: Record<string, unknown> }> = [];
let upsertArgs: Record<string, unknown> | null = null;

const prismaMock = {
  cabinet: { findUnique: vi.fn(async () => ({ config: JSON.stringify({ province }) })) },
  trustTransaction: {
    groupBy: vi.fn(async () => balanceGroups),
  },
  trustShortfall: {
    findMany: vi.fn(async () => openRows),
    findFirst: vi.fn(async () => openRows[0] ?? null),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      created.push(data);
      return { id: `sf-${created.length}` };
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      updated.push({ id: where.id, data });
      return { id: where.id };
    }),
  },
  trustBankAccount: {
    findFirst: vi.fn(async () => ({ type: accountType })),
  },
  trustInterestRemittance: {
    upsert: vi.fn(async (args: Record<string, unknown>) => {
      upsertArgs = args;
      return { id: "ir-1" };
    }),
    findMany: vi.fn(async () => []),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));

const NOW = new Date("2026-07-31T12:00:00Z");

beforeEach(() => {
  province = "QC";
  accountType = "GENERAL";
  openRows = [];
  balanceGroups = [];
  created.length = 0;
  updated.length = 0;
  upsertArgs = null;
  vi.clearAllMocks();
});

/* ════════════════════════════════════════════════════════════════
   Détection
   ════════════════════════════════════════════════════════════════ */

describe("Détection des découverts", () => {
  it("consigne un découvert vu au registre", async () => {
    const { detectShortfalls } = await import("../trust-shortfall-service");
    balanceGroups = [{ clientId: "c1", dossierId: "d1", _sum: { amount: -450 } }];

    const found = await detectShortfalls({ cabinetId: "cab", now: NOW });

    expect(found).toHaveLength(1);
    expect(found[0]!.isNew).toBe(true);
    expect(found[0]!.amount).toBe(450);
    expect(created[0]!.province).toBe("QC");
    // Le solde au moment de la détection est conservé tel quel, signé.
    expect(created[0]!.balanceAtDetection).toBe(-450);
  });

  it("EST IDEMPOTENTE : un incident déjà ouvert n'en crée pas un second", async () => {
    // Sans cela, dix consultations de l'écran produiraient dix incidents pour un seul
    // problème, et l'historique deviendrait illisible au moment où il compte le plus.
    const { detectShortfalls } = await import("../trust-shortfall-service");
    balanceGroups = [{ clientId: "c1", dossierId: "d1", _sum: { amount: -450 } }];
    openRows = [
      {
        id: "sf-existant",
        clientId: "c1",
        dossierId: "d1",
        amount: 450,
        detectedAt: new Date("2026-07-01T00:00:00Z"),
        resolvedAt: null,
        remediationSource: null,
        remediationNote: null,
        province: "QC",
      },
    ];

    const found = await detectShortfalls({ cabinetId: "cab", now: NOW });

    expect(created).toHaveLength(0);
    expect(found[0]!.isNew).toBe(false);
    // La date de détection reste celle du PREMIER constat : c'est elle qui mesure
    // depuis quand les fonds d'un autre client sont utilisés.
    expect(found[0]!.detectedAt).toEqual(new Date("2026-07-01T00:00:00Z"));
  });

  it("met à jour le montant quand le découvert s'aggrave, sans rouvrir d'incident", async () => {
    const { detectShortfalls } = await import("../trust-shortfall-service");
    balanceGroups = [{ clientId: "c1", dossierId: "d1", _sum: { amount: -900 } }];
    openRows = [
      {
        id: "sf-existant",
        clientId: "c1",
        dossierId: "d1",
        amount: 450,
        detectedAt: new Date("2026-07-01T00:00:00Z"),
        resolvedAt: null,
        remediationSource: null,
        remediationNote: null,
        province: "QC",
      },
    ];

    await detectShortfalls({ cabinetId: "cab", now: NOW });

    expect(created).toHaveLength(0);
    expect(updated[0]!.data.amount).toBe(900);
    expect(updated[0]!.data.resolvedAt).toBeUndefined();
  });

  it("clôt un incident dont la carte-client est repassée au positif", async () => {
    const { detectShortfalls } = await import("../trust-shortfall-service");
    balanceGroups = []; // plus aucun découvert
    openRows = [
      {
        id: "sf-comble",
        clientId: "c1",
        dossierId: "d1",
        amount: 450,
        detectedAt: new Date("2026-07-01T00:00:00Z"),
        resolvedAt: null,
        remediationSource: null,
        remediationNote: null,
        province: "QC",
      },
    ];

    await detectShortfalls({ cabinetId: "cab", now: NOW });

    expect(updated[0]!.id).toBe("sf-comble");
    expect(updated[0]!.data.resolvedAt).toEqual(NOW);
    // Source non déclarée : on l'écrit plutôt que de laisser croire à un renflouement.
    expect(updated[0]!.data.remediationSource).toBe("LEDGER_CORRECTION");
    expect(String(updated[0]!.data.remediationNote)).toContain("non déclarée");
  });

  it("N'EFFACE PAS l'incident clos : il est mis à jour, jamais supprimé", async () => {
    // Un découvert survenu le 3 et comblé le 4 n'apparaîtrait nulle part si l'on ne
    // regardait que les soldes de fin de mois. Or c'est ce qu'un inspecteur cherche.
    const { detectShortfalls } = await import("../trust-shortfall-service");
    balanceGroups = [];
    openRows = [
      {
        id: "sf-comble",
        clientId: "c1",
        dossierId: null,
        amount: 100,
        detectedAt: new Date("2026-07-03T00:00:00Z"),
        resolvedAt: null,
        remediationSource: null,
        remediationNote: null,
        province: "QC",
      },
    ];

    await detectShortfalls({ cabinetId: "cab", now: NOW });

    expect(prismaMock.trustShortfall.update).toHaveBeenCalled();
    expect(prismaMock.trustShortfall).not.toHaveProperty("delete");
  });

  it("traite chaque carte-client séparément, sans compensation", async () => {
    const { detectShortfalls } = await import("../trust-shortfall-service");
    balanceGroups = [
      { clientId: "riche", dossierId: null, _sum: { amount: 5000 } },
      { clientId: "pauvre", dossierId: null, _sum: { amount: -300 } },
    ];

    const found = await detectShortfalls({ cabinetId: "cab", now: NOW });

    expect(found).toHaveLength(1);
    expect(found[0]!.clientId).toBe("pauvre");
  });
});

/* ════════════════════════════════════════════════════════════════
   Renflouement
   ════════════════════════════════════════════════════════════════ */

describe("Renflouement", () => {
  it("consigne la source et la date, sans effectuer le dépôt lui-même", async () => {
    // Le dépôt passe par createTrustDeposit et ses garde-fous. Le faire ici les
    // contournerait, ce qu'un chantier de conformité ne doit pas faire.
    const { recordRemediation } = await import("../trust-shortfall-service");
    openRows = [
      {
        id: "sf-1",
        clientId: "c1",
        dossierId: null,
        amount: 450,
        detectedAt: new Date("2026-07-01T00:00:00Z"),
        resolvedAt: null,
        province: "QC",
      },
    ];

    await recordRemediation({
      cabinetId: "cab",
      shortfallId: "sf-1",
      source: "CABINET_OPERATING",
      transactionId: "ttx-9",
      userId: "u1",
      now: NOW,
    });

    expect(updated[0]!.data.remediationSource).toBe("CABINET_OPERATING");
    expect(updated[0]!.data.remediationTransactionId).toBe("ttx-9");
    expect(prismaMock.trustTransaction.groupBy).not.toHaveBeenCalled();
  });

  it("refuse de combler deux fois le même incident", async () => {
    const { recordRemediation, TrustShortfallError } = await import("../trust-shortfall-service");
    openRows = [
      {
        id: "sf-1",
        clientId: "c1",
        dossierId: null,
        amount: 450,
        detectedAt: new Date("2026-07-01T00:00:00Z"),
        resolvedAt: new Date("2026-07-02T00:00:00Z"),
        province: "QC",
      },
    ];

    await expect(
      recordRemediation({
        cabinetId: "cab",
        shortfallId: "sf-1",
        source: "CLIENT_DEPOSIT",
        userId: "u1",
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(TrustShortfallError);
  });

  it("porte l'article ontarien pour un cabinet ontarien", async () => {
    const { recordRemediation } = await import("../trust-shortfall-service");
    province = "ON";
    openRows = [
      {
        id: "sf-1",
        clientId: "c1",
        dossierId: null,
        amount: 450,
        detectedAt: new Date("2026-07-01T00:00:00Z"),
        resolvedAt: new Date("2026-07-02T00:00:00Z"),
        province: "ON",
      },
    ];

    await recordRemediation({
      cabinetId: "cab",
      shortfallId: "sf-1",
      source: "CLIENT_DEPOSIT",
      userId: "u1",
      now: NOW,
    }).catch((e: Error & { reference: string }) => {
      expect(e.reference).toBe("By-Law 9, s. 14");
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   Intérêts
   ════════════════════════════════════════════════════════════════ */

describe("Versement des intérêts", () => {
  it("impose le bénéficiaire au lieu de le laisser saisir", async () => {
    const { recordInterestRemittance } = await import("../trust-shortfall-service");

    await recordInterestRemittance({
      cabinetId: "cab",
      trustBankAccountId: "acc-1",
      periode: "2026-06",
      amount: 143.2,
      remittedAt: new Date("2026-07-05"),
      proofDocumentId: "doc-1",
      userId: "u1",
    });

    const create = (upsertArgs as { create: Record<string, unknown> }).create;
    expect(create.beneficiary).toBe("FONDS_ETUDES_JURIDIQUES");
  });

  it("dirige les intérêts d'un cabinet ontarien vers la Law Foundation", async () => {
    const { recordInterestRemittance } = await import("../trust-shortfall-service");
    province = "ON";

    await recordInterestRemittance({
      cabinetId: "cab",
      trustBankAccountId: "acc-1",
      periode: "2026-06",
      amount: 90,
      userId: "u1",
    });

    const create = (upsertArgs as { create: Record<string, unknown> }).create;
    expect(create.beneficiary).toBe("LAW_FOUNDATION_ONTARIO");
  });

  it("dirige les intérêts d'un compte particulier vers le client (art. 62)", async () => {
    const { recordInterestRemittance } = await import("../trust-shortfall-service");
    accountType = "PARTICULIER";

    await recordInterestRemittance({
      cabinetId: "cab",
      trustBankAccountId: "acc-2",
      periode: "2026-06",
      amount: 12,
      userId: "u1",
    });

    const create = (upsertArgs as { create: Record<string, unknown> }).create;
    expect(create.beneficiary).toBe("CLIENT");
  });

  it("NE CALCULE AUCUN MONTANT : il vient du relevé", async () => {
    // Ni B-1 r.10 ni la s. 57 n'ont été lus. Calculer fabriquerait un chiffre que
    // rien ne fonde, et un cabinet le verserait.
    const { recordInterestRemittance } = await import("../trust-shortfall-service");

    await recordInterestRemittance({
      cabinetId: "cab",
      trustBankAccountId: "acc-1",
      periode: "2026-06",
      amount: 143.2,
      userId: "u1",
    });

    const create = (upsertArgs as { create: Record<string, unknown> }).create;
    expect(create.amount).toBe(143.2);
    expect(Object.keys(create)).not.toContain("rate");
    expect(Object.keys(create)).not.toContain("taux");
  });

  it("n'est complet qu'avec la date ET la pièce", async () => {
    const { recordInterestRemittance } = await import("../trust-shortfall-service");

    const sansPiece = await recordInterestRemittance({
      cabinetId: "cab",
      trustBankAccountId: "acc-1",
      periode: "2026-06",
      amount: 143.2,
      remittedAt: new Date("2026-07-05"),
      userId: "u1",
    });
    expect(sansPiece.complete).toBe(false);

    const complet = await recordInterestRemittance({
      cabinetId: "cab",
      trustBankAccountId: "acc-1",
      periode: "2026-06",
      amount: 143.2,
      remittedAt: new Date("2026-07-05"),
      proofDocumentId: "doc-1",
      userId: "u1",
    });
    expect(complet.complete).toBe(true);
  });

  it("ne crée pas deux versements pour la même période et le même bénéficiaire", async () => {
    // La contrainte d'unicité existe en base ; le service passe par upsert plutôt que
    // par create, sinon une double saisie doublerait le montant déclaré.
    const { recordInterestRemittance } = await import("../trust-shortfall-service");

    await recordInterestRemittance({
      cabinetId: "cab",
      trustBankAccountId: "acc-1",
      periode: "2026-06",
      amount: 143.2,
      userId: "u1",
    });

    expect(prismaMock.trustInterestRemittance.upsert).toHaveBeenCalled();
    const where = (upsertArgs as { where: Record<string, unknown> }).where;
    expect(where).toHaveProperty("trustBankAccountId_periode_beneficiary");
  });
});
