"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  calculerPension,
  VERIFIE_LE,
  type Parent,
  type SituationGarde,
} from "@/lib/outils/pension-alimentaire/calcul";
import {
  saisieSuffisante,
  saisieVersEntree,
  type Saisie,
} from "@/lib/outils/pension-alimentaire/saisie";
import { TABLE_VERSION } from "@/lib/outils/pension-alimentaire/table-2026-01-01";

/**
 * L'écran de fixation de la pension alimentaire pour enfants.
 *
 * UNE INTENTION (M2) : saisir deux revenus, des enfants et un temps de garde, obtenir
 * le montant et les lignes du formulaire qui y mènent.
 *
 * TROIS PARTIS PRIS, TIRÉS DU RÈGLEMENT ET NON D'UN GABARIT (M1) :
 *
 * 1. La première question n'est pas un revenu, c'est le RÉGIME. En divorce, le modèle
 *    québécois ne s'applique que si les deux parents résident au Québec. Poser la
 *    question à la fin ferait calculer un montant du mauvais régime avant de le
 *    retirer.
 *
 * 2. Le temps de garde se saisit en JOURS, jamais en pourcentage. Le formulaire divise
 *    lui-même par 365. Demander un pourcentage ferait entrer un nombre déjà arrondi,
 *    et l'arrondi d'un facteur intermédiaire est ce que les deux calculateurs évitent.
 *
 * 3. Chaque ligne du résultat porte SON NUMÉRO au formulaire officiel. Le parent qui
 *    signe sous serment doit pouvoir suivre le calcul ligne à ligne.
 *
 * Anti-slop §10 : filets horizontaux seulement (A14), largeurs inégales (A15), aucune
 * icône décorative (A6), divulgation progressive des champs propres à chaque garde (A11).
 */

const SITUATIONS: { valeur: SituationGarde; libelle: string; aide: string }[] = [
  {
    valeur: "exclusive",
    libelle: "Un parent a la garde, l'autre voit les enfants 20 % du temps ou moins",
    aide: "Section 1 du formulaire",
  },
  {
    valeur: "visite_prolongee",
    libelle: "Un parent a la garde, l'autre voit les enfants entre 20 % et 40 % du temps",
    aide: "Section 1.1 du formulaire",
  },
  {
    valeur: "exclusive_chacun",
    libelle: "Chaque parent a la garde d'au moins un enfant",
    aide: "Section 2 du formulaire",
  },
  {
    valeur: "partagee",
    libelle: "Chaque parent a les enfants au moins 40 % du temps",
    aide: "Section 3 du formulaire",
  },
  {
    valeur: "mixte",
    libelle: "Plusieurs de ces situations à la fois",
    aide: "Section 4 du formulaire, non calculée ici",
  },
];

const saisieVide: Saisie = {
  divorce: true,
  deuxParentsAuQuebec: true,
  pere: { revenuAnnuel: "", cotisationsSyndicales: "", cotisationsProfessionnelles: "" },
  mere: { revenuAnnuel: "", cotisationsSyndicales: "", cotisationsProfessionnelles: "" },
  nombreEnfants: "1",
  fraisGarde: "",
  fraisEtudes: "",
  fraisParticuliers: "",
  situation: "exclusive",
  parentNonGardien: "pere",
  joursNonGardien: "",
  enfantsChezPere: "",
  enfantsChezMere: "",
  joursPere: "",
  joursMere: "",
};

const argent = (n: number) =>
  n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2 });

