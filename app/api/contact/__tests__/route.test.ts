import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Lot 1 — la demande écrite depuis le site ne se perd plus.
 *
 * Ce que ces tests protègent : avant le 2026-09-04, cette route envoyait deux
 * courriels, attrapait leurs échecs, et répondait « succès » sans avoir rien
 * gardé. Une demande manquée était une demande perdue, sans trace.
 *
 * Le contrat mis sous test est donc l'ordre des opérations, pas le contenu des
 * courriels : on écrit d'abord, on envoie ensuite, et ce qui échoue après
 * l'écriture ne peut plus rien faire disparaître.
 */

const demandeCreate = vi.fn();
const demandeUpdate = vi.fn();
const sendEmail = vi.fn();
const attachDemandeSiteToCrm = vi.fn();
const isRateLimited = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    demandeSite: {
      create: (...a: unknown[]) => demandeCreate(...a),
      update: (...a: unknown[]) => demandeUpdate(...a),
    },
  },
}));
vi.mock("@/lib/email", () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }));
vi.mock("@/lib/crm/lead-from-demande", () => ({
  attachDemandeSiteToCrm: (...a: unknown[]) => attachDemandeSiteToCrm(...a),
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "127.0.0.1",
  isRateLimited: (...a: unknown[]) => isRateLimited(...a),
}));

import { POST } from "../route";

const CORPS = {
  name: "Camille Roy",
  email: "Camille@royavocats.ca",
  phone: "(514) 555-0100",
  message: "Voir SAFE sur mes propres dossiers",
};

function requete(corps: Record<string, unknown> = CORPS) {
  return new Request("https://safecabinet.ca/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "vitest" },
    body: JSON.stringify(corps),
  }) as never;
}

function demandeEnregistree(over: Record<string, unknown> = {}) {
  return {
    id: "dem1",
    type: "CONTACT",
    nom: CORPS.name,
    email: "camille@royavocats.ca",
    telephone: CORPS.phone,
    cabinet: null,
    nbAvocats: null,
    raison: CORPS.message,
    momentSouhaite: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  isRateLimited.mockResolvedValue(false);
  demandeCreate.mockImplementation(async ({ data }) =>
    demandeEnregistree({ ...data, id: "dem1" }),
  );
  demandeUpdate.mockResolvedValue({});
  sendEmail.mockResolvedValue(undefined);
  attachDemandeSiteToCrm.mockResolvedValue({
    ok: true,
    leadId: "lead1",
    created: true,
    note: "Lead créé.",
  });
});

describe("POST /api/contact", () => {
  it("enregistre la demande avant d'envoyer quoi que ce soit", async () => {
    const reponse = await POST(requete());

    expect(reponse.status).toBe(200);
    expect(demandeCreate).toHaveBeenCalledOnce();
    const ordreCreate = demandeCreate.mock.invocationCallOrder[0];
    const ordrePremierEnvoi = sendEmail.mock.invocationCallOrder[0];
    expect(ordreCreate).toBeLessThan(ordrePremierEnvoi);

    const { data } = demandeCreate.mock.calls[0][0];
    expect(data.email).toBe("camille@royavocats.ca"); // normalisé
    expect(data.telephone).toBe(CORPS.phone);
    expect(data.type).toBe("CONTACT");
  });

  it("garde la demande et répond succès même si les deux courriels échouent", async () => {
    sendEmail.mockRejectedValue(new Error("SMTP down"));

    const reponse = await POST(requete());

    expect(reponse.status).toBe(200);
    expect(demandeCreate).toHaveBeenCalledOnce();
    const trace = demandeUpdate.mock.calls[0][0].data;
    expect(trace.accuseReceptionEnvoye).toBe(false);
    expect(trace.aviseInterneEnvoye).toBe(false);
  });

  it("garde la demande et note l'échec quand le CRM tombe", async () => {
    attachDemandeSiteToCrm.mockResolvedValue({ ok: false, error: "workspace absent" });

    const reponse = await POST(requete());

    expect(reponse.status).toBe(200);
    expect(demandeUpdate.mock.calls[0][0].data.crmNote).toContain("workspace absent");
  });

  it("refuse et n'écrit rien si le courriel manque", async () => {
    const reponse = await POST(requete({ name: "Camille Roy", message: "Bonjour" }));

    expect(reponse.status).toBe(400);
    expect(demandeCreate).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("répond une erreur au visiteur si l'enregistrement échoue, plutôt que de mentir", async () => {
    demandeCreate.mockRejectedValue(new Error("base injoignable"));

    const reponse = await POST(requete());

    expect(reponse.status).toBe(500);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("devient une demande de rendez-vous quand un moment est proposé", async () => {
    await POST(requete({ ...CORPS, momentSouhaite: "Mardi ou mercredi après-midi" }));

    const { data } = demandeCreate.mock.calls[0][0];
    expect(data.type).toBe("RENDEZ_VOUS");
    expect(data.momentSouhaite).toBe("Mardi ou mercredi après-midi");
  });

  it("ne touche pas à la base quand la limite de débit est atteinte", async () => {
    isRateLimited.mockResolvedValue(true);

    const reponse = await POST(requete());

    expect(reponse.status).toBe(429);
    expect(demandeCreate).not.toHaveBeenCalled();
  });
});
