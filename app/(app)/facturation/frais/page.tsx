import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { FacturationFraisActions } from "@/components/facturation/FacturationFraisActions";

export default async function FacturationFraisPage() {
  const cabinetId = await requireCabinetId();

  const [debours, deboursARefacturer, deboursNonRembourses, clients, dossiers] = await Promise.all([
    prisma.deboursDossier.findMany({
      where: { cabinetId },
      orderBy: { date: "desc" },
      take: 100,
      include: {
        dossier: { select: { id: true, intitule: true, numeroDossier: true } },
        client: { select: { id: true, raisonSociale: true } },
        facture: { select: { id: true, numero: true } },
      },
    }),
    prisma.deboursDossier.aggregate({
      where: { cabinetId, refacturable: true, factureId: null },
      _sum: { montant: true },
    }),
    prisma.deboursDossier.aggregate({
      where: {
        cabinetId,
        payeParCabinet: true,
        OR: [{ factureId: null }, { facture: { paymentStatus: { not: "PAID" } } }],
      },
      _sum: { montant: true },
    }),
    prisma.client.findMany({
      where: { cabinetId },
      select: { id: true, raisonSociale: true },
      orderBy: { raisonSociale: "asc" },
    }),
    prisma.dossier.findMany({
      where: { cabinetId },
      select: { id: true, intitule: true, numeroDossier: true, clientId: true },
      orderBy: { dateOuverture: "desc" },
    }),
  ]);

  const totalARefacturer = deboursARefacturer._sum.montant ?? 0;
  const totalNonRembourses = deboursNonRembourses._sum.montant ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Débours - Vue globale"
        description="Gérez tous les débours du cabinet."
        backHref={routes.facturation}
        backLabel="Retour à la facturation"
        action={
          <FacturationFraisActions
            clients={clients}
            dossiers={dossiers}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Débours à refacturer" />
          <CardContent>
            <p className="text-2xl font-semibold text-primary-700">
              {formatCurrency(totalARefacturer)}
            </p>
            <p className="text-sm text-neutral-muted mt-1">
              Montants refacturables non encore inclus dans une facture
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Débours non remboursés" />
          <CardContent>
            <p className="text-2xl font-semibold text-primary-700">
              {formatCurrency(totalNonRembourses)}
            </p>
            <p className="text-sm text-neutral-muted mt-1">
              Payés par le cabinet, pas encore remboursés par le client
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader title="Liste des frais" />
        <CardContent>
          {debours.length === 0 ? (
            <p className="text-sm text-neutral-muted py-4">
              Aucun débours. Cliquez sur &quot;Nouveau débours&quot; pour en ajouter un, ou gérez les débours depuis chaque dossier (onglet &quot;Débours&quot;).
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-border text-left text-neutral-muted">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Client / Dossier</th>
                    <th className="py-2 pr-2">Description</th>
                    <th className="py-2 pr-2 text-right">Quantité</th>
                    <th className="py-2 pr-2 text-right">Montant</th>
                    <th className="py-2 pr-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {debours.map((d) => (
                    <tr key={d.id} className="border-b border-neutral-border/70">
                      <td className="py-2 pr-2">{formatDate(d.date)}</td>
                      <td className="py-2 pr-2">
                        <span className="text-neutral-800 block">{d.client.raisonSociale}</span>
                        <Link
                          href={routes.dossier(d.dossierId)}
                          className="text-primary-600 hover:underline text-xs"
                        >
                          {d.dossier.numeroDossier ?? d.dossier.intitule}
                        </Link>
                      </td>
                      <td className="py-2 pr-2">{d.description}</td>
                      <td className="py-2 pr-2 text-right">
                        {Number(d.quantite) === 1 ? "1" : d.quantite}
                      </td>
                      <td className="py-2 pr-2 text-right font-medium">
                        {formatCurrency(d.montant)}
                      </td>
                      <td className="py-2 pr-2">
                        {d.facture ? (
                          <Link
                            href={routes.facturationFactureEdit(d.facture.id)}
                            className="text-primary-600 hover:underline"
                          >
                            {d.facture.numero}
                          </Link>
                        ) : (
                          <span className="text-neutral-muted">Non facturé</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
