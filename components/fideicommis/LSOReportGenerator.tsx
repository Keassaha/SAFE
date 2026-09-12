"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCabinetProvince } from "@/components/providers/CabinetProvinceProvider";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";
import {
  RegistreFeuille,
  registreCellClass,
  registreCellMutedClass,
  registreCellNumClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreRowClass,
  registreSelectClass,
  RegistrePlainHeader,
} from "@/components/ui/registre";

type ReportType = "monthly" | "quarterly" | "annual";

/** Le mois précédent, au format que l'API attend (« AAAA-MM »). */
function moisPrecedent(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const dtClasse = "text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted";
const chiffreClasse = "font-mono text-[18px] font-medium leading-[24px] tabular-nums text-si-ink sm:text-[20px] sm:leading-[26px]";

interface ReportData {
  cabinetName: string;
  periode: string;
  type: string;
  generatedAt: string;
  generatedBy: string;
  soldeOuverture: number;
  soldeFermeture: number;
  totalDeposits: number;
  totalWithdrawals: number;
  transactions: {
    date: string;
    type: string;
    description: string | null;
    dossier: string | null;
    client: string | null;
    amount: number;
    balance: number;
  }[];
  reconciliation: {
    soldeBancaire: number;
    soldeRegistre: number;
    ecart: number;
    status: string;
    certifiedAt: string | null;
    certifiedBy: string | null;
  } | null;
  interetsLFO: number;
  nbTransactions: number;
  nbActiveTrustAccounts: number;
  annualReconciliations: {
    months: { periode: string; status: string; certified: boolean; certifiedAt: string | null; ecart: number }[];
    allCertified: boolean;
    missingOrUncertifiedMonths: string[];
    totalEcart: number;
  } | null;
}

interface SavedReport {
  id: string;
  periode: string;
  type: string;
  generatedAt: string;
  status: string;
  generatedBy: { nom: string };
  reconciliation: { status: string; certifiedAt: string | null } | null;
}

export function LSOReportGenerator({
  canGenerate = false,
  canCertify = false,
}: {
  canGenerate?: boolean;
  canCertify?: boolean;
}) {
  const queryClient = useQueryClient();
  const { formatCurrency } = useFormatteurs();
  const copy = getTrustRegulatorCopy(useCabinetProvince());
  const [periode, setPeriode] = useState(moisPrecedent);
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [preview, setPreview] = useState<ReportData | null>(null);
  const [certifyError, setCertifyError] = useState<string | null>(null);
  /* Rapport dont on demande la signature : ouvre la fenêtre de SAFE, plus la
     boîte grise du navigateur. */
  const [aSigner, setASigner] = useState<SavedReport | null>(null);

  /* La période se choisit, elle ne se tape plus : « 2026-04 » à la main donnait
     un rapport vide à la première faute de frappe. Vingt-quatre mois pour le
     mensuel et le trimestriel (le trimestre est celui du mois choisi), cinq
     exercices pour l'annuel. */
  const periodes = useMemo(() => {
    const locale = copy.isQuebec ? "fr-CA" : "en-CA";
    const fmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
    const now = new Date();
    if (reportType === "annual") {
      return Array.from({ length: 5 }, (_, i) => {
        const y = now.getFullYear() - i;
        return { value: `${y}-01`, label: String(y) };
      });
    }
    return Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = fmt.format(d);
      return {
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      };
    });
  }, [reportType, copy.isQuebec]);

  const changerType = (t: ReportType) => {
    setReportType(t);
    setPreview(null);
    if (t === "annual") setPeriode(`${new Date().getFullYear()}-01`);
    else if (periode.endsWith("-01") && reportType === "annual") setPeriode(moisPrecedent());
  };

  const libelleType = (t: string) =>
    t === "monthly"
      ? copy.reportTypeMonthly
      : t === "quarterly"
        ? copy.reportTypeQuarterly
        : t === "annual"
          ? copy.reportTypeAnnual
          : t;
  const libellePeriode = (p: string, t: string) => {
    if (t === "annual") return p.slice(0, 4);
    const trouve = periodes.find((x) => x.value === p);
    if (trouve) return trouve.label;
    const [a, m] = p.split("-").map(Number);
    if (!a || !m) return p;
    const s = new Intl.DateTimeFormat(copy.isQuebec ? "fr-CA" : "en-CA", { month: "long", year: "numeric" }).format(new Date(a, m - 1, 1));
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const dateCourte = (iso: string) => new Date(iso).toLocaleDateString(copy.isQuebec ? "fr-CA" : "en-CA");

  const { data: savedReports } = useQuery({
    queryKey: ["lso-reports"],
    queryFn: async () => {
      const res = await fetch("/api/fideicommis/lso-report");
      if (!res.ok) throw new Error("Error loading reports");
      return res.json() as Promise<{ reports: SavedReport[] }>;
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/fideicommis/lso-report?preview=true&periode=${periode}&type=${reportType}`
      );
      if (!res.ok) throw new Error("Error generating preview");
      return res.json() as Promise<ReportData>;
    },
    onSuccess: (data) => setPreview(data),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/fideicommis/lso-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periode, type: reportType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error saving report");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lso-reports"] });
      setPreview(null);
    },
  });

  const certifyMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`/api/fideicommis/lso-report/${reportId}/certify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Erreur de certification");
      }
      return res.json();
    },
    onSuccess: () => {
      setCertifyError(null);
      setASigner(null);
      queryClient.invalidateQueries({ queryKey: ["lso-reports"] });
    },
    onError: (err: Error) => setCertifyError(err.message),
  });

  const rapports = savedReports?.reports ?? [];

  return (
    <div className="space-y-6">
      {/* Le choix de la période et du type, à côté du titre : une action pleine
          tant qu'il n'y a pas d'aperçu, « Préparer l'aperçu ». */}
      {canGenerate && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-si-muted">
            {reportType === "annual" ? copy.reportPeriodYear : copy.reportFieldPeriod.replace(" (AAAA-MM)", "").replace(" (YYYY-MM)", "")}
            <select
              value={periode}
              onChange={(e) => {
                setPeriode(e.target.value);
                setPreview(null);
              }}
              className={registreSelectClass}
            >
              {periodes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-si-muted">
            {copy.reportFieldType}
            <select
              value={reportType}
              onChange={(e) => changerType(e.target.value as ReportType)}
              className={registreSelectClass}
            >
              <option value="monthly">{copy.reportTypeMonthly}</option>
              <option value="quarterly">{copy.reportTypeQuarterly}</option>
              <option value="annual">{copy.reportTypeAnnual}</option>
            </select>
          </label>
          <Button
            type="button"
            variant={preview ? "secondary" : "primary"}
            onClick={() => previewMutation.mutate()}
            disabled={!periode || previewMutation.isPending}
          >
            {previewMutation.isPending ? copy.reportLoading : copy.reportPreparePreview}
          </Button>
        </div>
      )}

      {/* L'aperçu : une barre de chiffres, puis le journal dans la grammaire du
          registre. Quatre boîtes de couleur disaient quatre montants. */}
      {preview && (
        <section className="safe-feuille overflow-hidden" aria-label={copy.reportStatementTitle}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-si-line px-5 py-3.5">
            <h2 className="text-[16px] font-medium text-si-ink">
              {copy.reportStatementTitle} · {libellePeriode(preview.periode, preview.type)}
            </h2>
            <span className="text-[12px] text-si-muted">{copy.reportPreviewUnsaved}</span>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-si-line px-5 py-4 min-[400px]:grid-cols-2 lg:flex lg:flex-wrap lg:gap-x-10">
            <div className="min-w-0">
              <dt className={dtClasse}>{copy.reportOpeningBalance}</dt>
              <dd className={`mt-1.5 ${chiffreClasse}`}>{formatCurrency(preview.soldeOuverture)}</dd>
            </div>
            <div className="min-w-0">
              <dt className={dtClasse}>{copy.reportTotalDeposits}</dt>
              <dd className={`mt-1.5 ${chiffreClasse}`}>{formatCurrency(preview.totalDeposits)}</dd>
            </div>
            <div className="min-w-0">
              <dt className={dtClasse}>{copy.reportTotalWithdrawals}</dt>
              <dd className={`mt-1.5 ${chiffreClasse}`}>{formatCurrency(preview.totalWithdrawals)}</dd>
            </div>
            <div className="min-w-0">
              <dt className={dtClasse}>{copy.reportClosingBalance}</dt>
              <dd className={`mt-1.5 ${chiffreClasse}`}>{formatCurrency(preview.soldeFermeture)}</dd>
            </div>
            <div className="min-w-0">
              <dt className={dtClasse}>{copy.reportActiveAccounts}</dt>
              <dd className={`mt-1.5 ${chiffreClasse}`}>{preview.nbActiveTrustAccounts}</dd>
            </div>
            {preview.reconciliation && (
              <div className="min-w-0">
                <dt className={dtClasse}>{copy.threeWayReconciliation}</dt>
                <dd className="mt-1.5 text-[14px] leading-[22px] text-si-ink">
                  {copy.reportBankBalance} <span className="font-mono tabular-nums">{formatCurrency(preview.reconciliation.soldeBancaire)}</span>
                  {" · "}
                  {copy.reportRegisterBalance} <span className="font-mono tabular-nums">{formatCurrency(preview.reconciliation.soldeRegistre)}</span>
                  <br />
                  {copy.reportDiscrepancy}{" "}
                  <span
                    className={`font-mono tabular-nums ${
                      preview.reconciliation.ecart === 0 ? "text-si-verified" : "text-si-danger-ink"
                    }`}
                  >
                    {formatCurrency(preview.reconciliation.ecart)}
                  </span>
                  {preview.reconciliation.certifiedBy && (
                    <span className="block text-[12px] text-si-muted">
                      {copy.reportCertifiedBy(preview.reconciliation.certifiedBy)}
                      {preview.reconciliation.certifiedAt && copy.reportCertifiedOn(dateCourte(preview.reconciliation.certifiedAt))}
                    </span>
                  )}
                </dd>
              </div>
            )}
            {preview.interetsLFO > 0 && (
              <div className="min-w-0">
                <dt className={dtClasse}>{copy.foundationInterestLabel.replace(/\s*:\s*$/, "")}</dt>
                <dd className={`mt-1.5 ${chiffreClasse}`}>{formatCurrency(preview.interetsLFO)}</dd>
              </div>
            )}
          </dl>

          {/* Annuel : les douze rapprochements de l'exercice. */}
          {preview.annualReconciliations && (
            <div className="border-b border-si-line px-5 py-4">
              <h3 className="text-[13px] font-medium text-si-ink">{copy.reportAnnualTitle}</h3>
              <p
                className={`mt-1 text-[13px] ${
                  preview.annualReconciliations.allCertified ? "text-si-verified" : "text-si-danger-ink"
                }`}
              >
                {preview.annualReconciliations.allCertified
                  ? copy.reportAnnualComplete(formatCurrency(preview.annualReconciliations.totalEcart))
                  : copy.reportAnnualIncomplete(
                      preview.annualReconciliations.missingOrUncertifiedMonths.length,
                      preview.annualReconciliations.missingOrUncertifiedMonths.join(", "),
                    )}
              </p>
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
                {preview.annualReconciliations.months.map((m) => (
                  <li
                    key={m.periode}
                    title={m.certifiedAt ? `${copy.reportMonthCertified} · ${dateCourte(m.certifiedAt)}` : m.status}
                    className={`rounded-md border px-2 py-1.5 text-center text-[12px] ${
                      m.certified ? "border-si-line text-si-verified" : "border-si-danger/40 text-si-danger-ink"
                    }`}
                  >
                    <span className="block font-mono font-medium">{m.periode.slice(5)}</span>
                    <span className="block">
                      {m.certified ? copy.reportMonthCertified : m.status === "missing" ? copy.reportMonthMissing : m.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
            <h3 className="text-[13px] font-medium text-si-ink">
              {copy.reportTransactionJournal(preview.nbTransactions)}
            </h3>
            {canGenerate && (
              <Button type="button" variant="primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? copy.reportSaving : copy.reportSave}
              </Button>
            )}
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-si-surface">
                <tr className={registreHeadRowClass}>
                  <th scope="col" className={`w-[112px] ${registreHeadCellClass}`}><RegistrePlainHeader label={copy.reportColDate} /></th>
                  <th scope="col" className={`w-[110px] ${registreHeadCellClass}`}><RegistrePlainHeader label={copy.reportColType} /></th>
                  <th scope="col" className={registreHeadCellClass}><RegistrePlainHeader label={copy.reportColClientMatter} /></th>
                  <th scope="col" className={registreHeadCellClass}><RegistrePlainHeader label={copy.reportColDescription} /></th>
                  <th scope="col" className={`w-[140px] ${registreHeadCellClass} text-right`}><RegistrePlainHeader label={copy.reportColAmount} align="right" /></th>
                  <th scope="col" className={`w-[150px] ${registreHeadCellClass} text-right`}><RegistrePlainHeader label={copy.reportColBalance} align="right" /></th>
                </tr>
              </thead>
              <tbody>
                {preview.transactions.map((tx, i) => (
                  <tr key={i} className={registreRowClass}>
                    <td className={`whitespace-nowrap ${registreCellMutedClass}`}>{tx.date}</td>
                    <td className={`whitespace-nowrap ${registreCellMutedClass} ${tx.type === "correction" ? "font-medium text-si-amber-ink" : ""}`}>
                      {tx.type === "deposit" ? copy.reportTotalDeposits.replace(/^Total (des |of )?/i, "") : tx.type === "withdrawal" ? copy.reportTotalWithdrawals.replace(/^Total (des |of )?/i, "") : tx.type}
                    </td>
                    <td className={registreCellClass}>
                      {tx.client && <span className="block text-[14px] font-medium leading-5">{tx.client}</span>}
                      {tx.dossier && <span className="block text-[12px] leading-4 text-si-muted">{tx.dossier}</span>}
                    </td>
                    <td className={registreCellMutedClass}>
                      <span className="block max-w-[36ch] truncate" title={tx.description ?? ""}>{tx.description || "—"}</span>
                    </td>
                    <td className={`whitespace-nowrap ${registreCellNumClass}`}>{formatCurrency(tx.amount)}</td>
                    <td className={`whitespace-nowrap ${registreCellNumClass}`}>{formatCurrency(tx.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Les rapports enregistrés, dans la grammaire du registre, avec des
          statuts en français : « final » et « certified » étaient les mots du code. */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium text-si-ink">{copy.reportSavedTitle}</h2>
          <span className="text-[13px] text-si-muted">{copy.reportsCount(rapports.length)}</span>
        </div>
        {certifyError && (
          <p className="text-sm text-si-danger-ink" role="alert">
            {certifyError}
          </p>
        )}
        <RegistreFeuille ariaLabel={copy.reportSavedTitle}>
          {rapports.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-si-muted">{copy.reportNoReports}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className={registreHeadRowClass}>
                    <th scope="col" className={registreHeadCellClass}><RegistrePlainHeader label={copy.reportColPeriod} /></th>
                    <th scope="col" className={registreHeadCellClass}><RegistrePlainHeader label={copy.reportColType} /></th>
                    <th scope="col" className={registreHeadCellClass}><RegistrePlainHeader label={copy.reportColGenerated} /></th>
                    <th scope="col" className={registreHeadCellClass}><RegistrePlainHeader label={copy.reportColBy} /></th>
                    <th scope="col" className={registreHeadCellClass}><RegistrePlainHeader label={copy.reportColReconciliation} /></th>
                    <th scope="col" className={registreHeadCellClass}><RegistrePlainHeader label={copy.reportColStatus} /></th>
                    {canCertify && (
                      <th scope="col" className={`${registreHeadCellClass} text-right`}>
                        <span className="sr-only">{copy.reportColAction}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rapports.map((r) => (
                    <tr key={r.id} className={registreRowClass}>
                      <td className={`${registreCellClass} font-medium`}>{libellePeriode(r.periode, r.type)}</td>
                      <td className={registreCellMutedClass}>{libelleType(r.type)}</td>
                      <td className={`whitespace-nowrap ${registreCellMutedClass}`}>{dateCourte(r.generatedAt)}</td>
                      <td className={registreCellMutedClass}>{r.generatedBy.nom}</td>
                      <td className={registreCellClass}>
                        {r.reconciliation ? (
                          <StatusBadge
                            label={r.reconciliation.status === "certified" ? copy.reportReconcCertified : copy.reportReconcToCertify}
                            variant={r.reconciliation.status === "certified" ? "success" : "warning"}
                          />
                        ) : (
                          <span className="text-si-muted">{copy.reportReconciliationNone}</span>
                        )}
                      </td>
                      <td className={registreCellClass}>
                        <StatusBadge
                          label={r.status === "final" ? copy.reportStatusFinal : copy.reportStatusDraft}
                          variant={r.status === "final" ? "success" : "neutral"}
                        />
                      </td>
                      {canCertify && (
                        <td className={`text-right ${registreCellClass}`}>
                          {r.status === "final" ? (
                            <span className="text-si-muted">—</span>
                          ) : (
                            <Button type="button" variant="secondary" size="sm" onClick={() => setASigner(r)} disabled={certifyMutation.isPending}>
                              {copy.reportSign}
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </RegistreFeuille>
      </div>

      <Modal open={aSigner !== null} onClose={() => setASigner(null)} title={copy.reportSignTitle}>
        <div className="space-y-4">
          {aSigner && (
            <p className="text-sm text-si-ink">
              {libellePeriode(aSigner.periode, aSigner.type)} · {libelleType(aSigner.type)}
            </p>
          )}
          <p className="text-sm text-si-muted">{copy.certificationStatement}</p>
          <p className="text-xs text-si-muted">{copy.reportSignIntro}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="tertiary" onClick={() => setASigner(null)} disabled={certifyMutation.isPending}>
              {copy.isQuebec ? "Annuler" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => aSigner && certifyMutation.mutate(aSigner.id)}
              disabled={certifyMutation.isPending}
            >
              {certifyMutation.isPending ? copy.reportSigning : copy.reportSignConfirm}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
