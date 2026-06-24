import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requirePageAccess } from "@/lib/auth/page-guard";
import { canManageInvoices } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { displayInvoiceNumero } from "@/lib/facturation/invoice-numero-format";
import { FacturationPageHero } from "@/components/facturation/FacturationPageHero";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { FileText, ChevronRight } from "lucide-react";

export default async function FacturationVerificationPage() {
  const t = await getTranslations("billingUi");
  const { cabinetId } = await requirePageAccess(canManageInvoices);

  const invoices = await prisma.invoice.findMany({
    where: {
      cabinetId,
      statut: "brouillon",
      invoiceStatus: { in: ["DRAFT", "READY_TO_ISSUE"] },
    },
    include: {
      client: { select: { id: true, raisonSociale: true } },
      dossier: { select: { id: true, intitule: true } },
    },
    orderBy: { dateEmission: "desc" },
  });

  return (
    <div className="space-y-6">
      <FacturationPageHero backHref={routes.facturation} backLabel={t("overview")} />
      <Card>
        <CardHeader title={t("invoicesInReview")} />
        <CardContent>
          <p className="text-sm text-si-muted mb-4">
            {t("reviewIntro")}
          </p>
          {invoices.length === 0 ? (
            <p className="text-sm text-si-muted py-8 text-center">
              {t("noInvoicesPendingReview")}
            </p>
          ) : (
            <ul className="divide-y divide-si-line">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={routes.facturationFactureEdit(inv.id)}
                    className="flex items-center gap-4 py-4 px-2 -mx-2 rounded-lg hover:bg-si-canvas transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-si-amber/[0.13] text-si-amber-ink">
                      <FileText className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-si-ink">
                        {displayInvoiceNumero(inv.numero)} — {inv.client.raisonSociale}
                      </p>
                      <p className="text-sm text-si-muted">
                        {inv.dossier?.intitule ?? t("noMatter")} · {t("issuedColon")}{" "}
                        {formatDate(inv.dateEmission)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-si-ink">
                        {formatCurrency(inv.montantTotal)}
                      </p>
                      <p className="text-xs text-si-muted">
                        {inv.invoiceStatus === "READY_TO_ISSUE"
                          ? t("approvedReadyToSend")
                          : t("awaitingApproval")}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-si-muted shrink-0" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
