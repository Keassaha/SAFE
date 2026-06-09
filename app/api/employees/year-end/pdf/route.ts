import { NextResponse } from "next/server";
import type { DocumentProps } from "@react-pdf/renderer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManagePayroll } from "@/lib/auth/permissions";
import { getYearEndSummary } from "@/lib/payroll/year-end-service";
import type { UserRole } from "@prisma/client";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { YearEndSummary, YearEndEmployeeSummary } from "@/lib/payroll/year-end-service";

// ——— Styles PDF ———

const FOREST = "#1F3A2E";
const BODY = "#3F3F46";
const MUTED = "#71717A";
const BORDER = "#E4E4E7";
const T4_BG = "#EBF4EF";
const T4_COLOR = "#1F6142";
const T4A_BG = "#FEF3C7";
const T4A_COLOR = "#92400E";

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
  // En-tête
  header: { marginBottom: 20 },
  cabinetName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: FOREST },
  title: { fontSize: 11, color: MUTED, marginTop: 2 },
  year: { fontSize: 22, fontFamily: "Helvetica-Bold", color: FOREST, marginTop: 4 },
  disclaimer: {
    fontSize: 7.5,
    color: MUTED,
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 6,
    marginTop: 8,
  },
  // Carte employé
  empCard: {
    marginBottom: 16,
    border: `1px solid ${BORDER}`,
    borderRadius: 4,
    overflow: "hidden",
  },
  empHeader: {
    backgroundColor: "#F9FAFB",
    borderBottom: `1px solid ${BORDER}`,
    padding: "6 10",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  empName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: BODY },
  empMeta: { fontSize: 8.5, color: MUTED, marginTop: 1 },
  badge: { borderRadius: 2, padding: "2 5", fontSize: 8, fontFamily: "Helvetica-Bold" },
  badgeT4: { backgroundColor: T4_BG, color: T4_COLOR },
  badgeT4A: { backgroundColor: T4A_BG, color: T4A_COLOR },
  // Tableau des paiements
  table: { padding: "0 10 6 10" },
  tableHeader: {
    flexDirection: "row",
    borderBottom: `1px solid ${BORDER}`,
    paddingVertical: 4,
    marginTop: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottom: `1px solid #F4F4F5`,
  },
  tableTotals: {
    flexDirection: "row",
    borderTop: `1.5px solid ${BORDER}`,
    paddingTop: 4,
    marginTop: 2,
    backgroundColor: "#F9FAFB",
  },
  colPeriod: { flex: 3, fontSize: 7.5 },
  colDate: { flex: 2, fontSize: 7.5 },
  colHours: { flex: 1.5, fontSize: 7.5, textAlign: "right" },
  colRate: { flex: 1.5, fontSize: 7.5, textAlign: "right" },
  colGross: { flex: 2, fontSize: 7.5, textAlign: "right" },
  colDed: { flex: 2, fontSize: 7.5, textAlign: "right" },
  colNet: { flex: 2, fontSize: 7.5, textAlign: "right" },
  headerCell: { color: MUTED, fontFamily: "Helvetica-Bold", fontSize: 7 },
  totalCell: { fontFamily: "Helvetica-Bold", color: BODY, fontSize: 8 },
  // Pied de page
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: MUTED },
});

// ——— Helpers ———

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

// ——— Composants PDF ———

