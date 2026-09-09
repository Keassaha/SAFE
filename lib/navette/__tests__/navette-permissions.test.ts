import { describe, it, expect } from "vitest";
import {
  canSendNavetteType,
  canSeeConfidential,
  isNavetteParticipant,
} from "../navette-permissions";

describe("isNavetteParticipant", () => {
  it("inclut assistante/avocat/admin, exclut comptabilite", () => {
    expect(isNavetteParticipant("assistante")).toBe(true);
    expect(isNavetteParticipant("avocat")).toBe(true);
    expect(isNavetteParticipant("admin_cabinet")).toBe(true);
    expect(isNavetteParticipant("comptabilite")).toBe(false);
    expect(isNavetteParticipant("inconnu")).toBe(false);
  });
});

describe("canSendNavetteType — frontière doctrinale", () => {
  it("l'avocate DÉCIDE : sent_back / approved réservés avocat/admin", () => {
    expect(canSendNavetteType("avocat", "sent_back")).toBe(true);
    expect(canSendNavetteType("admin_cabinet", "approved")).toBe(true);
    expect(canSendNavetteType("assistante", "sent_back")).toBe(false);
    expect(canSendNavetteType("assistante", "approved")).toBe(false);
  });

  it("l'assistante PRÉPARE : ready_for_review réservé assistante/admin", () => {
    expect(canSendNavetteType("assistante", "ready_for_review")).toBe(true);
    expect(canSendNavetteType("admin_cabinet", "ready_for_review")).toBe(true);
    expect(canSendNavetteType("avocat", "ready_for_review")).toBe(false);
  });

  it("question / info / reply : tout participant", () => {
    for (const role of ["assistante", "avocat", "admin_cabinet"]) {
      expect(canSendNavetteType(role, "question")).toBe(true);
      expect(canSendNavetteType(role, "info")).toBe(true);
      expect(canSendNavetteType(role, "reply")).toBe(true);
    }
  });

  it("comptabilite ne peut rien envoyer", () => {
    expect(canSendNavetteType("comptabilite", "question")).toBe(false);
    expect(canSendNavetteType("comptabilite", "info")).toBe(false);
    expect(canSendNavetteType("comptabilite", "invoice_ready")).toBe(false);
    expect(canSendNavetteType("comptabilite", "acte_urgent")).toBe(false);
  });

  it("P5 — invoice_ready réservé avocat/admin (l'avocate valide la facture)", () => {
    expect(canSendNavetteType("avocat", "invoice_ready")).toBe(true);
    expect(canSendNavetteType("admin_cabinet", "invoice_ready")).toBe(true);
    expect(canSendNavetteType("assistante", "invoice_ready")).toBe(false);
  });

  it("P5 — document_ready / acte_urgent : tout participant", () => {
    for (const role of ["assistante", "avocat", "admin_cabinet"]) {
      expect(canSendNavetteType(role, "document_ready")).toBe(true);
      expect(canSendNavetteType(role, "acte_urgent")).toBe(true);
    }
  });
});

describe("canSeeConfidential", () => {
  it("seuls avocat/admin voient le confidentiel", () => {
    expect(canSeeConfidential("avocat")).toBe(true);
    expect(canSeeConfidential("admin_cabinet")).toBe(true);
    expect(canSeeConfidential("assistante")).toBe(false);
  });
});

/* ═══════════ Décider, résoudre, voir (2026-09-05) ═══════════ */

import {
  canViewNavetteMessage,
  checkNavetteDecision,
  checkNavetteResolve,
  hasNavetteAdminOverride,
  isNavetteRequestType,
} from "../navette-permissions";

const AVOCATE = "u-avocate";
const ADJOINTE = "u-adjointe";

function demande(p: Partial<{ type: "ready_for_review" | "sent_back" | "question" | "info"; recipientId: string | null; resolvedAt: Date | null; confidentiel: boolean }> = {}) {
  return {
    type: (p.type ?? "ready_for_review") as never,
    recipientId: p.recipientId === undefined ? AVOCATE : p.recipientId,
    resolvedAt: p.resolvedAt ?? null,
    confidentiel: p.confidentiel ?? false,
  };
}

