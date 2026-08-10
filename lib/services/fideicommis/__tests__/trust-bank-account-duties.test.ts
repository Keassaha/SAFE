import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Démarches post-ouverture d'un compte en fidéicommis — art. 51 et 64 B-1 r.5.
 *
 * ── Le défaut que ces tests verrouillent ─────────────────────────────────────
 *
 * `getPostOpeningDuties` LISAIT `regulatorNotifiedAt` et `clientCopySentAt` depuis
 * CH-01, mais rien dans le dépôt ne les ÉCRIVAIT. Les deux obligations restaient donc
 * « à faire » pour toujours, quoi que le cabinet accomplisse.
 *
 * C'est le motif que le programme combat partout : une exigence sans porte de sortie
 * (PR-2). Une case qu'on ne peut jamais cocher finit par être ignorée, et l'écran
 * entier avec elle.
 *
 * Ce qui est prouvé ici :
 *   1. consigner la démarche l'inscrit vraiment, et l'obligation cesse d'être due ;
 *   2. la copie au client est REFUSÉE sur un compte général — l'art. 64 ne vise que
 *      le compte particulier, et l'accepter inventerait une obligation ;
 *   3. la pièce jointe est conservée quand il y en a une (PR-8) ;
 *   4. l'entente B-1 r.10 se confirme APRÈS l'ouverture, sans rouvrir le compte.
 */

let account: Record<string, unknown> | null;
const updates: Array<Record<string, unknown>> = [];
const audits: Array<Record<string, unknown>> = [];

const prismaMock = {
  cabinet: {
    findUnique: vi.fn(async () => ({ config: JSON.stringify({ province: "QC" }) })),
  },
  trustBankAccount: {
    findFirst: vi.fn(async () => account),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updates.push(data);
      return { id: "acc-1", ...data };
    }),
    updateMany: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updates.push(data);
      return { count: 1 };
    }),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn(async (entry: Record<string, unknown>) => {
    audits.push(entry);
  }),
}));

const { confirmBarreauAgreement, recordPostOpeningDuty } = await import(
  "../trust-bank-account-service"
);

const LE_15 = new Date("2026-08-15T12:00:00.000Z");

beforeEach(() => {
  updates.length = 0;
  audits.length = 0;
  account = { id: "acc-1", type: "GENERAL" };
});

describe("La démarche de l'art. 51 peut enfin être consignée", () => {
  it("inscrit la date, donc l'obligation cesse d'être due", async () => {
    await recordPostOpeningDuty({
      cabinetId: "cab-1",
      accountId: "acc-1",
      duty: "REGULATOR_FORM_SENT",
      at: LE_15,
      userId: "u-1",
    });

    expect(updates[0]).toMatchObject({ regulatorNotifiedAt: LE_15 });
  });

  it("conserve la pièce quand il y en a une", async () => {
    // PR-8 : toute écriture réglementaire doit pouvoir porter sa pièce.
    await recordPostOpeningDuty({
      cabinetId: "cab-1",
      accountId: "acc-1",
      duty: "REGULATOR_FORM_SENT",
      at: LE_15,
      documentId: "doc-9",
      userId: "u-1",
    });

    expect(updates[0]).toMatchObject({ regulatorFormDocumentId: "doc-9" });
  });

  it("journalise l'article qui fonde la démarche", async () => {
    await recordPostOpeningDuty({
      cabinetId: "cab-1",
      accountId: "acc-1",
      duty: "REGULATOR_FORM_SENT",
      at: LE_15,
      userId: "u-1",
    });

    expect(audits[0]?.newValues).toMatchObject({ reference: "B-1 r.5, art. 51" });
  });
});

describe("La copie au client n'existe que pour le compte particulier", () => {
  it("REFUSE la copie au client sur un compte général", async () => {
    // L'art. 64 ne vise que le compte particulier. L'accepter ici inventerait une
    // obligation, faute aussi grave que d'en omettre une.
    await expect(
      recordPostOpeningDuty({
        cabinetId: "cab-1",
        accountId: "acc-1",
        duty: "CLIENT_COPY_SENT",
        at: LE_15,
        userId: "u-1",
      }),
    ).rejects.toThrow(/art. 64/);

    expect(updates).toHaveLength(0);
  });

  it("l'accepte sur un compte particulier, et cite l'art. 64", async () => {
    account = { id: "acc-2", type: "PARTICULIER" };

    await recordPostOpeningDuty({
      cabinetId: "cab-1",
      accountId: "acc-2",
      duty: "CLIENT_COPY_SENT",
      at: LE_15,
      userId: "u-1",
    });

    expect(updates[0]).toMatchObject({ clientCopySentAt: LE_15 });
    expect(audits[0]?.newValues).toMatchObject({ reference: "B-1 r.5, art. 64" });
  });
});

describe("Un compte d'un autre cabinet reste hors de portée", () => {
  it("refuse quand le compte est introuvable pour ce cabinet", async () => {
    account = null;
    await expect(
      recordPostOpeningDuty({
        cabinetId: "cab-1",
        accountId: "acc-inconnu",
        duty: "REGULATOR_FORM_SENT",
        at: LE_15,
        userId: "u-1",
      }),
    ).rejects.toThrow(/introuvable/);
  });
});

describe("L'entente B-1 r.10 se confirme après coup", () => {
  it("se coche sans rouvrir le compte", async () => {
    // Elle n'est pas bloquante à l'ouverture : c'est une démarche de plusieurs jours
    // auprès de la banque. Elle doit donc pouvoir se lever plus tard.
    await confirmBarreauAgreement({
      cabinetId: "cab-1",
      accountId: "acc-1",
      confirmed: true,
      userId: "u-1",
    });

    expect(updates[0]).toMatchObject({ barreauAgreementConfirmed: true });
    expect(audits[0]?.newValues).toMatchObject({ reference: "B-1 r.5, art. 50" });
  });
});
