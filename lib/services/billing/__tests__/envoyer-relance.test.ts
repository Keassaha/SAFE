import { describe, it, expect, vi, beforeEach } from "vitest";
import { reponseHttpPourRelance } from "@/lib/services/billing/relance-http";

/**
 * Envoi d'une relance de facture.
 *
 * La colonne « Relance » du registre lisait `lastReminderDay`, qu'aucun code
 * n'écrivait : le produit affichait une trace que rien ne posait. Ces tests
 * portent sur ce qui doit être vrai pour le cabinet, pas sur l'implémentation.
 */

const findFirstMock = vi.fn();
const countMock = vi.fn();
const updateMock = vi.fn();
const reminderCreateMock = vi.fn();
const sendEmailMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: {
      findFirst: (...a: unknown[]) => findFirstMock(...a),
      findUnique: (...a: unknown[]) => findFirstMock(...a),
      count: (...a: unknown[]) => countMock(...a),
      update: (...a: unknown[]) => updateMock(...a),
      findMany: vi.fn(),
    },
    invoiceReminder: { create: (...a: unknown[]) => reminderCreateMock(...a) },
  },
}));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn() }));
vi.mock("@/lib/email", async (orig) => ({
  ...(await orig<typeof import("@/lib/email")>()),
  sendEmail: (...a: unknown[]) => sendEmailMock(...a),
}));

const MAINTENANT = new Date("2026-08-27T12:00:00.000Z");

function facture(over: Record<string, unknown> = {}) {
  return {
    id: "inv_1",
    cabinetId: "cab_1",
    numero: "2026-0042",
    balanceDue: 1200,
    dateEcheance: new Date("2026-08-12T00:00:00.000Z"),
    shareToken: null,
    client: {
      email: "client@example.ca",
      langue: "FR",
      typeClient: "personne_morale",
      raisonSociale: "Boulangerie Saint-Roch inc.",
      prenom: null,
      nom: null,
    },
    cabinet: { nom: "Cabinet Roy" },
    ...over,
  };
}

beforeEach(() => {
  for (const m of [findFirstMock, countMock, updateMock, reminderCreateMock, sendEmailMock]) m.mockReset();
  countMock.mockResolvedValue(1);
  reminderCreateMock.mockResolvedValue({ id: "rem_1" });
  updateMock.mockResolvedValue({});
  sendEmailMock.mockResolvedValue({ id: "eml_1", success: true });
});

async function envoyer(over?: Record<string, unknown>) {
  findFirstMock.mockResolvedValue(facture(over));
  const { envoyerRelanceFacture } = await import("@/lib/services/billing/reminder-service");
  return envoyerRelanceFacture({ invoiceId: "inv_1", cabinetId: "cab_1", maintenant: MAINTENANT });
}

describe("envoi d'une relance", () => {
  it("envoie, puis écrit la trace que le registre affiche", async () => {
    const r = await envoyer();
    expect(r).toEqual({ statut: "envoyee", joursDeRetard: 15, destinataire: "client@example.ca" });
    expect(sendEmailMock).toHaveBeenCalledOnce();
    // Sans cette écriture, le courriel part et la colonne « Relance » reste vide.
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "inv_1" },
      data: { lastReminderDay: 15 },
    });
  });

  it("part au nom du cabinet, jamais au nom de SAFE", async () => {
    await envoyer();
    const arg = sendEmailMock.mock.calls[0][0] as { cabinetNom: string; html: string };
    expect(arg.cabinetNom).toBe("Cabinet Roy");
    expect(arg.html).toContain("Cabinet Roy");
    expect(arg.html).not.toContain("safecabinet.ca");
  });

  it("suit la langue du CLIENT, pas celle du serveur", async () => {
    await envoyer({ client: { ...facture().client, langue: "EN" } });
    const arg = sendEmailMock.mock.calls[0][0] as { subject: string; html: string };
    expect(arg.subject).toBe("Reminder: invoice 2026-0042");
    expect(arg.html).toContain("Payment reminder");
  });

  it("n'écrit aucune trace si l'envoi échoue", async () => {
    // Une trace posée avant l'envoi ferait croire au cabinet qu'il a relancé.
    sendEmailMock.mockRejectedValue(new Error("Resend refuse"));
    const r = await envoyer();
    expect(r).toEqual({ statut: "envoi_echoue", message: "Resend refuse" });
    expect(reminderCreateMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("refuse une facture déjà payée avant de parler du courriel", async () => {
    const r = await envoyer({ balanceDue: 0, client: { ...facture().client, email: null } });
    expect(r).toEqual({ statut: "deja_payee" });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("refuse une facture qui n'est pas encore en retard", async () => {
    countMock.mockResolvedValue(0);
    const r = await envoyer();
    expect(r).toEqual({ statut: "pas_en_retard" });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("signale un client sans courriel plutôt que d'échouer en silence", async () => {
    const r = await envoyer({ client: { ...facture().client, email: "  " } });
    expect(r).toEqual({ statut: "client_sans_courriel" });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("ne relance pas une facture d'un autre cabinet", async () => {
    findFirstMock.mockResolvedValue(null);
    const { envoyerRelanceFacture } = await import("@/lib/services/billing/reminder-service");
    const r = await envoyerRelanceFacture({ invoiceId: "inv_1", cabinetId: "autre", maintenant: MAINTENANT });
    expect(r).toEqual({ statut: "facture_introuvable" });
  });
});

describe("traduction en HTTP", () => {
  it("distingue ce que le cabinet peut corriger de ce dont il n'est pas responsable", () => {
    expect(reponseHttpPourRelance({ statut: "facture_introuvable" }).status).toBe(404);
    expect(reponseHttpPourRelance({ statut: "client_sans_courriel" }).status).toBe(400);
    expect(reponseHttpPourRelance({ statut: "deja_payee" }).status).toBe(409);
    expect(reponseHttpPourRelance({ statut: "pas_en_retard" }).status).toBe(409);
    expect(reponseHttpPourRelance({ statut: "envoi_echoue", message: "x" }).status).toBe(502);
    expect(
      reponseHttpPourRelance({ statut: "envoyee", joursDeRetard: 15, destinataire: "a@b.ca" }),
    ).toEqual({ status: 200, body: { success: true, joursDeRetard: 15, destinataire: "a@b.ca" } });
  });
});
