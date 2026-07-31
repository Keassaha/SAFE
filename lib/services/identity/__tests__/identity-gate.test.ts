import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-06.3 — Le garde-fou d'identité sur les mouvements de fonds.
 *
 * Ferme RC-10 de l'audit : `ClientIdentityVerification` existait comme modèle mais
 * n'était jamais déclenchée. Un cabinet pouvait recevoir 50 000 $ en fidéicommis
 * pour un client jamais vérifié, sans aucun signal.
 *
 * Ces tests prouvent que le blocage est **province-aware**, et surtout qu'il ne
 * bloque QUE ce que le règlement bloque :
 *   - Québec, personne physique : refus AVANT réception (art. 26(1) — « au plus tard
 *     au moment où il reçoit des fonds »).
 *   - Ontario, personne physique : PAS de refus, un délai s'ouvre (s. 23(5) —
 *     « immediately AFTER first engaging »). Bloquer ici ajouterait au règlement.
 *   - Organisation : délai de 60 jours (QC, art. 26(2)) ou 30 jours (ON, s. 23(6)),
 *     puis blocage des mouvements suivants.
 */

let clientRow: Record<string, unknown> | null;
/** Date d'application du garde-fou. Par défaut : appliqué (date dans le passé). */
let enforcedFrom: Date | null;
let updateManyArgs: Record<string, unknown> | null = null;
const auditLogs: Array<{ reason?: string; blocked?: boolean }> = [];

const prismaMock = {
  client: {
    findFirst: vi.fn(async () => clientRow),
    updateMany: vi.fn(async (args: Record<string, unknown>) => {
      updateManyArgs = args;
      return { count: 1 };
    }),
  },
  cabinet: {
    findUnique: vi.fn(async () => ({
      config: JSON.stringify({ province: "QC" }),
      identityGateEnforcedFrom: enforcedFrom,
    })),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn(async (p: { metadata?: { reason?: string; blocked?: boolean } }) => {
    auditLogs.push({ reason: p.metadata?.reason, blocked: p.metadata?.blocked });
  }),
}));

const NOW = new Date("2026-06-01T12:00:00Z");
const BASE = { cabinetId: "cab1", clientId: "client-1", now: NOW };

