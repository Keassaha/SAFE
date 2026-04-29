import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { SuiviPipelineView } from "./SuiviPipelineView";
import { whereInvoiceDraft, whereInvoiceForReports } from "@/lib/billing/invoice-status";

export default async function FacturationSuiviPage() {
  const cabinetId = await requireCabinetId();
  const t = await getTranslations("facturation");

  // Doctrine: voir docs/accounting/INVOICE_STATUS_NORMALIZATION.md
  // Bucket "envoyées" pour le pipeline = toutes les factures qui ont été émises
  // (PAID inclus pour visualiser l'historique du pipeline).
  const [brouillons, envoyees] = await Promise.all([
    prisma.invoice.findMany({
      where: { cabinetId, ...whereInvoiceDraft() },
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true } },
        invoiceLines: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { cabinetId, ...whereInvoiceForReports() },
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true } },
        invoiceLines: true,
      },
      orderBy: { dateEmission: "desc" },
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
        brouillons={brouillons}
        validees={[]}
        envoyees={envoyees}
        cabinetId={cabinetId}
      />
    </div>
  );
}
