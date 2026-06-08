import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewTicketForm } from "@/components/console/NewTicketForm";

const TYPE_LABELS: Record<string, string> = {
  BUG: "Bug",
  DEMANDE_FEATURE: "Feature",
  QUESTION: "Question",
  REMARQUE: "Remarque",
  URGENCE: "Urgence",
};
const STATUT_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  EN_ATTENTE_CLIENT: "Attente client",
  RESOLU: "Résolu",
  FERME: "Fermé",
  REOUVERT: "Rouvert",
};

function statutBadge(s: string) {
  const map: Record<string, string> = {
    NOUVEAU: "bg-blue-100 text-blue-800 border-blue-200",
    EN_COURS: "bg-amber-100 text-amber-800 border-amber-200",
    EN_ATTENTE_CLIENT: "bg-purple-100 text-purple-800 border-purple-200",
    RESOLU: "bg-emerald-100 text-emerald-800 border-emerald-200",
    FERME: "bg-zinc-100 text-zinc-600 border-zinc-200",
    REOUVERT: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${map[s] ?? "bg-zinc-100 text-zinc-600"}`}>
      {STATUT_LABELS[s] ?? s}
    </span>
  );
}

function prioriteDot(p: string) {
  const color = p === "HAUTE" ? "bg-red-500" : p === "BASSE" ? "bg-zinc-300" : "bg-amber-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function ConsoleSupportPage() {
  const workspace = await getSafeIncWorkspace();

  // Cabinets clients pour le sélecteur (leads convertis, hors SAFE Inc.)
  const clientLeads = await prisma.lead.findMany({
    where: { workspaceId: workspace.id, cabinetId: { not: null } },
    select: { cabinetId: true, cabinet: { select: { id: true, nom: true } } },
  });
  const cabinetOptions = clientLeads
    .map((l) => l.cabinet)
    .filter((c): c is { id: string; nom: string } => !!c && c.nom !== "SAFE");

  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ statut: "asc" }, { updatedAt: "desc" }],
    include: {
      cabinet: { select: { nom: true } },
      _count: { select: { replies: true } },
    },
  });

  const ouverts = tickets.filter((t) => !["RESOLU", "FERME"].includes(t.statut)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description={`${tickets.length} ticket${tickets.length > 1 ? "s" : ""} · ${ouverts} ouvert${ouverts > 1 ? "s" : ""}`}
      />

      <Card>
        <CardContent className="px-5 py-4">
          <NewTicketForm cabinets={cabinetOptions} />
        </CardContent>
      </Card>

      {tickets.length === 0 ? (
        <EmptyState
          title="Aucun ticket"
          description="Créez un ticket pour suivre une demande, un bug ou une remarque d'un cabinet client. Le widget client bidirectionnel arrive ensuite."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Ticket</th>
                    <th className="px-4 py-3 text-left">Cabinet</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-right">Réponses</th>
                    <th className="px-4 py-3 text-left">Mis à jour</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3">
                        <Link href={`/console/support/${t.id}`} className="flex items-center gap-2 font-medium text-zinc-900 hover:text-emerald-700">
                          {prioriteDot(t.priorite)}
                          {t.titre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{t.cabinet?.nom ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-600">{TYPE_LABELS[t.type] ?? t.type}</td>
                      <td className="px-4 py-3">{statutBadge(t.statut)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-600">{t._count.replies}</td>
                      <td className="px-4 py-3 text-zinc-600">{formatDate(t.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
