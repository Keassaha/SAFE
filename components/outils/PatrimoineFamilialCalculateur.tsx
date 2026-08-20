"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  calculerPartage,
  VERIFIE_LE,
  type CategorieBien,
  type CauseDissolution,
  type Regime,
} from "@/lib/outils/patrimoine-familial/calcul";
import {
  lignesVersBiens,
  type ApportSaisi,
} from "@/lib/outils/patrimoine-familial/saisie";
import type { SourceApport } from "@/lib/outils/patrimoine-familial/calcul";

/**
 * L'écran du calculateur de patrimoine familial.
 *
 * UNE INTENTION (M2) : saisir des biens, obtenir la valeur à partager et le chemin qui
 * y mène. Rien d'autre. Pas de tableau de bord, pas de statistiques, pas d'export.
 *
 * DEUX PARTIS PRIS DE CONTENU, tirés de la recherche et non d'un gabarit (M1) :
 *
 * 1. Le régime et la cause de dissolution se demandent AVANT tout bien. Ils changent
 *    la composition du patrimoine, pas seulement son étiquette : au décès, les gains
 *    du Régime de rentes en sortent (C.c.Q. art. 415 al. 3). Les mettre en bas de
 *    page en ferait des options ; ils sont des prémisses.
 *
 * 2. Le chemin de calcul est montré, pas caché derrière un « voir le détail ». Le
 *    formulaire de la Cour supérieure se produit SOUS SERMENT : personne ne devrait
 *    jurer sur un nombre dont il ne voit pas la provenance.
 *
 * Anti-slop §10 : filets horizontaux seulement (A14), colonnes de largeurs inégales
 * (A15), aucune icône décorative (A6), texte aligné à gauche (A2).
 */

type Ligne = {
  /** Identité de la ligne dans la liste. Le reste vit dans `LigneSaisie`. */
  cle: number;
  libelle: string;
  categorie: CategorieBien;
  possedeAvant: boolean;
  valeurBruteReference: string;
  detteReference: string;
  valeurBrutePartage: string;
  dettePartage: string;
  partageableEnNature: boolean;
  chargeFiscaleLatente: string;
  apports: ApportSaisi[];
};

/**
 * Les provenances proposées, et leur ordre.
 *
 * La succession vient en tête parce que c'est le cas courant. « Autre » est là pour
 * que l'utilisateur puisse être honnête : le calcul l'écartera et le dira, plutôt que
 * de le pousser à mentir sur la provenance pour obtenir une déduction.
 */
const SOURCES_MARIAGE: { valeur: SourceApport; libelle: string }[] = [
  { valeur: "succession_donation", libelle: "Un héritage ou une donation" },
  { valeur: "remploi", libelle: "La vente d'un bien possédé au mariage" },
  { valeur: "autre", libelle: "Autre provenance" },
];

const SOURCES_UNION_PARENTALE: { valeur: SourceApport; libelle: string }[] = [
  { valeur: "succession_donation", libelle: "Un héritage ou une donation" },
  { valeur: "remploi", libelle: "La vente d'un bien déjà au patrimoine" },
  { valeur: "biens_avant_union", libelle: "Des biens accumulés avant l'union" },
  { valeur: "fruits_et_revenus", libelle: "Les revenus de ces biens" },
  { valeur: "autre", libelle: "Autre provenance" },
];

const apportVide = (): ApportSaisi => ({
  montant: "",
  valeurBruteAuMoment: "",
  source: "succession_donation",
});

const CATEGORIES: { valeur: CategorieBien; libelle: string }[] = [
  { valeur: "residence_familiale", libelle: "Résidence de la famille" },
  { valeur: "meuble_menage", libelle: "Meubles du ménage" },
  { valeur: "vehicule_familial", libelle: "Véhicule familial" },
  { valeur: "regime_retraite", libelle: "Régime de retraite ou REER" },
  { valeur: "gains_rrq", libelle: "Gains inscrits au Régime de rentes" },
];

