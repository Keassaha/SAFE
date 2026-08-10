import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contrat de poids du pipeline d'import.
 *
 * `lib/import/pipeline.ts` est importé par `components/import/SafeImportWizard.tsx`,
 * qui est un composant client. Tout ce que le pipeline importe statiquement part
 * donc dans le navigateur.
 *
 * Le parseur de relevés PDF s'appuie sur le SDK Anthropic et sur une clé serveur :
 * il ne peut pas s'exécuter côté navigateur, et les PDF passent déjà par l'action
 * serveur `analyzeStatementPdf`. Un import statique le faisait pourtant entrer dans
 * le chemin critique de /import, pour 29 kB de code mort.
 */
describe("contrat de poids du pipeline d'import", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/import/pipeline.ts"), "utf8");

  it("n'importe jamais le parseur PDF statiquement", () => {
    expect(source).not.toMatch(/^import\s[^\n]*from\s+["']\.\/parsers\/pdf["']/m);
    expect(source).toMatch(/await import\(["']\.\/parsers\/pdf["']\)/);
  });

  it("garde le parseur PDF comme seule dépendance différée", () => {
    // Les parseurs CSV et Excel restent statiques : ils s'exécutent réellement
    // dans le navigateur et leur report ne ferait que retarder la première analyse.
    expect(source).toMatch(/^import \{ parseExcelBuffer \} from "\.\/parsers\/excel";/m);
    expect(source).toMatch(/^import \{ parseCsvText \} from "\.\/parsers\/csv";/m);
  });

  it("ne laisse aucun SDK serveur atteignable statiquement depuis le pipeline", () => {
    const interdits = ["@anthropic-ai/sdk", "@prisma/client", "@react-pdf/renderer"];
    for (const paquet of interdits) {
      expect(source).not.toContain(paquet);
    }
  });
});
