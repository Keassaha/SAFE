import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  RegistreFeuille,
  registreHeadRowClass,
  registreHeadCellClass,
  registreRowClass,
  registreChampClass,
} from "@/components/ui/registre";
import {
  LIBELLE_ETAT,
  LIBELLE_NATURE,
  compterParFiltre,
  depuis,
  listerDemandes,
  type EntreeDemande,
  type FiltreDemandes,
} from "@/lib/services/demandes";

/**
 * Console SAFE Inc. — les demandes venues du site public.
 *
 * Une intention : répondre à ce qui attend. C'est une file d'attente, pas un
 * tableau de bord. Les trois natures (demande écrite, rendez-vous, audit
 * gratuit) tiennent dans la même liste parce qu'elles appellent toutes la même
 * chose, une réponse.
 *
 * Deux registres de pastille, tranchés par DESIGN_HUMAIN §11 : contour pour ce
 * qui informe (la nature), fond dilué pour ce qui réclame un geste (« À
 * répondre »). Le vert ne dit qu'une chose ici comme ailleurs : c'est fait.
 *
 * Les anomalies de suivi (accusé non parti, lead non créé) sont montrées, pas
 * cachées : un courriel qui échoue ne laissait de trace que dans les logs.
 */

export const dynamic = "force-dynamic";

const ONGLETS: { cle: FiltreDemandes; label: string }[] = [
  { cle: "a-traiter", label: "À traiter" },
  { cle: "toutes", label: "Toutes" },
  { cle: "rendez-vous", label: "Rendez-vous" },
  { cle: "audits", label: "Audits" },
  { cle: "closes", label: "Closes" },
];

function lienOnglet(cle: FiltreDemandes, recherche: string) {
  const params = new URLSearchParams();
  if (cle !== "a-traiter") params.set("vue", cle);
  if (recherche) params.set("q", recherche);
  const qs = params.toString();
  return `/console/demandes${qs ? `?${qs}` : ""}`;
}

