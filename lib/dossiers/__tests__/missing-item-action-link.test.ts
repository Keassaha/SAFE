import { describe, it, expect } from "vitest";
import {
  getMissingItemAction,
  getKindCanonicalLink,
} from "@/lib/dossiers/missing-item-action-link";
import type { MissingItem, MissingItemKind } from "@/lib/dossiers/preparation-status";

const ctx = { dossierId: "dos_42", clientId: "cli_99" };

function item(kind: MissingItemKind, label = "test"): MissingItem {
  return { kind, severity: "warning", label, nextAction: "test action" };
}

/* ───────── getMissingItemAction ───────── */

describe("getMissingItemAction — routage des manquants vers l'action concrète", () => {
  it("kind=assistant → action self_assign (pas de href)", () => {
    const a = getMissingItemAction(item("assistant"), ctx);
    expect(a.kind).toBe("self_assign");
  });

  it("kind=identity → lien vers la page de vérification du client", () => {
    const a = getMissingItemAction(item("identity"), ctx);
    expect(a.kind).toBe("link");
    if (a.kind !== "link") return;
    expect(a.href).toBe("/clients/cli_99/verification-identite");
  });

  it("kind=mandate → édition dossier", () => {
    const a = getMissingItemAction(item("mandate"), ctx);
    expect(a.kind).toBe("link");
    if (a.kind !== "link") return;
    expect(a.href).toBe("/dossiers/dos_42?edit=1");
  });

  it("kind=billing_mode → édition dossier", () => {
    const a = getMissingItemAction(item("billing_mode"), ctx);
    expect(a.kind).toBe("link");
    if (a.kind !== "link") return;
    expect(a.href).toBe("/dossiers/dos_42?edit=1");
  });

  it("kind=conflict → fiche dossier", () => {
    const a = getMissingItemAction(item("conflict"), ctx);
    expect(a.kind).toBe("link");
    if (a.kind !== "link") return;
    expect(a.href).toBe("/dossiers/dos_42");
  });

  it("kind=event_deadline → LexTrack du dossier", () => {
    const a = getMissingItemAction(item("event_deadline"), ctx);
    expect(a.kind).toBe("link");
    if (a.kind !== "link") return;
    expect(a.href).toContain("/gestion/lextrack");
    expect(a.href).toContain("dossierId=dos_42");
  });

  it("kind=checklist / cartable_section / debours / admin_task → fiche dossier", () => {
    for (const k of ["checklist", "cartable_section", "debours", "admin_task"] as const) {
      const a = getMissingItemAction(item(k), ctx);
      expect(a.kind).toBe("link");
      if (a.kind !== "link") return;
      expect(a.href).toBe("/dossiers/dos_42");
    }
  });
});

/* ───────── getKindCanonicalLink ───────── */

describe("getKindCanonicalLink — version directe pour la file", () => {
  it("kind=assistant → null (action, pas lien)", () => {
    expect(getKindCanonicalLink("assistant", ctx)).toBeNull();
  });

  it("kind=identity → /clients/:id/verification-identite", () => {
    expect(getKindCanonicalLink("identity", ctx)).toBe("/clients/cli_99/verification-identite");
  });

  it("kind=event_deadline → URL LexTrack avec dossierId", () => {
    const link = getKindCanonicalLink("event_deadline", ctx);
    expect(link).toContain("/gestion/lextrack");
    expect(link).toContain("dossierId=dos_42");
  });

  it("kind=mandate / billing_mode → édition", () => {
    expect(getKindCanonicalLink("mandate", ctx)).toBe("/dossiers/dos_42?edit=1");
    expect(getKindCanonicalLink("billing_mode", ctx)).toBe("/dossiers/dos_42?edit=1");
  });
});

/* ───────── Sécurité encodage URL ───────── */

describe("Encodage URL", () => {
  it("dossierId avec caractères spéciaux est encodé dans le lien LexTrack", () => {
    const link = getKindCanonicalLink("event_deadline", {
      dossierId: "dos with space & =",
      clientId: "cli_1",
    });
    expect(link).toContain("dossierId=dos%20with%20space%20%26%20%3D");
  });
});
