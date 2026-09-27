import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Lot 1 — la demande du site apparaît dans le pipeline, une seule fois.
 *
 * Deux garanties sous test :
 *  - un cabinet qui écrit deux fois, ou qui avait déjà rempli l'audit, ne
 *    double pas dans le pipeline : la reconnaissance se fait par courriel ;
 *  - le module ne throw jamais. La route l'appelle après avoir enregistré la
 *    demande ; une exception ici referait perdre ce qu'on vient de sauver.
 */

const demandeFindUnique = vi.fn();
const demandeUpdate = vi.fn();
const leadFindFirst = vi.fn();
const leadFindUnique = vi.fn();
const leadCreate = vi.fn();
const leadUpdate = vi.fn();
const contactCreate = vi.fn();
const activityCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    demandeSite: {
      findUnique: (...a: unknown[]) => demandeFindUnique(...a),
      update: (...a: unknown[]) => demandeUpdate(...a),
    },
    lead: {
      findFirst: (...a: unknown[]) => leadFindFirst(...a),
      findUnique: (...a: unknown[]) => leadFindUnique(...a),
      create: (...a: unknown[]) => leadCreate(...a),
      update: (...a: unknown[]) => leadUpdate(...a),
    },
    leadContact: { create: (...a: unknown[]) => contactCreate(...a) },
    activity: { create: (...a: unknown[]) => activityCreate(...a) },
  },
}));
vi.mock("@/lib/safe-inc", () => ({
  getSafeIncWorkspace: async () => ({ id: "ws1", nom: "SAFE Inc." }),
}));
vi.mock("@/lib/services/crm/scoring", () => ({
  recomputeLeadScore: async () => ({ total: 12 }),
}));

import { attachDemandeSiteToCrm } from "../lead-from-demande";

function demande(over: Record<string, unknown> = {}) {
  return {
    id: "dem1",
    type: "CONTACT",
    page: "/contact",
    nom: "Camille Roy",
    email: "camille@royavocats.ca",
    telephone: "(514) 555-0100",
    cabinet: "Roy Avocats",
    nbAvocats: null,
    raison: "Voir SAFE sur mes propres dossiers",
    momentSouhaite: null,
    langue: "fr",
    leadId: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  demandeFindUnique.mockResolvedValue(demande());
  demandeUpdate.mockResolvedValue({});
  leadFindFirst.mockResolvedValue(null);
  leadFindUnique.mockResolvedValue(null); // slug libre
  leadCreate.mockResolvedValue({ id: "leadNeuf" });
  leadUpdate.mockResolvedValue({});
  contactCreate.mockResolvedValue({});
  activityCreate.mockResolvedValue({});
});

describe("attachDemandeSiteToCrm", () => {
  it("crée le lead, son contact et l'activité, puis rattache la demande", async () => {
    const r = await attachDemandeSiteToCrm("dem1");

    expect(r).toMatchObject({ ok: true, created: true, leadId: "leadNeuf" });
    const { data } = leadCreate.mock.calls[0][0];
    expect(data.raisonSociale).toBe("Roy Avocats");
    expect(data.sourceLead).toBe("SITE_WEB");
    expect(data.stageLead).toBe("CONTACTED");
    expect(contactCreate.mock.calls[0][0].data.email).toBe("camille@royavocats.ca");
    expect(activityCreate.mock.calls[0][0].data.direction).toBe("INBOUND");
    expect(demandeUpdate.mock.calls[0][0].data.leadId).toBe("leadNeuf");
  });

  it("ne crée pas un second lead quand le courriel est déjà connu", async () => {
    leadFindFirst.mockResolvedValue({ id: "leadExistant", raisonSociale: "Roy Avocats" });

    const r = await attachDemandeSiteToCrm("dem1");

    expect(r).toMatchObject({ ok: true, created: false, leadId: "leadExistant" });
    expect(leadCreate).not.toHaveBeenCalled();
    expect(activityCreate).toHaveBeenCalledOnce();
    expect(demandeUpdate.mock.calls[0][0].data.leadId).toBe("leadExistant");
  });

  it("ne retouche à rien si la demande porte déjà un lead", async () => {
    demandeFindUnique.mockResolvedValue(demande({ leadId: "dejaLa" }));

    const r = await attachDemandeSiteToCrm("dem1");

    expect(r).toMatchObject({ ok: true, created: false, leadId: "dejaLa" });
    expect(leadCreate).not.toHaveBeenCalled();
    expect(activityCreate).not.toHaveBeenCalled();
  });

  it("hausse la priorité et porte les moments proposés pour un rendez-vous", async () => {
    demandeFindUnique.mockResolvedValue(
      demande({ type: "RENDEZ_VOUS", momentSouhaite: "Mardi après-midi" }),
    );

    await attachDemandeSiteToCrm("dem1");

    expect(leadCreate.mock.calls[0][0].data.prioriteNurturing).toBe("CONVERSATION_PROFONDE");
    expect(activityCreate.mock.calls[0][0].data.contenu).toContain("Mardi après-midi");
  });

  it("déduit la taille du cabinet seulement quand elle est déclarée", async () => {
    demandeFindUnique.mockResolvedValue(demande({ nbAvocats: "4" }));
    await attachDemandeSiteToCrm("dem1");
    expect(leadCreate.mock.calls[0][0].data.tailleCabinet).toBe("DEUX_CINQ");

    vi.clearAllMocks();
    demandeFindUnique.mockResolvedValue(demande());
    leadFindFirst.mockResolvedValue(null);
    leadFindUnique.mockResolvedValue(null);
    leadCreate.mockResolvedValue({ id: "leadNeuf" });
    await attachDemandeSiteToCrm("dem1");
    const data = leadCreate.mock.calls[0][0].data;
    expect(data.tailleCabinet).toBe("SOLO");
    expect(data.notesPrivees).toContain("Taille du cabinet non déclarée");
  });

  it("ne throw jamais : une panne de base ressort en { ok: false }", async () => {
    leadCreate.mockRejectedValue(new Error("base injoignable"));

    const r = await attachDemandeSiteToCrm("dem1");

    expect(r).toEqual({ ok: false, error: "base injoignable" });
  });
});
