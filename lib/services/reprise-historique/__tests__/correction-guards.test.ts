import { describe, it, expect } from "vitest";
import {
  assertFactureCorrigible,
  calculerEffetNet,
  changementsMateriels,
  validerMotifCorrection,
  versionLaPlusHaute,
  type EtatFacture,
} from "@/lib/services/reprise-historique/correction-guards";

describe("assertFactureCorrigible — l'exception ne vaut que pour la reprise", () => {
  it("accepte une facture reprise vivante", () => {
    expect(assertFactureCorrigible({ estReprise: true, cancelledAt: null }).ok).toBe(true);
  });

  it("refuse une facture émise par SAFE et renvoie vers son module", () => {
    const verdict = assertFactureCorrigible({ estReprise: false, cancelledAt: null });
    expect(verdict.ok).toBe(false);
    expect(verdict.refus).toBe("pas_une_reprise");
    expect(verdict.message).toContain("Facturation");
  });

  it("refuse une facture déjà annulée", () => {
    const verdict = assertFactureCorrigible({ estReprise: true, cancelledAt: new Date() });
    expect(verdict.refus).toBe("facture_annulee");
  });

  it("refuse une facture introuvable", () => {
    expect(assertFactureCorrigible(null).refus).toBe("introuvable");
  });
});

describe("calculerEffetNet — ce qu'il faut neutraliser", () => {
  it("une entrée de 528 se neutralise par une sortie de 528", () => {
    expect(calculerEffetNet([{ montantEntree: 528, montantSortie: 0, sourceId: "inv1" }])).toBe(-528);
  });

  it("une sortie de 128 se neutralise par une entrée de 128", () => {
    expect(calculerEffetNet([{ montantEntree: 0, montantSortie: 128, sourceId: "deb1" }])).toBe(128);
  });

  it("additionne l'écriture initiale et ses re-jeux", () => {
    const net = calculerEffetNet([
      { montantEntree: 500, montantSortie: 0, sourceId: "inv1" },
      { montantEntree: 0, montantSortie: 500, sourceId: null },
      { montantEntree: 528, montantSortie: 0, sourceId: "inv1#v2" },
    ]);
    expect(net).toBe(-528);
  });

  it("une pièce déjà neutralisée n'a plus rien à annuler", () => {
    const net = calculerEffetNet([
      { montantEntree: 500, montantSortie: 0, sourceId: "inv1" },
      { montantEntree: 0, montantSortie: 500, sourceId: null },
    ]);
    expect(net).toBe(0);
  });
});

describe("versionLaPlusHaute", () => {
  it("vaut 1 quand seule l'écriture initiale existe", () => {
    expect(versionLaPlusHaute([{ montantEntree: 1, montantSortie: 0, sourceId: "inv1" }])).toBe(1);
  });

  it("lit la plus haute version présente", () => {
    expect(
      versionLaPlusHaute([
        { montantEntree: 1, montantSortie: 0, sourceId: "inv1" },
        { montantEntree: 1, montantSortie: 0, sourceId: "inv1#v2" },
        { montantEntree: 1, montantSortie: 0, sourceId: "inv1#v3" },
      ]),
    ).toBe(3);
  });
});

const etat = (o: Partial<EtatFacture> = {}): EtatFacture => ({
  montantTotal: 528,
  dateEmission: "2026-04-10",
  statutPaiement: "payee",
  montantPaye: 528,
  datePaiement: "2026-05-02",
  ...o,
});

describe("changementsMateriels", () => {
  it("ne voit rien quand rien ne bouge", () => {
    expect(changementsMateriels(etat(), etat()).material).toBe(false);
  });

  it("ignore un écart inférieur au sou", () => {
    expect(changementsMateriels(etat(), etat({ montantTotal: 528.004 })).material).toBe(false);
  });

  it("nomme le changement de montant en toutes lettres", () => {
    const { material, raisons } = changementsMateriels(etat(), etat({ montantTotal: 628 }));
    expect(material).toBe(true);
    expect(raisons[0]).toBe("montant total 528 → 628");
  });

  it("nomme un passage de payée à impayée avec ses conséquences", () => {
    const { raisons } = changementsMateriels(
      etat(),
      etat({ statutPaiement: "impayee", montantPaye: 0, datePaiement: null }),
    );
    expect(raisons).toEqual([
      "statut payee → impayee",
      "montant payé 528 → 0",
      "date de paiement 2026-05-02 → aucune",
    ]);
  });
});

describe("validerMotifCorrection — sans motif, le bouton ne part pas", () => {
  it("accepte un motif de la liste fermée sans précision", () => {
    expect(validerMotifCorrection({ code: "ERREUR_SAISIE" }).ok).toBe(true);
  });

  it("refuse « Autre » sans précision suffisante", () => {
    const verdict = validerMotifCorrection({ code: "AUTRE", texte: "oups" });
    expect(verdict.ok).toBe(false);
    expect(verdict.message).toContain("10 caractères");
  });

  it("accepte « Autre » précisé, et rend le texte nettoyé", () => {
    const verdict = validerMotifCorrection({ code: "AUTRE", texte: "  montant relu sur la facture papier  " });
    expect(verdict.ok).toBe(true);
    expect(verdict.texte).toBe("montant relu sur la facture papier");
  });
});
