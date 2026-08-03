import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-11 — Accès d'inspection, conservation, trousse. Côté service.
 *
 * Ce qui est prouvé ici :
 *   1. un accès ne s'ouvre pas anonymement, et le jeton n'est jamais stocké en clair ;
 *   2. une session expirée ou révoquée est REFUSÉE, pas tolérée avec un avertissement ;
 *   3. la consultation est journalisée AVANT d'être servie, et le périmètre est une
 *      liste blanche ;
 *   4. la purge refuse par défaut — sans fin d'exercice, sans date de fermeture ;
 *   5. la trousse NOMME ce qui manque au lieu de s'arrêter ou de le taire.
 */

let province: "QC" | "ON";
let sessionRow: Record<string, unknown> | null;
let fiscalYearEnd: string | null;
let closedDossiers: Array<Record<string, unknown>>;
let monthlyReports: Array<Record<string, unknown>>;

const created: Record<string, Array<Record<string, unknown>>> = {
  inspectionAccessSession: [],
  inspectionAccessRead: [],
};

const prismaMock = {
  cabinet: {
    findUnique: vi.fn(async ({ select }: { select?: Record<string, unknown> }) =>
      select && "fiscalYearEnd" in select
        ? { fiscalYearEnd }
        : select && "nom" in select
          ? { nom: "Cabinet Test" }
          : { config: JSON.stringify({ province }) },
    ),
  },
  inspectionAccessSession: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      created.inspectionAccessSession.push(data);
      return { id: "sess-1", ...data };
    }),
    findUnique: vi.fn(async () => sessionRow),
    findFirst: vi.fn(async () => sessionRow),
    findMany: vi.fn(async () => (sessionRow ? [{ ...sessionRow, _count: { reads: 3 } }] : [])),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data),
  },
  inspectionAccessRead: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      created.inspectionAccessRead.push(data);
      return { id: "read-1" };
    }),
    findMany: vi.fn(async () => []),
  },
  dossier: { findMany: vi.fn(async () => closedDossiers) },
  trustMonthlyReport: { findMany: vi.fn(async () => monthlyReports) },
  trustShortfall: { findMany: vi.fn(async () => []) },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/services/fideicommis/register-service", () => ({
  loadRegister: vi.fn(async ({ registerId }: { registerId: string }) => {
    if (registerId === "FEES_BOOK") throw new Error("Registre indisponible pour ce cabinet.");
    return {
      definition: { id: registerId, reference: "réf" },
      rows: [],
      columns: [],
      rowCount: 0,
      fingerprint: `fp-${registerId}`,
    };
  }),
}));
vi.mock("@/lib/services/fideicommis/register-render", () => ({
  toCsv: vi.fn(() => "col1;col2"),
}));

const NOW = new Date("2026-08-03T12:00:00Z");

beforeEach(() => {
  province = "QC";
  sessionRow = null;
  fiscalYearEnd = "12-31";
  closedDossiers = [];
  monthlyReports = [];
  created.inspectionAccessSession.length = 0;
  created.inspectionAccessRead.length = 0;
  vi.clearAllMocks();
});

/* ════════════════════════════════════════════════════════════════
   Ouverture d'un accès
   ════════════════════════════════════════════════════════════════ */

