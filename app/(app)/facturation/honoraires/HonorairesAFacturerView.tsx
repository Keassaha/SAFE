"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RowMenu, rowMenuItemClass } from "@/components/ui/RowMenu";
import {
  RegistreAucunResultat,
  RegistreBarreOutils,
  RegistreFeuille,
  RegistrePagination,
  RegistrePlainHeader,
  registreCellClass,
  registreCellMutedClass,
  registreCellNumClass,
  registreChampClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreRowClass,
  registreSelectClass,
  usePaginationLocale,
} from "@/components/ui/registre";
import { routes } from "@/lib/routes";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import { useFacturationHonoraires, type HonorairesRow } from "@/lib/hooks/useFacturation";
import { useTempsContext } from "@/lib/hooks/useTemps";
import { SEUIL_FACTURATION_DEFAUT } from "@/lib/cabinet-config";
import { DORMANT_DAYS } from "@/lib/services/finance/unbilled-time";

/**
 * Honoraires à facturer : une ligne par dossier, un bouton par ligne.
 *
 * La section fondait tous les dossiers d'un client dans une seule ligne, avec
 * un seul bouton : quinze fiches sur trois dossiers ne donnaient qu'une option.
 * Désormais chaque dossier porte son « Préparer la facture ». Le client reste
 * lisible : une rangée le nomme, additionne ses dossiers, et offre en un lien
 * la facture unique pour tous, qui est l'ancien comportement.
 *
 * Le seuil vient du cabinet (Paramètres › Facturation), plus d'une constante.
 * Un dossier sous le seuil reste visible, en gris, au lieu d'être bloqué sans
 * explication. Décision CEO du 2026-09-12, image validée le même jour.
 */

type Periode = "" | "mois" | "trois_mois" | "annee";

function debutPeriode(p: Periode, now = new Date()): Date | undefined {
  if (p === "mois") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (p === "trois_mois") return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  if (p === "annee") return new Date(now.getFullYear(), 0, 1);
  return undefined;
}

function urlNouvelleFacture(row: HonorairesRow): string {
  const params = new URLSearchParams({ clientId: row.clientId });
  if (row.timeEntryIds.length) params.set("timeEntryIds", row.timeEntryIds.join(","));
  if (row.expenseIds.length) params.set("expenseIds", row.expenseIds.join(","));
  if (row.deboursIds.length) params.set("deboursIds", row.deboursIds.join(","));
  if (row.registreTacheIds.length) params.set("registreTacheIds", row.registreTacheIds.join(","));
  return `${routes.facturationFactureNouvelle}?${params.toString()}`;
}

interface HonorairesAFacturerViewProps {
  cabinetId: string;
}

