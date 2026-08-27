import { describe, it, expect, afterEach } from "vitest";
import { apercuDesignFerme } from "@/lib/apercu-design";

/**
 * Les contrôles visuels `/ds-preview` étaient servis publiquement en
 * production : sept routes sans authentification, rendant des composants réels
 * sur des données inventées.
 *
 * La règle doit fermer quand elle ne sait pas. Un environnement inconnu qui
 * laisserait la porte ouverte est exactement le défaut qu'on corrige.
 */
const initial = { vercel: process.env.VERCEL_ENV, node: process.env.NODE_ENV };

function poser(vercel: string | undefined, node: string) {
  if (vercel === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercel;
  // `process.env.NODE_ENV` n'accepte pas `defineProperty` sous Node : on
  // l'écrit comme n'importe quelle variable, en contournant le type littéral.
  (process.env as Record<string, string | undefined>).NODE_ENV = node;
}

afterEach(() => poser(initial.vercel, initial.node ?? "test"));

describe("porte des contrôles visuels", () => {
  it("ferme sur la production Vercel", () => {
    poser("production", "production");
    expect(apercuDesignFerme()).toBe(true);
  });

  it("reste ouverte sur un déploiement de préversion", () => {
    // C'est là qu'on juge un écran depuis un téléphone avant de le pousser.
    poser("preview", "production");
    expect(apercuDesignFerme()).toBe(false);
  });

  it("reste ouverte en développement", () => {
    poser("development", "development");
    expect(apercuDesignFerme()).toBe(false);
    poser(undefined, "development");
    expect(apercuDesignFerme()).toBe(false);
  });

  it("ferme hors Vercel dès qu'il s'agit d'un build de production", () => {
    poser(undefined, "production");
    expect(apercuDesignFerme()).toBe(true);
  });
});
