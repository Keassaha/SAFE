import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust, canEditBillingTrust } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { FideicommisDashboard } from "@/components/fideicommis/FideicommisDashboard";
import { AddTransactionButton } from "@/components/fideicommis/AddTransactionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function ComptesPage() {
  const t = await getTranslations("accountingUi");
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite")) {
    return (
      <div className="p-6">
        <p className="text-[#B84A3E]">{t("noAccess")}</p>
      </div>
    );
  }

  const [clients, dossiers] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      orderBy: { raisonSociale: "asc" },
      select: { id: true, raisonSociale: true, prenom: true, nom: true },
    }),
    prisma.dossier.findMany({
      where: { cabinetId },
      orderBy: { intitule: "asc" },
      select: { id: true, clientId: true, intitule: true, numeroDossier: true },
    }),
  ]);

  const canEdit = canEditBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("trustAccountsTitle")}
        description={t("trustAccountsDescription")}
        backHref={routes.facturation}
        backLabel={t("backToBilling")}
        action={
          <AddTransactionButton
            canEdit={canEdit}
            cabinetId={cabinetId}
            clients={clients}
            dossiers={dossiers}
          />
        }
      />

      {/* Les écrans réglementaires.
          Six boutons dans l'entête du titre deviendraient illisibles et se
          disputeraient l'attention de l'action principale. Un panneau les rassemble,
          chacun avec l'article qui le fonde : la source se lit sans clic. */}
      <section className="rounded-xl border border-[var(--si-line)] bg-[var(--si-surface)]">
        <div className="border-b border-[var(--si-line)] px-4 py-3">
          <h2 className="text-sm font-medium text-[var(--si-ink)]">Conformité</h2>
          <p className="mt-0.5 text-xs text-[var(--si-muted)]">
            Ce qu'un inspecteur demande, prêt à produire.
          </p>
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: routes.rapportMensuel, titre: "Rapport mensuel", ref: "art. 41 · s. 18(8)" },
            { href: routes.trousseInspection, titre: "Trousse d'inspection", ref: "art. 29, 30, 33" },
            { href: routes.registres, titre: "Registres", ref: "art. 30 · par. 21(2)" },
            { href: routes.soldesDebiteurs, titre: "Soldes débiteurs", ref: "art. 59, 60 · s. 14" },
            { href: routes.especes, titre: "Espèces", ref: "art. 69 à 73 · s. 19" },
            { href: routes.autresBiens, titre: "Autres biens", ref: "art. 43 à 46 · s. 18(9)" },
          ].map((e) => (
            <li key={e.href} className="border-b border-[var(--si-line)] last:border-b-0">
              <Link
                href={e.href}
                className="block px-4 py-3 transition-colors hover:bg-[#0B1F19]/[0.03]"
              >
                <span className="block text-sm text-[var(--si-ink)]">{e.titre}</span>
                <span className="mt-0.5 block text-xs text-[var(--si-muted)]">{e.ref}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <FideicommisDashboard
        cabinetId={cabinetId}
        canEdit={canEdit}
        clients={clients}
        dossiers={dossiers}
        seuilBas={500}
      />
    </div>
  );
}
