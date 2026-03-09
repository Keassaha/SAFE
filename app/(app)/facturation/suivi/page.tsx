import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { FacturationPageHero } from "@/components/facturation/FacturationPageHero";
import { SuiviInvoicesView } from "./SuiviInvoicesView";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { routes } from "@/lib/routes";

export default async function FacturationSuiviPage({
  searchParams,
}: {
  searchParams: Promise<{ retard?: string }>;
}) {
  const cabinetId = await requireCabinetId();
  const { retard } = await searchParams;
  const onlyOverdue = retard === "1";

  const invoices = await prisma.invoice.findMany({
    where: {
      cabinetId,
      ...(onlyOverdue
        ? { statut: "en_retard" }
        : {
            statut: { in: ["envoyee", "partiellement_payee", "payee", "en_retard"] },
            invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] },
          }),
    },
    include: {
      client: { select: { id: true, raisonSociale: true } },
      dossier: { select: { id: true, intitule: true } },
    },
    orderBy: [{ statut: "asc" }, { dateEcheance: "asc" }],
  });

  return (
    <div className="space-y-6">
      <FacturationPageHero backHref={routes.facturation} backLabel="la vue d'ensemble" />
      <Card>
        <CardHeader
          title={onlyOverdue ? "Factures en retard" : "Suivi des factures envoyées"}
          action={onlyOverdue ? (
            <a
              href="/facturation/suivi"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Voir toutes les factures envoyées
            </a>
          ) : undefined}
        />
        <CardContent>
          <SuiviInvoicesView
            invoices={invoices.map((inv) => ({
              id: inv.id,
              numero: inv.numero,
              clientId: inv.client.id,
              client: inv.client.raisonSociale,
              dossier: inv.dossier?.intitule ?? null,
              dateEmission: inv.dateEmission.toISOString(),
              dateEcheance: inv.dateEcheance.toISOString(),
              montantTotal: inv.montantTotal,
              balanceDue: inv.balanceDue,
              statut: inv.statut,
              sentAt: inv.sentAt?.toISOString() ?? null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