export function HonorairesAFacturerView({ cabinetId }: HonorairesAFacturerViewProps) {
  const router = useRouter();
  const { formatCurrency } = useFormatteurs();
  const t = useTranslations("billingUi");
  const tc = useTranslations("common");

  const [recherche, setRecherche] = useState("");
  const [clientId, setClientId] = useState("");
  const [userId, setUserId] = useState("");
  const [periode, setPeriode] = useState<Periode>("");

  const filtres = useMemo(
    () => ({
      ...(userId ? { userId } : {}),
      ...(debutPeriode(periode) ? { dateFrom: debutPeriode(periode) } : {}),
    }),
    [userId, periode],
  );

  const { data, isLoading } = useFacturationHonoraires(filtres);
  const { data: contexte } = useTempsContext(cabinetId);
  const seuil = data?.seuil ?? SEUIL_FACTURATION_DEFAUT;
  const users = contexte?.users ?? [];

  // Le filtre client se fait ici : côté API, `clientId` bascule la réponse
  // en détail d'un seul client, ce n'est pas un filtre de liste.
  const clients = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of data?.rows ?? []) m.set(r.clientId, r.clientName);
    return Array.from(m, ([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [data?.rows]);

  const rows = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (data?.rows ?? []).filter((r) => {
      if (clientId && r.clientId !== clientId) return false;
      if (!q) return true;
      return [r.clientName, r.dossierNumero, r.dossierIntitule]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q));
    });
  }, [data?.rows, clientId, recherche]);

  const pageRows = usePaginationLocale(rows);
  const nbClients = new Set(rows.map((r) => r.clientId)).size;
  const nbFiches = rows.reduce((s, r) => s + r.count, 0);
  const totalGeneral = rows.reduce((s, r) => s + r.totalAFacturer, 0);

  // Groupes client sur la page courante : la rangée de tête porte le nom, le
  // nombre de dossiers dans TOUTE la liste (pas seulement la page), et le total.
  const parClient = useMemo(() => {
    const m = new Map<string, { nb: number; total: number }>();
    for (const r of rows) {
      const g = m.get(r.clientId) ?? { nb: 0, total: 0 };
      g.nb += 1;
      g.total += r.totalAFacturer;
      m.set(r.clientId, g);
    }
    return m;
  }, [rows]);

  const remettreEnPageUn = () => pageRows.setPage(1);

  return (
    <RegistreFeuille ariaLabel={t("feesToBill")}>
      <RegistreBarreOutils
        recherche={
          <input
            type="search"
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              remettreEnPageUn();
            }}
            placeholder={t("searchDossierOrClient")}
            aria-label={t("searchDossierOrClient")}
            className={`${registreChampClass} w-full px-3`}
          />
        }
        filtres={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                remettreEnPageUn();
              }}
              aria-label={t("client")}
              className={registreSelectClass}
            >
              <option value="">{t("filterClientAll")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
            <select
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                remettreEnPageUn();
              }}
              aria-label={t("lawyer")}
              className={registreSelectClass}
            >
              <option value="">{t("filterLawyerAll")}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
            <select
              value={periode}
              onChange={(e) => {
                setPeriode(e.target.value as Periode);
                remettreEnPageUn();
              }}
              aria-label={t("period")}
              className={registreSelectClass}
            >
              <option value="">{t("filterPeriodAll")}</option>
              <option value="mois">{t("periodThisMonth")}</option>
              <option value="trois_mois">{t("periodThreeMonths")}</option>
              <option value="annee">{t("periodThisYear")}</option>
            </select>
            <span className="text-[13px] text-si-muted">
              {t("dossiersClientsCount", { dossiers: rows.length, clients: nbClients })}
            </span>
          </div>
        }
      />

      {isLoading ? (
        <p className="px-6 py-10 text-center text-sm text-si-muted" aria-live="polite">
          {tc("loading")}
        </p>
      ) : rows.length === 0 ? (
        <RegistreAucunResultat message={t("noFeesForCriteria")} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className={registreHeadRowClass}>
                  <th className={`${registreHeadCellClass} w-[34%]`}><RegistrePlainHeader label={t("colClientDossier")} /></th>
                  <th className={registreHeadCellClass}><RegistrePlainHeader label={t("colFiches")} align="right" /></th>
                  <th className={registreHeadCellClass}><RegistrePlainHeader label={t("colHeures")} align="right" /></th>
                  <th className={registreHeadCellClass}><RegistrePlainHeader label={t("colHonoraires")} align="right" /></th>
                  <th className={registreHeadCellClass}><RegistrePlainHeader label={t("colDebours")} align="right" /></th>
                  <th className={registreHeadCellClass}><RegistrePlainHeader label={t("colTotalEstime")} align="right" /></th>
                  <th className={registreHeadCellClass}><RegistrePlainHeader label={t("colPlusAncienne")} align="right" /></th>
                  <th className={registreHeadCellClass}>
                    <span className="sr-only">{t("actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.tranche.map((row, i) => {
                  const precedent = pageRows.tranche[i - 1];
                  const groupe = parClient.get(row.clientId) ?? { nb: 1, total: row.totalAFacturer };
                  /* La tête de groupe ne paraît QUE si le client a plusieurs
                     dossiers. À un seul, elle répétait le total de la ligne du
                     dessous, annonçait « 1 dossier » qui ne groupe rien, et ne
                     portait pas le lien de facture groupée, réservé à deux
                     dossiers et plus. Son seul apport, le nom du client, passe
                     sur la ligne du dossier. Demande CEO du 2026-09-14. */
                  const premierDuClient = !precedent || precedent.clientId !== row.clientId;
                  const teteDeGroupe = premierDuClient && groupe.nb > 1;
                  /* Sans tête de groupe, la ligne porte elle-même le nom du
                     client : il n'est écrit nulle part ailleurs dans ce
                     tableau. Même grammaire que les autres registres, le client
                     au-dessus de sa référence. */
                  const porteLeClient = groupe.nb === 1;
                  const libres =
                    row.timeEntryIds.length +
                    row.expenseIds.length +
                    row.deboursIds.length +
                    row.registreTacheIds.length;
                  const bloque = libres === 0 || row.sousSeuil;
                  const raison =
                    libres === 0
                      ? t("allItemsAlreadyDrafted")
                      : row.sousSeuil
                        ? t("minToBillTitle", { amount: formatCurrency(seuil) })
                        : undefined;
                  const brouillon = row.draftInvoiceIds[0] ?? null;
                  const libelleDossier = row.dossierIntitule ?? t("noDossier");
                  return (
                    <RowFragment key={row.key}>
                      {teteDeGroupe ? (
                        <tr className="border-b border-si-line bg-si-canvas">
                          <td colSpan={5} className="px-3 py-2 text-[13px]">
                            <span className="font-medium text-si-ink">{row.clientName}</span>
                            <span className="text-si-muted"> · {t("dossiersOfClient", { count: groupe.nb })}</span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-[13px] tabular-nums text-si-ink">
                            {formatCurrency(groupe.total)}
                          </td>
                          <td colSpan={2} className="px-3 py-2 text-right text-[13px]">
                            {groupe.nb > 1 ? (
                              <Link
                                href={`${routes.facturationFactureNouvelle}?clientId=${encodeURIComponent(row.clientId)}`}
                                className="text-si-body underline decoration-si-line underline-offset-2 transition-colors hover:text-si-ink hover:decoration-si-ink-strong"
                              >
                                {t("oneInvoiceForDossiers", { count: groupe.nb })}
                              </Link>
                            ) : null}
                          </td>
                        </tr>
                      ) : null}
                      <tr className={registreRowClass}>
                        <td className={registreCellClass}>
                          {porteLeClient ? (
                            <>
                              <span className="block truncate text-[14px] font-medium leading-5 text-si-ink">
                                {row.clientName}
                              </span>
                              <span className="mt-0.5 block truncate text-[12px] leading-4 text-si-muted">
                                {row.dossierNumero ? (
                                  <span className="font-mono tabular-nums">{row.dossierNumero} · </span>
                                ) : null}
                                {libelleDossier}
                                {row.avocats.length > 0 ? ` · ${row.avocats.join(", ")}` : ""}
                              </span>
                            </>
                          ) : (
                            <>
                              {/* Le client est déjà nommé par la tête de groupe,
                                  juste au-dessus : le répéter à chaque ligne du
                                  groupe le dirait trois fois. */}
                              <span className="block truncate text-[13px] text-si-muted">
                                {row.dossierNumero ? (
                                  <span className="font-mono tabular-nums">{row.dossierNumero} · </span>
                                ) : null}
                                {libelleDossier}
                                {row.avocats.length > 0 ? ` · ${row.avocats.join(", ")}` : ""}
                              </span>
                            </>
                          )}
                        </td>
                        <td className={registreCellNumClass}>{row.count}</td>
                        <td className={registreCellNumClass}>
                          {row.totalHeures.toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h
                        </td>
                        <td className={registreCellNumClass}>{formatCurrency(row.totalHonoraires)}</td>
                        <td className={`${registreCellNumClass} ${row.totalDebours === 0 ? "text-si-muted" : ""}`}>
                          {formatCurrency(row.totalDebours)}
                        </td>
                        <td className={`${registreCellNumClass} ${row.sousSeuil ? "text-si-muted" : "font-medium"}`}>
                          {formatCurrency(row.totalAFacturer)}
                          {row.sousSeuil ? (
                            <span className="mt-0.5 block font-sans text-[12px] text-si-muted">{t("underThreshold")}</span>
                          ) : null}
                        </td>
                        <td
                          className={`${registreCellNumClass} ${
                            row.ageMaxJours > DORMANT_DAYS ? "font-medium text-si-amber-ink" : ""
                          }`}
                        >
                          {t("daysShort", { days: row.ageMaxJours })}
                        </td>
                        <td className={`${registreCellMutedClass} whitespace-nowrap text-right`}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={bloque}
                              title={raison}
                              onClick={() => router.push(urlNouvelleFacture(row))}
                            >
                              {t("prepareInvoice")}
                            </Button>
                            <RowMenu label={t("actions")} describedBy={libelleDossier}>
                              <Link
                                role="menuitem"
                                href={routes.facturationHonorairesClient(row.clientId)}
                                className={rowMenuItemClass}
                              >
                                <Eye className="h-4 w-4" aria-hidden /> {t("viewClientDetail")}
                              </Link>
                              {brouillon ? (
                                <Link
                                  role="menuitem"
                                  href={routes.facturationFactureApercu(brouillon)}
                                  className={rowMenuItemClass}
                                >
                                  <FileText className="h-4 w-4" aria-hidden /> {t("viewDraftInvoice")}
                                </Link>
                              ) : null}
                            </RowMenu>
                          </div>
                        </td>
                      </tr>
                    </RowFragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <RegistrePagination
            totalCount={pageRows.total}
            currentPage={pageRows.page}
            resume={t("footerSummary", {
              dossiers: rows.length,
              fiches: nbFiches,
              total: formatCurrency(totalGeneral),
            })}
            labelPage={tc("paginationPage", { current: pageRows.page, total: pageRows.totalPages })}
            labelPrecedent={tc("previous")}
            labelSuivant={tc("next")}
            onPageChange={pageRows.setPage}
          />
        </>
      )}
    </RegistreFeuille>
  );
}

/** Deux `<tr>` sous une même clé : la tête de groupe et la ligne du dossier. */
function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
