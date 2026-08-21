/**
 * Ces tests vérifient la FIDÉLITÉ AU FORMULAIRE, ligne par ligne, faute de cas publié.
 *
 * Aucun exemple chiffré des quatre sections de garde n'a été trouvé publié. Le
 * formulaire étant sa propre spécification, chaque test cite le numéro de ligne qu'il
 * contrôle, et s'y ajoutent des propriétés de cohérence qu'aucune transcription juste
 * ne peut violer.
 */
import { describe, it, expect } from "vitest";
import { calculerPension, type Entree, type Ligne } from "../calcul";
import { DEDUCTION_DE_BASE } from "../table-2026-01-01";

const revenus = (revenuAnnuel: number) => ({
  revenuAnnuel,
  cotisationsSyndicales: 0,
  cotisationsProfessionnelles: 0,
});

const base = (o: Partial<Entree> = {}): Entree => ({
  pere: revenus(80_000),
  mere: revenus(40_000),
  nombreEnfants: 2,
  frais: { garde: 0, etudesPostsecondaires: 0, particuliers: 0 },
  garde: { situation: "exclusive", parentNonGardien: "pere" },
  ...o,
});

const ligne = (ls: Ligne[], n: string) => ls.find((l) => l.numero === n);
const paire = (ls: Ligne[], n: string) => ligne(ls, n)!.valeur as { pere: number; mere: number };
const seul = (ls: Ligne[], n: string) => ligne(ls, n)!.valeur as number;

describe("partie 3 — le revenu disponible", () => {
  const r = calculerPension(base());

  it("ligne 305 retranche la déduction de base de chaque revenu", () => {
    expect(paire(r.lignes, "305")).toEqual({
      pere: 80_000 - DEDUCTION_DE_BASE,
      mere: 40_000 - DEDUCTION_DE_BASE,
    });
  });

  it("ligne 305 inscrit zéro plutôt qu'un revenu négatif", () => {
    const pauvre = calculerPension(base({ mere: revenus(5_000) }));
    expect(paire(pauvre.lignes, "305").mere).toBe(0);
  });

  it("ligne 307 répartit en pourcentage, et les deux parts font 100", () => {
    const f = paire(r.lignes, "307");
    expect(f.pere + f.mere).toBeCloseTo(100, 6);
    expect(f.pere).toBeGreaterThan(f.mere);
  });
});

describe("partie 4 — la contribution et les frais", () => {
  it("ligne 402 répartit la contribution selon le facteur de revenu", () => {
    const r = calculerPension(base());
    const l401 = seul(r.lignes, "401");
    const l402 = paire(r.lignes, "402");
    expect(l402.pere + l402.mere).toBeCloseTo(l401, 1);
  });

  it("ligne 406 répute nuls les frais négatifs, comme l'exige l'art. 9, 1°", () => {
    const r = calculerPension(
      base({ frais: { garde: -500, etudesPostsecondaires: 1_200, particuliers: 0 } }),
    );
    expect(seul(r.lignes, "406")).toBe(1_200);
  });
});

describe("section 1 — garde exclusive", () => {
  const r = calculerPension(base({ frais: { garde: 3_000, etudesPostsecondaires: 0, particuliers: 0 } }));

  it("ligne 511 additionne la contribution de base et les frais", () => {
    expect(seul(r.lignes, "511")).toBe(seul(r.lignes, "401") + seul(r.lignes, "406"));
  });

  it("ligne 512 applique le facteur de revenu du parent non gardien", () => {
    // Le facteur EXACT, pas celui affiché à la ligne 307. Voir le bloc « arrondis ».
    const dispPere = paire(r.lignes, "305").pere;
    const f = dispPere / seul(r.lignes, "306");
    expect(seul(r.lignes, "512")).toBeCloseTo(seul(r.lignes, "511") * f, 1);
  });

  it("c'est bien le parent non gardien qui paie", () => {
    expect(r.debiteur).toBe("pere");
    expect(r.pensionAnnuelle).toBeGreaterThan(0);
  });
});