function client(overrides: Record<string, unknown> = {}) {
  return {
    typeClient: "personne_physique",
    identityVerified: false,
    verificationDate: null,
    identityExemption: null,
    firstFundsMovementAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  clientRow = client();
  // Par défaut, les suites ci-dessous testent le comportement SOUS APPLICATION.
  // Le mode observation a sa propre section.
  enforcedFrom = new Date("2026-01-01T00:00:00Z");
  updateManyArgs = null;
  auditLogs.length = 0;
  prismaMock.client.updateMany.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Québec — le blocage préalable
   ════════════════════════════════════════════════════════════════ */

describe("Québec — personne physique (art. 20, 26(1))", () => {
  it("REFUSE le mouvement de fonds si l'identité n'est pas vérifiée", async () => {
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    await expect(
      assertIdentityForFundsMovement({ ...BASE, province: "QC" }),
    ).rejects.toMatchObject({ code: "IDENTITY_VERIFICATION_REQUIRED" });
  });

  it("cite l'article et propose de régulariser ou d'invoquer une exemption (PR-2)", async () => {
    const { assertIdentityForFundsMovement, isIdentityVerificationRequiredError } = await import("../identity-gate");

    try {
      await assertIdentityForFundsMovement({ ...BASE, province: "QC" });
      throw new Error("aurait dû lever");
    } catch (e) {
      expect(isIdentityVerificationRequiredError(e)).toBe(true);
      if (isIdentityVerificationRequiredError(e)) {
        expect(e.reference).toContain("art. 26(1)");
        expect(e.remedy).toMatch(/exemption/i);
        // Les exemptions offertes sont celles du Québec, pas celles de l'Ontario.
        expect(e.availableExemptions).toHaveProperty("FONDS_HONORAIRES_OU_DEBOURS");
        expect(e.availableExemptions).not.toHaveProperty("FONDS_VIREMENT_ELECTRONIQUE");
      }
    }
  });

  it("journalise le refus (une tentative bloquée doit laisser une trace)", async () => {
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    await expect(assertIdentityForFundsMovement({ ...BASE, province: "QC" })).rejects.toThrow();
    expect(auditLogs.some((l) => l.blocked && l.reason === "IDENTITY_VERIFICATION_REQUIRED")).toBe(true);
  });

  it("laisse passer un client vérifié", async () => {
    clientRow = client({ identityVerified: true, verificationDate: new Date("2026-01-01") });
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    const r = await assertIdentityForFundsMovement({ ...BASE, province: "QC" });
    expect(r.verdict.status).toBe("OK");
  });

  it("laisse passer une exemption québécoise valide et justifiée", async () => {
    clientRow = client({ identityExemption: "FONDS_HONORAIRES_OU_DEBOURS" });
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    const r = await assertIdentityForFundsMovement({ ...BASE, province: "QC" });
    expect(r.verdict).toMatchObject({ status: "OK", reason: "exempt" });
  });

  it("REFUSE une exemption ontarienne invoquée par un cabinet québécois", async () => {
    // Accorder au Québec une dispense qui n'existe qu'en Ontario serait une faute
    // plus grave que l'absence de contrôle : le système validerait l'illicite.
    clientRow = client({ identityExemption: "FONDS_VIREMENT_ELECTRONIQUE" });
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    await expect(assertIdentityForFundsMovement({ ...BASE, province: "QC" })).rejects.toThrow();
  });
});

/* ════════════════════════════════════════════════════════════════
   Ontario — le délai, pas le blocage
   ════════════════════════════════════════════════════════════════ */

describe("Ontario — personne physique (s. 22(1)(b), 23(5))", () => {
  it("NE BLOQUE PAS le premier mouvement : le texte dit « immediately AFTER »", async () => {
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    const r = await assertIdentityForFundsMovement({ ...BASE, province: "ON" });
    expect(r.verdict.status).toBe("DUE");
  });

  it("pose le point de départ du délai au premier mouvement", async () => {
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    await assertIdentityForFundsMovement({ ...BASE, province: "ON" });
    const data = (updateManyArgs as { data: Record<string, unknown> }).data;
    expect(data.firstFundsMovementAt).toEqual(NOW);
    expect(data.identityVerificationDueAt).toBeInstanceOf(Date);
  });

  it("BLOQUE le mouvement suivant : « immediately after » ne laisse aucun délai", async () => {
    // Contrairement à une organisation (30 jours), une personne physique ontarienne
    // n'a aucun délai chiffré. Le premier mouvement passe, le suivant est bloqué tant
    // que la vérification n'est pas consignée.
    clientRow = client({ firstFundsMovementAt: new Date("2026-05-01T00:00:00Z") });
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    await expect(
      assertIdentityForFundsMovement({ ...BASE, province: "ON" }),
    ).rejects.toMatchObject({ code: "IDENTITY_VERIFICATION_REQUIRED" });
  });

  it("ne repousse jamais l'échéance d'une organisation à un mouvement ultérieur", async () => {
    // Sinon chaque nouveau dépôt offrirait un délai neuf : un délai perpétuel.
    clientRow = client({
      typeClient: "personne_morale",
      firstFundsMovementAt: new Date("2026-05-25T00:00:00Z"),
    });
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    await assertIdentityForFundsMovement({ ...BASE, province: "ON" });
    expect(prismaMock.client.updateMany).not.toHaveBeenCalled();
  });
});

/* ════════════════════════════════════════════════════════════════
   Organisations — 60 jours au Québec, 30 en Ontario
   ════════════════════════════════════════════════════════════════ */

describe("Organisations — délais divergents", () => {
  it("Québec : 60 jours (art. 26(2))", async () => {
    clientRow = client({ typeClient: "personne_morale" });
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    const r = await assertIdentityForFundsMovement({ ...BASE, province: "QC" });
    expect(r.verdict.status).toBe("DUE");
    expect(r.dueAt?.toISOString().slice(0, 10)).toBe("2026-07-31");
  });

  it("Ontario : 30 jours (s. 23(6)) — moitié moins", async () => {
    clientRow = client({ typeClient: "personne_morale" });
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    const r = await assertIdentityForFundsMovement({ ...BASE, province: "ON" });
    expect(r.dueAt?.toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("BLOQUE le mouvement suivant une fois le délai expiré", async () => {
    clientRow = client({
      typeClient: "personne_morale",
      firstFundsMovementAt: new Date("2026-03-01T00:00:00Z"),
    });
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    await expect(
      assertIdentityForFundsMovement({ ...BASE, province: "ON" }),
    ).rejects.toMatchObject({ code: "IDENTITY_VERIFICATION_REQUIRED" });
  });

  it("ne bloque PAS rétroactivement le mouvement qui a ouvert le délai", async () => {
    // Ce mouvement-là était licite au moment où il a eu lieu : le règlement accorde
    // un délai justement parce que la vérification peut suivre.
    clientRow = client({
      typeClient: "personne_morale",
      firstFundsMovementAt: new Date("2026-05-25T00:00:00Z"),
    });
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    const r = await assertIdentityForFundsMovement({ ...BASE, province: "ON" });
    expect(r.verdict.status).toBe("DUE");
  });
});

/* ════════════════════════════════════════════════════════════════
   Évaluation sans effet de bord
   ════════════════════════════════════════════════════════════════ */

describe("evaluateIdentityGate — lecture seule pour les écrans", () => {
  it("renvoie le verdict sans lever ni écrire", async () => {
    const { evaluateIdentityGate } = await import("../identity-gate");

    const r = await evaluateIdentityGate({ ...BASE, province: "QC" });
    expect(r.verdict.status).toBe("BLOCKING");
    expect(prismaMock.client.updateMany).not.toHaveBeenCalled();
    expect(auditLogs).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════════════════════════
   CH-06.5 — L'interrupteur DATÉ
   ════════════════════════════════════════════════════════════════ */

describe("resolveEnforcement — un interrupteur qui ne peut pas se cacher", () => {
  it("sans date : mode observation, pas « désactivé »", async () => {
    const { resolveEnforcement } = await import("../identity-gate");
    expect(resolveEnforcement(null, NOW)).toEqual({ mode: "OBSERVING", enforcedFrom: null });
  });

  it("date future : période de régularisation, avec compte à rebours", async () => {
    const { resolveEnforcement } = await import("../identity-gate");
    const e = resolveEnforcement(new Date("2026-07-01T12:00:00Z"), NOW);
    expect(e.mode).toBe("GRACE");
    if (e.mode === "GRACE") expect(e.daysUntilEnforcement).toBe(30);
  });

  it("date atteinte : application", async () => {
    const { resolveEnforcement } = await import("../identity-gate");
    expect(resolveEnforcement(new Date("2026-05-01T00:00:00Z"), NOW).mode).toBe("ENFORCING");
  });
});

describe("Mode observation — évalue, journalise, ne bloque pas", () => {
  it("laisse passer un mouvement qui serait bloqué sous application", async () => {
    enforcedFrom = null;
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    const r = await assertIdentityForFundsMovement({ ...BASE, province: "QC" });
    expect(r.verdict.status).toBe("BLOCKING");
    expect(r.wouldBlock).toBe(true);
    expect(r.enforcement.mode).toBe("OBSERVING");
  });

  it("journalise quand même le refus qui aurait eu lieu", async () => {
    // C'est toute l'utilité du mode : à la fin d'une semaine, la piste d'audit
    // contient la liste exacte des clients à régulariser, sans avoir bloqué personne.
    enforcedFrom = null;
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    await assertIdentityForFundsMovement({ ...BASE, province: "QC" });
    const log = auditLogs.find((l) => l.reason === "IDENTITY_VERIFICATION_REQUIRED");
    expect(log).toBeDefined();
    // `blocked: false` — la trace dit la vérité : le contrôle a échoué, l'opération est passée.
    expect(log?.blocked).toBe(false);
  });

  it("pendant la période de régularisation, laisse passer et affiche le compte à rebours", async () => {
    enforcedFrom = new Date("2026-07-01T12:00:00Z");
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    const r = await assertIdentityForFundsMovement({ ...BASE, province: "QC" });
    expect(r.wouldBlock).toBe(true);
    expect(r.enforcement.mode).toBe("GRACE");
  });

  it("une fois la date atteinte, bloque sans que rien d'autre n'ait changé", async () => {
    enforcedFrom = new Date("2026-05-01T00:00:00Z");
    const { assertIdentityForFundsMovement } = await import("../identity-gate");

    await expect(
      assertIdentityForFundsMovement({ ...BASE, province: "QC" }),
    ).rejects.toMatchObject({ code: "IDENTITY_VERIFICATION_REQUIRED" });
  });
});
