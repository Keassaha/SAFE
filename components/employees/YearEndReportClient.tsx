"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileDown, AlertCircle, CheckCircle2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { YearEndSummary, YearEndEmployeeSummary } from "@/lib/payroll/year-end-service";

interface YearEndReportClientProps {
  summary: YearEndSummary;
  availableYears: number[];
  selectedYear: number;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(n);
}

function EmployeeRow({ emp }: { emp: YearEndEmployeeSummary }) {
  const [open, setOpen] = useState(false);
  const isT4 = emp.employmentType === "employee";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Ligne résumé */}
      <button
        type="button"
        className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-neutral-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <UserCircle2 className="h-9 w-9 flex-shrink-0 text-neutral-300" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px] text-neutral-900">{emp.fullName}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                isT4
                  ? "bg-[#EBF4EF] text-[#1F6142]"
                  : "bg-[#FEF3C7] text-[#92400E]"
              }`}
            >
              {isT4 ? "T4 EMPLOYÉ" : "T4A CONTRACTUEL"}
            </span>
          </div>
          <p className="text-[12px] text-neutral-500 mt-0.5">
            {emp.email}
            {emp.sinMasked && (
              <span className="ml-3 font-mono">NAS : {emp.sinMasked}</span>
            )}
            {!emp.sinMasked && (
              <span className="ml-3 text-amber-600">NAS non renseigné</span>
            )}
          </p>
        </div>

        {/* Totaux résumés */}
        <div className="hidden sm:flex items-center gap-6 flex-shrink-0 text-right">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Brut</p>
            <p className="text-[13px] font-semibold text-neutral-800">{fmt(emp.totalGross)}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Retenues</p>
            <p className="text-[13px] font-medium text-neutral-600">{fmt(emp.totalDeductions)}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Net versé</p>
            <p className="text-[13px] font-semibold text-forest-700">{fmt(emp.totalNet)}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Périodes</p>
            <p className="text-[13px] text-neutral-600">{emp.payslipCount}</p>
          </div>
        </div>

        <span className="text-neutral-400 text-sm ml-2">{open ? "▲" : "▼"}</span>
      </button>

      {/* Détail des périodes */}
      {open && (
        <div className="border-t border-neutral-100 px-4 pb-4 overflow-x-auto">
          {emp.sinMasked === null && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Le NAS de cet employé n&apos;est pas renseigné. Le PDF sera incomplet.
              Ajoutez-le dans la fiche employé &rarr; onglet Paie.
            </div>
          )}
          <table className="mt-3 w-full text-[12px]">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 text-[11px] uppercase tracking-wide">
                <th className="text-left pb-2 font-medium">Période</th>
                <th className="text-right pb-2 font-medium">Date paiement</th>
                <th className="text-right pb-2 font-medium">Heures</th>
                <th className="text-right pb-2 font-medium">Taux</th>
                <th className="text-right pb-2 font-medium">Brut</th>
                <th className="text-right pb-2 font-medium">Retenues</th>
                <th className="text-right pb-2 font-medium text-forest-700">Net</th>
              </tr>
            </thead>
            <tbody>
              {emp.payslips.map((ps) => (
                <tr
                  key={ps.payslipId}
                  className="border-b border-neutral-50 hover:bg-neutral-50"
                >
                  <td className="py-1.5 text-neutral-700">{ps.periodLabel}</td>
                  <td className="py-1.5 text-right text-neutral-500">
                    {new Date(ps.paymentDate).toLocaleDateString("fr-CA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-1.5 text-right text-neutral-600">
                    {ps.hoursWorked.toFixed(2)} h
                  </td>
                  <td className="py-1.5 text-right text-neutral-500">
                    {fmt(ps.hourlyRate)}/h
                  </td>
                  <td className="py-1.5 text-right text-neutral-700">{fmt(ps.grossPay)}</td>
                  <td className="py-1.5 text-right text-neutral-500">{fmt(ps.deductions)}</td>
                  <td className="py-1.5 text-right font-semibold text-forest-700">
                    {fmt(ps.netPay)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-semibold text-[12px]">
                <td className="pt-2 pb-1 text-neutral-600">
                  Total {emp.payslipCount} paiement{emp.payslipCount > 1 ? "s" : ""}
                </td>
                <td />
                <td className="pt-2 pb-1 text-right text-neutral-700">
                  {emp.totalHours.toFixed(2)} h
                </td>
                <td />
                <td className="pt-2 pb-1 text-right text-neutral-800">{fmt(emp.totalGross)}</td>
                <td className="pt-2 pb-1 text-right text-neutral-600">
                  {fmt(emp.totalDeductions)}
                </td>
                <td className="pt-2 pb-1 text-right text-forest-700">{fmt(emp.totalNet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export function YearEndReportClient({
  summary,
  availableYears,
  selectedYear,
}: YearEndReportClientProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const handleYearChange = (y: string) => {
    router.push(`/employees/year-end?year=${y}`);
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/employees/year-end/pdf?year=${selectedYear}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Erreur lors de la génération du PDF.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recap-paie-${selectedYear}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const missingNas = summary.employees.filter((e) => !e.sinMasked);

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-medium text-neutral-600" htmlFor="year-select">
            Année :
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          className="gap-2"
          disabled={downloading || summary.employees.length === 0}
          onClick={handleDownloadPdf}
        >
          <FileDown className="h-4 w-4" />
          {downloading ? "Génération…" : `Exporter PDF ${selectedYear}`}
        </Button>
      </div>

      {/* Avertissement NAS manquants */}
      {missingNas.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <div className="text-[13px] text-amber-700">
            <span className="font-semibold">
              {missingNas.length} employé{missingNas.length > 1 ? "s" : ""} sans NAS :
            </span>{" "}
            {missingNas.map((e) => e.fullName).join(", ")}.{" "}
            Le PDF sera incomplet. Ajoutez le NAS dans la fiche employé &rarr; onglet Paie.
          </div>
        </div>
      )}

      {/* Résumé global */}
      {summary.employees.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Employés / contractuels"
              value={String(summary.employees.length)}
            />
            <StatCard
              label="Brut annuel total"
              value={fmt(summary.employees.reduce((s, e) => s + e.totalGross, 0))}
            />
            <StatCard
              label="Retenues totales"
              value={fmt(summary.employees.reduce((s, e) => s + e.totalDeductions, 0))}
            />
            <StatCard
              label="Net versé total"
              value={fmt(summary.employees.reduce((s, e) => s + e.totalNet, 0))}
              highlight
            />
          </div>

          {/* Liste des employés */}
          <div className="space-y-3">
            {summary.employees.map((emp) => (
              <EmployeeRow key={emp.employeeId} emp={emp} />
            ))}
          </div>

          {/* Note de bas de page */}
          <div className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
            <p className="text-[12px] text-neutral-500">
              Ce récapitulatif est un <strong>document interne</strong> à remettre à votre
              comptable ou à entrer dans votre logiciel de paie (Payworks, Desjardins Paie, etc.).
              SAFE ne calcule pas les retenues CPP/AE/impôt et ne transmet pas à l&apos;ARC.
              Seules les paies dont le statut est <em>payé</em> apparaissent ici.
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
          <p className="text-[14px] font-medium text-neutral-600">
            Aucun paiement de paie enregistré pour {selectedYear}.
          </p>
          <p className="mt-1 text-[13px] text-neutral-400">
            Les paies doivent avoir le statut <em>payé</em> pour apparaître ici.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        highlight
          ? "border-forest-200 bg-[#EBF4EF]"
          : "border-neutral-200 bg-white"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p
        className={`mt-1 text-[18px] font-bold ${
          highlight ? "text-forest-700" : "text-neutral-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
