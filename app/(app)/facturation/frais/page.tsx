import { getTranslations } from "next-intl/server";
import { requirePageAccess } from "@/lib/auth/page-guard";
import { canManageInvoices, canViewBilling } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { FacturationFraisActions } from "@/components/facturation/FacturationFraisActions";
import { DeboursPageView } from "@/components/facturation/DeboursPageView";
import type { DeboursLigne } from "@/lib/debours/vue";

function nomDuClient(c: {
  raisonSociale: string | null;
  prenom?: string | null;
  nom?: string | null;
}): string {
  const societe = c.raisonSociale?.trim();
  if (societe) return societe;
  return [c.prenom, c.nom].filter(Boolean).join(" ").trim() || "Client sans nom";
}

/**
 * La page des débours — ce que le cabinet a avancé pour ses clients.
 *
 * Elle listait cent lignes à plat, sans filtre, sans tri, sans action, et
 * n'était dans aucun menu. Elle se lit maintenant par client, comme demandé
 * le 2026-09-12.
 *
 * Le plafond passe de 100 à 500 : à 100, un cabinet actif perdait de vue ses
 * plus vieux débours sans que rien ne le lui dise.
 */
export default async function FacturationFraisPage() {
  const t = await getTranslations("debours");
  const { cabinetId, role } = await requirePageAccess(canViewBilling);
  const canWrite = canManageInvoices(role);

  const [debours, clients, dossiers] = await Promise.all([
    prisma.deboursDossier.findMany({
      where: { cabinetId },
      orderBy: { date: "desc" },
      take: 500,
      include: {
        dossier: { select: { id: true, intitule: true, numeroDossier: true } },
        client: { select: { id: true, raisonSociale: true, prenom: true, nom: true } },
        facture: { select: { id: true, numero: true } },
      },
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

  const lignes: DeboursLigne[] = debours.map((d) => ({
    id: d.id,
    date: d.date.toISOString(),
    description: d.description,
    quantite: d.quantite,
    montant: d.montant,
    taxable: d.taxable,
    payeParCabinet: d.payeParCabinet,
    refacturable: d.refacturable,
    statutDebours: d.statutDebours,
    clientId: d.clientId,
    clientNom: nomDuClient(d.client),
    dossierId: d.dossierId,
    dossierLabel: d.dossier.numeroDossier
      ? `${d.dossier.numeroDossier} — ${d.dossier.intitule}`
      : d.dossier.intitule,
    factureId: d.facture?.id ?? null,
    factureNumero: d.facture?.numero ?? null,
  }));

  /* Seuls les clients qui ont des débours peuplent le filtre : proposer les
     deux cents clients du cabinet dont cent quatre-vingt-dix-huit n'ont rien
     avancé, c'est un filtre qui ne filtre pas. */
  const clientsAvecDebours = new Set(lignes.map((l) => l.clientId));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageIntro")}
        backHref={routes.facturation}
        backLabel={t("backToBilling")}
        action={
          canWrite ? <FacturationFraisActions clients={clients} dossiers={dossiers} /> : undefined
        }
      />

      <DeboursPageView
        lignes={lignes}
        clients={clients
          .filter((c) => clientsAvecDebours.has(c.id))
          .map((c) => ({ id: c.id, nom: nomDuClient(c) }))}
        canWrite={canWrite}
      />
    </div>
  );
}
