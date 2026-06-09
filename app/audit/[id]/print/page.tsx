import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AuditReport } from "@/components/audit-report/AuditReport";
import {
  buildCabinet,
  buildDrivers,
  buildRisques,
  buildBarreau,
  buildOpportunites,
  buildMarche,
  buildOffre,
  buildEtapes,
  buildAnnexe,
} from "@/lib/audit-report/rules";
import { computeCout, computeScore } from "@/lib/audit-report/compute";
import type { AuditReport as TAuditReport, Variant } from "@/types/audit-report";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Rapport d'audit SAFE",
  robots: { index: false, follow: false },
};

function midHoursInputs(v: unknown): { min: number; max: number } {
  switch (String(v ?? "")) {
    case "lt2":  return { min: 0, max: 2 };
    case "2_5":  return { min: 2, max: 5 };
    case "6_10": return { min: 6, max: 10 };
    case "gt10": return { min: 10, max: 15 };
    default:     return { min: 2, max: 5 };
  }
}

function midRateInputs(v: unknown): { min: number; max: number } {
  switch (String(v ?? "")) {
    case "lt150":  return { min: 100, max: 150 };
    case "150_250":return { min: 150, max: 250 };
    case "251_400":return { min: 251, max: 400 };
    case "gt400":  return { min: 400, max: 600 };
    default:       return { min: 150, max: 250 };
  }
}

function delaiJours(v: unknown): number {
  switch (String(v ?? "")) {
    case "lt15":   return 10;
    case "15_30":  return 22;
    case "31_60":  return 45;
    case "gt60":   return 75;
    default:       return 50;
  }
}

function buildReport(
  answers: Record<string, unknown>,
  date: string,
  ref: string
): TAuditReport {
  const risques = buildRisques(answers);
  const score = computeScore(risques);
  const marche = buildMarche(answers);
  const offre = buildOffre(answers);

  const cout = computeCout({
    heuresAdminDeclarees: midHoursInputs(answers.heures_admin),
    fourchetteTaux: midRateInputs(answers.taux_horaire),
    delaiReglementDeclare: delaiJours(answers.delai_paiement),
    valeurAffichee: "nette",
  });

  return {
    meta: { ref, date, confidentiel: true },
    cabinet: buildCabinet(answers),
    butAudit:
      "Cet audit identifie les points de friction dans la gestion de votre cabinet, quantifie le temps et le revenu récupérables, et vous propose un plan d'action concret.",
    score,
    cout,
    drivers: buildDrivers(answers),
    risques,
    barreau: buildBarreau(answers),
    barreauDisclaimer:
      "Ce résumé a valeur informative uniquement. Il ne constitue pas un avis juridique. Les obligations en vigueur varient selon la province et l'année de pratique. Consultez votre ordre professionnel pour confirmation.",
    opportunites: buildOpportunites(answers),
    marche,
    offre,
    etapes: buildEtapes(answers),
    citationFondateur:
      "Nous avons conçu SAFE parce que les avocats méritent un outil aussi rigoureux qu'eux. Chaque fonctionnalité répond à une exigence réelle du Barreau ou à une heure perdue dans un cabinet que nous avons rencontrée.",
    annexe: buildAnnexe(answers),
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variant?: string }>;
}

export default async function PrintPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const variant: Variant = sp.variant === "cream" ? "cream" : "white";

  const submission = await prisma.auditSubmission.findUnique({ where: { id } });
  if (!submission) notFound();

  let answers: Record<string, unknown> = {};
  try {
    const parsed = submission.reponses ? JSON.parse(submission.reponses) : {};
    answers = (parsed.answers ?? parsed) as Record<string, unknown>;
  } catch {
    notFound();
  }

  // Format date nicely
  const d = new Date(submission.createdAt);
  const dateStr = d.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const refStr = `A ${d.getFullYear()} ${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")} ${id.slice(0, 3).toUpperCase()}`;

  const report = buildReport(answers, dateStr, refStr);

  return (
    <main style={{ margin: 0, padding: 0, background: "none" }}>
      <AuditReport data={report} variant={variant} />
    </main>
  );
}