describe("Ouverture d'un accès d'inspection", () => {
  const base = {
    cabinetId: "cab",
    inspectorName: "M. Inspecteur",
    inspectorOrganization: "Barreau du Québec",
    purpose: "Inspection professionnelle 2026",
    grantedByUserId: "u1",
    now: NOW,
  };

  it("refuse un accès anonyme", async () => {
    // Un accès sans nom donnerait un journal qui ne prouve rien.
    const { grantInspectionAccess, InspectionAccessError } = await import(
      "../inspection-access-service"
    );
    await expect(
      grantInspectionAccess({ ...base, inspectorName: "  " }),
    ).rejects.toBeInstanceOf(InspectionAccessError);
  });

  it("exige aussi l'organisme et le motif", async () => {
    const { grantInspectionAccess } = await import("../inspection-access-service");
    await expect(grantInspectionAccess({ ...base, purpose: "" })).rejects.toThrow(/motif/i);
  });

  it("NE STOCKE JAMAIS le jeton en clair", async () => {
    // Un jeton lisible en base rendrait l'accès réutilisable par quiconque lit la table.
    const { grantInspectionAccess } = await import("../inspection-access-service");
    const r = await grantInspectionAccess(base);

    const stored = created.inspectionAccessSession[0]!;
    expect(stored.tokenHash).not.toBe(r.token);
    expect(String(stored.tokenHash)).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(stored)).not.toContain(r.token);
  });

  it("borne la durée : trente jours par défaut", async () => {
    const { grantInspectionAccess } = await import("../inspection-access-service");
    const r = await grantInspectionAccess(base);
    expect(r.expiresAt).toEqual(new Date("2026-09-02T12:00:00Z"));
  });

  it("plafonne une durée déraisonnable au lieu de l'accepter", async () => {
    // Une session sans fin n'est plus une session.
    const { grantInspectionAccess } = await import("../inspection-access-service");
    const r = await grantInspectionAccess({ ...base, days: 9999 });
    const jours = (r.expiresAt.getTime() - NOW.getTime()) / 86_400_000;
    expect(jours).toBe(180);
  });
});

/* ════════════════════════════════════════════════════════════════
   Résolution
   ════════════════════════════════════════════════════════════════ */

describe("Résolution d'un jeton", () => {
  const active = {
    id: "sess-1",
    cabinetId: "cab",
    inspectorName: "M. Inspecteur",
    inspectorOrganization: "Barreau du Québec",
    scopeFrom: null,
    scopeTo: null,
    expiresAt: new Date("2026-09-02T12:00:00Z"),
    revokedAt: null,
  };

  it("accepte une session active", async () => {
    const { resolveInspectionSession } = await import("../inspection-access-service");
    sessionRow = active;
    const s = await resolveInspectionSession({ token: "peu-importe", now: NOW });
    expect(s.evaluation.state).toBe("ACTIVE");
  });

  it("REFUSE une session expirée, sans tolérance", async () => {
    // Une porte qu'on laisse entrouverte parce qu'elle vient de se fermer n'est pas
    // une porte fermée.
    const { resolveInspectionSession, InspectionAccessError } = await import(
      "../inspection-access-service"
    );
    sessionRow = { ...active, expiresAt: new Date("2026-08-03T11:59:59Z") };
    await expect(
      resolveInspectionSession({ token: "t", now: NOW }),
    ).rejects.toBeInstanceOf(InspectionAccessError);
  });

  it("REFUSE une session révoquée même si elle n'est pas expirée", async () => {
    const { resolveInspectionSession } = await import("../inspection-access-service");
    sessionRow = { ...active, revokedAt: new Date("2026-08-01T00:00:00Z") };
    await expect(resolveInspectionSession({ token: "t", now: NOW })).rejects.toThrow(/révoqué/i);
  });

  it("refuse un jeton inconnu", async () => {
    const { resolveInspectionSession } = await import("../inspection-access-service");
    sessionRow = null;
    await expect(resolveInspectionSession({ token: "t", now: NOW })).rejects.toThrow(/inconnu/i);
  });
});

/* ════════════════════════════════════════════════════════════════
   Journalisation
   ════════════════════════════════════════════════════════════════ */

