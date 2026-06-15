import { getTranslations } from "next-intl/server";
import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { FacturationFraisActions } from "@/components/facturation/FacturationFraisActions";
import type { DeboursStatut } from "@prisma/client";

export default async function FacturationFraisPage() {
  const t = await getTranslations("billingUi");
  const cabinetId = await requireCabinetId();

  const [debours, deboursARefacturer, deboursNonRembourses, clients, dossiers] = await Promise.all([
    prisma.deboursDossier.findMany({
      where: { cabinetId },
      orderBy: { date: "desc" },
      take: 100,
      include: {
        dossier: { select: { id: true, intitule: true, numeroDossier: true } },
        client: { select: { id: true, raisonSociale: true, prenom: true, nom: true } },
        facture: { select: { id: true, numero: true } },
      },
    }),
    prisma.deboursDossier.aggregate({
      where: { cabinetId, refacturable: true, statutDebours: { in: ["NON_FACTURE", "FACTURE"] } },
      _sum: { montant: true },
    }),
    prisma.deboursDossier.aggregate({
      where: {
        cabinetId,
        payeParCabinet: true,
        statutDebours: { in: ["NON_FACTURE", "FACTURE"] },
      },
      _sum: { montant: true },
    }),
    prisma.client.findMany({
      where: { cabinetId },
      select: { id: true, raisonSociale: true, prenom: true, nom: true },
      orderBy: [{ raisonSociale: "asc" }, { nom: "asc" }, { prenom: "asc" }],
    }),
    prisma.dossier.findMany({
      where: { cabinetId },
      select: { id: true, intitule: true, numeroDossier: true, clientId: true },
      orderBy: { dateOuverture: "desc" },
    }),
  ]);

  const totalARefacturer = deboursARefacturer._sum.montant ?? 0;
  const totalNonRembourses = deboursNonRembourses._sum.montant ?? 0;
  const clientLabel = (client: { raisonSociale: string | null; prenom?: string | null; nom?: string | null }) => {
    const company = client.raisonSociale?.trim();
    if (company) return company;
    return [client.prenom, client.nom].filter(Boolean).join(" ").trim() || "Client sans nom";
  };
  const deboursStatusLabel = (status: DeboursStatut) => {
    switch (status) {
      case "NON_FACTURE":
        return "Non facturé";
      case "FACTURE":
        return "Facturé";
      case "RECOUVRE":
        return "Recouvré";
      case "RADIE":
        return "Radié";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("disbursementsOverview")}
        description={t("disbursementsOverviewDescription")}
        backHref={routes.facturation}
        backLabel={t("backToBilling")}
        action={
          <FacturationFraisActions
            clients={clients}
            dossiers={dossiers}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title={t("disbursementsToRebill")} />
          <CardContent>
            <p className="text-2xl font-semibold text-primary-700">
              {formatCurrency(totalARefacturer)}
            </p>
            <p className="text-sm text-neutral-muted mt-1">
              {t("disbursementsToRebillHint")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t("disbursementsUnreimbursed")} />
          <CardContent>
            <p className="text-2xl font-semibold text-primary-700">
              {formatCurrency(totalNonRembourses)}
            </p>
            <p className="text-sm text-neutral-muted mt-1">
              {t("disbursementsUnreimbursedHint")}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader title={t("chargesList")} />
        <CardContent>
          {debours.length === 0 ? (
            <p className="text-sm text-neutral-muted py-4">
              {t("noDisbursements")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-border text-left text-neutral-muted">
                    <th className="py-2 pr-2">{t("date")}</th>
                    <th className="py-2 pr-2">{t("clientMatter")}</th>
                    <th className="py-2 pr-2">{t("description")}</th>
                    <th className="py-2 pr-2 text-right">{t("quantity")}</th>
                    <th className="py-2 pr-2 text-right">{t("amount")}</th>
                    <th className="py-2 pr-2">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {debours.map((d) => (
                    <tr key={d.id} className="border-b border-neutral-border/70">
                      <td className="py-2 pr-2">{formatDate(d.date)}</td>
                      <td className="py-2 pr-2">
                        <span className="text-neutral-800 block">{clientLabel(d.client)}</span>
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
                        <span className="block text-neutral-800">{deboursStatusLabel(d.statutDebours)}</span>
                        {d.facture ? (
                          <Link
                            href={routes.facturationFactureEdit(d.facture.id)}
                            className="text-primary-600 hover:underline text-xs"
                          >
                            {d.facture.numero}
                          </Link>
                        ) : (
                          <span className="text-neutral-muted text-xs">{t("notBilled")}</span>
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
