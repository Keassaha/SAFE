/**
 * L'ordre des lignes sur une facture.
 *
 * Demande CEO : « que tout soit naturellement aligné de façon chronologique ».
 *
 * LE DÉFAUT D'ORIGINE
 *
 * `sortOrder` était attribué en deux passes à la création : TOUTES les prestations,
 * puis TOUS les débours, chacun dans l'ordre non déterministe que renvoyait la base
 * faute d'`orderBy`. Sur une facture mêlant honoraires et débours, le client lisait
 * une suite de dates qui montait, retombait, puis remontait.
 *
 * Une facture d'avocat se lit comme un récit du dossier. Si les dates sautent, le
 * client cherche l'erreur au lieu de lire le travail.
 */

import { describe, it, expect } from "vitest";
import { ordonnerChronologiquement } from "../invoice-presenter";
import type { PresentedLine } from "../invoice-presenter";

const ligne = (over: Partial<PresentedLine> & { id: string }): PresentedLine => ({
  type: "honoraires",
  description: over.id,
  date: "2026-08-01",
  hours: 1,
  rate: 300,
  amount: 300,
  userNom: null,
  parentLineId: null,
  source: "invoice_line",
  ...over,
});

const ordre = (l: PresentedLine[]) => ordonnerChronologiquement(l).map((x) => x.id);

describe("les dates montent, du début à la fin", () => {
  it("remet en ordre des lignes saisies en désordre", () => {
    expect(
      ordre([
        ligne({ id: "c", date: "2026-08-20" }),
        ligne({ id: "a", date: "2026-08-03" }),
        ligne({ id: "b", date: "2026-08-11" }),
      ]),
    ).toEqual(["a", "b", "c"]);
  });

  it("mêle honoraires et débours dans la même chronologie", () => {
    // C'est le cas qui cassait : les débours partaient tous après les honoraires,
    // quelles que soient leurs dates.
    expect(
      ordre([
        ligne({ id: "hono-1", date: "2026-08-05" }),
        ligne({ id: "hono-2", date: "2026-08-25" }),
        ligne({ id: "debours-1", type: "debours_taxable", date: "2026-08-12" }),
        ligne({ id: "debours-2", type: "debours_taxable", date: "2026-08-02" }),
      ]),
    ).toEqual(["debours-2", "hono-1", "debours-1", "hono-2"]);
  });

  it("à date égale, l'ordre de saisie fait foi", () => {
    // Deux prestations du même jour se suivent comme elles ont été enregistrées.
    expect(
      ordre([
        ligne({ id: "premiere", date: "2026-08-05" }),
        ligne({ id: "seconde", date: "2026-08-05" }),
      ]),
    ).toEqual(["premiere", "seconde"]);
  });

  it("accepte indifféremment une Date ou une chaîne", () => {
    expect(
      ordre([
        ligne({ id: "tard", date: new Date("2026-09-01") }),
        ligne({ id: "tot", date: "2026-08-01" }),
      ]),
    ).toEqual(["tot", "tard"]);
  });
});

describe("les rabais restent lisibles", () => {
  it("un rabais ciblé colle à sa ligne parente", () => {
    // Le détacher pour le ranger à sa propre date rendrait illisible ce qu'il vient
    // réduire.
    expect(
      ordre([
        ligne({ id: "L1", date: "2026-08-01" }),
        ligne({ id: "L2", date: "2026-08-20" }),
        ligne({ id: "R", type: "rabais", parentLineId: "L1", date: "2026-08-30", amount: -50 }),
      ]),
    ).toEqual(["L1", "R", "L2"]);
  });

  it("un rabais global ferme la facture", () => {
    // Il porte sur l'ensemble, pas sur un jour.
    expect(
      ordre([
        ligne({ id: "global", type: "rabais", parentLineId: null, date: "2026-08-01", amount: -100 }),
        ligne({ id: "L1", date: "2026-08-10" }),
      ]),
    ).toEqual(["L1", "global"]);
  });

  it("un rabais orphelin n'est jamais perdu", () => {
    // Si la ligne parente a disparu, le montant doit rester visible : le total en
    // dépend, et une facture qui ne s'additionne pas est indéfendable.
    const r = ordonnerChronologiquement([
      ligne({ id: "L1", date: "2026-08-01" }),
      ligne({ id: "R", type: "rabais", parentLineId: "DISPARUE", amount: -50 }),
    ]);
    expect(r.map((x) => x.id)).toContain("R");
    expect(r).toHaveLength(2);
  });
});

describe("lignes sans date", () => {
  it("passent en fin plutôt que d'inventer une place", () => {
    expect(
      ordre([
        ligne({ id: "sans", date: "" }),
        ligne({ id: "avec", date: "2026-08-10" }),
      ]),
    ).toEqual(["avec", "sans"]);
  });

  it("gardent entre elles leur ordre d'origine", () => {
    expect(
      ordre([ligne({ id: "s1", date: "" }), ligne({ id: "s2", date: "" })]),
    ).toEqual(["s1", "s2"]);
  });

  it("une date illisible ne fait pas planter le tri", () => {
    const r = ordre([
      ligne({ id: "cassee", date: "pas une date" }),
      ligne({ id: "bonne", date: "2026-08-10" }),
    ]);
    expect(r).toEqual(["bonne", "cassee"]);
  });
});

describe("aucune ligne perdue", () => {
  it("le tri conserve exactement les mêmes lignes", () => {
    const entree = [
      ligne({ id: "a", date: "2026-08-20" }),
      ligne({ id: "b", type: "debours_taxable", date: "2026-08-01" }),
      ligne({ id: "c", type: "rabais", parentLineId: "a", amount: -10 }),
      ligne({ id: "d", type: "rabais", parentLineId: null, amount: -20 }),
      ligne({ id: "e", date: "" }),
    ];
    const sortie = ordonnerChronologiquement(entree);
    expect(sortie).toHaveLength(entree.length);
    expect([...sortie].map((l) => l.id).sort()).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("une facture vide ne casse pas", () => {
    expect(ordonnerChronologiquement([])).toEqual([]);
  });
});
