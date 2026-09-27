import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { LIBELLE_NATURE } from "@/lib/services/demandes";
import { BarreEtat } from "./BarreEtat";

/**
 * La fiche d'une demande du site.
 *
 * Elle porte ce que la liste ne montre pas : le message entier, les
 * coordonnées, et surtout l'état de ce qui a suivi la réception (accusé,
 * avis interne, entrée au pipeline). C'est ici qu'on répare une demande qui
 * n'est pas allée au bout de son cours.
 */

export const dynamic = "force-dynamic";

function Ligne({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-si-line2 py-2.5 last:border-b-0">
      <dt className="w-40 shrink-0 text-[13px] text-si-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-[14px] text-si-ink">{children}</dd>
    </div>
  );
}

export default async function DemandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const demande = await prisma.demandeSite.findUnique({
    where: { id },
    include: { lead: { select: { id: true, raisonSociale: true } } },
  });

  if (!demande) notFound();

  const manques = [
    !demande.accuseReceptionEnvoye ? "l'accusé de réception n'est pas parti" : null,
    !demande.aviseInterneEnvoye ? "l'avis interne n'est pas parti" : null,
    !demande.leadId ? "elle n'est pas entrée au pipeline" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title={demande.nom}
        description={[demande.cabinet, LIBELLE_NATURE[demande.type]]
          .filter(Boolean)
          .join(" · ")}
        backHref="/console/demandes"
        backLabel="Demandes"
      />

      {manques.length > 0 ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-si-amber/30 bg-si-amber/[0.07] px-3 py-2.5 text-[13px] leading-relaxed text-si-amber-ink">
          <AlertTriangle className="mt-0.5 h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
          <p>
            Cette demande est enregistrée, mais {manques.join(", ")}. Vous pouvez répondre
            malgré tout : rien de ce que le visiteur a écrit n&apos;est perdu.
          </p>
        </div>
      ) : null}

      <Card>
        <CardContent className="p-5">
          <dl>
            <Ligne label="Courriel">
              <a className="text-si-ink underline underline-offset-2" href={`mailto:${demande.email}`}>
                {demande.email}
              </a>
            </Ligne>
            <Ligne label="Téléphone">
              {demande.telephone ? (
                <a className="text-si-ink underline underline-offset-2" href={`tel:${demande.telephone}`}>
                  {demande.telephone}
                </a>
              ) : (
                <span className="text-si-subtle">Non donné</span>
              )}
            </Ligne>
            {demande.momentSouhaite ? (
              <Ligne label="Moments proposés">{demande.momentSouhaite}</Ligne>
            ) : null}
            <Ligne label="Ce qu&apos;il demande">
              {demande.raison ? (
                <p className="whitespace-pre-wrap">{demande.raison}</p>
              ) : (
                <span className="text-si-subtle">Rien d&apos;écrit</span>
              )}
            </Ligne>
            <Ligne label="Reçue le">
              {demande.createdAt.toLocaleString("fr-CA", { dateStyle: "long", timeStyle: "short" })}
              {demande.page ? <span className="text-si-muted"> · depuis {demande.page}</span> : null}
            </Ligne>
            <Ligne label="Au pipeline">
              {demande.lead ? (
                <Link
                  href={`/console/clients/${demande.lead.id}`}
                  className="text-si-ink underline underline-offset-2"
                >
                  {demande.lead.raisonSociale}
                </Link>
              ) : (
                <span className="text-si-subtle">{demande.crmNote ?? "Pas rattachée"}</span>
              )}
            </Ligne>
          </dl>
        </CardContent>
      </Card>

      <BarreEtat
        id={demande.id}
        statut={demande.statut}
        rattachee={Boolean(demande.leadId)}
      />
    </div>
  );
}
