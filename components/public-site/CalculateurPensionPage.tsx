"use client";

/**
 * La pension alimentaire, en accès public.
 *
 * Même moteur, même écran, autre cadre : les réserves sont annoncées AVANT le calcul.
 * Un parent qui cherche « calcul pension alimentaire Québec » ne sait pas que ce
 * montant se plaide, et repartirait avec un chiffre qu'il croirait définitif.
 */

import { INK, PROSE, MUTED, LINE, SURFACE, PageShell, PageHeader } from "./shared";
import { PensionAlimentaireCalculateur } from "@/components/outils/PensionAlimentaireCalculateur";

export default function CalculateurPensionPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Outil gratuit"
        titre="Pension alimentaire pour enfants"
        intro="Le calcul du formulaire officiel québécois, avec le numéro de chaque ligne en regard du montant."
      />

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl p-6" style={{ background: SURFACE, border: `1px solid ${LINE}` }}>
            <h2 className="font-serif text-[20px]" style={{ color: INK }}>
              Ce que cet outil refuse de faire
            </h2>
            <ul className="mt-4 space-y-2 text-[15px] leading-relaxed" style={{ color: PROSE }}>
              <li>
                Il ne calcule pas si un parent réside hors du Québec dans une instance en
                divorce. Ce sont alors les règles fédérales, et elles ne se calculent pas
                de la même façon.
              </li>
              <li>
                Il ne calcule pas les situations où plusieurs types de garde coexistent.
                Le formulaire y consacre vingt-cinq lignes, et nous préférons vous
                renvoyer au formulaire officiel plutôt que risquer une erreur invisible.
              </li>
              <li>
                Il n&apos;applique aucun des ajustements que le formulaire permet de
                motiver. Ce sont des décisions, pas des formules.
              </li>
            </ul>
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: MUTED }}>
              Ce n&apos;est pas un avis juridique. Le montant se plaide sur des faits que
              seul un avocat peut apprécier, et le formulaire officiel se signe sous
              serment.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <PensionAlimentaireCalculateur contexte="public" />
        </div>
      </section>
    </PageShell>
  );
}
