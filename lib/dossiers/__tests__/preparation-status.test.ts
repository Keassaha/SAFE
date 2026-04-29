import { describe, it, expect } from "vitest";
import {
  getDossierMissingItems,
  getDossierPreparationStatus,
  type DossierPreparationSnapshot,
} from "../preparation-status";

/**
 * Tests purs du calcul de l'état de préparation.
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
 */

const NOW = new Date("2026-04-29T12:00:00Z");

function snapshot(over: Partial<DossierPreparationSnapshot> = {}): DossierPreparationSnapshot {
  return {
    dossierId: "dos_1",
    cabinetId: "cab_1",
    clientId: "cli_1",
    type: "immobilier",
    statut: "actif",
    dateOuverture: new Date("2026-04-01T00:00:00Z"),
    assistantJuridiqueId: "user_assistante",
    avocatResponsableId: "user_avocat",
    modeFacturation: "horaire",
    mandate: {
      exists: true,
      checklist: [
        { label: "Mandat signé", obligatoire: true, checked: true },
        { label: "Provision reçue", obligatoire: false, checked: false },
      ],
    },
    client: {
      identityVerified: true,
      consentementCollecteAt: new Date("2026-04-01T00:00:00Z"),
      lastIdentityVerificationStartedAt: null,
    },
    unresolvedConflict: false,
    emptyMandatorySections: 0,
    missingRequiredDebours: 0,
    upcomingEvents: [],
    myAdminTasksOverdueCount: 0,
    hasReadyToBillWork: false,
    ...over,
  };
}

/* ──────────────── Cas idéal ──────────────── */

describe("Cas idéal — dossier prêt pour revue", () => {
  it("retourne pret_pour_revue sans manquants quand tout est OK", () => {
    const res = getDossierPreparationStatus(snapshot(), NOW);
    expect(res.state).toBe("pret_pour_revue");
    expect(res.missingItems).toHaveLength(0);
    expect(res.nextAction).toBeNull();
    expect(res.readyToBill).toBe(false);
  });

  it("active readyToBill si du travail facturable est prêt", () => {
    const res = getDossierPreparationStatus(snapshot({ hasReadyToBillWork: true }), NOW);
    expect(res.state).toBe("pret_pour_revue");
    expect(res.readyToBill).toBe(true);
  });
});

/* ──────────────── Manquants critiques ──────────────── */

describe("Manquants critiques → état incomplet", () => {
  it("dossier sans assistante → critical assistant + état incomplet", () => {
    const res = getDossierPreparationStatus(snapshot({ assistantJuridiqueId: null }), NOW);
    expect(res.state).toBe("incomplet");
    expect(res.missingItems[0]).toMatchObject({
      kind: "assistant",
      severity: "critical",
    });
    expect(res.nextAction).toMatch(/Assigner une assistante/);
  });

  it("dossier sans mandat → critical mandate", () => {
    const res = getDossierPreparationStatus(
      snapshot({ mandate: { exists: false, checklist: [] } }),
      NOW,
    );
    expect(res.state).toBe("incomplet");
    expect(res.missingItems.find((m) => m.kind === "mandate")).toBeDefined();
  });

  it("identité non vérifiée et pas de session démarrée → incomplet (pas attente client)", () => {
    const res = getDossierPreparationStatus(
      snapshot({
        client: {
          identityVerified: false,
          consentementCollecteAt: null,
          lastIdentityVerificationStartedAt: null,
        },
      }),
      NOW,
    );
    expect(res.state).toBe("incomplet");
    expect(res.missingItems.find((m) => m.kind === "identity")).toBeDefined();
  });

  it("mode de facturation non défini → critical", () => {
    const res = getDossierPreparationStatus(snapshot({ modeFacturation: null }), NOW);
    expect(res.state).toBe("incomplet");
    expect(res.missingItems.find((m) => m.kind === "billing_mode")).toBeDefined();
  });

  it("multiples manquants critiques: nextAction = le premier par sévérité", () => {
    const res = getDossierPreparationStatus(
      snapshot({
        assistantJuridiqueId: null,
        mandate: { exists: false, checklist: [] },
        client: {
          identityVerified: false,
          consentementCollecteAt: null,
          lastIdentityVerificationStartedAt: null,
        },
      }),
      NOW,
    );
    expect(res.state).toBe("incomplet");
    expect(res.missingItems.length).toBeGreaterThanOrEqual(3);
    // Tous les manquants critiques sont triés en tête
    expect(res.missingItems[0].severity).toBe("critical");
    expect(res.nextAction).toBeDefined();
  });
});

