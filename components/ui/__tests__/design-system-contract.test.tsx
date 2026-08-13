import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { depth, interfaceTokens } from "@/lib/ds/tokens";
import { tokens as compatibilityTokens } from "@/lib/design-tokens";

describe("contrat du design system SAFE", () => {
  it("conserve une seule source de jetons", () => {
    expect(compatibilityTokens).toBe(interfaceTokens);
    expect(interfaceTokens.motion.duration.normal).toBe("180ms");
    expect(interfaceTokens.radius.DEFAULT).toBe("6px");
  });

  it("garde l'icône et le libellé sur une seule ligne", () => {
    // La normalisation de Tailwind pose `svg { display: block }`. Envelopper
    // tous les enfants dans un `<span>` unique fait donc tomber l'icône et le
    // libellé sur deux lignes, et neutralise `items-center` et `gap-2` puisqu'il
    // ne reste qu'un enfant de flexbox. Les enfants restent des frères directs.
    const avecIcone = renderToStaticMarkup(
      <Button>
        <svg data-icone />
        Facturer
      </Button>,
    );
    expect(avecIcone).not.toMatch(/<span><svg/);
    // L'icône et le libellé sont des frères directs du bouton, sans enveloppe.
    expect(avecIcone).toMatch(/<\/svg>Facturer<\/button>/);
    expect(avecIcone).toContain("items-center");
    expect(avecIcone).toContain("gap-2");
  });

  it("expose le chargement et la raison d'une indisponibilité", () => {
    const loading = renderToStaticMarkup(<Button loading loadingLabel="Enregistrement" />);
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain('data-state="loading"');
    expect(loading).toContain("Enregistrement");

    const disabled = renderToStaticMarkup(
      <Button disabled disabledReason="Sélectionnez un dossier">
        Continuer
      </Button>,
    );
    expect(disabled).toContain("Sélectionnez un dossier");
    expect(disabled).toContain("aria-describedby=");
  });

  it("relie le libellé, le message et l'état invalide d'un champ", () => {
    const field = renderToStaticMarkup(<Input id="client" label="Client" error="Champ requis" />);
    expect(field).toContain('for="client"');
    expect(field).toContain('aria-invalid="true"');
    expect(field).toContain('aria-describedby="client-message"');
    expect(field).toContain('id="client-message"');
  });

  /**
   * Le rayon dit le rôle, et un seul rôle par valeur.
   *
   * La carte valait 8 px, comme un panneau posé dans le flux. Elle est devenue
   * une FEUILLE : une surface qui porte un contenu et se détache d'un canvas
   * gris franc, donc 14 px et une ombre permanente (déc. CEO 2026-08-11).
   * Le contrat suit la décision au lieu de la bloquer, mais il continue
   * d'interdire l'arbitraire : pas de rayon d'élévation sur une carte, et la
   * pastille reste pleine.
   */
  it("réserve chaque rayon à un rôle, et un seul", () => {
    const card = renderToStaticMarkup(<Card>Contenu</Card>);
    expect(card).toContain("rounded-[14px]");
    expect(card).not.toContain("rounded-2xl");
    expect(card).toContain("shadow-[");

    const badge = renderToStaticMarkup(<StatusBadge label="Information" variant="info" />);
    expect(badge).toContain("rounded-full");
    expect(badge).toContain("Information");
  });
});

/**
 * Système de profondeur, trois plans.
 * Doctrine : docs/design/SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md §4 et §6.
 */
