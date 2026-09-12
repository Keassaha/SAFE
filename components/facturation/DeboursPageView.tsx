"use client";

/**
 * SAFE — La page des débours, groupée par client.
 *
 * Elle listait cent lignes à plat, sans filtre, sans tri, sans action. On ne
 * pouvait pas répondre à la seule question qu'on se pose devant : « qu'est-ce
 * que j'ai avancé pour ce client, et qu'est-ce qui n'est pas encore rentré ? »
 * Demande CEO du 2026-09-12 : une liste par client, avec sa page dédiée.
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RowMenu, rowMenuItemClass } from "@/components/ui/RowMenu";
import { Ban } from "lucide-react";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import { routes } from "@/lib/routes";
import { radierDeboursDossier } from "@/lib/actions/debours";
import {
  filtrer,
  grouperParClient,
  moisPresents,
  resteARefacturer,
  totaux,
  type DeboursLigne,
} from "@/lib/debours/vue";
import type { DeboursStatut } from "@prisma/client";

interface DeboursPageViewProps {
  lignes: DeboursLigne[];
  clients: Array<{ id: string; nom: string }>;
  canWrite: boolean;
}

export function DeboursPageView({ lignes, clients, canWrite }: DeboursPageViewProps) {
  const t = useTranslations("debours");
  const { formatCurrency, intlLocale } = useFormatteurs();
  const router = useRouter();
  const [enCours, demarrer] = useTransition();

  const [clientId, setClientId] = useState("");
  const [statut, setStatut] = useState<DeboursStatut | "">("");
  const [mois, setMois] = useState("");
  const [parClient, setParClient] = useState(true);

  const visibles = useMemo(
    () => filtrer(lignes, { clientId, statut, mois }),
    [lignes, clientId, statut, mois],
  );
  const groupes = useMemo(() => grouperParClient(visibles), [visibles]);
  const t3 = useMemo(() => totaux(lignes), [lignes]);
  const mois12 = useMemo(() => moisPresents(lignes), [lignes]);

  const nomDuMois = (aaaaMm: string) => {
    const [a, m] = aaaaMm.split("-").map(Number);
    return new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(
      new Date(a, m - 1, 1),
    );
  };
  const jour = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
      new Date(iso),
    );

  function radier(id: string) {
    demarrer(async () => {
      const res = await radierDeboursDossier(id);
      if (res.ok) {
        toast.success(t("writtenOffDone"));
        router.refresh();
      } else {
        toast.error(
          res.error === "already_recovered" ? t("cannotWriteOffRecovered") : t("writeOffFailed"),
        );
      }
    });
  }

  const champ =
    "h-tap rounded-md border border-si-line bg-si-surface2 px-3 text-[12.5px] text-si-body outline-none transition-colors hover:border-si-muted focus:border-si-border-strong";

  const etatDeLaLigne = (l: DeboursLigne) => {
    if (l.statutDebours === "RADIE") return { texte: t("statusWrittenOff"), ton: "neutre" as const };
    if (l.statutDebours === "RECOUVRE") return { texte: t("statusRecovered"), ton: "vert" as const };
    if (l.statutDebours === "FACTURE") return { texte: t("statusInvoiced"), ton: "vert" as const };
    if (!l.refacturable) return { texte: t("statusNotRebillable"), ton: "neutre" as const };
    return { texte: t("statusToRebill"), ton: "ambre" as const };
  };

  return (
    <div>
      {/* Trois chiffres, et chacun répond à une question différente : ce qu'il
          reste à porter sur une facture, ce qui est sorti du compte et n'est
          pas rentré, ce qui est rentré. */}
      <dl className="mb-5 flex flex-wrap gap-x-16 gap-y-4 border-b border-si-line pb-5">
        {[
          { l: t("kpiToRebill"), v: t3.aRefacturer, e: t("kpiToRebillHint") },
          { l: t("kpiAdvanced"), v: t3.avanceNonRembourse, e: t("kpiAdvancedHint") },
          { l: t("kpiRecovered"), v: t3.recouvre, e: t("kpiRecoveredHint") },
        ].map((k) => (
          <div key={k.l} className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-[0.09em] text-si-muted">
              {k.l}
            </dt>
            <dd className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-[20px] font-medium tabular-nums text-si-ink">
                {formatCurrency(k.v)}
              </span>
              <span className="truncate text-[12px] text-si-muted">{k.e}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={champ}>
          <option value="">{t("allClients")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value as DeboursStatut | "")}
          className={champ}
        >
          <option value="">{t("allStates")}</option>
          <option value="NON_FACTURE">{t("statusToRebill")}</option>
          <option value="FACTURE">{t("statusInvoiced")}</option>
          <option value="RECOUVRE">{t("statusRecovered")}</option>
          <option value="RADIE">{t("statusWrittenOff")}</option>
        </select>
        <select value={mois} onChange={(e) => setMois(e.target.value)} className={champ}>
          <option value="">{t("allMonths")}</option>
          {mois12.map((m) => (
            <option key={m} value={m}>
              {nomDuMois(m)}
            </option>
          ))}
        </select>

        <div className="ml-auto inline-flex overflow-hidden rounded-md border border-si-line bg-si-surface">
          {[
            { v: true, l: t("byClient") },
            { v: false, l: t("flat") },
          ].map((o) => (
            <button
              key={o.l}
              type="button"
              onClick={() => setParClient(o.v)}
              className={`safe-zoom min-h-tap px-3 text-[12.5px] transition-colors ${
                parClient === o.v ? "safe-action-degrade font-medium text-white" : "text-si-muted"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="py-8 text-[13px] text-si-muted">
          {lignes.length === 0 ? t("emptyAll") : t("emptyForFilters")}
        </p>
      ) : parClient ? (
        <div className="space-y-6">
          {groupes.map((g) => (
            <section key={g.clientId}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-si-ink pb-1.5">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.09em] text-si-ink">
                  {g.clientNom}
                </h2>
                <span className="text-[12px] text-si-muted">
                  {t("matterCount", { count: g.nbDossiers })}
                </span>
                <span className="ml-auto font-mono text-[14px] font-medium tabular-nums text-si-ink">
                  {formatCurrency(g.aRefacturer)}
                </span>
              </div>
              <div className="rounded-b-lg border border-t-0 border-si-line bg-si-surface px-4 pb-2">
                <Tableau
                  lignes={g.lignes}
                  montrerDossier
                  canWrite={canWrite}
                  enCours={enCours}
                  radier={radier}
                  etatDeLaLigne={etatDeLaLigne}
                  jour={jour}
                  formatCurrency={formatCurrency}
                  t={t}
                />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-si-line bg-si-surface px-4 pb-2">
          <Tableau
            lignes={visibles}
            montrerDossier
            montrerClient
            canWrite={canWrite}
            enCours={enCours}
            radier={radier}
            etatDeLaLigne={etatDeLaLigne}
            jour={jour}
            formatCurrency={formatCurrency}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

const enTete =
  "px-2 pb-2 pt-3 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-si-muted";

function Tableau({
  lignes,
  montrerClient = false,
  canWrite,
  enCours,
  radier,
  etatDeLaLigne,
  jour,
  formatCurrency,
  t,
}: {
  lignes: DeboursLigne[];
  montrerDossier: boolean;
  montrerClient?: boolean;
  canWrite: boolean;
  enCours: boolean;
  radier: (id: string) => void;
  etatDeLaLigne: (l: DeboursLigne) => { texte: string; ton: "vert" | "ambre" | "neutre" };
  jour: (iso: string) => string;
  formatCurrency: (n: number) => string;
  t: (cle: string) => string;
}) {
  return (
    /* Colonnes à largeur fixe : sous ~860 px, c'est la PAGE qui se mettrait à
       défiler de gauche à droite. */
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[880px]">
        <thead>
          <tr className="border-b border-si-line">
            <th className={enTete}>{t("colDate")}</th>
            <th className={enTete}>{t("colDescription")}</th>
            {montrerClient && <th className={enTete}>{t("colClient")}</th>}
            <th className={enTete}>{t("colMatter")}</th>
            <th className={`${enTete} text-center`}>{t("colTaxable")}</th>
            <th className={`${enTete} text-right`}>{t("colAmount")}</th>
            <th className={enTete}>{t("colState")}</th>
            <th className={enTete}>
              <span className="sr-only">{t("colActions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => {
            const e = etatDeLaLigne(l);
            return (
              <tr key={l.id} className="border-b border-si-line last:border-b-0">
                <td className="whitespace-nowrap px-2 py-2.5 text-[13px] text-si-muted">
                  {jour(l.date)}
                </td>
                <td className="px-2 py-2.5 text-[13.5px] text-si-ink">
                  {l.description}
                  {l.quantite !== 1 && (
                    <span className="ml-2 text-[12px] text-si-muted">× {l.quantite}</span>
                  )}
                </td>
                {montrerClient && (
                  <td className="px-2 py-2.5 text-[13px] text-si-body">{l.clientNom}</td>
                )}
                <td className="px-2 py-2.5 text-[12px]">
                  <Link
                    href={routes.dossier(l.dossierId)}
                    className="text-si-muted underline-offset-2 hover:text-si-ink hover:underline"
                  >
                    {l.dossierLabel}
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-center text-[13px]">
                  {l.taxable ? (
                    <span className="text-si-body">{t("yes")}</span>
                  ) : (
                    <span className="text-si-subtle">{t("no")}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right text-[13.5px] font-medium tabular-nums text-si-ink">
                  {formatCurrency(l.montant)}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-[12px]">
                  <span
                    className={`mr-1.5 inline-block h-[5px] w-[5px] rounded-full align-middle ${
                      e.ton === "vert"
                        ? "bg-si-verified"
                        : e.ton === "ambre"
                          ? "bg-si-amber"
                          : "bg-si-subtle"
                    }`}
                    aria-hidden
                  />
                  <span
                    className={
                      e.ton === "vert"
                        ? "text-si-verified"
                        : e.ton === "ambre"
                          ? "text-si-amber-ink"
                          : "text-si-subtle"
                    }
                  >
                    {e.texte}
                  </span>
                  {l.factureNumero && l.factureId && (
                    <>
                      <span className="px-1 text-si-line">·</span>
                      <Link
                        href={routes.facturationFactureEdit(l.factureId)}
                        className="text-si-muted underline-offset-2 hover:text-si-ink hover:underline"
                      >
                        {l.factureNumero}
                      </Link>
                    </>
                  )}
                </td>
                <td className="px-2 py-2.5 text-right">
                  {/* Radier, jamais supprimer : le cabinet a bel et bien sorti
                      l'argent, il renonce seulement à le récupérer. La doctrine
                      comptable bannit « supprimer » et le code la respecte.

                      Le menu vient de `RowMenu` : un registre défile dans son
                      propre conteneur, et un menu positionné en absolu s'y
                      ferait rogner sur les dernières lignes. */}
                  {canWrite && resteARefacturer(l) && (
                    <RowMenu label={t("colActions")} describedBy={l.description}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => radier(l.id)}
                        disabled={enCours}
                        className={rowMenuItemClass}
                      >
                        <Ban className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
                        {t("writeOff")}
                      </button>
                      <p className="px-3 pb-1.5 pt-1 text-[11px] leading-snug text-si-muted">
                        {t("writeOffHint")}
                      </p>
                    </RowMenu>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