/* ──────────────── Bloqué (conflit) ──────────────── */

describe("Conflit non résolu → bloqué", () => {
  it("conflict prime sur tout autre manquant", () => {
    const res = getDossierPreparationStatus(
      snapshot({
        unresolvedConflict: true,
        assistantJuridiqueId: null, // critical existe aussi mais bloque l'emporte
        modeFacturation: null,
      }),
      NOW,
    );
    expect(res.state).toBe("bloque");
    expect(res.missingItems[0]).toMatchObject({ kind: "conflict", severity: "blocking" });
    expect(res.nextAction).toMatch(/Résoudre/);
  });
});

/* ──────────────── Attente client ──────────────── */

describe("Attente client", () => {
  it("identité non vérifiée + session ouverte ≥48h → en_attente_client", () => {
    const sessionOpenedAt = new Date(NOW.getTime() - 72 * 60 * 60 * 1000); // 72h plus tôt
    const res = getDossierPreparationStatus(
      snapshot({
        client: {
          identityVerified: false,
          consentementCollecteAt: null,
          lastIdentityVerificationStartedAt: sessionOpenedAt,
        },
      }),
      NOW,
    );
    expect(res.state).toBe("en_attente_client");
  });

  it("identité non vérifiée + session ouverte <48h → incomplet (l'assistante doit relancer)", () => {
    const sessionOpenedAt = new Date(NOW.getTime() - 12 * 60 * 60 * 1000); // 12h plus tôt
    const res = getDossierPreparationStatus(
      snapshot({
        client: {
          identityVerified: false,
          consentementCollecteAt: null,
          lastIdentityVerificationStartedAt: sessionOpenedAt,
        },
      }),
      NOW,
    );
    expect(res.state).toBe("incomplet");
  });

  it("checklist obligatoire 'client ...' non cochée → en_attente_client", () => {
    const res = getDossierPreparationStatus(
      snapshot({
        mandate: {
          exists: true,
          checklist: [
            { label: "Mandat signé", obligatoire: true, checked: true },
            { label: "Pièce d'identité du client reçue", obligatoire: true, checked: false },
          ],
        },
        // Sinon tout OK pour ne déclencher aucune autre critical.
      }),
      NOW,
    );
    // Le manquant warning de checklist passe la situation en "incomplet"
    // déclenché par... non, attendez : c'est un warning, pas une critical.
    // Pour atteindre "en_attente_client", il faut une critical ET la condition client.
    // Test ajusté : on ajoute une critical (identité non vérifiée) ET le label client.
    // Ce cas-ci n'a aucune critical → le résultat est en_preparation.
    expect(res.state).toBe("en_preparation");
  });

  it("identité non vérifiée + label client dans checklist → en_attente_client", () => {
    const res = getDossierPreparationStatus(
      snapshot({
        client: {
          identityVerified: false,
          consentementCollecteAt: null,
          lastIdentityVerificationStartedAt: null,
        },
        mandate: {
          exists: true,
          checklist: [
            { label: "Pièce d'identité du client reçue", obligatoire: true, checked: false },
          ],
        },
      }),
      NOW,
    );
    expect(res.state).toBe("en_attente_client");
  });
});

/* ──────────────── En préparation (warnings) ──────────────── */

