import { redirect } from "next/navigation";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { canManageInvoices } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { listPayerRules } from "@/lib/services/finance/payer-rules";
import { PayeursReglesView } from "@/components/parametres/PayeursReglesView";

export default async function ParametresPayeursTiersPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canManageInvoices(role as UserRole)) {
    redirect(routes.parametres);
  }

  const [rules, clients] = await Promise.all([
    listPayerRules(cabinetId),
    prisma.client.findMany({
      where: { cabinetId },
      select: { id: true, raisonSociale: true, prenom: true, nom: true },
      orderBy: [{ raisonSociale: "asc" }, { nom: "asc" }, { prenom: "asc" }],
    }),
  ]);

  const t = await getTranslations("payerRules");
  const tp = await getTranslations("parametres");

  const initialRules = rules.map((r) => ({
    id: r.id,
    payerEmail: r.payerEmail,
    payerName: r.payerName,
    clientId: r.clientId,
    scope: r.scope as "CLIENT_UNIQUE" | "PAYEUR_CONNU",
    note: r.note,
    active: r.active,
    source: r.source,
    clientLabel: r.client
      ? r.client.raisonSociale?.trim() ||
        [r.client.prenom, r.client.nom].filter(Boolean).join(" ").trim() ||
        null
      : null,
  }));

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={t("payerRulesTitle")}
        description={t("payerRulesDesc")}
        backHref={routes.parametres}
        backLabel={tp("backToSettings")}
      />
      <PayeursReglesView initialRules={initialRules} clients={clients} />
    </div>
  );
}
