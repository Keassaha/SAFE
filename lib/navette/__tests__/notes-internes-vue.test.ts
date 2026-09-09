import { describe, it, expect } from "vitest";
import {
  repartirNotes,
  actionsPour,
  typeDeNote,
  revueDejaEnAttente,
  variantesEntree,
  type SerializedNavetteRow,
} from "../notes-internes-vue";
import type { NavetteMessageType } from "@prisma/client";

/**
 * La logique de l'écran « Notes internes ».
 *
 * Ce qui est vérifié ici est exactement ce que l'écran offre : une décision ne
 * s'affiche que si le serveur l'accepterait, et une entrée ne se présente que
 * sous une seule des trois formes.
 */

const AVOCATE = "u-avocate";
const ADJOINTE = "u-adjointe";

function ligne(p: Partial<SerializedNavetteRow> & { id: string; type: NavetteMessageType }): SerializedNavetteRow {
  return {
    body: null,
    authorId: ADJOINTE,
    authorName: "Aaliyah",
    authorRole: "assistante",
    recipientId: AVOCATE,
    recipientName: "Me Camille Roy",
    parentId: null,
    dueDate: null,
    confidentiel: false,
    resolvedAt: null,
    createdAt: "2026-09-05T19:42:00.000Z",
    ...p,
  };
}

describe("repartirNotes — trois formes, jamais deux", () => {
  const rows = [
    ligne({ id: "r1", type: "ready_for_review" }),
    ligne({ id: "m1", type: "info", body: "Il manque le contrat.", recipientId: null }),
    ligne({ id: "e1", type: "approved", authorId: AVOCATE, authorRole: "avocat", recipientId: ADJOINTE, resolvedAt: "2026-09-05T19:48:00.000Z" }),
  ];

  it("l'avocate destinataire voit la demande à traiter, le message et l'évènement séparés", () => {
    const v = repartirNotes({ rows, userId: AVOCATE, role: "avocat" });
    expect(v.aTraiter.map((e) => e.row.id)).toEqual(["r1"]);
    expect(v.echanges.map((r) => r.id)).toEqual(["m1"]);
    expect(v.historique.map((r) => r.id)).toEqual(["e1"]);
  });

  it("une entrée n'apparaît jamais dans deux zones", () => {
    const v = repartirNotes({ rows, userId: AVOCATE, role: "avocat" });
    const tous = [...v.aTraiter.map((e) => e.row.id), ...v.echanges.map((r) => r.id), ...v.historique.map((r) => r.id)];
    expect(new Set(tous).size).toBe(tous.length);
    expect(tous.length).toBe(rows.length);
  });

  it("l'adjointe, qui n'est pas destinataire, n'a rien à trancher", () => {
    const v = repartirNotes({ rows, userId: ADJOINTE, role: "assistante" });
    expect(v.aTraiter).toHaveLength(0);
    expect(v.historique.map((r) => r.id)).toContain("r1");
  });

  it("une demande déjà tranchée dans cette page quitte « À traiter » sans attendre le serveur", () => {
    const v = repartirNotes({ rows, userId: AVOCATE, role: "avocat", dejaTranchees: ["r1"] });
    expect(v.aTraiter).toHaveLength(0);
    expect(v.historique.map((r) => r.id)).toContain("r1");
  });

  it("une demande déjà résolue en base ne revient jamais à traiter", () => {
    const v = repartirNotes({
      rows: [ligne({ id: "r1", type: "ready_for_review", resolvedAt: "2026-09-05T19:48:00.000Z" })],
      userId: AVOCATE,
      role: "avocat",
    });
    expect(v.aTraiter).toHaveLength(0);
  });

  it("un message confidentiel reste invisible à l'assistante, même comme demande", () => {
    const rows = [ligne({ id: "c1", type: "question", confidentiel: true, recipientId: ADJOINTE })];
    const v = repartirNotes({ rows, userId: ADJOINTE, role: "assistante" });
    expect(v.aTraiter).toHaveLength(0);
  });

  it("état vide : trois zones vides, aucune exception", () => {
    const v = repartirNotes({ rows: [], userId: AVOCATE, role: "avocat" });
    expect(v).toEqual({ aTraiter: [], echanges: [], historique: [] });
  });

  it("les échanges se lisent du plus ancien au plus récent, l'historique à l'inverse", () => {
    const rows = [
      ligne({ id: "m2", type: "info", createdAt: "2026-09-05T20:00:00.000Z", recipientId: null }),
      ligne({ id: "m1", type: "info", createdAt: "2026-09-05T19:00:00.000Z", recipientId: null }),
      ligne({ id: "e2", type: "approved", createdAt: "2026-09-05T20:10:00.000Z", resolvedAt: "x", recipientId: null }),
      ligne({ id: "e1", type: "approved", createdAt: "2026-09-05T19:10:00.000Z", resolvedAt: "x", recipientId: null }),
    ];
    const v = repartirNotes({ rows, userId: AVOCATE, role: "avocat" });
    expect(v.echanges.map((r) => r.id)).toEqual(["m1", "m2"]);
    expect(v.historique.map((r) => r.id)).toEqual(["e2", "e1"]);
  });
});