function EmployeeSection({ emp }: { emp: YearEndEmployeeSummary }) {
  const isT4 = emp.employmentType === "employee";
  return React.createElement(
    View,
    { style: s.empCard },
    // En-tête employé
    React.createElement(
      View,
      { style: s.empHeader },
      React.createElement(
        View,
        null,
        React.createElement(Text, { style: s.empName }, emp.fullName),
        React.createElement(
          Text,
          { style: s.empMeta },
          [
            emp.email,
            emp.sinFull ? `NAS : ${emp.sinFull}` : "NAS : non renseigné",
          ].join("   ·   "),
        ),
      ),
      React.createElement(
        Text,
        { style: [s.badge, isT4 ? s.badgeT4 : s.badgeT4A] },
        isT4 ? "T4  EMPLOYÉ" : "T4A  CONTRACTUEL",
      ),
    ),
    // Tableau
    React.createElement(
      View,
      { style: s.table },
      // Header
      React.createElement(
        View,
        { style: s.tableHeader },
        React.createElement(Text, { style: [s.colPeriod, s.headerCell] }, "Période"),
        React.createElement(Text, { style: [s.colDate, s.headerCell] }, "Date paiement"),
        React.createElement(Text, { style: [s.colHours, s.headerCell] }, "Heures"),
        React.createElement(Text, { style: [s.colRate, s.headerCell] }, "Taux"),
        React.createElement(Text, { style: [s.colGross, s.headerCell] }, "Brut"),
        React.createElement(Text, { style: [s.colDed, s.headerCell] }, "Retenues"),
        React.createElement(Text, { style: [s.colNet, s.headerCell] }, "Net"),
      ),
      // Lignes
      ...emp.payslips.map((ps) =>
        React.createElement(
          View,
          { key: ps.payslipId, style: s.tableRow },
          React.createElement(Text, { style: s.colPeriod }, ps.periodLabel),
          React.createElement(Text, { style: s.colDate }, fmtDate(ps.paymentDate)),
          React.createElement(Text, { style: s.colHours }, ps.hoursWorked.toFixed(2) + " h"),
          React.createElement(Text, { style: s.colRate }, fmt(ps.hourlyRate) + "/h"),
          React.createElement(Text, { style: s.colGross }, fmt(ps.grossPay)),
          React.createElement(Text, { style: s.colDed }, fmt(ps.deductions)),
          React.createElement(Text, { style: s.colNet }, fmt(ps.netPay)),
        ),
      ),
      // Totaux
      React.createElement(
        View,
        { style: s.tableTotals },
        React.createElement(
          Text,
          { style: [s.colPeriod, s.totalCell] },
          `${emp.payslipCount} paiement${emp.payslipCount > 1 ? "s" : ""}`,
        ),
        React.createElement(Text, { style: s.colDate }),
        React.createElement(
          Text,
          { style: [s.colHours, s.totalCell] },
          emp.totalHours.toFixed(2) + " h",
        ),
        React.createElement(Text, { style: s.colRate }),
        React.createElement(Text, { style: [s.colGross, s.totalCell] }, fmt(emp.totalGross)),
        React.createElement(
          Text,
          { style: [s.colDed, s.totalCell] },
          fmt(emp.totalDeductions),
        ),
        React.createElement(Text, { style: [s.colNet, s.totalCell] }, fmt(emp.totalNet)),
      ),
    ),
  );
}

/** Construit le ReactElement Document (à passer directement à renderToBuffer). */
function buildYearEndPdf(summary: YearEndSummary): React.ReactElement<DocumentProps> {
  return React.createElement(
    Document,
    {
      title: `Récapitulatif fin d'année ${summary.year} — ${summary.cabinetNom}`,
      author: "SAFE",
    },
    React.createElement(
      Page,
      { size: "LETTER", style: s.page, orientation: "landscape" },
      // En-tête
      React.createElement(
        View,
        { style: s.header },
        React.createElement(Text, { style: s.cabinetName }, summary.cabinetNom),
        React.createElement(
          Text,
          { style: s.title },
          "Récapitulatif de paie — Feuillets de fin d'année T4 / T4A",
        ),
        React.createElement(Text, { style: s.year }, String(summary.year)),
        React.createElement(
          Text,
          { style: s.disclaimer },
          "Ce document est un récapitulatif interne préparé par SAFE à remettre à votre comptable ou entrer dans votre logiciel de paie. " +
            "SAFE ne calcule pas les retenues CPP/AE/impôt et ne transmet pas à l'ARC. " +
            `Généré le ${fmtDate(summary.generatedAt)}.`,
        ),
      ),
      // Employés
      ...summary.employees.map((emp) =>
        React.createElement(EmployeeSection, { key: emp.employeeId, emp }),
      ),
      // Pied de page
      React.createElement(
        View,
        { style: s.footer, fixed: true },
        React.createElement(
          Text,
          { style: s.footerText },
          `${summary.cabinetNom} — Récapitulatif ${summary.year}`,
        ),
        React.createElement(
          Text,
          { style: s.footerText, render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}` },
        ),
      ),
    ),
  );
}

// ——— Route ———

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role as UserRole;
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) return NextResponse.json({ error: "Cabinet manquant" }, { status: 401 });
  if (!canManagePayroll(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const url = new URL(request.url);
  const yearParam = url.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear() - 1;

  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 });
  }

  const summary = await getYearEndSummary(cabinetId, year);

  if (summary.employees.length === 0) {
    return NextResponse.json(
      { error: `Aucun paiement de paie enregistré pour l'année ${year}.` },
      { status: 404 },
    );
  }

  const pdfElement = buildYearEndPdf(summary);
  const buffer = await renderToBuffer(pdfElement);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recap-paie-${year}.pdf"`,
    },
  });
}
