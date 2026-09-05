"use client";

/**
 * Chronologie de correspondance — la vue, sans le chargement (lot 0).
 *
 * Doctrine : docs/product/SPEC_SAFE_CORRESPONDANCE_ASSISTEE.md §21, écran E1.
 *
 * Séparée de `DossierDetailCorrespondance` pour deux raisons. La première est
 * qu'un composant qui ne fait que rendre des props se juge à l'oeil sur des cas
 * limites, dans `/ds-preview/correspondance`, sans base ni session (PS-092).
 * La seconde est qu'elle n'a plus qu'une responsabilité, ce qui la rend courte.
 *
 * ── Choix de forme ───────────────────────────────────────────────────────────
 * Chronologie et non tableau (DESIGN_HUMAIN P1) : ces lignes se lisent dans le
 * temps, elles ne se comparent pas colonne à colonne. Deux niveaux par entrée
 * (P3) parce que la provenance compte autant que l'objet. Temps relatif court
 * avec date complète au survol (A13). Filets horizontaux seulement (C2).
 *
 * Aucun survol de ligne : rien n'est cliquable ici, donc rien ne doit avoir
 * l'air de l'être. Aucun bouton plein non plus : l'intention de cet écran est
 * de LIRE (loi L2). Le jour où « Nouvelle correspondance » arrive, ce sera le
 * seul bouton plein de l'onglet.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, PenLine, Inbox } from "lucide-react";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import type { EntreeCorrespondance } from "@/lib/services/correspondance/chronologie";

/** Les quatre filtres du lot 0. « Reçus », « En attente » et « Terminés »
 *  attendent la réception : les afficher vides ferait promettre à l'écran ce
 *  qu'il ne sait pas encore faire. */
type Filtre = "tout" | "envoyes" | "echecs" | "saisis";

const FILTRES: { id: Filtre; cle: string }[] = [
  { id: "tout", cle: "corrFilterAll" },
  { id: "envoyes", cle: "corrFilterSent" },
  { id: "echecs", cle: "corrFilterFailed" },
  { id: "saisis", cle: "corrFilterManual" },
];

function retenue(entree: EntreeCorrespondance, filtre: Filtre): boolean {
  switch (filtre) {
    case "envoyes":
      return entree.etat === "envoye";
    case "echecs":
      return entree.etat === "echec";
    case "saisis":
      return entree.etat === "saisi";
    default:
      return true;
  }
}

/**
 * Temps relatif court. Au-delà de trente jours on rend la date : « il y a
 * 7 mois » n'aide personne à retrouver une correspondance.
 */
