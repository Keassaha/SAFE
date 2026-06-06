import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";

function KpiCard({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: number;
  accent?: "default" | "emerald";
}) {
  const valueClass =
    accent === "emerald"
      ? "text-3xl font-semibold text-emerald-700"
      : "text-3xl font-semibold text-zinc-900";
  return (
    <Card>
      <CardContent className="px-6 py-5">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
        <p className={`mt-2 ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function ConsolePage() {
  const workspace = await getSafeIncWorkspace();

  const [totalLeads, leadsActifs, leadsLive, ticketsOuverts] = await Promise.all([
    prisma.lead.count({ where: { workspaceId: workspace.id } }),
    prisma.lead.count({
      where: {
        workspaceId: workspace.id,
        statutLead: { in: ["NURTURE_ONLY", "QUALIFIED_AUDIT"] },
      },
    }),
    prisma.lead.count({
      where: { workspaceId: workspace.id, stageLead: "LIVE" },
    }),
    prisma.supportTicket.count({
      where: { statut: { in: ["NOUVEAU", "EN_COURS"] } },
    }),
  ]);

  const today = new Date();
  const phaseDebut = workspace.phaseDateDebut;
  const phaseFin = workspace.phaseDateFin;
  const totalJours =
    phaseFin && phaseDebut
      ? Math.round(
          (phaseFin.getTime() - phaseDebut.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 90;
  const joursEcoules = Math.max(
    0,
    Math.round((today.getTime() - phaseDebut.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const joursRestants = Math.max(0, totalJours - joursEcoules);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Console SAFE Inc."
        description={`Mode ${workspace.workMode} — J+${joursEcoules}/${totalJours} (${joursRestants}j restants)`}
      />

      {workspace.workMode === "PRECHAUFFAGE" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Phase préchauffage active.</strong> Pas de conversion outbound
          froid. Objectifs : témoignage cliente, case study publié, audience
          LinkedIn cible {workspace.cibleAudienceLinkedIn}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Leads total" value={totalLeads} />
        <KpiCard label="Leads en nurturing" value={leadsActifs} />
        <KpiCard label="Clients live" value={leadsLive} accent="emerald" />
        <KpiCard label="Tickets ouverts" value={ticketsOuverts} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/console/leads"
          className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-emerald-400 hover:bg-emerald-50/40"
        >
          <p className="font-medium text-zinc-900">Cabinets</p>
          <p className="mt-1 text-sm text-zinc-500">
            Liste prospection ({totalLeads})
          </p>
        </Link>

        <Link
          href="/console/pipeline"
          className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-emerald-400 hover:bg-emerald-50/40"
        >
          <p className="font-medium text-zinc-900">Pipeline</p>
          <p className="mt-1 text-sm text-zinc-500">Kanban 13 stages</p>
        </Link>

        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 opacity-60">
          <p className="font-medium text-zinc-900">Audits</p>
          <p className="mt-1 text-sm text-zinc-500">Conformité — à venir</p>
        </div>

        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 opacity-60">
          <p className="font-medium text-zinc-900">Support</p>
          <p className="mt-1 text-sm text-zinc-500">Tickets — à venir</p>
        </div>
      </div>
    </div>
  );
}
