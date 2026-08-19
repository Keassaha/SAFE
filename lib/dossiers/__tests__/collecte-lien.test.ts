/**
 * Le lien de collecte : qui entre, et qui n'entre pas.
 *
 * Spec : docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
 *
 * Ce que ces tests verrouillent :
 *   1. un lien révoqué ou expiré n'ouvre rien ;
 *   2. le message de refus ne révèle jamais si un dossier existe ;
 *   3. les contrôles de fichier s'expliquent au client, sans jargon.
 */

import { describe, it, expect } from "vitest";
import {
  genererCollecteToken,
  calculerExpiration,
  verifierLien,
  cleRefus,
  verifierFichier,
  TAILLE_MAX_OCTETS,
} from "../collecte-lien";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";

const MESSAGES_FR = fr.collecte as Record<string, string>;
const MESSAGES_EN = en.collecte as Record<string, string>;

const MAINTENANT = new Date("2026-08-18T12:00:00Z");
const dans = (jours: number) =>
  new Date(MAINTENANT.getTime() + jours * 86_400_000);

describe("le jeton", () => {
  it("est assez long pour ne pas se deviner", () => {
    const t = genererCollecteToken();
    expect(t.length).toBeGreaterThanOrEqual(40);
  });

  it("est différent à chaque fois", () => {
    const vus = new Set(Array.from({ length: 50 }, () => genererCollecteToken()));
    expect(vus.size).toBe(50);
  });

  it("ne contient rien à échapper dans une URL", () => {
    // Le client le reçoit par courriel ou par message : un caractère à encoder finit
    // toujours par casser chez quelqu'un.
    for (let i = 0; i < 30; i++) {
      expect(genererCollecteToken()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});

describe("qui entre", () => {
  it("un lien valide et non expiré ouvre", () => {
    expect(
      verifierLien({ collecteToken: "abc", collecteTokenExpiresAt: dans(10) }, MAINTENANT),
    ).toEqual({ valide: true });
  });

  it("un lien expiré n'ouvre pas", () => {
    const v = verifierLien(
      { collecteToken: "abc", collecteTokenExpiresAt: dans(-1) },
      MAINTENANT,
    );
    expect(v).toEqual({ valide: false, motif: "expire" });
  });

  it("le jour même de l'expiration, le lien est déjà fermé", () => {
    const v = verifierLien(
      { collecteToken: "abc", collecteTokenExpiresAt: MAINTENANT },
      MAINTENANT,
    );
    expect(v.valide).toBe(false);
  });

  it("un jeton retiré vaut révocation, pas expiration", () => {
    // Remettre le jeton à NULL est le geste de révocation du cabinet. Il doit se lire
    // comme une décision, pas comme le passage du temps.
    const v = verifierLien({ collecteToken: null, collecteTokenExpiresAt: dans(10) }, MAINTENANT);
    expect(v).toEqual({ valide: false, motif: "revoque" });
  });

  it("un dossier inexistant n'ouvre pas", () => {
    expect(verifierLien(null, MAINTENANT)).toEqual({ valide: false, motif: "inexistant" });
  });
});

describe("ce que le visiteur lit", () => {
  it("un lien inexistant et un lien révoqué donnent la MÊME clé", () => {
    // Dire « dossier introuvable » confirmerait qu'un autre jeton pourrait exister.
    expect(cleRefus("inexistant")).toBe(cleRefus("revoque"));
  });

  // Les phrases vivent désormais dans les fichiers de messages, et le client peut
  // être anglophone. Les garde-fous se vérifient donc dans les DEUX langues : une
  // traduction est exactement l'endroit où un « token » revient par distraction.
  it.each([
    ["fr", MESSAGES_FR, /avocat/],
    ["en", MESSAGES_EN, /lawyer/],
  ] as const)("aucun refus ne parle en code, en %s", (_langue, messages, mentionAvocat) => {
    for (const m of ["inexistant", "expire", "revoque"] as const) {
      const texte = messages[cleRefus(m)];
      expect(texte, `clé ${cleRefus(m)} absente`).toBeTruthy();
      expect(texte).not.toMatch(/token|jeton|dossier|matter|404|null/i);
      expect(texte).toMatch(mentionAvocat);
    }
  });

  it("les deux langues disent la même chose du même nombre de clés", () => {
    expect(Object.keys(MESSAGES_EN).sort()).toEqual(Object.keys(MESSAGES_FR).sort());
  });
});

describe("les fichiers acceptés", () => {
  it.each(["application/pdf", "image/jpeg", "image/png", "image/heic"])(
    "%s passe",
    (type) => {
      expect(verifierFichier({ type, size: 1000 }).ok).toBe(true);
    },
  );

  it.each(["application/zip", "text/html", "application/x-msdownload", ""])(
    "%s est refusé",
    (type) => {
      const v = verifierFichier({ type, size: 1000 });
      expect(v.ok).toBe(false);
      if (!v.ok) expect(MESSAGES_FR[v.cle]).toMatch(/PDF|photo/);
    },
  );

  it("un fichier vide est refusé", () => {
    expect(verifierFichier({ type: "application/pdf", size: 0 }).ok).toBe(false);
  });

  it("un fichier trop lourd est refusé, avec la marche à suivre", () => {
    const v = verifierFichier({ type: "application/pdf", size: TAILLE_MAX_OCTETS + 1 });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(MESSAGES_FR[v.cle]).toMatch(/plusieurs parties/);
  });

  it("la limite exacte passe encore", () => {
    expect(verifierFichier({ type: "application/pdf", size: TAILLE_MAX_OCTETS }).ok).toBe(true);
  });

  it("aucun message de refus ne parle en octets ni en MIME", () => {
    // Le client n'a pas à savoir ce qu'est un type MIME.
    for (const f of [
      { type: "application/zip", size: 10 },
      { type: "application/pdf", size: TAILLE_MAX_OCTETS + 1 },
    ]) {
      const v = verifierFichier(f);
      if (!v.ok) {
        for (const messages of [MESSAGES_FR, MESSAGES_EN]) {
          expect(messages[v.cle]).not.toMatch(/MIME|octet|bytes|application\//i);
        }
      }
    }
  });
});

describe("expiration", () => {
  it("par défaut, trente jours", () => {
    const e = calculerExpiration(MAINTENANT);
    expect(Math.round((e.getTime() - MAINTENANT.getTime()) / 86_400_000)).toBe(30);
  });

  it("la durée est réglable", () => {
    const e = calculerExpiration(MAINTENANT, 7);
    expect(Math.round((e.getTime() - MAINTENANT.getTime()) / 86_400_000)).toBe(7);
  });
});
