/**
 * Les six délais de divulgation en matière familiale.
 *
 * Recherche : docs/research/RECHERCHE_divulgation_famille_QC_2026-08-18.md
 *
 * Ce que ces tests verrouillent, par ordre de ce qu'une régression coûterait :
 *   1. le délai qui rend une demande INDÉCIDABLE ne se noie jamais dans les autres ;
 *   2. sans date source, aucune échéance n'est inventée ;
 *   3. les dates sont des jours calendaires, jamais des instants.
 */

import { describe, it, expect } from "vitest";
import {
  calculerDelaisFamille,
  datesManquantes,
  delaiLePlusUrgent,
  formatEcheance,
  type DatesDossierFamille,
} from "../delais-famille";

const AUJ = new Date("2026-08-18");
const trouve = (dates: DatesDossierFamille, code: string, auj = AUJ) =>
  calculerDelaisFamille(dates, auj).find((d) => d.code === code)!;

describe("le délai qui coûte l'audience", () => {
  it("se calcule à 10 jours avant la présentation", () => {
    const d = trouve({ presentation: new Date("2026-09-15") }, "CPC_413_AL2_DEMANDEUR");
    expect(formatEcheance(d)).toBe("2026-09-05");
  });

  it("porte la conséquence « demande indécidable », pas un simple retard", () => {
    // C'est la distinction qui compte : rater l'art. 26 retarde, rater le 413 al. 2
    // fait perdre l'audience. Les aplatir serait faux sur l'essentiel.
    const d = trouve({ presentation: new Date("2026-09-15") }, "CPC_413_AL2_DEMANDEUR");
    expect(d.consequence).toBe("demande_indecidable");
    expect(trouve({ instruction: new Date("2026-09-15") }, "REGL_26_INSTRUCTION").consequence)
      .toBe("manquement_procedural");
  });

  it("le défendeur a cinq jours, pas dix", () => {
    const d = trouve({ presentation: new Date("2026-09-15") }, "CPC_413_AL2_DEFENDEUR");
    expect(formatEcheance(d)).toBe("2026-09-10");
  });

  it("passe devant un délai plus proche mais moins grave", () => {
    // Un délai dans 18 jours qui coûte l'audience prime sur un manquement dans 3 jours.
    const delais = calculerDelaisFamille(
      { presentation: new Date("2026-09-15"), instruction: new Date("2026-08-31") },
      AUJ,
    );
    expect(delaiLePlusUrgent(delais)!.code).toBe("CPC_413_AL2_DEMANDEUR");
  });
});

describe("les délais du règlement", () => {
  it("art. 26 : dix jours avant l'instruction", () => {
    expect(formatEcheance(trouve({ instruction: new Date("2026-10-01") }, "REGL_26_INSTRUCTION")))
      .toBe("2026-09-21");
  });

  it("art. 27 : 180 jours de la signification", () => {
    expect(
      formatEcheance(trouve({ signification: new Date("2026-01-15") }, "REGL_27_SIGNIFICATION")),
    ).toBe("2026-07-14");
  });

  it("art. 27 : 30 jours de la communication, en cas de contestation", () => {
    expect(
      formatEcheance(
        trouve({ communicationPatrimoine: new Date("2026-08-01") }, "REGL_27_CONTESTATION"),
      ),
    ).toBe("2026-08-31");
  });

  it("art. 413 al. 1 : l'état des biens est dû AU protocole, pas avant", () => {
    expect(formatEcheance(trouve({ protocole: new Date("2026-09-09") }, "CPC_413_AL1_PROTOCOLE")))
      .toBe("2026-09-09");
  });
});

describe("sans date source, rien n'est inventé", () => {
  it("un délai non calculable le dit, et nomme la date qui manque", () => {
    // Une échéance inventée sur un délai qui rend une demande indécidable serait pire
    // que pas d'échéance du tout.
    const d = trouve({}, "CPC_413_AL2_DEMANDEUR");
    expect(d.etat).toBe("date_source_manquante");
    expect(d.echeance).toBeNull();
    expect(d.joursRestants).toBeNull();
    expect(d.dateSourceManquante).toBe("presentation");
  });

  it("un dossier vide rend les six délais, tous non calculables", () => {
    const tous = calculerDelaisFamille({}, AUJ);
    expect(tous).toHaveLength(6);
    expect(tous.every((d) => d.etat === "date_source_manquante")).toBe(true);
  });

  it("les dates manquantes sont listées une fois, sans doublon", () => {
    // Deux règles partent de la présentation : elle ne doit apparaître qu'une fois.
    const manquantes = datesManquantes({});
    expect(manquantes).toContain("presentation");
    expect(manquantes.filter((m) => m === "presentation")).toHaveLength(1);
    expect(manquantes).toHaveLength(5);
  });

  it("une date saisie disparaît de la liste des manquantes", () => {
    expect(datesManquantes({ presentation: new Date("2026-09-15") })).not.toContain("presentation");
  });
});

describe("échu et à venir", () => {
  it("un délai passé est marqué échu, avec un compte négatif", () => {
    const d = trouve({ presentation: new Date("2026-08-01") }, "CPC_413_AL2_DEMANDEUR");
    expect(d.etat).toBe("echu");
    expect(d.joursRestants).toBeLessThan(0);
  });

  it("le jour même de l'échéance n'est pas encore échu", () => {
    // « Au moins 10 jours avant » : le dixième jour compte encore.
    const d = trouve({ presentation: new Date("2026-08-28") }, "CPC_413_AL2_DEMANDEUR");
    expect(formatEcheance(d)).toBe("2026-08-18");
    expect(d.etat).toBe("a_venir");
    expect(d.joursRestants).toBe(0);
  });

  it("un délai échu n'est jamais proposé comme le plus urgent", () => {
    const delais = calculerDelaisFamille({ presentation: new Date("2026-01-01") }, AUJ);
    expect(delaiLePlusUrgent(delais)).toBeNull();
  });
});

describe("jours calendaires, jamais des instants", () => {
  it("l'heure de la date source ne déplace pas l'échéance", () => {
    // Une signification enregistrée à 23 h ne doit pas décaler le 180e jour.
    const matin = trouve({ signification: new Date("2026-01-15T09:00:00Z") }, "REGL_27_SIGNIFICATION");
    const soir = trouve({ signification: new Date("2026-01-16T02:00:00Z") }, "REGL_27_SIGNIFICATION");
    expect(formatEcheance(matin)).toBe("2026-07-14");
    // 2026-01-16 02:00 UTC = le 15 en soirée à Montréal, donc le même jour vécu.
    expect(formatEcheance(soir)).toBe("2026-07-14");
  });

  it("l'heure du jour courant ne change pas le compte de jours", () => {
    const dates = { presentation: new Date("2026-09-15") };
    const a = trouve(dates, "CPC_413_AL2_DEMANDEUR", new Date("2026-08-18T13:00:00Z"));
    const b = trouve(dates, "CPC_413_AL2_DEMANDEUR", new Date("2026-08-19T01:00:00Z"));
    expect(a.joursRestants).toBe(b.joursRestants);
  });
});

describe("chaque délai porte sa source", () => {
  it("tous citent un article vérifiable", () => {
    for (const d of calculerDelaisFamille({}, AUJ)) {
      expect(d.reference, d.code).toMatch(/C\.p\.c\.|Règl\./);
      expect(d.libelle.length, d.code).toBeGreaterThan(30);
      expect(d.libelle, d.code).not.toMatch(/CPC_|REGL_/);
    }
  });
});
