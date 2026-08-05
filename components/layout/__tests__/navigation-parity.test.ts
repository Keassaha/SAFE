import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Parité des deux navigations.
 *
 * ── Pourquoi ce test existe ──────────────────────────────────────────────────
 *
 * La navigation est définie DEUX FOIS : `Header.tsx` pour l'écran d'ordinateur,
 * `SidebarNav.tsx` pour le tiroir mobile. Rien dans le typage ne les relie, et elles
 * avaient déjà divergé sans que personne s'en aperçoive :
 *
 *   - l'entrée « Inspection » a été ajoutée au tiroir mobile seul, et est restée
 *     invisible au bureau, là où elle comptait ;
 *   - « Aujourd'hui », l'accueil de l'assistante, n'existait QUE dans le tiroir ;
 *   - « Conformité », le tableau de bord d'état du cabinet, aussi. Il était donc
 *     inatteignable par le menu depuis un ordinateur.
 *
 * Aucun test ne le voyait, aucun type ne le voyait, et l'application se construisait
 * sans se plaindre.
 *
 * ── Pourquoi il lit le SOURCE plutôt qu'importer les modules ─────────────────
 *
 * Les deux fichiers sont des composants clients : ils importent React, next-intl et
 * lucide-react, et leurs listes ne sont pas exportées. Les importer dans un test
 * demanderait un environnement de rendu et des mocks pour comparer deux tableaux de
 * chaînes.
 *
 * Lire le source est plus grossier, et c'est assumé : ce test ne vérifie pas un
 * comportement, il vérifie qu'une même liste n'a pas été écrite deux fois de deux
 * façons différentes. Le jour où les deux navigations partageront une source unique,
 * ce test devient inutile et doit être supprimé — ce serait la bonne nouvelle.
 */

const RACINE = join(__dirname, "..");

function destinations(fichier: string): Set<string> {
  const source = readFileSync(join(RACINE, fichier), "utf8");
  const trouvees = source.match(/href: routes\.[a-zA-Z]+/g) ?? [];
  return new Set(trouvees.map((m) => m.replace("href: routes.", "")));
}

/**
 * Destinations propres à la console SAFE Inc.
 *
 * La console est un espace interne (pilotage de SAFE Inc. lui-même), pas un espace
 * cabinet. Elle n'a jamais eu vocation à figurer dans le tiroir mobile, et l'exiger
 * ferait échouer ce test pour une divergence qui n'en est pas une.
 */
const HORS_PERIMETRE = new Set(["console"]);

function filtrer(s: Set<string>): Set<string> {
  return new Set([...s].filter((d) => !HORS_PERIMETRE.has(d) && !d.startsWith("console")));
}

describe("Parité des deux navigations", () => {
  const header = filtrer(destinations("Header.tsx"));
  const tiroir = filtrer(destinations("SidebarNav.tsx"));

  it("les deux menus mènent aux mêmes endroits", () => {
    const seulementTiroir = [...tiroir].filter((d) => !header.has(d)).sort();
    const seulementHeader = [...header].filter((d) => !tiroir.has(d)).sort();

    expect(
      { seulementTiroir, seulementHeader },
      "Une destination existe dans un menu et pas dans l'autre. " +
        "Un utilisateur ne pourra pas l'atteindre depuis l'un des deux appareils. " +
        "Ajoutez-la des deux côtés, ou retirez-la des deux.",
    ).toEqual({ seulementTiroir: [], seulementHeader: [] });
  });

  it("chaque menu mène quelque part", () => {
    // Un garde-fou contre le test lui-même : si l'expression de recherche cessait de
    // correspondre au code, les deux ensembles seraient vides et le test passerait en
    // ne vérifiant plus rien.
    expect(header.size).toBeGreaterThan(5);
    expect(tiroir.size).toBeGreaterThan(5);
  });

  it("les destinations d'inspection sont dans les deux", () => {
    // Ce sont celles qui ont divergé. On les épingle nommément.
    for (const d of ["inspection", "conformite", "comptes"]) {
      expect(header.has(d), `${d} absent du menu du bureau`).toBe(true);
      expect(tiroir.has(d), `${d} absent du tiroir mobile`).toBe(true);
    }
  });
});