describe("canViewNavetteMessage — cloison du confidentiel", () => {
  it("l'assistante ne voit pas un message confidentiel", () => {
    expect(canViewNavetteMessage("assistante", { confidentiel: true })).toBe(false);
    expect(canViewNavetteMessage("assistante", { confidentiel: false })).toBe(true);
  });
  it("l'avocate et l'admin le voient", () => {
    expect(canViewNavetteMessage("avocat", { confidentiel: true })).toBe(true);
    expect(canViewNavetteMessage("admin_cabinet", { confidentiel: true })).toBe(true);
  });
  it("la comptabilité ne voit rien de la navette", () => {
    expect(canViewNavetteMessage("comptabilite", { confidentiel: false })).toBe(false);
  });
});

describe("checkNavetteDecision — une décision vise une demande précise", () => {
  it("l'avocate destinataire peut approuver une demande ouverte", () => {
    expect(checkNavetteDecision({ role: "avocat", userId: AVOCATE, decision: "approve", request: demande() }))
      .toEqual({ ok: true });
  });

  it("une seconde approbation est refusée : la demande est déjà résolue", () => {
    const r = checkNavetteDecision({ role: "avocat", userId: AVOCATE, decision: "approve", request: demande({ resolvedAt: new Date() }) });
    expect(r).toEqual({ ok: false, reason: "already_resolved" });
  });

  it("on n'approuve pas parce qu'on est avocat : un avocat non visé est refusé", () => {
    const r = checkNavetteDecision({ role: "avocat", userId: "u-autre", decision: "approve", request: demande() });
    expect(r).toEqual({ ok: false, reason: "forbidden" });
  });

  it("l'admin du cabinet supplée explicitement le destinataire", () => {
    expect(checkNavetteDecision({ role: "admin_cabinet", userId: "u-autre", decision: "approve", request: demande() }))
      .toEqual({ ok: true });
  });

  it("rien d'autre qu'une demande de révision ne s'approuve", () => {
    for (const type of ["question", "info", "sent_back"] as const) {
      expect(checkNavetteDecision({ role: "avocat", userId: AVOCATE, decision: "approve", request: demande({ type }) }))
        .toEqual({ ok: false, reason: "not_a_request" });
    }
  });

  it("l'assistante ne décide pas, même si la demande la vise", () => {
    const r = checkNavetteDecision({ role: "assistante", userId: ADJOINTE, decision: "approve", request: demande({ recipientId: ADJOINTE }) });
    expect(r).toEqual({ ok: false, reason: "forbidden" });
  });

  it("une demande sans destinataire n'est décidable que par l'admin", () => {
    expect(checkNavetteDecision({ role: "avocat", userId: AVOCATE, decision: "send_back", request: demande({ recipientId: null }) }))
      .toEqual({ ok: false, reason: "forbidden" });
    expect(checkNavetteDecision({ role: "admin_cabinet", userId: AVOCATE, decision: "send_back", request: demande({ recipientId: null }) }))
      .toEqual({ ok: true });
  });
});

describe("checkNavetteResolve — seul le destinataire marque traité", () => {
  it("le destinataire peut résoudre", () => {
    expect(checkNavetteResolve({ role: "assistante", userId: ADJOINTE, message: demande({ type: "sent_back", recipientId: ADJOINTE }) }))
      .toEqual({ ok: true });
  });

  it("un tiers ne peut pas résoudre le message d'un autre", () => {
    expect(checkNavetteResolve({ role: "assistante", userId: "u-tiers", message: demande({ type: "sent_back", recipientId: ADJOINTE }) }))
      .toEqual({ ok: false, reason: "forbidden" });
  });

  it("une entrée déjà traitée ne se retraite pas", () => {
    expect(checkNavetteResolve({ role: "assistante", userId: ADJOINTE, message: demande({ type: "sent_back", recipientId: ADJOINTE, resolvedAt: new Date() }) }))
      .toEqual({ ok: false, reason: "already_resolved" });
  });

  it("une note d'information ne se « traite » pas : ce n'est pas une demande", () => {
    expect(checkNavetteResolve({ role: "assistante", userId: ADJOINTE, message: demande({ type: "info", recipientId: ADJOINTE }) }))
      .toEqual({ ok: false, reason: "not_a_request" });
  });
});

describe("garde-fous divers", () => {
  it("seul admin_cabinet a la suppléance", () => {
    expect(hasNavetteAdminOverride("admin_cabinet")).toBe(true);
    expect(hasNavetteAdminOverride("avocat")).toBe(false);
  });
  it("info et reply ne sont pas des demandes", () => {
    expect(isNavetteRequestType("info")).toBe(false);
    expect(isNavetteRequestType("reply")).toBe(false);
    expect(isNavetteRequestType("ready_for_review")).toBe(true);
  });
});
