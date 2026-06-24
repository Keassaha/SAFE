import { describe, it, expect } from "vitest";
import { urgentThreshold } from "../acte-urgent-scan";

describe("urgentThreshold — fenêtre d'urgence des actes", () => {
  const now = new Date("2026-06-23T12:00:00Z");

  it("le seuil est à 3 jours par défaut", () => {
    expect(urgentThreshold(now).toISOString()).toBe(new Date("2026-06-26T12:00:00Z").toISOString());
  });

  it("une échéance dans 2 jours est urgente (avant le seuil)", () => {
    const deadline = new Date("2026-06-25T12:00:00Z");
    expect(deadline < urgentThreshold(now)).toBe(true);
  });

  it("une échéance déjà dépassée est urgente", () => {
    const deadline = new Date("2026-06-20T12:00:00Z");
    expect(deadline < urgentThreshold(now)).toBe(true);
  });

  it("une échéance dans 10 jours n'est pas urgente", () => {
    const deadline = new Date("2026-07-03T12:00:00Z");
    expect(deadline < urgentThreshold(now)).toBe(false);
  });

  it("la fenêtre est paramétrable", () => {
    expect(urgentThreshold(now, 7).toISOString()).toBe(new Date("2026-06-30T12:00:00Z").toISOString());
  });
});
