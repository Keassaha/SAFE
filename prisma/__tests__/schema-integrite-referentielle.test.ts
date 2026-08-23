import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Garde-fou de schéma : aucune relation `onDelete: SetNull` ne doit porter sur
 * une colonne NON NULL.
 *
 * Postgres refuse d'écrire NULL dans une colonne qui l'interdit. La suppression
 * de la ligne référencée échoue alors, et l'erreur ne se voit qu'au moment où
 * quelqu'un essaie — c'est-à-dire au pire moment.
 *
 * Deux relations étaient dans ce cas (`ConflictCheck.checkedById`,
 * `TrustComplianceReport.generatedById`). Conséquence : un avocat ayant fait une
 * vérification de conflits ne pouvait plus être supprimé, et un cabinet ne
 * pouvait plus être purgé. `prisma validate` l'annonçait en AVERTISSEMENT, ce
 * qui se lit comme du bruit et se range comme tel.
 *
 * Ce test le dit en ROUGE, une fois pour toutes.
 */

const SCHEMA = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");

/** Relations `SetNull` dont la colonne locale est obligatoire. */
function relationsSetNullSurColonneObligatoire(): string[] {
  const fautives: string[] = [];
  let modele: string | null = null;
  const obligatoire = new Map<string, boolean>();

  for (const ligne of SCHEMA.split("\n")) {
    const m = /^model (\w+)/.exec(ligne);
    if (m) {
      modele = m[1];
      obligatoire.clear();
      continue;
    }
    const champ = /^\s+(\w+)\s+(\w+)(\?)?/.exec(ligne);
    if (champ && modele) obligatoire.set(champ[1], champ[3] !== "?");

    const rel = /@relation\([^)]*fields:\s*\[(\w+)\][^)]*onDelete:\s*SetNull/.exec(ligne);
    if (rel && modele && obligatoire.get(rel[1])) {
      fautives.push(`${modele}.${rel[1]}`);
    }
  }
  return fautives;
}

describe("intégrité référentielle du schéma", () => {
  it("aucune relation SetNull ne porte sur une colonne NON NULL", () => {
    const fautives = relationsSetNullSurColonneObligatoire();
    expect(
      fautives,
      fautives.length
        ? `Ces relations rendent la suppression de la ligne référencée IMPOSSIBLE : ` +
          `${fautives.join(", ")}. Rendez la colonne nullable, ou changez ` +
          `\`onDelete\` pour Cascade ou Restrict selon ce que la donnée exige.`
        : undefined,
    ).toEqual([]);
  });

  it("le détecteur reconnaît bien le motif fautif", () => {
    // Sans ce contrôle, une expression régulière cassée rendrait le test
    // vert pour de mauvaises raisons, ce qui est pire que pas de test.
    const faux = `model Faux {
  auteurId String
  auteur   User @relation(fields: [auteurId], references: [id], onDelete: SetNull)
}`;
    const detecte = /@relation\([^)]*fields:\s*\[(\w+)\][^)]*onDelete:\s*SetNull/.test(faux);
    expect(detecte).toBe(true);
  });
});