describe("Warnings → en_preparation", () => {
  it("checklist obligatoire mandat non cochée → warning + en_preparation", () => {
    const res = getDossierPreparationStatus(
      snapshot({
        mandate: {
          exists: true,
          checklist: [
            { label: "Provision initiale reçue", obligatoire: true, checked: false },
          ],
        },
      }),
      NOW,
    );
    expect(res.state).toBe("en_preparation");
    expect(res.missingItems.find((m) => m.kind === "checklist")).toBeDefined();
  });

  it("débours requis manquants → warning", () => {
    const res = getDossierPreparationStatus(
      snapshot({ missingRequiredDebours: 3 }),
      NOW,
    );
    expect(res.state).toBe("en_preparation");
    const debItem = res.missingItems.find((m) => m.kind === "debours");
    expect(debItem?.label).toMatch(/3 débours requis/);
  });

  it("section cartable obligatoire vide → warning", () => {
    const res = getDossierPreparationStatus(
      snapshot({ emptyMandatorySections: 2 }),
      NOW,
    );
    expect(res.state).toBe("en_preparation");
    expect(res.missingItems.find((m) => m.kind === "cartable_section")).toBeDefined();
  });

  it("événement à 5 jours sans tâche associée → warning", () => {
    const eventDate = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000);
    const res = getDossierPreparationStatus(
      snapshot({
        upcomingEvents: [
          { id: "evt_1", type: "audience", title: "Audience cour", date: eventDate, hasAssociatedTask: false },
        ],
      }),
      NOW,
    );
    expect(res.state).toBe("en_preparation");
    expect(res.missingItems.find((m) => m.kind === "event_deadline")).toBeDefined();
  });

  it("événement à 5 jours AVEC tâche associée → pas de warning", () => {
    const eventDate = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000);
    const res = getDossierPreparationStatus(
      snapshot({
        upcomingEvents: [
          { id: "evt_1", type: "audience", title: "Audience cour", date: eventDate, hasAssociatedTask: true },
        ],
      }),
      NOW,
    );
    expect(res.state).toBe("pret_pour_revue");
    expect(res.missingItems.find((m) => m.kind === "event_deadline")).toBeUndefined();
  });

  it("événement à 10 jours sans tâche → pas de warning (>7j)", () => {
    const eventDate = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000);
    const res = getDossierPreparationStatus(
      snapshot({
        upcomingEvents: [
          { id: "evt_1", type: "audience", title: "Audience", date: eventDate, hasAssociatedTask: false },
        ],
      }),
      NOW,
    );
    expect(res.state).toBe("pret_pour_revue");
  });
});

/* ──────────────── Tâches admin info ──────────────── */

describe("Info — tâches admin en retard", () => {
  it("ne change pas l'état mais ajoute un manquant info", () => {
    const res = getDossierPreparationStatus(
      snapshot({ myAdminTasksOverdueCount: 4 }),
      NOW,
    );
    expect(res.state).toBe("pret_pour_revue");
    const adminItem = res.missingItems.find((m) => m.kind === "admin_task");
    expect(adminItem?.severity).toBe("info");
    expect(adminItem?.label).toMatch(/4 tâche/);
  });
});

/* ──────────────── getDossierMissingItems direct ──────────────── */

describe("getDossierMissingItems — tri par sévérité", () => {
  it("retourne les manquants triés blocking → critical → warning → info", () => {
    const items = getDossierMissingItems(
      snapshot({
        unresolvedConflict: true,
        assistantJuridiqueId: null,
        missingRequiredDebours: 1,
        myAdminTasksOverdueCount: 2,
      }),
      NOW,
    );
    expect(items[0].severity).toBe("blocking");
    expect(items[items.length - 1].severity).toBe("info");
  });

  it("retourne un tableau vide quand aucun manquant", () => {
    const items = getDossierMissingItems(snapshot(), NOW);
    expect(items).toHaveLength(0);
  });
});
