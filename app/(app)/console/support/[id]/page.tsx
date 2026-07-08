import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { TicketReplyForm } from "@/components/console/TicketReplyForm";

const TYPE_LABELS: Record<string, string> = {
  BUG: "Bug", DEMANDE_FEATURE: "Demande de feature", QUESTION: "Question",
  REMARQUE: "Remarque", URGENCE: "Urgence",
};
const STATUT_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau", EN_COURS: "En cours", EN_ATTENTE_CLIENT: "En attente client",
  RESOLU: "Résolu", FERME: "Fermé", REOUVERT: "Rouvert",
};
const PRIORITE_LABELS: Record<string, string> = { HAUTE: "Haute", NORMALE: "Normale", BASSE: "Basse" };

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      cabinet: { select: { nom: true } },
      createdBy: { select: { nom: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { nom: true } } },
      },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={ticket.titre}
        description={`${ticket.cabinet?.nom ?? "—"} · ${TYPE_LABELS[ticket.type]} · Priorité ${PRIORITE_LABELS[ticket.priorite]}`}
        backHref="/console/support"
        backLabel="Tous les tickets"
      />

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded border border-si-line bg-si-canvas px-2.5 py-1 text-sm text-si-ink">
          {STATUT_LABELS[ticket.statut] ?? ticket.statut}
        </span>
        <span className="text-sm text-si-muted">
          Ouvert le {formatDateTime(ticket.createdAt)}
        </span>
      </div>

      {/* Description initiale */}
      <Card>
        <CardContent className="px-6 py-5">
          <div className="mb-2 text-xs uppercase tracking-wide text-si-muted">
            Demande initiale — {ticket.createdBy?.nom ?? "Client"}
          </div>
          <p className="whitespace-pre-wrap text-sm text-si-ink">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* Fil de réponses */}
      {ticket.replies.length > 0 && (
        <div className="space-y-3">
          {ticket.replies.map((r) => (
            <div
              key={r.id}
              className={`rounded-md border px-5 py-4 ${
                r.isFromSafeInc
                  ? "border-si-verified/30 bg-si-verified/[0.05]"
                  : "border-si-line bg-si-surface"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-si-ink">
                  {r.isFromSafeInc ? "SAFE Inc." : "Client"} · {r.author?.nom ?? ""}
                </span>
                <span className="text-xs text-si-muted">{formatDateTime(r.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-si-ink">{r.contenu}</p>
            </div>
          ))}
        </div>
      )}

      {/* Répondre + statut */}
      <Card>
        <CardContent className="px-6 py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-si-muted">
            Répondre
          </h2>
          <TicketReplyForm ticketId={ticket.id} currentStatut={ticket.statut} />
        </CardContent>
      </Card>
    </div>
  );
}
