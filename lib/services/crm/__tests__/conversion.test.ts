import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Lot L2 — conversion Lead → Cabinet.
 *
 * Ce que ces tests protègent : la conversion touche neuf tables. Une exécution
 * partielle laisserait un cabinet sans lead rattaché, ou un lead marqué converti
 * sans cabinet, et il n'existe aucun écran pour réparer ça. Les garde-fous en
 * amont de la transaction sont donc aussi importants que la transaction.
 */

const leadFindUnique = vi.fn();
const userFindFirst = vi.fn();
const transaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: { findUnique: (...a: unknown[]) => leadFindUnique(...a) },
    user: { findFirst: (...a: unknown[]) => userFindFirst(...a) },
    $transaction: (...a: unknown[]) => transaction(...a),
  },
}));

import { convertirLeadEnCabinet, type ConversionInput } from "@/lib/services/crm/conversion";

const INPUT: ConversionInput = {
  leadId: "lead1",
  cabinetNom: "Bergeron & Lapointe",
  cabinetEmail: "info@bergeron.ca",
  cabinetTelephone: "819 555 0100",
  cabinetAdresse: "Gatineau, QC",
  adminEmail: "Marie@bergeron.ca",
  plan: "essentiel",
  fiscalYearEnd: "12-31",
};

/** Lead prêt à convertir. */
function leadSigne(over: Record<string, unknown> = {}) {
  return {
    id: "lead1",
    raisonSociale: "Bergeron & Lapointe",
    stageLead: "SIGNED",
    cabinetId: null,
    aTrustAccounting: false,
    ...over,
  };
}

/** Capture tout ce que la transaction écrit, pour l'inspecter ensuite. */
function makeTx() {
  const calls: Record<string, unknown[]> = {
    cabinetCreate: [],
    invitationCreate: [],
    leadUpdate: [],
    checklistUpsert: [],
    taskUpdateMany: [],
    taskCreateMany: [],
    activityCreate: [],
    auditCreate: [],
  };
  const tx = {
    cabinet: {
      create: (a: unknown) => {
        calls.cabinetCreate.push(a);
        return Promise.resolve({ id: "cab1" });
      },
    },
    invitation: {
      create: (a: unknown) => {
        calls.invitationCreate.push(a);
        return Promise.resolve({ id: "inv1" });
      },
    },
    lead: {
      update: (a: unknown) => {
        calls.leadUpdate.push(a);
        return Promise.resolve({});
      },
    },
    activationChecklist: {
      upsert: (a: unknown) => {
        calls.checklistUpsert.push(a);
        return Promise.resolve({});
      },
    },
    task: {
      updateMany: (a: unknown) => {
        calls.taskUpdateMany.push(a);
        return Promise.resolve({ count: 3 });
      },
      createMany: (a: unknown) => {
        calls.taskCreateMany.push(a);
        return Promise.resolve({ count: 8 });
      },
    },
    activity: {
      create: (a: unknown) => {
        calls.activityCreate.push(a);
        return Promise.resolve({});
      },
    },
    auditLog: {
      create: (a: unknown) => {
        calls.auditCreate.push(a);
        return Promise.resolve({});
      },
    },
  };
  return { tx, calls };
}

beforeEach(() => {
  leadFindUnique.mockReset();
  userFindFirst.mockReset();
  transaction.mockReset();
  userFindFirst.mockResolvedValue(null);
});

