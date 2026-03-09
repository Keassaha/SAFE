import Link from "next/link";
import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { FacturationPageHero } from "@/components/facturation/FacturationPageHero";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { FileText, ChevronRight } from "lucide-react";

export default async function FacturationVerificationPage() {
  const cabinetId = await requireCabinetId();

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
      <FacturationPageHero backHref={routes.facturation} backLabel="la vue d'ensemble" />
      <Card>
        <CardHeader title="Factures en vérification" />
        <CardContent>
          <p className="text-sm text-[var(--safe-text-secondary)] mb-4">
            Modifiez les factures à la source et ajoutez des commentaires ligne par ligne. Une fois approuvées, vous pourrez les envoyer ou les marquer comme envoyées.
          </p>
          {invoices.length === 0 ? (
            <p className="text-sm text-[var(--safe-text-secondary)] py-8 text-center">
              Aucune facture en attente de vérification.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--safe-neutral-border)]">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={routes.facturationFactureEdit(inv.id)}
                    className="flex items-center gap-4 py-4 px-2 -mx-2 rounded-lg hover:bg-[var(--safe-neutral-bg)] transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                      <FileText className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--safe-text-title)]">
                        {inv.numero} — {inv.client.raisonSociale}
                      </p>
                      <p className="text-sm text-[var(--safe-text-secondary)]">
                        {inv.dossier?.intitule ?? "Sans dossier"} · Émission :{" "}
                        {formatDate(inv.dateEmission)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-[var(--safe-text-title)]">
                        {formatCurrency(inv.montantTotal)}
                      </p>
                      <p className="text-xs text-[var(--safe-text-secondary)]">
                        {inv.invoiceStatus === "READY_TO_ISSUE"
                          ? "Approuvée — prête à envoyer"
                          : "En attente d'approbation"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--safe-text-secondary)] shrink-0" aria-hidden />
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