function tempsRelatif(iso: string, maintenant: number, intlLocale: string): string {
  const minutes = Math.round((maintenant - new Date(iso).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto", style: "short" });
  if (minutes < 1) return rtf.format(0, "minute");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const heures = Math.round(minutes / 60);
  if (heures < 24) return rtf.format(-heures, "hour");
  const jours = Math.round(heures / 24);
  if (jours <= 30) return rtf.format(-jours, "day");
  return new Intl.DateTimeFormat(intlLocale, { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

function dateComplete(iso: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
}

export interface ChronologieCorrespondanceProps {
  entrees: EntreeCorrespondance[];
  /** Vue cabinet : le dossier devient la ligne porteuse, puisque c'est lui qui
   *  situe la communication. Dans la vue d'un dossier, le rappeler à chaque
   *  ligne serait du bruit. */
  afficherDossier?: boolean;
  tronquee?: boolean;
  chargement?: boolean;
  erreur?: string | null;
  /** Injectable pour que la page de spécimens rende un temps relatif stable. */
  maintenant?: number;
}

export function ChronologieCorrespondance({
  entrees,
  afficherDossier = false,
  tronquee = false,
  chargement = false,
  erreur = null,
  maintenant,
}: ChronologieCorrespondanceProps) {
  const t = useTranslations("matterDetailUi");
  const { intlLocale } = useFormatteurs();
  const [filtre, setFiltre] = useState<Filtre>("tout");

  /* Figé au montage : recalculer « il y a 2 h » à chaque rendu ferait bouger du
     texte sans que personne n'ait rien demandé (loi L3). */
  const [instant] = useState(() => maintenant ?? Date.now());

  const comptes = useMemo(
    () => ({
      tout: entrees.length,
      envoyes: entrees.filter((e) => e.etat === "envoye").length,
      echecs: entrees.filter((e) => e.etat === "echec").length,
      saisis: entrees.filter((e) => e.etat === "saisi").length,
    }),
    [entrees],
  );

  const visibles = useMemo(() => entrees.filter((e) => retenue(e, filtre)), [entrees, filtre]);

  return (
    <div className="rounded-lg border border-si-line bg-si-surface">
      <header className="border-b border-si-line px-5 py-4">
        <h3 className="text-[15px] font-medium text-si-ink">{t("corrHeading")}</h3>
        <p className="mt-1 max-w-[65ch] text-[13px] text-si-muted">
          {t(afficherDossier ? "corrSubheadingCabinet" : "corrSubheading")}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {FILTRES.map((f) => {
            const actif = filtre === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltre(f.id)}
                aria-pressed={actif}
                className={`safe-zoom-menu inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium ${
                  actif ? "border-si-ink-strong bg-si-ink-strong text-si-surface" : "border-si-line text-si-muted"
                }`}
              >
                {t(f.cle)}
                <span className="font-mono text-[11px] tabular-nums opacity-70">{comptes[f.id]}</span>
              </button>
            );
          })}
        </div>
      </header>

      {chargement ? (
        /* Squelette immobile, aux dimensions réelles des lignes attendues
           (PS-033). Aucune pulsation : une attente qui clignote est un
           mouvement sans information. */
        <div aria-busy="true" aria-live="polite" className="divide-y divide-si-line">
          <span className="sr-only">{t("corrLoading")}</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3">
              <div className="mt-0.5 h-4 w-4 rounded bg-si-surface2" />
              <div className="min-w-0 flex-1">
                <div className="h-[15px] w-2/5 rounded bg-si-surface2" />
                <div className="mt-2 h-[13px] w-3/5 rounded bg-si-surface2" />
              </div>
              <div className="h-[13px] w-16 rounded bg-si-surface2" />
            </div>
          ))}
        </div>
      ) : erreur ? (
        <div className="px-5 py-6">
          <p className="text-[13px] font-medium text-si-danger-ink">{erreur}</p>
          <p className="mt-1 text-[13px] text-si-muted">{t("corrErrorHint")}</p>
        </div>
      ) : entrees.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Inbox className="mx-auto h-5 w-5 text-si-subtle" aria-hidden />
          <p className="mt-2 text-[13px] font-medium text-si-ink">{t("corrEmptyTitle")}</p>
          <p className="mx-auto mt-1 max-w-[52ch] text-[13px] text-si-muted">{t("corrEmptyHint")}</p>
        </div>
      ) : visibles.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[13px] text-si-muted">{t("corrEmptyFilter")}</p>
        </div>
      ) : (
        <ol className="divide-y divide-si-line">
          {visibles.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-5 py-3">
              <span className="mt-[3px] shrink-0 text-si-subtle" aria-hidden>
                {e.sens === "sortant" ? <ArrowUpRight className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
              </span>

              <div className="min-w-0 flex-1">
                {afficherDossier && e.dossier ? (
                  <p className="truncate text-[11px] text-si-muted">
                    {e.dossier.numero ? `${e.dossier.numero} · ` : ""}
                    {e.dossier.intitule}
                  </p>
                ) : null}
                <p className="truncate text-[13px] font-medium text-si-ink" title={e.objet}>
                  {e.objet}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-si-muted">
                  {[
                    e.interlocuteur || null,
                    e.detail,
                    e.auteur,
                    e.nbPieces != null && e.nbPieces > 0 ? t("corrPieces", { count: e.nbPieces }) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {e.etat === "echec" ? (
                  <p className="mt-1 text-[12px] text-si-danger-ink">
                    {t("corrFailedLine")}
                    {e.erreur ? ` ${e.erreur}` : ""}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <time
                  dateTime={e.date}
                  title={dateComplete(e.date, intlLocale)}
                  /* Tabulaire mais pas mono : « il y a 22 min » est une phrase
                     qui contient un chiffre, pas un chiffre. Le mono l'étire et
                     la fait lire comme une référence comptable. */
                  className="text-[11px] tabular-nums text-si-muted"
                >
                  {tempsRelatif(e.date, instant, intlLocale)}
                </time>
                {/* Le mot double toujours la couleur et la forme (loi L4). Fond
                    dilué réservé à l'état qui appelle un geste, contour pour
                    l'état purement informatif (DESIGN_HUMAIN §11). */}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    e.etat === "echec"
                      ? "bg-si-danger/[0.10] text-si-danger-ink"
                      : "border border-si-line text-si-muted"
                  }`}
                >
                  {e.etat === "echec"
                    ? t("corrStateFailed")
                    : e.etat === "saisi"
                      ? t("corrStateManual")
                      : t("corrStateSent")}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      {tronquee && !chargement && !erreur ? (
        <p className="border-t border-si-line px-5 py-2.5 text-[12px] text-si-muted">{t("corrTruncated")}</p>
      ) : null}
    </div>
  );
}
