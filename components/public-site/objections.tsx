"use client";

/**
 * Les questions repliees, une seule fois pour tout le site public.
 *
 * L'accueil les servait en accordeon et /faq en liste ouverte : deux
 * grammaires pour la meme chose, et une page de quinze questions ouvertes est
 * un mur de texte que personne ne parcourt. Demande CEO du 2026-08-26, « je
 * veux que la section question soit comme celle de la landing page
 * principale ».
 *
 * « details » et « summary » plutot qu'un etat React : le repli fonctionne
 * sans JavaScript, la recherche interne du navigateur trouve le texte replie,
 * et le clavier le pilote sans qu'on ait rien a ecrire.
 */

import React from "react";

/** Une question et sa reponse, en un ou plusieurs paragraphes. */
export type Objection = [string, string | readonly string[]];

export function Objections({ entrees }: { entrees: readonly Objection[] }) {
  return (
    <div className="objections">
      {entrees.map(([q, r]) => (
        <details className="obj" key={q}>
          <summary>
            {q}
            <i aria-hidden />
          </summary>
          {(typeof r === "string" ? [r] : r).map((paragraphe) => (
            <p key={paragraphe}>{paragraphe}</p>
          ))}
        </details>
      ))}
    </div>
  );
}

/**
 * Les regles, pour une portee donnee. L'accueil vit sous « .xc » et les pages
 * ecrites sous « .safe-vitrine » : la portee est un parametre pour que les
 * deux servent exactement la meme feuille.
 */
export function reglesObjections(p: string): string {
  return `
  /* ── Les objections repliees ──────────────────────────────────────────────
     L'intitule descend et la reponse monte : c'est l'inverse du reglage
     habituel, et c'est voulu. Un intitule se PARCOURT, huit d'affilee, et il
     n'a pas besoin d'etre gros. Une reponse se LIT, une a la fois, et c'est
     elle qui doit etre confortable. Demande CEO du 2026-08-26. */

  ${p} .objections { margin-top: clamp(28px, 3.6vh, 44px); }
  ${p} .obj {
    border-top: 1px solid var(--si-line);
  }
  ${p} .obj:last-child { border-bottom: 1px solid var(--si-line); }
  ${p} .obj summary {
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
    padding: 17px 0;
    font-family: var(--sans);
    font-size: var(--t-detail);
    color: var(--si-ink);
    cursor: pointer;
    list-style: none;
    transition: color 180ms ease;
  }
  ${p} .obj summary::-webkit-details-marker { display: none; }
  ${p} .obj summary:hover { color: var(--si-body); }
  /* Le chevron tourne d'un quart de tour a l'ouverture. Il vit dans un « i »
     et non dans le marqueur natif, que Safari refuse de styler. */
  ${p} .obj summary i {
    flex: 0 0 auto;
    width: 8px; height: 8px;
    border-right: 1.4px solid var(--si-subtle);
    border-bottom: 1.4px solid var(--si-subtle);
    transform: rotate(45deg);
    margin-right: 3px;
    transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  ${p} .obj[open] summary i { transform: rotate(-135deg); }
  ${p} .obj > p {
    margin: 0;
    padding: 0 0 20px;
    max-width: 62ch;
    font-family: var(--sans);
    font-size: var(--t-explique);
    line-height: 1.66;
    color: var(--si-body);
  }
  /* Une reponse peut tenir en plusieurs paragraphes. Sans cette regle, le
     rembourrage bas de chacun les separait deux fois trop. */
  ${p} .obj > p + p { padding-top: 0; }
  ${p} .obj > p:not(:last-child) { padding-bottom: 14px; }
  @media (prefers-reduced-motion: reduce) {
    ${p} .obj summary i { transition: none; }
  }
`;
}
