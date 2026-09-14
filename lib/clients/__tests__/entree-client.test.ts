import { describe, it, expect } from "vitest";
import {
  elementsOuverts,
  ficheComplete,
  ecartFideicommis,
  progressionEntree,
  type FicheEntree,
} from "../entree-client";

/** Fiche irréprochable. Chaque test dégrade UN point et observe ce qui sort. */
function ficheConforme(surcharge: Partial<FicheEntree> = {}): FicheEntree {
  return {
    dossierEnCours: true,
    mandat: {
      envoyeAt: new Date("2026-02-11"),
      signeAt: new Date("2026-02-19"),
      verseAuDossierAt: new Date("2026-02-20"),
    },
    conflitsVerifieAt: new Date("2026-02-10"),
    identite: "VERIFIEE",
    consentementAt: new Date("2026-02-11"),
    fondsDetenus: { montant: 1500, arreteAu: new Date("2026-08-31") },
    nombreDatesQuiCourent: 2,
    aucuneDateConfirmee: false,
    ...surcharge,
  };
}

const cles = (fiche: FicheEntree) => elementsOuverts(fiche).map((e) => e.cle);

describe("elementsOuverts", () => {
  it("ne signale rien sur une fiche complète", () => {
    expect(elementsOuverts(ficheConforme())).toEqual([]);
    expect(ficheComplete(ficheConforme())).toBe(true);
  });

  it("range les manquements avant les points à surveiller", () => {
    const fiche = ficheConforme({
      conflitsVerifieAt: null, // manquant
      consentementAt: null, // à surveiller
    });
    const gravites = elementsOuverts(fiche).map((e) => e.gravite);
    expect(gravites).toEqual(["manquant", "a_surveiller"]);
  });

  describe("identité", () => {
    it("devient un manquement quand des fonds sont détenus", () => {
      const fiche = ficheConforme({ identite: "A_FAIRE" });
      const element = elementsOuverts(fiche).find((e) => e.cle === "identite_avec_fonds");
      expect(element?.gravite).toBe("manquant");
    });

    it("n'est qu'un point à surveiller sans fonds détenus", () => {
      const fiche = ficheConforme({ identite: "A_FAIRE", fondsDetenus: null });
      const element = elementsOuverts(fiche).find((e) => e.cle === "identite");
      expect(element?.gravite).toBe("a_surveiller");
    });

    it("passe l'exemption sans rien signaler : une exemption n'est pas un manquement", () => {
      expect(cles(ficheConforme({ identite: "EXEMPTEE" }))).toEqual([]);
    });

    it("place le manquement d'identité en tête, devant les conflits", () => {
      const fiche = ficheConforme({ identite: "A_FAIRE", conflitsVerifieAt: null });
      expect(cles(fiche)[0]).toBe("identite_avec_fonds");
    });
  });

  describe("mandat", () => {
    it("distingue « envoyé jamais signé » de « aucun mandat »", () => {
      const envoyeSeul = ficheConforme({
        mandat: { envoyeAt: new Date("2026-02-11"), signeAt: null, verseAuDossierAt: null },
      });
      expect(cles(envoyeSeul)).toContain("mandat_envoye_non_signe");

      const rien = ficheConforme({
        mandat: { envoyeAt: null, signeAt: null, verseAuDossierAt: null },
      });
      expect(cles(rien)).toContain("mandat_absent");
    });

    it("ne réclame la copie versée que si le mandat est signé", () => {
      const signeNonVerse = ficheConforme({
        mandat: { envoyeAt: new Date("2026-02-11"), signeAt: new Date("2026-02-19"), verseAuDossierAt: null },
      });
      expect(cles(signeNonVerse)).toEqual(["mandat_non_verse"]);

      // Non signé : c'est la signature qui manque, pas la copie. Signaler les
      // deux noierait le vrai problème sous un second reproche.
      const nonSigne = ficheConforme({
        mandat: { envoyeAt: new Date("2026-02-11"), signeAt: null, verseAuDossierAt: null },
      });
      expect(cles(nonSigne)).not.toContain("mandat_non_verse");
    });
  });

  describe("échéances", () => {
    it("signale le silence : ni date saisie, ni confirmation qu'il n'y en a pas", () => {
      const fiche = ficheConforme({ nombreDatesQuiCourent: 0, aucuneDateConfirmee: false });
      expect(cles(fiche)).toContain("dates_inconnues");
    });

    it("se tait quand le cabinet confirme qu'aucune date ne court", () => {
      const fiche = ficheConforme({ nombreDatesQuiCourent: 0, aucuneDateConfirmee: true });
      expect(cles(fiche)).not.toContain("dates_inconnues");
    });

    it("ne réclame aucune échéance à un dossier terminé", () => {
      const fiche = ficheConforme({
        dossierEnCours: false,
        nombreDatesQuiCourent: 0,
        aucuneDateConfirmee: false,
      });
      expect(cles(fiche)).not.toContain("dates_inconnues");
    });
  });

  it("réclame le mandat et les conflits même sur un dossier terminé", () => {
    // La déontologie ne s'efface pas à la clôture : la trace doit exister pour
    // la durée de conservation, et c'est justement elle qu'une inspection lit.
    const fiche = ficheConforme({
      dossierEnCours: false,
      conflitsVerifieAt: null,
      mandat: { envoyeAt: null, signeAt: null, verseAuDossierAt: null },
    });
    expect(cles(fiche)).toContain("conflits");
    expect(cles(fiche)).toContain("mandat_absent");
  });
});

