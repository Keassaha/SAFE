import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { ConvertirClientForm } from "@/components/console/ConvertirClientForm";

/**
 * Écran de conversion Lead → Cabinet (E17 du cahier des charges).
 *
 * La garde d'accès vient du layout `/console` (interne SAFE Inc. ET admin) ;
 * l'action de conversion la revérifie de son côté, comme toute action Console.
 */
export default async function ConvertirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      raisonSociale: true,
      ville: true,
      province: true,
      siteWeb: true,
      stageLead: true,
      cabinetId: true,
      contacts: {
        select: { prenom: true, nom: true, email: true, estDecideur: true, doNotContact: true },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!lead) notFound();

  // Déjà converti : on ne propose pas deux fois, on renvoie sur la fiche.
  if (lead.cabinetId) redirect(`/console/clients/${lead.id}`);

  const tachesOuvertes = await prisma.task.count({
    where: { leadId: lead.id, statut: { in: ["A_FAIRE", "EN_COURS"] } },
  });

  // Le décideur joignable est le meilleur candidat pour l'accès administrateur.
  const candidat =
    lead.contacts.find((c) => c.estDecideur && c.email && !c.doNotContact) ??
    lead.contacts.find((c) => c.email && !c.doNotContact) ??
    null;

  const plans = (Object.keys(PLANS) as PlanKey[]).map((key) => ({
    key,
    label: PLANS[key].name,
    prix: `${(PLANS[key].price / 100).toFixed(0)} $/mois`,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Convertir ${lead.raisonSociale}`}
        description="Le prospect devient un cabinet client. Une seule transaction, rien ne se perd."
        backHref={`/console/clients/${lead.id}`}
        backLabel="Retour à la fiche"
      />

      {lead.stageLead !== "SIGNED" ? (
        <div className="rounded-xl border border-si-amber/30 bg-si-amber/[0.08] px-6 py-5">
          <p className="text-sm font-medium text-si-amber-ink">
            Ce cabinet n&apos;est pas à l&apos;étape « Signé ».
          </p>
          <p className="mt-2 text-sm leading-6 text-si-ink">
            La conversion crée un vrai cabinet, un accès et une facturation. Elle attend donc une
            signature réelle. Faites d&apos;abord passer l&apos;étape depuis le pipeline, puis
            revenez ici.
          </p>
        </div>
      ) : (
        <ConvertirClientForm
          leadId={lead.id}
          nbTachesOuvertes={tachesOuvertes}
          plans={plans}
          defauts={{
            cabinetNom: lead.raisonSociale,
            cabinetEmail: "",
            cabinetTelephone: "",
            cabinetAdresse: [lead.ville, lead.province].filter(Boolean).join(", "),
            adminEmail: candidat?.email ?? "",
          }}
        />
      )}
    </div>
  );
}