describe("section 1.1 — droit de visite et de sortie prolongé", () => {
  it("ligne 516 compense l'excédent au-delà de 20 % du temps", () => {
    const jours = Math.round(365 * 0.3); // 30 % du temps
    const r = calculerPension(
      base({ garde: { situation: "visite_prolongee", parentNonGardien: "pere", joursNonGardien: jours } }),
    );
    // Le pourcentage EXACT, pas celui affiché à la ligne 515.
    const pct = (jours / 365) * 100;
    const attendu = ((pct - 20) / 100) * seul(r.lignes, "401");
    expect(seul(r.lignes, "516")).toBeCloseTo(attendu, 1);
  });

  it("plus le parent garde, moins il paie", () => {
    const pension = (part: number) =>
      calculerPension(
        base({
          garde: {
            situation: "visite_prolongee",
            parentNonGardien: "pere",
            joursNonGardien: Math.round(365 * part),
          },
        }),
      ).pensionAnnuelle!;
    expect(pension(0.35)).toBeLessThan(pension(0.25));
  });

  it("à 20 % pile, la compensation est nulle et le résultat rejoint la garde exclusive", () => {
    const jours = Math.round(365 * 0.2);
    const prolongee = calculerPension(
      base({ garde: { situation: "visite_prolongee", parentNonGardien: "pere", joursNonGardien: jours } }),
    );
    const exclusive = calculerPension(base());
    expect(prolongee.pensionAnnuelle).toBeCloseTo(exclusive.pensionAnnuelle!, 0);
  });
});

describe("section 2 — garde exclusive attribuée à chacun", () => {
  const r = calculerPension(
    base({
      nombreEnfants: 2,
      garde: { situation: "exclusive_chacun", enfantsChezPere: 1, enfantsChezMere: 1 },
    }),
  );

  it("ligne 523 divise la contribution par le nombre d'enfants", () => {
    expect(seul(r.lignes, "523")).toBeCloseTo(seul(r.lignes, "401") / 2, 1);
  });

  it("le parent au revenu le plus élevé paie, l'autre ne doit rien", () => {
    const l526 = paire(r.lignes, "526");
    expect(l526.pere).toBeGreaterThan(0);
    expect(l526.mere).toBe(0);
    expect(r.debiteur).toBe("pere");
  });

  it("à revenus égaux et garde égale, personne ne doit rien", () => {
    const egal = calculerPension(
      base({
        pere: revenus(60_000),
        mere: revenus(60_000),
        garde: { situation: "exclusive_chacun", enfantsChezPere: 1, enfantsChezMere: 1 },
      }),
    );
    expect(egal.pensionAnnuelle).toBe(0);
    expect(egal.debiteur).toBeNull();
  });
});

describe("section 3 — garde partagée", () => {
  it("à revenus égaux et temps égal, la pension est nulle", () => {
    const r = calculerPension(
      base({
        pere: revenus(60_000),
        mere: revenus(60_000),
        garde: { situation: "partagee", joursPere: 182.5, joursMere: 182.5 },
      }),
    );
    expect(r.pensionAnnuelle).toBe(0);
    expect(r.debiteur).toBeNull();
  });

  it("à temps égal, celui qui gagne plus paie", () => {
    const r = calculerPension(
      base({ garde: { situation: "partagee", joursPere: 182.5, joursMere: 182.5 } }),
    );
    expect(r.debiteur).toBe("pere");
  });

  it("le calcul est symétrique : inverser les parents inverse le débiteur", () => {
    const a = calculerPension(
      base({ garde: { situation: "partagee", joursPere: 200, joursMere: 165 } }),
    );
    const b = calculerPension(
      base({
        pere: revenus(40_000),
        mere: revenus(80_000),
        garde: { situation: "partagee", joursPere: 165, joursMere: 200 },
      }),
    );
    expect(a.debiteur).toBe("pere");
    expect(b.debiteur).toBe("mere");
    expect(a.pensionAnnuelle).toBeCloseTo(b.pensionAnnuelle!, 2);
  });
});