describe("ecartFideicommis", () => {
  it("tombe juste quand le déclaré égale le relevé", () => {
    const r = ecartFideicommis({ declares: [1500, 4000, 5900], soldeReleve: 11400 });
    expect(r).toEqual({ totalDeclare: 11400, soldeReleve: 11400, ecart: 0, statut: "equilibre" });
  });

  it("annonce ce qui reste à attribuer quand le relevé porte davantage", () => {
    const r = ecartFideicommis({ declares: [1500, 4000, 3750], soldeReleve: 11400 });
    expect(r.totalDeclare).toBe(9250);
    expect(r.ecart).toBe(2150);
    expect(r.statut).toBe("reste_a_attribuer");
  });

  it("signale le sur-attribué : les clients totalisent plus que la banque", () => {
    const r = ecartFideicommis({ declares: [10000, 2000], soldeReleve: 11400 });
    expect(r.ecart).toBe(-600);
    expect(r.statut).toBe("trop_attribue");
  });

  it("additionne sans conclure tant qu'aucun relevé n'est saisi", () => {
    const r = ecartFideicommis({ declares: [1500, 4000], soldeReleve: null });
    expect(r).toEqual({ totalDeclare: 5500, soldeReleve: null, ecart: null, statut: "releve_absent" });
  });

  it("ne fabrique pas d'écart à partir des arrondis de la virgule flottante", () => {
    // 0,1 + 0,2 vaut 0,30000000000000004 en IEEE 754. Sans arrondi au cent,
    // l'écran annoncerait un déséquilibre invisible à l'œil et incorrigible.
    const r = ecartFideicommis({ declares: [0.1, 0.2], soldeReleve: 0.3 });
    expect(r.totalDeclare).toBe(0.3);
    expect(r.ecart).toBe(0);
    expect(r.statut).toBe("equilibre");
  });

  it("traite une liste vide comme un total de zéro", () => {
    const r = ecartFideicommis({ declares: [], soldeReleve: 500 });
    expect(r.totalDeclare).toBe(0);
    expect(r.ecart).toBe(500);
    expect(r.statut).toBe("reste_a_attribuer");
  });
});

describe("progressionEntree", () => {
  it("calcule le reste et le pourcentage sur un objectif posé", () => {
    expect(progressionEntree({ entres: 6, misDeCote: 1, objectif: 30 })).toEqual({
      entres: 6,
      misDeCote: 1,
      restants: 24,
      pourcentage: 20,
    });
  });

  it("n'invente aucun dénominateur quand aucun objectif n'est posé", () => {
    const r = progressionEntree({ entres: 6, misDeCote: 0, objectif: null });
    expect(r.restants).toBeNull();
    expect(r.pourcentage).toBeNull();
  });

  it("ne déborde pas quand le cabinet a sous-estimé son nombre de clients", () => {
    const r = progressionEntree({ entres: 34, misDeCote: 0, objectif: 30 });
    expect(r.restants).toBe(0);
    expect(r.pourcentage).toBe(100);
  });

  it("ignore un objectif à zéro plutôt que de diviser par zéro", () => {
    const r = progressionEntree({ entres: 3, misDeCote: 0, objectif: 0 });
    expect(r.restants).toBeNull();
    expect(r.pourcentage).toBeNull();
  });
});