const CAUSES: { valeur: CauseDissolution; libelle: string }[] = [
  { valeur: "divorce", libelle: "Divorce" },
  { valeur: "separation_corps", libelle: "Séparation de corps" },
  { valeur: "nullite", libelle: "Nullité du mariage" },
  { valeur: "deces", libelle: "Décès" },
];

let compteur = 0;
const ligneVide = (): Ligne => ({
  cle: ++compteur,
  libelle: "",
  categorie: "residence_familiale",
  possedeAvant: false,
  valeurBruteReference: "",
  detteReference: "",
  valeurBrutePartage: "",
  dettePartage: "",
  partageableEnNature: false,
  chargeFiscaleLatente: "",
  apports: [],
});

const argent = (n: number) =>
  n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2 });

/**
 * L'âge d'une vérification, écrit comme une personne l'écrit.
 *
 * « il y a 1 jours » est la même faute que « 5 document(s) » : une économie de
 * développeur qui signe la machine. Et au-delà de deux mois, le nombre de jours ne
 * dit plus rien d'utile ; ce qui compte alors est que la vérification vieillit.
 */
const ageVerification = (iso: string): string => {
  const jours = Math.floor((Date.now() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000);
  if (jours <= 0) return "vérifié aujourd'hui";
  if (jours === 1) return "vérifié hier";
  if (jours < 60) return `vérifié il y a ${jours} jours`;
  const mois = Math.round(jours / 30);
  return `vérifié il y a ${mois} mois`;
};

const champ =
  "w-full rounded-md border-[0.5px] border-si-line bg-si-surface px-2.5 py-1.5 text-[13px] " +
  "text-si-ink outline-none focus:border-si-verified focus:shadow-focus";

export function PatrimoineFamilialCalculateur({
  contexte = "cabinet",
}: {
  /**
   * Qui lit l'écran.
   *
   * L'avertissement n'est pas le même. Au cabinet, l'avocate sait déjà que ce calcul
   * ne remplace pas le formulaire assermenté ; ce qu'elle doit savoir, c'est qu'elle
   * jure sur ce qu'elle signe. Au public, un justiciable pourrait s'en servir seul
   * pour négocier son divorce, et il faut lui dire que ce n'est pas un avis juridique.
   *
   * Rien d'autre ne change. Le calcul, les étapes et les réserves sont identiques :
   * un outil qui simplifierait son raisonnement pour le public serait moins honnête,
   * pas plus accessible.
   */
  contexte?: "cabinet" | "public";
} = {}) {
  const [regime, setRegime] = useState<Regime>("patrimoine_familial");
  const [cause, setCause] = useState<CauseDissolution>("divorce");
  const [lignes, setLignes] = useState<Ligne[]>([ligneVide()]);

  const dateRef = regime === "union_parentale" ? "à l'inclusion" : "au mariage";

  // La lecture des champs et leur conversion vivent dans `saisie.ts`, où elles sont
  // testées. Ce composant ne fait plus que du rendu.
  const biens = useMemo(() => lignesVersBiens(lignes), [lignes]);

  const resultat = useMemo(
    () => (biens.length ? calculerPartage({ regime, cause, biens }) : null),
    [regime, cause, biens],
  );

  const majLigne = (cle: number, champs: Partial<Ligne>) =>
    setLignes((ls) => ls.map((l) => (l.cle === cle ? { ...l, ...champs } : l)));

  const majApport = (cle: number, index: number, champs: Partial<ApportSaisi>) =>
    setLignes((ls) =>
      ls.map((l) =>
        l.cle === cle
          ? { ...l, apports: l.apports.map((a, i) => (i === index ? { ...a, ...champs } : a)) }
          : l,
      ),
    );

  return (
    <div className="space-y-8">
      {/* Les prémisses. Elles changent la composition du patrimoine, donc elles
          viennent avant les biens et pas dans un panneau de réglages. */}
      <section className="rounded-lg border border-si-line bg-si-surface p-5">
        <h2 className="text-[15px] font-medium text-si-ink">De quel partage s&apos;agit-il ?</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-si-muted">
          Ces deux réponses changent ce qui entre dans le patrimoine, pas seulement son nom.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-[6px] block text-[12px] font-medium text-si-ink">Régime</span>
            <select
              className={champ}
              value={regime}
              onChange={(e) => setRegime(e.target.value as Regime)}
            >
              <option value="patrimoine_familial">Mariage ou union civile</option>
              <option value="union_parentale">Union parentale</option>
            </select>
            <span className="mt-1 block text-[12px] text-si-muted">
              {regime === "union_parentale"
                ? "Ni les régimes de retraite ni les gains du Régime de rentes n'y entrent (art. 521.30)."
                : "Les régimes de retraite et les gains du Régime de rentes y entrent (art. 415)."}
            </span>
          </label>
          <label className="block">
            <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
              Cause de la dissolution
            </span>
            <select
              className={champ}
              value={cause}
              onChange={(e) => setCause(e.target.value as CauseDissolution)}
            >
              {CAUSES.map((c) => (
                <option key={c.valeur} value={c.valeur}>
                  {c.libelle}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[12px] text-si-muted">
              {cause === "deces"
                ? "Au décès, les gains du Régime de rentes sortent du patrimoine (art. 415 al. 3)."
                : "Les gains du Régime de rentes restent dans le patrimoine."}
            </span>
          </label>
        </div>
      </section>

      {/* Les biens. Une ligne par bien, avec les six valeurs que l'art. 418 exige. */}
      <section>
        <h2 className="text-[15px] font-medium text-si-ink">Les biens</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-si-muted">
          Pour un bien possédé {dateRef}, il faut sa valeur et ses dettes aux deux dates.
          Sans les deux, la déduction de l&apos;article 418 ne peut pas se calculer.
        </p>

        <div className="mt-4 space-y-3">
          {lignes.map((l) => (
            <div key={l.cle} className="rounded-lg border border-si-line bg-si-surface p-4">
              {/* Colonne porteuse large, métadonnées comprimées (A15). */}
              <div className="grid gap-3 sm:grid-cols-[2fr_1.2fr_auto] sm:items-end">
                <label className="block">
                  <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                    Désignation
                  </span>
                  <input
                    className={champ}
                    value={l.libelle}
                    placeholder="Résidence de Longueuil"
                    onChange={(e) => majLigne(l.cle, { libelle: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                    Nature
                  </span>
                  <select
                    className={champ}
                    value={l.categorie}
                    onChange={(e) =>
                      majLigne(l.cle, { categorie: e.target.value as CategorieBien })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.valeur} value={c.valeur}>
                        {c.libelle}
                      </option>
                    ))}
                  </select>
                </label>
                {lignes.length > 1 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setLignes((ls) => ls.filter((x) => x.cle !== l.cle))}
                  >
                    Retirer
                  </Button>
                ) : (
                  <span />
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                    Valeur à la date d&apos;évaluation
                  </span>
                  <input
                    className={champ}
                    inputMode="decimal"
                    value={l.valeurBrutePartage}
                    onChange={(e) => majLigne(l.cle, { valeurBrutePartage: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                    Dettes à cette date
                  </span>
                  <input
                    className={champ}
                    inputMode="decimal"
                    value={l.dettePartage}
                    onChange={(e) => majLigne(l.cle, { dettePartage: e.target.value })}
                  />
                  <span className="mt-1 block text-[12px] text-si-muted">
                    Seulement celles contractées pour ce bien (art. 417).
                  </span>
                </label>
              </div>

              {/* Divulgation progressive (A11) : les champs de la date de référence
                  n'apparaissent que si le bien était déjà là. */}
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-si-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-si-forest"
                  checked={l.possedeAvant}
                  onChange={(e) => majLigne(l.cle, { possedeAvant: e.target.checked })}
                />
                Ce bien était déjà possédé {dateRef}
              </label>

              {l.possedeAvant ? (
                <div className="mt-3 grid gap-3 border-t border-si-line pt-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                      Valeur {dateRef}
                    </span>
                    <input
                      className={champ}
                      inputMode="decimal"
                      value={l.valeurBruteReference}
                      onChange={(e) =>
                        majLigne(l.cle, { valeurBruteReference: e.target.value })
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                      Dettes {dateRef}
                    </span>
                    <input
                      className={champ}
                      inputMode="decimal"
                      value={l.detteReference}
                      onChange={(e) => majLigne(l.cle, { detteReference: e.target.value })}
                    />
                  </label>
                </div>
              ) : null}

              {/* LES APPORTS.
                  Le moteur savait les traiter depuis le premier jour et aucun champ ne
                  permettait de les saisir. Une cliente ayant mis un héritage dans la
                  maison obtenait donc un chiffre FAUX, pas un refus : le pire des trois
                  comportements possibles. */}
              <div className="mt-3 border-t border-si-line pt-3">
                <p className="text-[13px] text-si-ink">
                  Une somme a-t-elle été investie dans ce bien pendant l&apos;union ?
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-si-muted">
                  Un héritage, une donation, ou le produit de la vente d&apos;un bien que
                  vous possédiez déjà. Toutes les provenances n&apos;ouvrent pas de
                  déduction, et le calcul dira lesquelles il écarte.
                </p>

                {l.apports.map((a, i) => (
                  <div key={i} className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
                    <label className="block">
                      <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                        Provenance
                      </span>
                      <select
                        className={champ}
                        value={a.source}
                        onChange={(e) =>
                          majApport(l.cle, i, { source: e.target.value as SourceApport })
                        }
                      >
                        {(regime === "union_parentale"
                          ? SOURCES_UNION_PARENTALE
                          : SOURCES_MARIAGE
                        ).map((o) => (
                          <option key={o.valeur} value={o.valeur}>
                            {o.libelle}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                        Somme investie
                      </span>
                      <input
                        className={champ}
                        inputMode="decimal"
                        value={a.montant}
                        onChange={(e) => majApport(l.cle, i, { montant: e.target.value })}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                        Valeur du bien ce jour-là
                      </span>
                      <input
                        className={champ}
                        inputMode="decimal"
                        value={a.valeurBruteAuMoment}
                        onChange={(e) =>
                          majApport(l.cle, i, { valeurBruteAuMoment: e.target.value })
                        }
                      />
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        majLigne(l.cle, { apports: l.apports.filter((_, j) => j !== i) })
                      }
                    >
                      Retirer
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => majLigne(l.cle, { apports: [...l.apports, apportVide()] })}
                >
                  {l.apports.length ? "Ajouter une autre somme" : "Ajouter une somme investie"}
                </Button>
              </div>

              {l.categorie === "regime_retraite" ? (
                <div className="mt-3 border-t border-si-line pt-3">
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] text-si-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-si-forest"
                      checked={l.partageableEnNature}
                      onChange={(e) =>
                        majLigne(l.cle, { partageableEnNature: e.target.checked })
                      }
                    />
                    Ce bien se partage en nature, par transfert direct
                  </label>
                  {!l.partageableEnNature ? (
                    <label className="mt-3 block sm:max-w-xs">
                      <span className="mb-[6px] block text-[12px] font-medium text-si-ink">
                        Charge fiscale estimée à la liquidation
                      </span>
                      <input
                        className={champ}
                        inputMode="decimal"
                        value={l.chargeFiscaleLatente}
                        onChange={(e) =>
                          majLigne(l.cle, { chargeFiscaleLatente: e.target.value })
                        }
                      />
                      <span className="mt-1 block text-[12px] leading-relaxed text-si-muted">
                        Ce calcul ne l&apos;estime pas à votre place : les taux n&apos;ont
                        pas été vérifiés sur une source officielle. Donnez le montant et
                        vous obtiendrez les deux partages.
                      </span>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => setLignes((ls) => [...ls, ligneVide()])}
        >
          Ajouter un bien
        </Button>
      </section>

      {resultat ? (
        <section className="rounded-lg border border-si-line bg-si-surface p-5">
          <h2 className="text-[15px] font-medium text-si-ink">Le partage</h2>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-10 gap-y-3">
            <div>
              <p className="text-[12px] uppercase tracking-[0.06em] text-si-muted">
                Valeur à partager
              </p>
              <p className="font-serif text-[26px] tabular-nums text-si-ink">
                {argent(resultat.valeurPartageableTotale)}
              </p>
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-[0.06em] text-si-muted">
                Part de chaque conjoint
              </p>
              <p className="font-serif text-[26px] tabular-nums text-si-ink">
                {argent(resultat.partParConjoint)}
              </p>
            </div>
            {/* Les deux branches côte à côte, sans qu'aucune soit retenue par défaut. */}
            {resultat.partParConjointApresImpotLatent !== null ? (
              <div>
                <p className="text-[12px] uppercase tracking-[0.06em] text-si-muted">
                  Part, si la charge fiscale se déduit
                </p>
                <p className="font-serif text-[26px] tabular-nums text-si-ink">
                  {argent(resultat.partParConjointApresImpotLatent)}
                </p>
              </div>
            ) : null}
          </div>

          {resultat.incomplet ? (
            <p className="mt-4 rounded-md border border-si-line bg-si-canvas px-3 py-2 text-[13px] text-si-ink">
              Un bien au moins n&apos;a pas pu être calculé. Le total ci-dessus ne le
              comprend pas.
            </p>
          ) : null}

          {/* Le chemin. Filets horizontaux seulement (A14), largeurs inégales (A15). */}
          <div className="mt-6 space-y-6">
            {resultat.biens.map((b) => (
              <div key={b.libelle}>
                <p className="text-[13px] font-medium text-si-ink">{b.libelle}</p>
                <table className="mt-2 w-full text-[13px]">
                  <tbody>
                    {b.etapes.map((e, i) => (
                      <tr key={i} className="border-t border-si-line/60">
                        <td className="py-1.5 pr-4 text-si-ink">{e.libelle}</td>
                        <td className="py-1.5 pr-4 tabular-nums text-si-muted">{e.formule}</td>
                        <td className="w-px whitespace-nowrap py-1.5 pr-4 text-right tabular-nums text-si-ink">
                          {argent(e.montant)}
                        </td>
                        <td className="w-px whitespace-nowrap py-1.5 text-right text-[12px] text-si-muted">
                          {e.reference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Ce que le calcul ne tranche pas. Jamais en note de bas de page. */}
          {resultat.reserves.length ? (
            <div className="mt-8 border-t border-si-line pt-5">
              <h3 className="text-[13px] font-medium text-si-ink">
                Ce que ce calcul ne tranche pas
              </h3>
              <ul className="mt-3 space-y-4">
                {resultat.reserves.map((r, i) => (
                  <li key={i} className="text-[13px] leading-relaxed">
                    <p className="text-si-ink">
                      {r.bien ? <span className="font-medium">{r.bien} · </span> : null}
                      {r.message}
                    </p>
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
          ) : null}

          <p className="mt-6 text-[12px] leading-relaxed text-si-muted">
            {contexte === "public" ? (
              <>
                Ce calcul n&apos;est pas un avis juridique et ne remplace pas le
                formulaire de la Cour supérieure, qui se produit sous serment. Un partage
                se plaide sur des faits que seul un avocat peut apprécier. Sources
                vérifiées le {VERIFIE_LE}.
              </>
            ) : (
              <>
                Ce calcul ne remplace pas le formulaire de la Cour supérieure, qui se
                produit sous serment. Sources vérifiées le {VERIFIE_LE}.
              </>
            )}
          </p>
        </section>
      ) : null}
    </div>
  );
}