describe("Journal des consultations", () => {
  it("consigne chaque lecture", async () => {
    const { logInspectionRead } = await import("../inspection-access-service");
    await logInspectionRead({
      sessionId: "sess-1",
      resource: "REGISTERS",
      resourceId: "CLIENT_LEDGERS",
      now: NOW,
    });
    expect(created.inspectionAccessRead[0]!.resource).toBe("REGISTERS");
    expect(created.inspectionAccessRead[0]!.resourceId).toBe("CLIENT_LEDGERS");
  });

  it("refuse une ressource hors périmètre au lieu de la journaliser", async () => {
    // Le périmètre est une liste blanche : une ressource ajoutée plus tard n'est pas
    // visible tant que personne ne l'a décidé.
    const { logInspectionRead } = await import("../inspection-access-service");
    await expect(
      // @ts-expect-error — ressource volontairement hors du type
      logInspectionRead({ sessionId: "s", resource: "PAYROLL", now: NOW }),
    ).rejects.toThrow(/périmètre|pas ouverte/i);
    expect(created.inspectionAccessRead).toHaveLength(0);
  });

  it("ne révoque jamais en supprimant la session", async () => {
    // Un accès révoqué dont l'historique disparaîtrait ne prouverait plus rien.
    const { revokeInspectionAccess } = await import("../inspection-access-service");
    sessionRow = { id: "sess-1", cabinetId: "cab", revokedAt: null };
    await revokeInspectionAccess({
      cabinetId: "cab",
      sessionId: "sess-1",
      revokedByUserId: "u1",
      now: NOW,
    });
    expect(prismaMock.inspectionAccessSession.update).toHaveBeenCalled();
    expect(prismaMock.inspectionAccessSession).not.toHaveProperty("delete");
  });
});

/* ════════════════════════════════════════════════════════════════
   Conservation
   ════════════════════════════════════════════════════════════════ */