describe("partie 6 — la capacité de payer", () => {
  it("ligne 603 retient le moindre de la pension et de la moitié du revenu disponible", () => {
    // Frais énormes, pour forcer le plafond.
    const r = calculerPension(
      base({
        pere: revenus(30_000),
        mere: revenus(28_000),
        frais: { garde: 60_000, etudesPostsecondaires: 0, particuliers: 0 },
      }),
    );
    const l601 = seul(r.lignes, "601");
    const l602 = seul(r.lignes, "602");
    expect(r.pensionAnnuelle).toBe(Math.min(l601, l602));
    expect(r.reserves.map((x) => x.code)).toContain("plafond_capacite_applique");
  });
});

describe("ce que le calcul refuse ou signale", () => {
  it("refuse la garde mixte plutôt que de la deviner", () => {
    const r = calculerPension(base({ garde: { situation: "mixte" } }));
    expect(r.pensionAnnuelle).toBeNull();
    expect(r.reserves[0].code).toBe("garde_mixte");
    expect(r.reserves[0].message).toMatch(/formulaire officiel/);
  });

  it("signale que le pourcentage n'est qu'indicatif au-delà de 200 000 $", () => {
    const r = calculerPension(base({ pere: revenus(200_000), mere: revenus(100_000) }));
    expect(r.reserves.map((x) => x.code)).toContain("revenu_au_dela_du_plafond");
  });

  it("rappelle toujours que les lignes d'ajustement ne sont pas appliquées", () => {
    const r = calculerPension(base());
    const aj = r.reserves.find((x) => x.code === "ajustements_motives");
    expect(aj?.reference).toMatch(/notes 2 et 3/);
  });

  it("chaque réserve porte sa date et sa voie de sortie", () => {
    const r = calculerPension(base());
    for (const res of r.reserves) {
      expect(res.verifieLe).toBe("2026-08-19");
      expect(res.leveePar.length).toBeGreaterThan(10);
    }
  });

  it("chaque ligne rendue porte le numéro du formulaire officiel", () => {
    const r = calculerPension(base());
    for (const l of r.lignes) expect(l.numero).toMatch(/^[3-6][0-9]{2}(\.[0-9])?$/);
  });
});

describe("les arrondis : ce que le formulaire AFFICHE et ce que le calcul UTILISE", () => {
  /**
   * Le formulaire fait écrire des pourcentages sur les lignes 307, 515 et 530. Une
   * personne les inscrit arrondis, puis multiplie par ce qu'elle a écrit. Le calcul,
   * lui, garde la valeur exacte et n'arrondit que le montant final.
   *
   * Les deux premiers tests de ce fichier avaient d'abord été écrits avec le
   * pourcentage AFFICHÉ, et ils ont échoué. C'est le moteur qui avait raison.
   *
   * L'écart est petit ici et il ne l'est pas toujours : un exemple publié du patrimoine
   * familial arrondit une proportion à 66 % et se trompe de 333 $ sur un partage de
   * 42 000 $. La règle est donc la même dans les deux outils : jamais d'arrondi sur un
   * facteur intermédiaire.
   */
  it("arrondir le facteur de la ligne 307 fait dériver le montant", () => {
    const r = calculerPension(base());
    const exact = paire(r.lignes, "305").pere / seul(r.lignes, "306");
    const affiche = paire(r.lignes, "307").pere / 100;
    const l511 = seul(r.lignes, "511");

    const avecExact = l511 * exact;
    const avecAffiche = l511 * affiche;

    expect(seul(r.lignes, "512")).toBeCloseTo(avecExact, 2);
    expect(Math.abs(avecAffiche - avecExact)).toBeGreaterThan(0);
  });

  it("le montant final, lui, est bien arrondi au cent", () => {
    const r = calculerPension(base());
    expect(r.pensionAnnuelle).toBe(Math.round(r.pensionAnnuelle! * 100) / 100);
    expect(r.pensionMensuelle).toBe(Math.round(r.pensionMensuelle! * 100) / 100);
  });
});
