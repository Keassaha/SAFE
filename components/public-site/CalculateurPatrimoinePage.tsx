"use client";

/**
 * Le calculateur de patrimoine familial, en accès public.
 *
 * MÊME MOTEUR, MÊME ÉCRAN, AUTRE CADRE.
 *
 * Le calcul et ses réserves sont identiques à ceux du cabinet. Simplifier le
 * raisonnement pour le public le rendrait moins honnête, pas plus accessible.
 *
 * Ce qui change est l'encadrement : ici, les réserves sont annoncées AVANT le calcul,
 * pas seulement affichées après. Une avocate sait qu'un partage se plaide ; une
 * personne qui cherche « calcul patrimoine familial » sur le web ne le sait pas, et
 * repartirait avec un chiffre qu'elle croirait définitif.
 */

import { INK, PROSE, MUTED, LINE, SURFACE, PageShell, PageHeader } from "./shared";
import { PatrimoineFamilialCalculateur } from "@/components/outils/PatrimoineFamilialCalculateur";

export default function CalculateurPatrimoinePage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Outil gratuit"
        titre="Partage du patrimoine familial"
        intro="Vous entrez les biens, l'outil montre le calcul ligne par ligne, avec l'article du Code civil en regard de chaque déduction."
      />

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-3xl">
          {/* Les réserves d'abord. C'est le seul vrai changement pour le public. */}
          <div
            className="rounded-xl p-6"
            style={{ background: SURFACE, border: `1px solid ${LINE}` }}
          >
            <h2 className="font-serif text-[20px]" style={{ color: INK }}>
              Ce que cet outil refuse de faire
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: PROSE }}>
              Il ne devine pas. Quand le Code civil ne tranche pas une situation, il
              s&apos;arrête, nomme le problème et dit ce qui le déciderait. Vous ne
              recevrez pas un nombre qui a l&apos;air sûr de lui alors qu&apos;il ne
              l&apos;est pas.
            </p>
            <ul className="mt-4 space-y-2 text-[15px] leading-relaxed" style={{ color: PROSE }}>
              <li>
                Il ne calcule aucun impôt. Sur cette question précise, deux courants de
                jurisprudence s&apos;opposent depuis trente ans et aucun jugement de
                principe ne les a départagés.
              </li>
              <li>
                Il ne décide pas d&apos;un partage inégal. La Cour suprême a fixé le
                critère en 2008, et il appartient au tribunal.
              </li>
              <li>
                Il ne remplace pas le formulaire de la Cour supérieure, qui se signe sous
                serment.
              </li>
            </ul>
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: MUTED }}>
              Ce n&apos;est pas un avis juridique. Un partage se plaide sur des faits que
              seul un avocat peut apprécier, et deux dossiers aux mêmes chiffres ne se
              règlent pas toujours pareil.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <PatrimoineFamilialCalculateur contexte="public" />
        </div>
      </section>
    </PageShell>
  );
}