describe("actionsPour — une seule action principale", () => {
  it("sur une demande de révision : approuver d'abord, puis corriger, puis répondre", () => {
    expect(actionsPour({ row: ligne({ id: "r", type: "ready_for_review" }), peutDecider: true, peutResoudre: true }))
      .toEqual(["approve", "request_correction", "reply"]);
  });

  it("sur une correction reçue : marquer traité, et répondre", () => {
    expect(actionsPour({ row: ligne({ id: "s", type: "sent_back" }), peutDecider: false, peutResoudre: true }))
      .toEqual(["mark_addressed", "reply"]);
  });

  it("sur un signal dérivé : marquer traité seulement, on ne répond pas à une machine", () => {
    expect(actionsPour({ row: ligne({ id: "a", type: "acte_urgent" }), peutDecider: false, peutResoudre: true }))
      .toEqual(["mark_addressed"]);
  });

  it("aucune action quand il n'y a rien à faire", () => {
    expect(actionsPour({ row: ligne({ id: "x", type: "info" }), peutDecider: false, peutResoudre: false })).toEqual([]);
  });

  it("« Approuver » n'est jamais la seule action, et jamais absente d'une décision", () => {
    const a = actionsPour({ row: ligne({ id: "r", type: "ready_for_review" }), peutDecider: true, peutResoudre: false });
    expect(a[0]).toBe("approve");
    expect(a).toContain("request_correction");
  });
});

describe("typeDeNote — une note libre n'est pas une question", () => {
  it("note libre → info", () => expect(typeDeNote("note")).toBe("info"));
  it("réponse ciblée → reply", () => expect(typeDeNote("reply")).toBe("reply"));
  it("question explicite → question", () => expect(typeDeNote("question")).toBe("question"));
});

describe("revueDejaEnAttente — pas deux demandes vivantes", () => {
  it("détecte une demande ouverte", () => {
    expect(revueDejaEnAttente([ligne({ id: "r", type: "ready_for_review" })])).toBe(true);
  });
  it("ignore une demande résolue", () => {
    expect(revueDejaEnAttente([ligne({ id: "r", type: "ready_for_review", resolvedAt: "x" })])).toBe(false);
  });
  it("ignore une demande tranchée à l'instant dans cette page", () => {
    expect(revueDejaEnAttente([ligne({ id: "r", type: "ready_for_review" })], ["r"])).toBe(false);
  });
});

describe("variantesEntree — prefers-reduced-motion", () => {
  it("le mouvement réduit garde le fondu et retire toute hauteur animée", () => {
    const v = variantesEntree(true);
    expect(v.animate).toEqual({ opacity: 1 });
    expect(JSON.stringify(v)).not.toContain("height");
  });

  it("le mouvement normal ajuste la hauteur, sans translation", () => {
    const v = variantesEntree(false);
    expect(v.animate).toMatchObject({ opacity: 1, height: "auto" });
    expect(JSON.stringify(v)).not.toContain('"x"');
    expect(JSON.stringify(v)).not.toContain('"y"');
  });
});