/** Informe : contour seul. Réclame un geste : fond dilué. Jamais l'inverse. */
function PastilleEtat({ etat }: { etat: EntreeDemande["etat"] }) {
  const style =
    etat === "A_REPONDRE"
      ? "border-si-amber/[0.32] bg-si-amber/10 text-si-amber-ink font-medium"
      : etat === "CLOSE"
        ? "border-si-line text-si-muted"
        : "border-si-verified/30 text-si-verified";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs leading-5 ${style}`}
    >
      {etat === "A_REPONDRE" ? (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
      {LIBELLE_ETAT[etat]}
    </span>
  );
}

export default async function ConsoleDemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; q?: string }>;
}) {
  const params = await searchParams;
  const recherche = (params.q ?? "").slice(0, 100);
  const vue = (ONGLETS.find((o) => o.cle === params.vue)?.cle ??
    "a-traiter") as FiltreDemandes;

  const [entrees, compteurs] = await Promise.all([
    listerDemandes(vue, recherche),
    compterParFiltre(),
  ]);

  const enAttente = compteurs["a-traiter"];
  const anomalies = entrees.filter((e) => e.anomalie).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Demandes"
        description={
          enAttente > 0
            ? `${enAttente} en attente de votre réponse`
            : "Rien n'attend de réponse."
        }
      />

      {anomalies > 0 ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-si-amber/30 bg-si-amber/[0.07] px-3 py-2.5 text-[13px] leading-relaxed text-si-amber-ink">
          <AlertTriangle className="mt-0.5 h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
          <p>
            {anomalies === 1
              ? "Une demande de cette vue n'a pas suivi son cours normal : un courriel n'est pas parti, ou elle n'est pas entrée au pipeline."
              : `${anomalies} demandes de cette vue n'ont pas suivi leur cours normal : un courriel n'est pas parti, ou elles ne sont pas entrées au pipeline.`}{" "}
            Elles sont enregistrées ici, rien n&apos;est perdu.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Vues" className="flex gap-0.5 rounded-lg bg-si-surface2 p-[3px]">
          {ONGLETS.map((o) => {
            const actif = o.cle === vue;
            return (
              <Link
                key={o.cle}
                href={lienOnglet(o.cle, recherche)}
                aria-current={actif ? "page" : undefined}
                className={`safe-zoom-menu inline-flex h-tap items-center rounded-md px-3 text-[13px] ${
                  actif ? "bg-si-surface font-medium text-si-ink shadow-[0_1px_2px_rgb(22_24_23/0.08)]" : "text-si-muted"
                }`}
              >
                {o.label}
                <span className="ml-1.5 text-xs tabular-nums text-si-subtle">
                  {compteurs[o.cle]}
                </span>
              </Link>
            );
          })}
        </nav>

        <form className="ml-auto" action="/console/demandes">
          {vue !== "a-traiter" ? <input type="hidden" name="vue" value={vue} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={recherche}
            placeholder="Rechercher un nom, un cabinet"
            aria-label="Rechercher une demande"
            className={`w-[230px] px-2.5 ${registreChampClass}`}
          />
        </form>
      </div>

      {entrees.length === 0 ? (
        <EmptyState
          title={recherche ? "Aucune demande ne correspond" : "Aucune demande dans cette vue"}
          description={
            recherche
              ? "Essayez un autre nom, ou videz la recherche."
              : "Les demandes écrites depuis le site, les rendez-vous et les audits gratuits arrivent ici."
          }
        />
      ) : (
        <RegistreFeuille ariaLabel="Demandes reçues">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={registreHeadRowClass}>
                  <th className={`${registreHeadCellClass} pl-5 text-sm font-medium text-si-muted`}>
                    Demandeur
                  </th>
                  <th className={`${registreHeadCellClass} text-sm font-medium text-si-muted`}>
                    Nature
                  </th>
                  <th className={`${registreHeadCellClass} text-sm font-medium text-si-muted`}>
                    Ce qu&apos;il faut pour répondre
                  </th>
                  <th className={`${registreHeadCellClass} text-sm font-medium text-si-muted`}>
                    État
                  </th>
                  <th className={`${registreHeadCellClass} text-sm font-medium text-si-muted`}>
                    Arrivée
                  </th>
                  <th className={registreHeadCellClass} />
                </tr>
              </thead>
              <tbody>
                {entrees.map((e) => (
                  <tr key={e.cle} className={registreRowClass}>
                    <td className="max-w-[420px] py-2.5 pl-5 pr-3 align-middle">
                      <Link
                        href={e.href}
                        className="block text-[14px] font-medium leading-5 tracking-[-0.005em] text-si-ink transition-colors hover:text-si-ink-strong"
                      >
                        {e.nom}
                        {e.cabinet ? (
                          <span className="font-normal text-si-muted"> · {e.cabinet}</span>
                        ) : null}
                      </Link>
                      {e.resume ? (
                        <p className="mt-0.5 truncate text-[13px] text-si-body">{e.resume}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <span className="inline-flex items-center rounded-full border border-si-line px-2 py-0.5 text-xs leading-5 text-si-body">
                        {LIBELLE_NATURE[e.nature]}
                      </span>
                    </td>
                    {/* L'anomalie s'ajoute au renseignement, elle ne le remplace pas :
                        un courriel manqué ne doit pas effacer le numéro à composer. */}
                    <td className="whitespace-nowrap px-3 py-2.5 align-middle text-[13px] text-si-body">
                      {e.detail ?? <span className="text-si-subtle">—</span>}
                      {e.anomalie ? (
                        <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-si-danger">
                          <AlertTriangle className="h-[13px] w-[13px] shrink-0" strokeWidth={1.5} />
                          {e.anomalie}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <PastilleEtat etat={e.etat} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-middle text-[13px] tabular-nums text-si-muted">
                      <time dateTime={e.recuLe.toISOString()} title={e.recuLe.toLocaleString("fr-CA")}>
                        {depuis(e.recuLe)}
                      </time>
                    </td>
                    <td className="w-7 py-2.5 pr-4 text-right align-middle">
                      <ChevronRight
                        aria-hidden
                        className="inline h-4 w-4 text-si-subtle"
                        strokeWidth={1.5}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RegistreFeuille>
      )}

      <p className="text-xs text-si-subtle">
        Les demandes closes restent consultables. Aucune n&apos;est supprimée.
      </p>
    </div>
  );
}
