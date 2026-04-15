import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getReconciliationStatus } from "@/lib/services/fideicommis";

/**
 * GET /api/conformite — Aggregated compliance status for dashboard.
 * Checks: reconciliation, FINTRAC, mandates, conflicts, document expiry.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }

  const [
    reconciliation,
    dossiersWithoutFintrac,
    dossiersWithoutMandate,
    unresolvedConflicts,
    expiredDocuments,
    expiringSoonDocuments,
    totalActiveDossiers,
  ] = await Promise.all([
    // Trust reconciliation status
    getReconciliationStatus(cabinetId),

    // Immobilier dossiers without FINTRAC verification
    prisma.dossier.count({
      where: {
        cabinetId,
        type: "immobilier",
        statut: { in: ["ouvert", "actif", "en_attente"] },
        fintracVerified: false,
      },
    }),

    // Active dossiers without signed mandate (retainer)
    prisma.dossier.count({
      where: {
        cabinetId,
        statut: { in: ["ouvert", "actif", "en_attente"] },
        mandate: null,
      },
    }),

    // Unresolved conflict checks
    prisma.conflictCheck.count({
      where: {
        cabinetId,
        conflictsFound: true,
        resolution: null,
      },
    }),

    // Expired immigration documents
    prisma.immigrationDocument.count({
      where: {
        dossier: { cabinetId, statut: { in: ["ouvert", "actif", "en_attente"] } },
        expiresAt: { lt: new Date() },
      },
    }),

    // Documents expiring within 30 days
    prisma.immigrationDocument.count({
      where: {
        dossier: { cabinetId, statut: { in: ["ouvert", "actif", "en_attente"] } },
        expiresAt: {
          gt: new Date(),
          lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Total active dossiers
    prisma.dossier.count({
      where: { cabinetId, statut: { in: ["ouvert", "actif", "en_attente"] } },
    }),
  ]);

  // Calculate score (0-100)
  let score = 100;
  const issues: { id: string; label: string; severity: "error" | "warning"; count: number; href: string }[] = [];

  if (reconciliation.critical) {
    score -= 30;
    issues.push({ id: "reconciliation", label: "Trust reconciliation overdue", severity: "error", count: 1, href: "/comptes/rapprochement" });
  } else if (reconciliation.overdue) {
    score -= 15;
    issues.push({ id: "reconciliation", label: "Trust reconciliation due soon", severity: "warning", count: 1, href: "/comptes/rapprochement" });
  }

  if (dossiersWithoutFintrac > 0) {
    score -= Math.min(20, dossiersWithoutFintrac * 5);
    issues.push({ id: "fintrac", label: "Immobilier files without FINTRAC", severity: "error", count: dossiersWithoutFintrac, href: "/dossiers" });
  }

  if (unresolvedConflicts > 0) {
    score -= Math.min(15, unresolvedConflicts * 5);
    issues.push({ id: "conflicts", label: "Unresolved conflict checks", severity: "error", count: unresolvedConflicts, href: "/dossiers" });
  }

  if (dossiersWithoutMandate > 0) {
    score -= Math.min(10, dossiersWithoutMandate * 2);
    issues.push({ id: "mandates", label: "Files without signed mandate", severity: "warning", count: dossiersWithoutMandate, href: "/dossiers" });
  }

  if (expiredDocuments > 0) {
    score -= Math.min(15, expiredDocuments * 5);
    issues.push({ id: "expired_docs", label: "Expired immigration documents", severity: "error", count: expiredDocuments, href: "/dossiers" });
  }

  if (expiringSoonDocuments > 0) {
    score -= Math.min(5, expiringSoonDocuments * 2);
    issues.push({ id: "expiring_docs", label: "Documents expiring within 30 days", severity: "warning", count: expiringSoonDocuments, href: "/dossiers" });
  }

  score = Math.max(0, score);

  return NextResponse.json({
    score,
    scoreVariant: score >= 80 ? "success" : score >= 60 ? "warning" : "error",
    issues,
    reconciliation: {
      status: reconciliation.critical ? "critical" : reconciliation.overdue ? "overdue" : "ok",
      lastCertified: reconciliation.lastCertifiedPeriode,
      expectedPeriode: reconciliation.expectedPeriode,
      daysSinceMonthEnd: reconciliation.daysSinceMonthEnd,
    },
    counts: {
      totalActiveDossiers,
      dossiersWithoutFintrac,
      dossiersWithoutMandate,
      unresolvedConflicts,
      expiredDocuments,
      expiringSoonDocuments,
    },
  });
}
