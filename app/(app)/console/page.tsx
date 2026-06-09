import Link from "next/link";
import type { StageLead, TypeActivity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { Card, CardContent } from "@/components/ui/Card";

// Zone 1  Ancre      : phase J+X/90, barre de progression, date du jour.
// Zone 2  Cliente    : bloc dedie Me Derisier (actif #1 du prechauffage).
// KPIs               : jours restants, cabinets actifs, pipeline chaud, momentum 7j.
// Zone 3  Colonnes   : gauche « qui toucher aujourd'hui » · droite « flux recent ».
// Tout reste server-side via Prisma et le workspace SAFE Inc.

const DAY_MS = 1000 * 60 * 60 * 24;
const HOUR_MS = 1000 * 60 * 60;
const PHASE_DAYS = 90;

const STAGE_LABELS: Record<StageLead, string> = {
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

const ACTIVITY_LABELS: Record<TypeActivity, string> = {
  LINKEDIN_LIKE: "Like LinkedIn",
  LINKEDIN_COMMENT: "Commentaire LinkedIn",
  LINKEDIN_SHARE: "Partage LinkedIn",
  LINKEDIN_DM: "DM LinkedIn",
  EMAIL_ENVOYE: "Courriel envoyé",
  EMAIL_RECU: "Courriel reçu",
  EMAIL_OUVERT: "Courriel ouvert",
  EMAIL_CLIQUE: "Courriel cliqué",
  EMAIL_BOUNCE: "Courriel rejeté",
  CALL: "Appel",
  MEETING: "Rencontre",
  DEMO: "Démo",
  NOTE: "Note",
  AUDIT_SOUMIS: "Audit soumis",
  BUNDLE_PROPOSE: "Bundle proposé",
  CONTRAT_SIGNE: "Contrat signé",
  GO_LIVE: "Go live",
  CHURN_SIGNAL: "Signal de départ",
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function daysBetween(from: Date, to: Date) {
  return Math.max(0, Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function relativeTime(date: Date, now: Date) {
  const diff = Math.max(0, now.getTime() - date.getTime());
  if (diff < HOUR_MS) {
    const minutes = Math.max(1, Math.floor(diff / (1000 * 60)));
    return `il y a ${minutes} min`;
  }
  if (diff < DAY_MS) {
    const hours = Math.max(1, Math.floor(diff / HOUR_MS));
    return `il y a ${hours} h`;
  }
  const days = Math.max(1, Math.floor(diff / DAY_MS));
  return `il y a ${days} j`;
}

function progressTone(percent: number) {
  if (percent >= 85) {
    return { text: "text-red-700", bar: "bg-red-600", track: "bg-red-100", border: "border-red-200" };
  }
  if (percent >= 60) {
    return { text: "text-orange-700", bar: "bg-orange-500", track: "bg-orange-100", border: "border-orange-200" };
  }
  return { text: "text-emerald-700", bar: "bg-emerald-600", track: "bg-emerald-100", border: "border-emerald-200" };
}

function scoreTone(score: number) {
  if (score >= 75) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 60) return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function stageTone(stage: StageLead) {
  if (stage === "LIVE" || stage === "AMBASSADOR") {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (["READY_TO_SIGN", "SIGNED", "ACTIVATION_IN_PROGRESS"].includes(stage)) {
    return "bg-blue-50 text-blue-800 border-blue-200";
  }
  if (["AUDIT_PROPOSED", "AUDIT_SCHEDULED", "AUDIT_COMPLETED", "CONSULTATION_PHASE2"].includes(stage)) {
    return "bg-orange-50 text-orange-800 border-orange-200";
  }
  return "bg-zinc-50 text-zinc-700 border-zinc-200";
}

function activityTone(type: TypeActivity) {
  if (["CONTRAT_SIGNE", "GO_LIVE", "AUDIT_SOUMIS"].includes(type)) return "bg-emerald-500";
  if (["CALL", "MEETING", "DEMO"].includes(type)) return "bg-blue-500";
  if (["CHURN_SIGNAL", "EMAIL_BOUNCE"].includes(type)) return "bg-red-500";
  if (["LINKEDIN_DM", "EMAIL_RECU", "EMAIL_CLIQUE"].includes(type)) return "bg-orange-500";
  return "bg-zinc-400";
}

function KpiCard({
  value,
  label,
  subtext,
  tone = "neutral",
}: {
  value: string;
  label: string;
  subtext: string;
  tone?: "neutral" | "green" | "orange" | "red";
}) {
  const valueClass = {
    neutral: "text-zinc-950",
    green: "text-emerald-700",
    orange: "text-orange-700",
    red: "text-red-700",
  }[tone];

  return (
    <Card className="border border-zinc-200/70 bg-white shadow-sm">
      <CardContent className="px-5 py-4">
        <p className={`text-3xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
        <p className="mt-2 text-sm font-medium text-zinc-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function StageBadge({ stage }: { stage: StageLead }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${stageTone(stage)}`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`inline-flex min-w-10 justify-center rounded-md border px-2 py-1 text-xs font-semibold tabular-nums ${scoreTone(score)}`}>
      {score}
    </span>
  );
}

export default async function ConsolePage() {
  const workspace = await getSafeIncWorkspace();
  const today = new Date();
  const phaseStart = workspace.phaseDateDebut;
  const phaseEnd = workspace.phaseDateFin ?? new Date(phaseStart.getTime() + PHASE_DAYS * DAY_MS);
  const totalDays = Math.max(1, daysBetween(phaseStart, phaseEnd) || PHASE_DAYS);
  const elapsedDays = clamp(daysBetween(phaseStart, today), 0, totalDays);
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const progressPercent = clamp(Math.round((elapsedDays / totalDays) * 100), 0, 100);
  const progress = progressTone(progressPercent);
  const inactiveCutoff = new Date(today.getTime() - 5 * DAY_MS);
  const weekCutoff = new Date(today.getTime() - 7 * DAY_MS);

  const [liveCabinets, hotPipeline, weekActivities, pilote, priorityLeads, recentActivities] =
    await Promise.all([
      prisma.lead.count({
        where: { workspaceId: workspace.id, stageLead: "LIVE" },
      }),
      prisma.lead.count({
        where: {
          workspaceId: workspace.id,
          score: { gte: 60 },
          stageLead: { notIn: ["LIVE", "AMBASSADOR"] },
        },
      }),
      prisma.activity.count({
        where: { lead: { workspaceId: workspace.id }, date: { gte: weekCutoff } },
      }),
      // Cliente pilote : 1er lead Live rattache a un cabinet autre que SAFE Inc.
      prisma.lead.findFirst({
        where: {
          workspaceId: workspace.id,
          stageLead: "LIVE",
          cabinet: { nom: { not: "SAFE" } },
        },
        select: {
          id: true,
          raisonSociale: true,
          ville: true,
          province: true,
          score: true,
          dateDerniereActivite: true,
          cabinetId: true,
        },
      }),
      prisma.lead.findMany({
        where: {
          workspaceId: workspace.id,
          stageLead: { notIn: ["LIVE", "AMBASSADOR"] },
          OR: [
            { dateDerniereActivite: { lt: inactiveCutoff } },
            { dateDerniereActivite: null },
            { score: { gte: 60 } },
          ],
        },
        select: {
          id: true,
          raisonSociale: true,
          stageLead: true,
          score: true,
          ville: true,
          dateDerniereActivite: true,
        },
        orderBy: [{ score: "desc" }, { dateDerniereActivite: "asc" }],
        take: 6,
      }),
      prisma.activity.findMany({
        where: { lead: { workspaceId: workspace.id } },
        select: {
          id: true,
          type: true,
          date: true,
          createdAt: true,
          lead: { select: { raisonSociale: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
    ]);

  // Tickets ouverts de la cliente pilote
  const piloteTickets = pilote?.cabinetId
    ? await prisma.supportTicket.count({
        where: { cabinetId: pilote.cabinetId, statut: { in: ["NOUVEAU", "EN_COURS"] } },
      })
    : 0;
  const piloteDerniers = pilote?.dateDerniereActivite
    ? daysBetween(pilote.dateDerniereActivite, today)
    : null;

  const remainingTone = remainingDays <= 10 ? "red" : remainingDays <= 30 ? "orange" : "green";

  return (
    <div className="space-y-6">
      {/* ── ZONE 1 — Ancre ──────────────────────────────────────── */}
      <section className={`rounded-lg border ${progress.border} bg-white px-5 py-4 shadow-sm`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Console SAFE Inc.</h1>
            {workspace.workMode === "PRECHAUFFAGE" && (
              <p className="mt-1 text-xs text-zinc-500">
                Phase préchauffage active : audience cible LinkedIn {workspace.cibleAudienceLinkedIn ?? 1000}.
              </p>
            )}
          </div>

          <div className="w-full max-w-xl lg:px-6">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className={`font-medium ${progress.text}`}>
                J+{elapsedDays}/{totalDays} jours
              </span>
              <span className="font-medium tabular-nums text-zinc-700">{progressPercent}%</span>
            </div>
            <div className={`h-2.5 overflow-hidden rounded-full ${progress.track}`}>
              <div className={`h-full rounded-full ${progress.bar}`} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <p className="whitespace-nowrap text-sm font-medium capitalize text-zinc-600">{formatDate(today)}</p>
        </div>
      </section>

      {/* ── ZONE 2 — Cliente pilote ─────────────────────────────── */}
      {pilote && (
        <Link
          href={`/console/clients/${pilote.id}`}
          className="block rounded-lg border border-emerald-200 bg-emerald-50/40 px-6 py-5 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Cliente pilote</p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-950">{pilote.raisonSociale}</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {[pilote.ville, pilote.province].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
              Live
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-emerald-100 pt-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Dernier contact</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">
                {piloteDerniers === null
                  ? "Aucun"
                  : piloteDerniers === 0
                    ? "Aujourd'hui"
                    : `Il y a ${piloteDerniers} j`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Tickets ouverts</p>
              <p className={`mt-1 text-sm font-medium ${piloteTickets > 0 ? "text-amber-700" : "text-zinc-800"}`}>
                {piloteTickets}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Score</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">{pilote.score} / 100</p>
            </div>
          </div>
        </Link>
      )}

      {/* ── KPIs momentum ───────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          value={String(remainingDays)}
          label="Jours restants"
          subtext={`Jour ${elapsedDays} sur ${totalDays} de phase`}
          tone={remainingTone}
        />
        <KpiCard
          value={String(liveCabinets)}
          label="Cabinets actifs"
          subtext="Clients au stage Live"
          tone="green"
        />
        <KpiCard
          value={String(hotPipeline)}
          label="Pipeline chaud"
          subtext="Score 60+ hors clients live"
          tone={hotPipeline > 0 ? "orange" : "neutral"}
        />
        <KpiCard
          value={String(weekActivities)}
          label="Activités 7 jours"
          subtext="Votre momentum de la semaine"
          tone={weekActivities > 0 ? "green" : "neutral"}
        />
      </section>

      {/* ── ZONE 3 — Deux colonnes ──────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="border border-zinc-200/70 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">Qui toucher aujourd'hui</h2>
                <p className="mt-1 text-sm text-zinc-500">Inactifs depuis plus de 5 jours ou score de conversion élevé.</p>
              </div>
              <Link href="/console/clients" className="shrink-0 text-xs font-medium text-emerald-700 hover:underline">
                Tous les clients
              </Link>
            </div>

            {priorityLeads.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-zinc-900">Vous êtes à jour.</p>
                <p className="mt-1 text-sm text-zinc-500">Aucune relance prioritaire pour aujourd'hui.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {priorityLeads.map((lead) => {
                  const lastContactDays = lead.dateDerniereActivite
                    ? daysBetween(lead.dateDerniereActivite, today)
                    : null;

                  return (
                    <Link
                      key={lead.id}
                      href={`/console/clients/${lead.id}`}
                      className="grid gap-3 px-5 py-4 transition hover:bg-zinc-50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-zinc-950">{lead.raisonSociale}</p>
                          <StageBadge stage={lead.stageLead} />
                          <ScoreBadge score={lead.score} />
                        </div>
                        <p className="mt-2 text-sm text-zinc-500">
                          {lead.ville ? `${lead.ville} · ` : ""}
                          Dernier contact :{" "}
                          {lastContactDays === null
                            ? "aucune activité"
                            : lastContactDays === 0
                              ? "aujourd'hui"
                              : `${lastContactDays} jour${lastContactDays > 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <span className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-800">
                        Ouvrir
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/70 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-base font-semibold text-zinc-950">Ce qui s'est passé</h2>
              <p className="mt-1 text-sm text-zinc-500">Les 8 dernières activités CRM.</p>
            </div>

            {recentActivities.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-zinc-500">Aucune activité récente.</div>
            ) : (
              <ol className="divide-y divide-zinc-100">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex gap-3 px-5 py-4">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${activityTone(activity.type)}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-950">{ACTIVITY_LABELS[activity.type]}</p>
                      <p className="mt-1 truncate text-sm text-zinc-500">{activity.lead?.raisonSociale ?? "Lead sans nom"}</p>
                      <p className="mt-1 text-xs text-zinc-400">{relativeTime(activity.date, today)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