describe("contrat du système de profondeur", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  it("ne connaît que trois niveaux de verre (PS-006c)", () => {
    expect(Object.keys(depth)).toEqual(["subtle", "elevated", "focus", "scrim", "atmosphere"]);
    expect(css).toContain("--glass-1-blur");
    expect(css).toContain("--glass-2-blur");
    expect(css).toContain("--glass-3-blur");
    expect(css).not.toContain("--glass-4-blur");
  });

  it("garde le niveau focus plus opaque que les autres", () => {
    const alpha = (surface: string) => Number(surface.split(",").pop()!.replace(")", "").trim());
    expect(alpha(depth.subtle.surface)).toBeLessThan(alpha(depth.elevated.surface));
    expect(alpha(depth.elevated.surface)).toBeLessThan(alpha(depth.focus.surface));
    expect(alpha(depth.focus.surface)).toBeGreaterThanOrEqual(0.95);
  });

  it("fournit un repli opaque à chaque niveau (PS-006d)", () => {
    for (const level of [depth.subtle, depth.elevated, depth.focus]) {
      expect(level.opaque).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
    expect(css).toContain("@supports not (backdrop-filter: blur(2px))");
    expect(css).toContain("@media (prefers-reduced-transparency: reduce)");
  });

  it("porte le flou dans les trois classes de surface, jamais en littéral", () => {
    for (const cls of [".safe-glass-subtle", ".safe-glass-elevated", ".safe-glass-focus", ".safe-scrim"]) {
      expect(css).toContain(cls);
    }
    // Un `backdrop-filter` par niveau, toujours via la variable du niveau.
    const declarations = css.match(/(?<!-webkit-)backdrop-filter:\s*[^;]+;/g) ?? [];
    expect(declarations.filter((d) => d.includes("var(--glass-")).length).toBe(4);
  });

  it("ne redéclare jamais la variante WebKit à la main", () => {
    // Le transformeur CSS de Turbopack fusionne `backdrop-filter` et
    // `-webkit-backdrop-filter` et ne conserve que la DERNIÈRE écrite. Écrire
    // les deux supprime donc la propriété standard du CSS servi, et le verre
    // devient inerte sans que rien ne le signale. Le préfixe est ajouté par le
    // pipeline : la feuille source ne déclare que la propriété standard.
    expect(css).not.toMatch(/-webkit-backdrop-filter:\s*var\(--glass-/);
    // La condition de repli ne teste que la propriété réellement déclarée,
    // pour que la dégradation soit franche plutôt qu'indéterminée.
    const supportsCondition = css.match(/@supports not \([^{]+/)?.[0] ?? "";
    expect(supportsCondition).not.toContain("-webkit-backdrop-filter");
  });

  it("ne pose jamais de verre à l'intérieur d'un autre verre (PS-006g)", () => {
    // Un élément qui porte un `backdrop-filter` devient racine d'arrière-plan :
    // le flou d'un descendant n'échantillonne alors plus la page, seulement son
    // parent. Le verre imbriqué ne floute rien et laisse le contenu net derrière
    // le texte. Le défaut est silencieux, d'où ce contrôle.
    const VITRE = /safe-glass-(?:subtle|elevated|focus)|safe-scrim/;
    const racine = process.cwd();
    const fichiers: string[] = [];
    const parcourir = (dossier: string) => {
      for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
        if (e.name === "node_modules" || e.name.startsWith(".")) continue;
        const chemin = path.join(dossier, e.name);
        if (e.isDirectory()) parcourir(chemin);
        else if (e.name.endsWith(".tsx") && !e.name.includes("Specimen")) fichiers.push(chemin);
      }
    };
    for (const base of ["components", "app"]) parcourir(path.join(racine, base));

    const imbrications: string[] = [];
    for (const fichier of fichiers) {
      const src = fs.readFileSync(fichier, "utf8");
      if (!VITRE.test(src)) continue;
      // Profondeur d'ouverture des balises : on signale une classe vitrée
      // ouverte alors qu'un ancêtre vitré n'est pas encore refermé.
      const pile: boolean[] = [];
      for (const ligne of src.split("\n")) {
        const fermetures = (ligne.match(/<\//g) ?? []).length + (ligne.match(/\/>/g) ?? []).length;
        const ouvertures = (ligne.match(/<[A-Za-z]/g) ?? []).length;
        const vitree = VITRE.test(ligne) && /className/.test(ligne);
        if (vitree && pile.some(Boolean)) {
          imbrications.push(`${path.relative(racine, fichier)} : ${ligne.trim().slice(0, 70)}`);
        }
        for (let i = 0; i < ouvertures; i++) pile.push(vitree && i === 0);
        for (let i = 0; i < fermetures; i++) pile.pop();
      }
    }
    expect(imbrications).toEqual([]);
  });

  it("garde un fond atmosphérique aux couleurs de la marque (§5)", () => {
    expect(css).toContain(".safe-atmosphere");
    // Aucun violet, indigo ou bleu générique dans le fond : A1 de DESIGN_HUMAIN.
    for (const token of [depth.atmosphere.forest, depth.atmosphere.warm]) {
      const [r, g, b] = token.match(/\d+/g)!.slice(0, 3).map(Number);
      expect(b).toBeLessThanOrEqual(Math.max(r, g));
    }
  });
});