describe("Garde-fous avant la transaction", () => {
  it("refuse un lead introuvable", async () => {
    leadFindUnique.mockResolvedValue(null);
    const r = await convertirLeadEnCabinet(INPUT, "u1");
    expect(r).toEqual({ ok: false, error: "Cabinet introuvable." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("refuse une seconde conversion", async () => {
    leadFindUnique.mockResolvedValue(leadSigne({ cabinetId: "deja" }));
    const r = await convertirLeadEnCabinet(INPUT, "u1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/déjà converti/);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("refuse tant que l'étape n'est pas SIGNED", async () => {
    for (const stage of ["READY_TO_SIGN", "CONVERSING", "AUDIT_COMPLETED", "LIVE"]) {
      leadFindUnique.mockResolvedValue(leadSigne({ stageLead: stage }));
      const r = await convertirLeadEnCabinet(INPUT, "u1");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/Signé/);
    }
    expect(transaction).not.toHaveBeenCalled();
  });

  it("refuse un nom de cabinet vide et une adresse invalide, sans lire la base", async () => {
    expect(await convertirLeadEnCabinet({ ...INPUT, cabinetNom: " " }, "u1")).toEqual({
      ok: false,
      error: "Le nom du cabinet est requis.",
    });
    const r = await convertirLeadEnCabinet({ ...INPUT, adminEmail: "pasunemail" }, "u1");
    expect(r.ok).toBe(false);
    expect(leadFindUnique).not.toHaveBeenCalled();
  });

  it("refuse une fin d'exercice mal formée", async () => {
    const r = await convertirLeadEnCabinet({ ...INPUT, fiscalYearEnd: "31 décembre" }, "u1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/MM-JJ/);
  });

  it("refuse une adresse déjà rattachée à un compte, qui bloquerait l'invitation", async () => {
    leadFindUnique.mockResolvedValue(leadSigne());
    userFindFirst.mockResolvedValue({ id: "u9" });
    const r = await convertirLeadEnCabinet(INPUT, "u1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/compte existe déjà/);
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe("La transaction", () => {
  it("écrit les neuf effets attendus et retourne le cabinet créé", async () => {
    leadFindUnique.mockResolvedValue(leadSigne());
    const { tx, calls } = makeTx();
    transaction.mockImplementation((fn: (t: unknown) => Promise<unknown>) => fn(tx));

    const r = await convertirLeadEnCabinet(INPUT, "u1");

    expect(r).toEqual({ ok: true, cabinetId: "cab1", invitationId: "inv1" });
    expect(calls.cabinetCreate).toHaveLength(1);
    expect(calls.invitationCreate).toHaveLength(1);
    expect(calls.leadUpdate).toHaveLength(1);
    expect(calls.checklistUpsert).toHaveLength(1);
    expect(calls.taskUpdateMany).toHaveLength(1);
    expect(calls.taskCreateMany).toHaveLength(1);
    expect(calls.activityCreate).toHaveLength(1);
    expect(calls.auditCreate).toHaveLength(1);
  });

  it("rattache le lead au cabinet et le passe en client actif", async () => {
    leadFindUnique.mockResolvedValue(leadSigne());
    const { tx, calls } = makeTx();
    transaction.mockImplementation((fn: (t: unknown) => Promise<unknown>) => fn(tx));

    await convertirLeadEnCabinet(INPUT, "u1");

    const data = (calls.leadUpdate[0] as { data: Record<string, unknown> }).data;
    expect(data.cabinetId).toBe("cab1");
    expect(data.statutLead).toBe("ACTIVE_CUSTOMER");
    expect(data.stageLead).toBe("ACTIVATION_IN_PROGRESS");
    expect(data.convertedAt).toBeInstanceOf(Date);
  });

  it("normalise l'adresse d'invitation en minuscules et vise le rôle admin", async () => {
    leadFindUnique.mockResolvedValue(leadSigne());
    const { tx, calls } = makeTx();
    transaction.mockImplementation((fn: (t: unknown) => Promise<unknown>) => fn(tx));

    await convertirLeadEnCabinet(INPUT, "u1");

    const data = (calls.invitationCreate[0] as { data: Record<string, unknown> }).data;
    expect(data.email).toBe("marie@bergeron.ca");
    expect(data.role).toBe("admin_cabinet");
    expect(String(data.token)).toHaveLength(64);
    expect(data.expiresAt).toBeInstanceOf(Date);
  });

  it("annule les tâches de prospection ouvertes au lieu de les supprimer", async () => {
    leadFindUnique.mockResolvedValue(leadSigne());
    const { tx, calls } = makeTx();
    transaction.mockImplementation((fn: (t: unknown) => Promise<unknown>) => fn(tx));

    await convertirLeadEnCabinet(INPUT, "u1");

    const arg = calls.taskUpdateMany[0] as {
      where: { statut: { in: string[] } };
      data: { statut: string };
    };
    expect(arg.where.statut.in).toEqual(["A_FAIRE", "EN_COURS"]);
    expect(arg.data.statut).toBe("ANNULEE");
  });

  it("crée les tâches d'intégration, toutes datées", async () => {
    leadFindUnique.mockResolvedValue(leadSigne());
    const { tx, calls } = makeTx();
    transaction.mockImplementation((fn: (t: unknown) => Promise<unknown>) => fn(tx));

    await convertirLeadEnCabinet(INPUT, "u1");

    const data = (calls.taskCreateMany[0] as { data: Record<string, unknown>[] }).data;
    expect(data.length).toBeGreaterThanOrEqual(8);
    // Une tâche sans échéance est invisible en tour de contrôle, donc inutile.
    expect(data.every((t) => t.dateEcheance instanceof Date)).toBe(true);
    expect(data.every((t) => t.leadId === "lead1")).toBe(true);
    expect(data.every((t) => t.statut === "A_FAIRE")).toBe(true);
  });

  it("ajoute l'étape fidéicommis seulement quand le cabinet en a un", async () => {
    const compter = async (aTrustAccounting: boolean) => {
      leadFindUnique.mockResolvedValue(leadSigne({ aTrustAccounting }));
      const { tx, calls } = makeTx();
      transaction.mockImplementation((fn: (t: unknown) => Promise<unknown>) => fn(tx));
      await convertirLeadEnCabinet(INPUT, "u1");
      return (calls.taskCreateMany[0] as { data: { titre: string }[] }).data;
    };

    const sans = await compter(false);
    const avec = await compter(true);

    expect(avec.length).toBe(sans.length + 1);
    expect(avec.some((t) => /fidéicommis/i.test(t.titre))).toBe(true);
    expect(sans.some((t) => /fidéicommis/i.test(t.titre))).toBe(false);
  });

  it("journalise la création du cabinet avec son origine", async () => {
    leadFindUnique.mockResolvedValue(leadSigne());
    const { tx, calls } = makeTx();
    transaction.mockImplementation((fn: (t: unknown) => Promise<unknown>) => fn(tx));

    await convertirLeadEnCabinet(INPUT, "u1");

    const data = (calls.auditCreate[0] as { data: Record<string, unknown> }).data;
    expect(data.entityType).toBe("Cabinet");
    expect(data.cabinetId).toBe("cab1");
    expect(data.userId).toBe("u1");
    expect(JSON.parse(String(data.newValues))).toMatchObject({
      origine: "conversion_lead",
      leadId: "lead1",
    });
  });

  it("un échec en cours de transaction ne remonte jamais un succès", async () => {
    leadFindUnique.mockResolvedValue(leadSigne());
    transaction.mockRejectedValue(new Error("deadlock"));

    const r = await convertirLeadEnCabinet(INPUT, "u1");

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/rien n'a été créé/);
  });
});
