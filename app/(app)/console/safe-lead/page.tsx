import Link from "next/link";
import { ArrowRight, Flame, Plus, Radar, Sparkles, Target } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";

const DAY_MS = 1000 * 60 * 60 * 24;

const STAGE_LABELS: Record<string, string> = {
  AWARENESS: "Awareness",
  ENGAGED: "Engagé",
  CONTACTED: "Contacté",
  CONVERSING: "Conversation",
  LEAD_MAGNET_SENT: "Lead magnet",
  AUDIT_PROPOSED: "Audit proposé",
  AUDIT_SCHEDULED: "Audit planifié",
  AUDIT_COMPLETED: "Audit complété",
  CONSULTATION_PHASE2: "Consultation",
  READY_TO_SIGN: "Prêt à signer",
  SIGNED: "Signé",
  ACTIVATION_IN_PROGRESS: "Activation",
  LIVE: "Live",
  AMBASSADOR: "Ambassadeur",
};

const SOURCE_LABELS: Record<string, string> = {
  LINKEDIN_DM_WARM: "LinkedIn tiède",
  LINKEDIN_DM_COLD: "LinkedIn froid",
  LINKEDIN_POST: "Post LinkedIn",
  SEO_ORGANIC: "SEO organique",
  SEO_LOCAL_BUSINESS: "SEO local",
  REFERRAL: "Référence",
  AUDIT_GRATUIT: "Audit gratuit",
  EMAIL: "Email",
  FACEBOOK_GROUP: "Groupe Facebook",
  RECRUITMENT_AGENCY: "Partenaire recrutement",
  OFFLINE: "Offline",
};