const ageVerification = (iso: string): string => {
  const j = Math.floor((Date.now() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000);
  if (j <= 0) return "vérifié aujourd'hui";
  if (j === 1) return "vérifié hier";
  if (j < 60) return `vérifié il y a ${j} jours`;
  return `vérifié il y a ${Math.round(j / 30)} mois`;
};

const champ =
  "w-full rounded-md border-[0.5px] border-si-line bg-si-surface px-2.5 py-1.5 text-[13px] " +
  "text-si-ink outline-none focus:border-si-verified focus:shadow-focus";
const etiquette = "mb-[6px] block text-[12px] font-medium text-si-ink";

export function PensionAlimentaireCalculateur({
  contexte = "cabinet",
}: {
  contexte?: "cabinet" | "public";
} = {}) {
  const [s, setS] = useState<Saisie>(saisieVide);
  const maj = (champs: Partial<Saisie>) => setS((v) => ({ ...v, ...champs }));
  const majParent = (qui: "pere" | "mere", champs: Partial<Saisie["pere"]>) =>
    setS((v) => ({ ...v, [qui]: { ...v[qui], ...champs } }));

  const resultat = useMemo(
    () => (saisieSuffisante(s) ? calculerPension(saisieVersEntree(s)) : null),
    [s],
  );

  const nomParent = (p: Parent) => (p === "pere" ? "Le père" : "La mère");

  return (
    <div className="space-y-8">
      {/* La première question, et elle décide si ce calcul s'applique. */}
      <section className="rounded-lg border border-si-line bg-si-surface p-5">
        <h2 className="text-[15px] font-medium text-si-ink">De quelle demande s&apos;agit-il ?</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-si-muted">
          Cette réponse décide si le calcul québécois s&apos;applique, ou si ce sont les
          règles fédérales.
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-si-ink">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-si-ink-strong"
              checked={s.divorce}
              onChange={(e) => maj({ divorce: e.target.checked })}
            />
            <span>
              La demande s&apos;inscrit dans une instance en divorce
              <span className="mt-0.5 block text-[12px] text-si-muted">
                Sinon, séparation de fait, union parentale, ou parents jamais mariés.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-si-ink">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-si-ink-strong"
              checked={s.deuxParentsAuQuebec}
              onChange={(e) => maj({ deuxParentsAuQuebec: e.target.checked })}
            />
            <span>
              Les deux parents résident habituellement au Québec
              <span className="mt-0.5 block text-[12px] text-si-muted">
                En divorce, dès qu&apos;un parent réside ailleurs, ce sont les Lignes
                directrices fédérales qui s&apos;appliquent.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-medium text-si-ink">Les revenus des deux parents</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-si-muted">
          Le revenu annuel de toute provenance. Les transferts gouvernementaux reliés à la
          famille, l&apos;aide de dernier recours et l&apos;aide aux études n&apos;en font
          pas partie.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(["pere", "mere"] as const).map((qui) => (
            <div key={qui} className="rounded-lg border border-si-line bg-si-surface p-4">
              <p className="text-[13px] font-medium text-si-ink">
                {qui === "pere" ? "Père" : "Mère"}
              </p>
              <label className="mt-3 block">
                <span className={etiquette}>Revenu annuel</span>
                <input
                  className={champ}
                  inputMode="decimal"
                  value={s[qui].revenuAnnuel}
                  onChange={(e) => majParent(qui, { revenuAnnuel: e.target.value })}
                />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={etiquette}>Cotisations syndicales</span>
                  <input
                    className={champ}
                    inputMode="decimal"
                    value={s[qui].cotisationsSyndicales}
                    onChange={(e) => majParent(qui, { cotisationsSyndicales: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className={etiquette}>Cotisations professionnelles</span>
                  <input
                    className={champ}
                    inputMode="decimal"
                    value={s[qui].cotisationsProfessionnelles}
                    onChange={(e) =>
                      majParent(qui, { cotisationsProfessionnelles: e.target.value })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-medium text-si-ink">Les enfants et les frais</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className={etiquette}>Nombre d&apos;enfants</span>
            <input
              className={champ}
              inputMode="numeric"
              value={s.nombreEnfants}
              onChange={(e) => maj({ nombreEnfants: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={etiquette}>Frais de garde nets</span>
            <input
              className={champ}
              inputMode="decimal"
              value={s.fraisGarde}
              onChange={(e) => maj({ fraisGarde: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={etiquette}>Études postsecondaires</span>
            <input
              className={champ}
              inputMode="decimal"
              value={s.fraisEtudes}
              onChange={(e) => maj({ fraisEtudes: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={etiquette}>Frais particuliers</span>
            <input
              className={champ}
              inputMode="decimal"
              value={s.fraisParticuliers}
              onChange={(e) => maj({ fraisParticuliers: e.target.value })}
            />
          </label>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-si-muted">
          Des frais nets : déduction faite de tout avantage, subvention ou crédit
          d&apos;impôt. Un montant net négatif compte pour zéro.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-medium text-si-ink">Le temps de garde</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-si-muted">
          C&apos;est lui qui décide de la section du formulaire, donc du calcul entier.
        </p>

        <div className="mt-4 space-y-2">
          {SITUATIONS.map((o) => (
            <label
              key={o.valeur}
              className="safe-zoom-rang flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 text-[13px] text-si-ink transition-colors"
            >
              <input
                type="radio"
                name="situation"
                className="mt-0.5 h-4 w-4 shrink-0 accent-si-ink-strong"
                checked={s.situation === o.valeur}
                onChange={() => maj({ situation: o.valeur })}
              />
              <span>
                {o.libelle}
                <span className="mt-0.5 block text-[12px] text-si-muted">{o.aide}</span>
              </span>
            </label>
          ))}
        </div>

        {/* Divulgation progressive : chaque situation demande ses propres chiffres. */}
        {(s.situation === "exclusive" || s.situation === "visite_prolongee") && (
          <div className="mt-4 grid gap-3 border-t border-si-line pt-4 sm:grid-cols-2">
            <label className="block">
              <span className={etiquette}>Le parent qui n&apos;a pas la garde</span>
              <select
                className={champ}
                value={s.parentNonGardien}
                onChange={(e) => maj({ parentNonGardien: e.target.value as Parent })}
              >
                <option value="pere">Le père</option>
                <option value="mere">La mère</option>
              </select>
            </label>
            {s.situation === "visite_prolongee" && (
              <label className="block">
                <span className={etiquette}>Ses jours de garde dans l&apos;année</span>
                <input
                  className={champ}
                  inputMode="decimal"
                  value={s.joursNonGardien}
                  onChange={(e) => maj({ joursNonGardien: e.target.value })}
                />
                <span className="mt-1 block text-[12px] text-si-muted">
                  En jours, pas en pourcentage : le formulaire divise lui-même par 365.
                </span>
              </label>
            )}
          </div>
        )}

        {s.situation === "exclusive_chacun" && (
          <div className="mt-4 grid gap-3 border-t border-si-line pt-4 sm:grid-cols-2">
            <label className="block">
              <span className={etiquette}>Enfants sous la garde du père</span>
              <input
                className={champ}
                inputMode="numeric"
                value={s.enfantsChezPere}
                onChange={(e) => maj({ enfantsChezPere: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={etiquette}>Enfants sous la garde de la mère</span>
              <input
                className={champ}
                inputMode="numeric"
                value={s.enfantsChezMere}
                onChange={(e) => maj({ enfantsChezMere: e.target.value })}
              />
            </label>
          </div>
        )}

        {s.situation === "partagee" && (
          <div className="mt-4 grid gap-3 border-t border-si-line pt-4 sm:grid-cols-2">
            <label className="block">
              <span className={etiquette}>Jours de garde du père</span>
              <input
                className={champ}
                inputMode="decimal"
                value={s.joursPere}
                onChange={(e) => maj({ joursPere: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={etiquette}>Jours de garde de la mère</span>
              <input
                className={champ}
                inputMode="decimal"
                value={s.joursMere}
                onChange={(e) => maj({ joursMere: e.target.value })}
              />
            </label>
          </div>
        )}
      </section>

      {resultat && (
        <section className="rounded-lg border border-si-line bg-si-surface p-5">
          <h2 className="text-[15px] font-medium text-si-ink">La pension</h2>

          {resultat.pensionAnnuelle === null ? (
            <p className="mt-3 text-[14px] leading-relaxed text-si-ink">
              Ce calcul ne s&apos;applique pas à cette situation. La raison est expliquée
              plus bas.
            </p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-10 gap-y-3">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.06em] text-si-muted">
                    Par année
                  </p>
                  <p className="font-serif text-[26px] tabular-nums text-si-ink">
                    {argent(resultat.pensionAnnuelle)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] uppercase tracking-[0.06em] text-si-muted">
                    Par mois
                  </p>
                  <p className="font-serif text-[26px] tabular-nums text-si-ink">
                    {argent(resultat.pensionMensuelle ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] uppercase tracking-[0.06em] text-si-muted">
                    Payée par
                  </p>
                  <p className="font-serif text-[26px] text-si-ink">
                    {resultat.debiteur ? nomParent(resultat.debiteur) : "personne"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-si-muted">
                Le formulaire raisonne en montants annuels. Le mensuel est une division
                par douze ; la fréquence réelle des versements se convient à la partie 8.
              </p>
            </>
          )}

          {resultat.lignes.length > 0 && (
            <div className="mt-6">
              <table className="w-full text-[13px]">
                <tbody>
                  {resultat.lignes.map((l, i) => (
                    <tr key={i} className="border-t border-si-line/60">
                      <td className="w-px whitespace-nowrap py-1.5 pr-3 tabular-nums text-si-muted">
                        {l.numero}
                      </td>
                      <td className="py-1.5 pr-4 text-si-ink">{l.libelle}</td>
                      <td className="py-1.5 pr-4 text-[12px] text-si-muted">{l.formule}</td>
                      <td className="w-px whitespace-nowrap py-1.5 text-right tabular-nums text-si-ink">
                        {typeof l.valeur === "number"
                          ? argent(l.valeur)
                          : `${argent(l.valeur.pere)} · ${argent(l.valeur.mere)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {resultat.reserves.length > 0 && (
            <div className="mt-8 border-t border-si-line pt-5">
              <h3 className="text-[13px] font-medium text-si-ink">
                Ce que ce calcul ne tranche pas
              </h3>
              <ul className="mt-3 space-y-4">
                {resultat.reserves.map((r, i) => (
                  <li key={i} className="text-[13px] leading-relaxed">
                    <p className="text-si-ink">{r.message}</p>
                    <p className="mt-1 text-[12px] text-si-muted">
                      {r.reference} · {ageVerification(r.verifieLe)}, le {r.verifieLe}
                    </p>
                    <p className="mt-0.5 text-[12px] text-si-muted">
                      Ce qui le lèverait : {r.leveePar}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 text-[12px] leading-relaxed text-si-muted">
            {contexte === "public"
              ? "Ce calcul n'est pas un avis juridique et ne remplace pas le formulaire officiel de fixation, qui se produit sous serment. "
              : "Ce calcul ne remplace pas le formulaire officiel de fixation, qui se produit sous serment. "}
            Table applicable depuis le {TABLE_VERSION}. Sources vérifiées le {VERIFIE_LE}.
          </p>
        </section>
      )}

      {!resultat && (
        <p className="text-[13px] text-si-muted">
          Entrez au moins un revenu et un enfant pour voir le calcul.
        </p>
      )}

      <Button type="button" variant="secondary" size="sm" onClick={() => setS(saisieVide)}>
        Tout effacer
      </Button>
    </div>
  );
}