describe("Conservation et refus de purger", () => {
  it("refuse de purger sans fin d'exercice réglée", async () => {
    // Supposer le 31 décembre déplacerait toutes les échéances de l'art. 32, dans le
    // sens de la destruction prématurée.
    const { assertPurgeAllowed, RetentionError } = await import("../retention-service");
    fiscalYearEnd = null;
    await expect(
      assertPurgeAllowed({
        cabinetId: "cab",
        kind: "SUPPORTING_DOCUMENT",
        recordDate: new Date("2000-01-01T00:00:00Z"),
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(RetentionError);
  });

  it("refuse de purger un registre dont le dossier n'est pas fermé", async () => {
    const { assertPurgeAllowed } = await import("../retention-service");
    await expect(
      assertPurgeAllowed({
        cabinetId: "cab",
        kind: "CLIENT_LEDGERS",
        recordDate: new Date("2005-01-01T00:00:00Z"),
        fileClosedAt: null,
        now: NOW,
      }),
    ).rejects.toThrow(/pas fermé|commencé à courir/i);
  });

  it("laisse passer une fois l'échéance atteinte", async () => {
    const { assertPurgeAllowed } = await import("../retention-service");
    await expect(
      assertPurgeAllowed({
        cabinetId: "cab",
        kind: "CLIENT_LEDGERS",
        recordDate: new Date("2010-01-01T00:00:00Z"),
        fileClosedAt: new Date("2015-01-01T00:00:00Z"),
        now: NOW,
      }),
    ).resolves.toBeUndefined();
  });

  it("signale l'absence de fin d'exercice dans l'état de conservation", async () => {
    const { getRetentionStatus } = await import("../retention-service");
    fiscalYearEnd = null;
    const s = await getRetentionStatus("cab");
    expect(s.blockedFr).toContain("exercice financier");
  });

  it("N'UTILISE PAS updatedAt comme date de fermeture", async () => {
    // Ce serait dater la fermeture d'un dossier sur la dernière fois que quelqu'un
    // l'a touché, ce qui n'a aucun rapport.
    const { getPurgeCandidates } = await import("../retention-service");
    closedDossiers = [
      {
        id: "d1",
        reference: "2010-001",
        updatedAt: new Date("2011-01-01T00:00:00Z"),
        dateCloture: null,
        clientId: "c1",
      },
    ];
    const c = await getPurgeCandidates({ cabinetId: "cab", now: NOW });
    expect(c).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════════════════════════
   Trousse d'inspection
   ════════════════════════════════════════════════════════════════ */

describe("Trousse d'inspection", () => {
  const params = {
    cabinetId: "cab",
    periodFrom: new Date("2026-01-01T00:00:00Z"),
    periodTo: new Date("2026-03-31T23:59:59Z"),
    generatedBy: "Me Test",
    now: NOW,
  };

  it("NE S'ARRÊTE PAS au premier registre indisponible", async () => {
    // Une trousse qui s'interromprait à la première pièce absente ne servirait à rien
    // le jour où elle sert.
    const { buildInspectionKit } = await import("../inspection-kit-service");
    const kit = await buildInspectionKit(params);
    const feesBook = kit.items.find((i) => i.filename.includes("FEES_BOOK"));
    expect(feesBook?.missingReasonFr).toContain("indisponible");
    expect(kit.items.filter((i) => i.kind === "REGISTER").length).toBeGreaterThan(1);
  });

  it("porte un mois sans rapport comme MANQUANT, pas comme absent de la liste", async () => {
    // Un trou silencieux ressemblerait à une période sans obligation.
    const { buildInspectionKit } = await import("../inspection-kit-service");
    monthlyReports = [
      { id: "r1", periode: "2026-01", certifiedAt: new Date("2026-02-20"), certifiedById: "u1" },
    ];
    const kit = await buildInspectionKit(params);
    const mensuels = kit.items.filter((i) => i.kind === "MONTHLY_REPORT");
    expect(mensuels).toHaveLength(3); // janvier, février, mars
    expect(mensuels.filter((m) => m.missingReasonFr)).toHaveLength(2);
  });

  it("distingue un rapport non certifié d'un rapport absent", async () => {
    const { buildInspectionKit } = await import("../inspection-kit-service");
    monthlyReports = [{ id: "r1", periode: "2026-01", certifiedAt: null, certifiedById: null }];
    const kit = await buildInspectionKit(params);
    const janvier = kit.items.find((i) => i.filename.includes("2026-01"))!;
    expect(janvier.content).not.toBeNull();
    expect(janvier.missingReasonFr).toContain("non certifié");
  });

  it("ouvre le manifeste sur ce qui MANQUE", async () => {
    // Un manifeste qui commencerait par les pièces produites laisserait croire que la
    // trousse est complète, et personne ne lirait jusqu'au bas.
    const { buildInspectionKit } = await import("../inspection-kit-service");
    const kit = await buildInspectionKit(params);
    const avantPieces = kit.manifest.slice(0, kit.manifest.indexOf("PIÈCES"));
    expect(avantPieces).toContain("manquante");
  });

  it("REFUSE de se présenter comme une attestation de conformité", async () => {
    const { buildInspectionKit } = await import("../inspection-kit-service");
    monthlyReports = [
      { id: "a", periode: "2026-01", certifiedAt: new Date("2026-02-01"), certifiedById: "u" },
      { id: "b", periode: "2026-02", certifiedAt: new Date("2026-03-01"), certifiedById: "u" },
      { id: "c", periode: "2026-03", certifiedAt: new Date("2026-04-01"), certifiedById: "u" },
    ];
    const kit = await buildInspectionKit(params);
    expect(kit.manifest).toMatch(/ne certifie pas|ne vaut pas attestation/i);
  });

  it("scelle l'ensemble par une empreinte du manifeste", async () => {
    const { buildInspectionKit } = await import("../inspection-kit-service");
    const kit = await buildInspectionKit(params);
    expect(kit.manifestFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it("dit que les empreintes ne sont exigées par aucun article", async () => {
    const { buildInspectionKit } = await import("../inspection-kit-service");
    const kit = await buildInspectionKit(params);
    expect(kit.manifest).toContain("exigées par aucun article");
  });

  it("compte les pièces manquantes plutôt que de les taire", async () => {
    const { buildInspectionKit } = await import("../inspection-kit-service");
    const kit = await buildInspectionKit(params);
    expect(kit.missingCount).toBe(kit.items.filter((i) => i.missingReasonFr).length);
    expect(kit.missingCount).toBeGreaterThan(0);
  });
});
