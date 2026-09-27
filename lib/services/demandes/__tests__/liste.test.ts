import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Lot 2 — la file des demandes.
 *
 * Ce que ces tests protègent : la liste réunit deux tables qui ne parlent pas
 * la même langue (statuts `NOUVELLE` d'un côté, `nouveau`/`termine` de
 * l'autre). Une traduction fausse ferait disparaître des demandes de la vue
 * « À traiter » sans que personne ne s'en aperçoive, ce qui est exactement le
 * défaut que ce chantier corrige.
 */

const demandeFindMany = vi.fn();
const demandeCount = vi.fn();
const auditFindMany = vi.fn();
const auditCount = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    demandeSite: {
      findMany: (...a: unknown[]) => demandeFindMany(...a),
      count: (...a: unknown[]) => demandeCount(...a),
    },
    auditSubmission: {
      findMany: (...a: unknown[]) => auditFindMany(...a),
      count: (...a: unknown[]) => auditCount(...a),
    },
  },
}));
vi.mock("react", async (orig) => {
  const react = (await orig()) as Record<string, unknown>;
  return { ...react, cache: (fn: unknown) => fn };
});

import { compterDemandesEnAttente, depuis, listerDemandes } from "../index";

function demande(over: Record<string, unknown> = {}) {
  return {
    id: "d1",
    type: "CONTACT",
    statut: "NOUVELLE",
    nom: "Camille Roy",
    cabinet: "Roy Avocats",
    email: "camille@royavocats.ca",
    telephone: "514 555 0100",
    raison: "Voir SAFE sur mes propres dossiers",
    momentSouhaite: null,
    accuseReceptionEnvoye: true,
    aviseInterneEnvoye: true,
    leadId: "lead1",
    createdAt: new Date("2026-09-04T10:00:00Z"),
    ...over,
  };
}

function audit(over: Record<string, unknown> = {}) {
  return {
    id: "a1",
    status: "nouveau",
    prospectNom: "Sophie Bergeron",
    prospectCabinet: "Bergeron & Lapointe",
    prospectTelephone: null,
    scoreGlobal: 38200,
    createdAt: new Date("2026-09-04T12:00:00Z"),
    lead: { id: "lead2" },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  demandeFindMany.mockResolvedValue([demande()]);
  auditFindMany.mockResolvedValue([audit()]);
  demandeCount.mockResolvedValue(0);
  auditCount.mockResolvedValue(0);
});

describe("listerDemandes", () => {
  it("réunit les deux sources et trie du plus récent au plus ancien", async () => {
    const r = await listerDemandes("toutes");

    expect(r.map((e) => e.cle)).toEqual(["audit:a1", "demande:d1"]);
    expect(r[0].nature).toBe("AUDIT");
    expect(r[0].detail?.replace(/\s/g, " ")).toBe("38 200 $ / an");
    expect(r[1].detail).toBe("514 555 0100");
  });

  it("traduit les statuts d'audit vers les états de la file", async () => {
    auditFindMany.mockResolvedValue([
      audit({ id: "a1", status: "nouveau" }),
      audit({ id: "a2", status: "en_analyse" }),
      audit({ id: "a3", status: "termine" }),
    ]);

    const r = await listerDemandes("toutes");
    const etats = Object.fromEntries(r.filter((e) => e.origine === "audit").map((e) => [e.id, e.etat]));

    expect(etats).toEqual({ a1: "A_REPONDRE", a2: "A_REPONDRE", a3: "REPONDUE" });
  });

  it("montre les moments proposés plutôt que le téléphone pour un rendez-vous", async () => {
    demandeFindMany.mockResolvedValue([
      demande({ type: "RENDEZ_VOUS", momentSouhaite: "Mardi après-midi" }),
    ]);

    const [e] = await listerDemandes("rendez-vous");

    expect(e.nature).toBe("RENDEZ_VOUS");
    expect(e.detail).toBe("Mardi après-midi");
  });

  it("signale ce qui n'a pas suivi : courriel manqué, lead absent", async () => {
    demandeFindMany.mockResolvedValue([
      demande({ accuseReceptionEnvoye: false, leadId: null }),
    ]);

    const e = (await listerDemandes("toutes")).find((x) => x.origine === "demande")!;

    expect(e.anomalie).toContain("Accusé non parti");
    expect(e.anomalie).toContain("Pas au pipeline");
  });

  it("ne rapporte aucune anomalie quand tout a suivi", async () => {
    const e = (await listerDemandes("toutes")).find((x) => x.origine === "demande")!;
    expect(e.anomalie).toBeNull();
  });

  it("la vue Rendez-vous n'interroge pas les audits", async () => {
    await listerDemandes("rendez-vous");
    expect(auditFindMany).not.toHaveBeenCalled();
  });

  it("la vue Audits n'interroge pas les demandes", async () => {
    await listerDemandes("audits");
    expect(demandeFindMany).not.toHaveBeenCalled();
  });

  it("la vue À traiter ne demande que ce qui attend une réponse", async () => {
    await listerDemandes("a-traiter");

    expect(demandeFindMany.mock.calls[0][0].where.statut).toBe("NOUVELLE");
    expect(auditFindMany.mock.calls[0][0].where.status).toEqual({
      in: ["nouveau", "en_analyse"],
    });
  });

  it("cherche sur le nom, le cabinet et le courriel", async () => {
    await listerDemandes("toutes", "roy");

    const or = demandeFindMany.mock.calls[0][0].where.OR;
    expect(or).toHaveLength(3);
    expect(or[0].nom).toEqual({ contains: "roy", mode: "insensitive" });
  });
});

describe("compterDemandesEnAttente", () => {
  it("additionne les deux sources", async () => {
    demandeCount.mockResolvedValue(3);
    auditCount.mockResolvedValue(4);
    await expect(compterDemandesEnAttente()).resolves.toBe(7);
  });
});

describe("depuis", () => {
  const t0 = new Date("2026-09-04T12:00:00Z");
  it("dit le temps écoulé en clair", () => {
    expect(depuis(new Date("2026-09-04T11:59:40Z"), t0)).toBe("à l'instant");
    expect(depuis(new Date("2026-09-04T11:20:00Z"), t0)).toBe("il y a 40 min");
    expect(depuis(new Date("2026-09-04T09:00:00Z"), t0)).toBe("il y a 3 h");
    expect(depuis(new Date("2026-09-03T12:00:00Z"), t0)).toBe("hier");
    expect(depuis(new Date("2026-09-01T12:00:00Z"), t0)).toBe("il y a 3 j");
  });
});
