import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

const STAGE_LABELS: Record<string, string> = {
  AWARENESS: "Awareness",
  ENGAGED: "Engagé",
  CONTACTED: "Contacté",
  CONVERSING: "Conversation",
  LEAD_MAGNET_SENT: "Lead magnet envoyé",
  AUDIT_PROPOSED: "Audit proposé",
  AUDIT_SCHEDULED: "Audit planifié",
  AUDIT_COMPLETED: "Audit complété",
  CONSULTATION_PHASE2: "Consultation Phase 2",
  READY_TO_SIGN: "Prêt à signer",
  SIGNED: "Signé",
  ACTIVATION_IN_PROGRESS: "Activation",
  LIVE: "Live",
  AMBASSADOR: "Ambassadeur",
};

const SOURCE_LABELS: Record<string, string> = {
  LINKEDIN_DM_WARM: "LinkedIn DM tiède",
  LINKEDIN_DM_COLD: "LinkedIn DM froid",
  LINKEDIN_POST: "LinkedIn post",
  SEO_ORGANIC: "SEO organique",
  SEO_LOCAL_BUSINESS: "SEO local",
  REFERRAL: "Referral",
  AUDIT_GRATUIT: "Audit gratuit",
  EMAIL: "Email",
  FACEBOOK_GROUP: "Facebook",
  RECRUITMENT_AGENCY: "Agence recrutement",
  OFFLINE: "Offline",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-100 text-emerald-800"
      : score >= 40
      ? "bg-amber-100 text-amber-800"
      : "bg-zinc-100 text-zinc-700";
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {score}
    </span>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const isLive = stage === "LIVE" || stage === "AMBASSADOR";
  const isClosing = ["SIGNED", "ACTIVATION_IN_PROGRESS", "READY_TO_SIGN"].includes(
    stage,
  );
  const color = isLive
    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : isClosing
    ? "bg-blue-100 text-blue-800 border-blue-200"
    : "bg-zinc-100 text-zinc-700 border-zinc-200";
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${color}`}
    >
      {STAGE_LABELS[stage] ?? stage}
    </span>
  );
}

export default async function ConsoleLeadsPage() {
  const workspace = await getSafeIncWorkspace();

  const leads = await prisma.lead.findMany({
    where: { workspaceId: workspace.id },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    include: {
      _count: { select: { contacts: true, activities: true } },
      cabinet: { select: { nom: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cabinets"
        description={`${leads.length} cabinet${leads.length > 1 ? "s" : ""} dans le pipeline`}
        action={
          <Link
            href="/console/leads/nouveau"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Nouveau cabinet
          </Link>
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          title="Aucun lead"
          description="Lancez le seed CRM pour générer votre cliente actuelle + 5 leads démo."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Cabinet</th>
                    <th className="px-4 py-3 text-left">Stage</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-left">Province / Ville</th>
                    <th className="px-4 py-3 text-left">Taille</th>
                    <th className="px-4 py-3 text-right">Contacts</th>
                    <th className="px-4 py-3 text-right">Activités</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="cursor-pointer transition hover:bg-zinc-50/60"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/console/leads/${lead.id}`}
                          className="block font-medium text-zinc-900 hover:text-emerald-700"
                        >
                          {lead.raisonSociale}
                        </Link>
                        {lead.cabinet && (
                          <div className="mt-0.5 text-xs text-emerald-700">
                            ✓ Client converti
                          </div>
                        )}
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {lead.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={lead.stageLead} />
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {SOURCE_LABELS[lead.sourceLead] ?? lead.sourceLead}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ScoreBadge score={lead.score} />
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        <div>{lead.province}</div>
                        {lead.ville && (
                          <div className="text-xs text-zinc-500">{lead.ville}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {lead.tailleCabinet.replace(/_/g, "-")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                        {lead._count.contacts}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                        {lead._count.activities}
                      </td>
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
