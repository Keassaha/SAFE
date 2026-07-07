import { requirePageAccess } from "@/lib/auth/page-guard";
import { canManageInvoices } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { SuiviPipelineView } from "./SuiviPipelineView";
import { whereInvoiceIssuedActive, whereInvoiceOverdue } from "@/lib/billing/invoice-status";

export default async function FacturationSuiviPage() {
  const { cabinetId } = await requirePageAccess(canManageInvoices);
  const t = await getTranslations("facturation");

  // Cette page est dédiée au suivi POST-émission (envoyées, en retard, encaissement).
  // Les brouillons et factures à préparer sont gérés depuis /facturation (#facturables).
  // Doctrine: voir docs/accounting/INVOICE_STATUS_NORMALIZATION.md
  const now = new Date();
  const [envoyees, enRetard] = await Promise.all([
    // Émises actives, non payées, non en retard. Disjoint de whereInvoiceOverdue
    // par la condition `dateEcheance >= now`, donc pas de doublon entre colonnes.
    prisma.invoice.findMany({
      where: { cabinetId, ...whereInvoiceIssuedActive(now) },
      include: {
        client: { select: { id: true, raisonSociale: true, prenom: true, nom: true } },
        dossier: { select: { id: true, intitule: true } },
        invoiceLines: true,
      },
      orderBy: { dateEmission: "desc" },
    }),
    prisma.invoice.findMany({
      where: { cabinetId, ...whereInvoiceOverdue(now) },
      include: {
        client: { select: { id: true, raisonSociale: true, prenom: true, nom: true } },
        dossier: { select: { id: true, intitule: true } },
        invoiceLines: true,
      },
      orderBy: { dateEcheance: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("billingAndFollowUp")}
        description={t("billingDescription")}
        action={
          <Link href={routes.facturationFactureNouvelle}>
            <Button variant="primary" type="button">
              <Plus className="w-4 h-4 mr-2 inline-block" aria-hidden />
              {t("newInvoice")}
            </Button>
          </Link>
        }
      />

      <SuiviPipelineView
        envoyees={envoyees}
        enRetard={enRetard}
        cabinetId={cabinetId}
      />
    </div>
  );
}