function formatDate(date: Date | null) {
  if (!date) return "Aucune activité";
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function scoreTone(score: number) {
  if (score >= 75) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 60) return "border-orange-200 bg-orange-50 text-orange-800";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function KpiCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card className="border border-zinc-200/70 bg-white shadow-sm">
      <CardContent className="px-5 py-4">
        <p className="text-3xl font-semibold tracking-tight text-zinc-950">{value}</p>
        <p className="mt-2 text-sm font-medium text-zinc-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Flame;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div>
        <h2 className="text-base font-semibold tracking-tight text-zinc-950">{title}</h2>
        <p className="mt-0.5 text-sm leading-5 text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default async function SafeLeadPage() {
  const workspace = await getSafeIncWorkspace();
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * DAY_MS);
  const staleCutoff = new Date(today.getTime() - 14 * DAY_MS);

  const [
    totalLeads,
    hotLeads,
    newThisWeek,
    readyForAudit,
    staleHotLeads,
    activitiesThisWeek,
    sourceBreakdown,
    leadMagnets,
    priorityLeads,
  ] = await Promise.all([
    prisma.lead.count({ where: { workspaceId: workspace.id } }),
    prisma.lead.count({
      where: {
        workspaceId: workspace.id,
        score: { gte: 70 },
        stageLead: { notIn: ["LIVE", "AMBASSADOR"] },
      },
    }),
    prisma.lead.count({
      where: { workspaceId: workspace.id, createdAt: { gte: weekAgo } },
    }),
    prisma.lead.count({
      where: {
        workspaceId: workspace.id,
        stageLead: { in: ["AUDIT_PROPOSED", "AUDIT_SCHEDULED", "AUDIT_COMPLETED", "CONSULTATION_PHASE2", "READY_TO_SIGN"] },
      },
    }),
    prisma.lead.count({
      where: {
        workspaceId: workspace.id,
        score: { gte: 60 },
        stageLead: { notIn: ["LIVE", "AMBASSADOR"] },
        OR: [{ dateDerniereActivite: null }, { dateDerniereActivite: { lt: staleCutoff } }],
      },
    }),
    prisma.activity.count({
      where: { lead: { workspaceId: workspace.id }, date: { gte: weekAgo } },
    }),
    prisma.lead.groupBy({
      by: ["sourceLead"],
      where: { workspaceId: workspace.id },
      _count: { _all: true },
      orderBy: { _count: { sourceLead: "desc" } },
      take: 5,
    }),
    prisma.leadMagnet.count({ where: { actif: true } }),
    prisma.lead.findMany({
      where: {
        workspaceId: workspace.id,
        stageLead: { notIn: ["LIVE", "AMBASSADOR"] },
      },
      orderBy: [{ score: "desc" }, { dateDerniereActivite: "asc" }],
      take: 6,
      select: {
        id: true,
        raisonSociale: true,
        province: true,
        ville: true,
        sourceLead: true,
        stageLead: true,
        score: true,
        scoreFirmographique: true,
        scoreEngagement: true,
        scoreEnrichissement: true,
        dateDerniereActivite: true,
        _count: { select: { contacts: true, activities: true, tasks: true } },
      },
    }),
  ]);

  const conversionFocus = hotLeads + readyForAudit;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SAFE Lead"
        description="Interface de génération et qualification des leads chauds pour cabinets d'avocats."
        action={
          <Link
            href="/console/leads/nouveau"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau lead
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Leads suivis" value={totalLeads} helper="Cabinets dans le workspace SAFE Inc." />
        <KpiCard label="Chaud à qualifier" value={hotLeads} helper="Score 70+ hors clients live." />
        <KpiCard label="Entrées 7 jours" value={newThisWeek} helper="Nouveaux cabinets détectés." />
        <KpiCard label="Focus conversion" value={conversionFocus} helper="Leads chauds + audits/décision." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <Card className="border border-zinc-200/70 bg-white shadow-sm">
          <CardContent className="space-y-5">
            <SectionTitle
              icon={Flame}
              title="File chaude"
              subtitle="Les cabinets à qualifier ou relancer en priorité."
            />

            <div className="divide-y divide-zinc-100">
              {priorityLeads.length === 0 ? (
                <p className="py-8 text-sm text-zinc-500">Aucun lead actif pour l'instant.</p>
              ) : (
                priorityLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/console/leads/${lead.id}`}
                    className="group grid gap-3 py-4 transition hover:bg-zinc-50/60 sm:grid-cols-[1fr_auto] sm:px-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-zinc-950 group-hover:text-emerald-700">
                          {lead.raisonSociale}
                        </h3>
                        <span className={`rounded border px-2 py-0.5 text-xs font-semibold tabular-nums ${scoreTone(lead.score)}`}>
                          {lead.score}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {lead.ville ? `${lead.ville}, ` : ""}
                        {lead.province} · {SOURCE_LABELS[lead.sourceLead] ?? lead.sourceLead} · {STAGE_LABELS[lead.stageLead] ?? lead.stageLead}
                      </p>
                      <div className="mt-3 grid gap-2 text-xs text-zinc-600 sm:grid-cols-3">
                        <span>Firmo {lead.scoreFirmographique}/40</span>
                        <span>Engagement {lead.scoreEngagement}/40</span>
                        <span>Enrichi {lead.scoreEnrichissement}/20</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs text-zinc-500 sm:justify-end">
                      <span>{lead._count.contacts} contact{lead._count.contacts > 1 ? "s" : ""}</span>
                      <span>{lead._count.activities} activité{lead._count.activities > 1 ? "s" : ""}</span>
                      <span>{formatDate(lead.dateDerniereActivite)}</span>
                      <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:text-emerald-700" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-zinc-200/70 bg-white shadow-sm">
            <CardContent className="space-y-5">
              <SectionTitle
                icon={Radar}
                title="Boucles d'acquisition"
                subtitle="Sources qui alimentent le pipeline."
              />
              <div className="space-y-3">
                {sourceBreakdown.map((source) => (
                  <div key={source.sourceLead} className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                    <span className="text-sm font-medium text-zinc-800">
                      {SOURCE_LABELS[source.sourceLead] ?? source.sourceLead}
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700 shadow-sm">
                      {source._count._all}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200/70 bg-white shadow-sm">
            <CardContent className="space-y-5">
              <SectionTitle
                icon={Target}
                title="Signaux à traiter"
                subtitle="Ce que SAFE Lead doit faire remonter."
              />
              <div className="grid gap-3">
                <div className="rounded-md border border-orange-100 bg-orange-50 px-3 py-3">
                  <p className="text-sm font-semibold text-orange-900">{staleHotLeads} relance{staleHotLeads > 1 ? "s" : ""} chaude{staleHotLeads > 1 ? "s" : ""}</p>
                  <p className="mt-1 text-xs leading-5 text-orange-800">Score 60+ sans activité récente depuis 14 jours.</p>
                </div>
                <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-3">
                  <p className="text-sm font-semibold text-emerald-900">{activitiesThisWeek} activité{activitiesThisWeek > 1 ? "s" : ""} cette semaine</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">Interactions CRM reliées aux leads SAFE Inc.</p>
                </div>
                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-3">
                  <p className="text-sm font-semibold text-blue-900">{leadMagnets} lead magnet{leadMagnets > 1 ? "s" : ""} actif{leadMagnets > 1 ? "s" : ""}</p>
                  <p className="mt-1 text-xs leading-5 text-blue-800">Actifs qui peuvent déclencher une qualification.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border border-zinc-200/70 bg-white shadow-sm">
        <CardContent className="space-y-5">
          <SectionTitle
            icon={Sparkles}
            title="Qualification SAFE Lead v1"
            subtitle="Définition opérationnelle d'un lead chaud avant automatisation."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Fit cabinet", "Province cible, taille exploitable, domaine de pratique compatible, volume de facturation suffisant."],
              ["Signal d'intention", "Audit demandé, ressource consommée, réponse à un DM, commentaire qualifié ou référence directe."],
              ["Prochaine action", "Chaque lead chaud doit avoir une relance, une invitation audit ou une consultation à planifier."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-4">
                <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
