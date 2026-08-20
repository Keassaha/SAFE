"use client";

/**
 * L'index public des outils gratuits.
 *
 * Il n'y en a qu'un aujourd'hui. La page existe quand même, parce que la règle de build
 * prévoit une suite et qu'un chemin propre coûte moins cher à ouvrir maintenant qu'à
 * réécrire quand le deuxième outil arrivera.
 */

import Link from "next/link";
import { INK, MUTED, PROSE, LINE, SURFACE, R, PageShell, PageHeader } from "./shared";

const OUTILS = [
  {
    href: R.calcPatrimoineFamilial,
    titre: "Partage du patrimoine familial",
    quoi:
      "La valeur à partager, calculée article par article, avec la déduction de plus-value que les tableurs manquent une fois sur deux.",
    pret: true,
  },
  {
    href: null,
    titre: "Pension alimentaire pour enfants",
    quoi:
      "La table officielle, les quatre situations de garde, et le plafond de capacité de payer.",
    pret: false,
  },
];

export default function CalculateursPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Outils gratuits"
        titre="Des calculs que vous pouvez vérifier"
        intro="Chaque montant renvoie à son article. Et quand le droit ne tranche pas, l'outil s'arrête au lieu d'inventer un chiffre."
      />

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl space-y-4">
          {OUTILS.map((o) => {
            const contenu = (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="font-serif text-[20px]" style={{ color: INK }}>
                    {o.titre}
                  </h2>
                  {!o.pret && (
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                      en construction
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: PROSE }}>
                  {o.quoi}
                </p>
              </>
            );

            return o.href ? (
              <Link
                key={o.titre}
                href={o.href}
                className="safe-zoom-rang block rounded-xl p-6 transition-transform"
                style={{ background: SURFACE, border: `1px solid ${LINE}` }}
              >
                {contenu}
              </Link>
            ) : (
              <div
                key={o.titre}
                className="rounded-xl p-6"
                style={{ background: SURFACE, border: `1px dashed ${LINE}`, opacity: 0.72 }}
              >
                {contenu}
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
