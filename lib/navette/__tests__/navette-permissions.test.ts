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
  });
});

describe("canSeeConfidential", () => {
  it("seuls avocat/admin voient le confidentiel", () => {
    expect(canSeeConfidential("avocat")).toBe(true);
    expect(canSeeConfidential("admin_cabinet")).toBe(true);
    expect(canSeeConfidential("assistante")).toBe(false);
  });
});
