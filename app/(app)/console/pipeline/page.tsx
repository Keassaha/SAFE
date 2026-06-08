import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  PipelineBoard,
  type PipelineLead,
} from "@/components/console/pipeline/PipelineBoard";
import type { StageLead } from "@prisma/client";

const PHASES: {
  phase: string;
  emoji: string;
  stages: { key: StageLead; short: string }[];
}[] = [
  {
    phase: "Pré-engagement",
    emoji: "🌱",
    stages: [
      { key: "AWARENESS", short: "Awareness" },
      { key: "ENGAGED", short: "Engagé" },
    ],
  },
  {
    phase: "Engagement",
    emoji: "💬",
    stages: [
      { key: "CONTACTED", short: "Contacté" },
      { key: "CONVERSING", short: "Conversation" },
    ],
  },
  {
    phase: "Pré-audit",
    emoji: "🎯",
    stages: [
      { key: "LEAD_MAGNET_SENT", short: "LM envoyé" },
      { key: "AUDIT_PROPOSED", short: "Audit proposé" },
      { key: "AUDIT_SCHEDULED", short: "Audit planifié" },
    ],
  },
  {
    phase: "Décision",
    emoji: "📋",
    stages: [
      { key: "AUDIT_COMPLETED", short: "Audit fait" },
      { key: "CONSULTATION_PHASE2", short: "Consult P2" },
      { key: "READY_TO_SIGN", short: "Ready to sign" },
    ],
  },
  {
    phase: "Client",
    emoji: "🚀",
    stages: [
      { key: "SIGNED", short: "Signé" },
      { key: "ACTIVATION_IN_PROGRESS", short: "Activation" },
      { key: "LIVE", short: "Live" },
      { key: "AMBASSADOR", short: "Ambassadeur" },
    ],
  },
];

export default async function ConsolePipelinePage() {
  const workspace = await getSafeIncWorkspace();

  const rawLeads = await prisma.lead.findMany({
    where: {
      workspaceId: workspace.id,
      statutLead: { notIn: ["CHURNED", "PAUSED"] },
    },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      raisonSociale: true,
      stageLead: true,
      score: true,
      province: true,
      ville: true,
      cabinetId: true,
    },
  });

  const leads: PipelineLead[] = rawLeads.map((l) => ({
    id: l.id,
    raisonSociale: l.raisonSociale,
    stageLead: l.stageLead,
    score: l.score,
    province: l.province,
    ville: l.ville,
    cabinetId: l.cabinetId,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description={`${leads.length} lead${leads.length > 1 ? "s" : ""} actif${leads.length > 1 ? "s" : ""} — Glissez-déposez pour changer de stage — Phase ${workspace.workMode}`}
      />

      {workspace.workMode === "PRECHAUFFAGE" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Pendant la phase préchauffage, l'objectif est <strong>de remplir la
          colonne gauche</strong> (Awareness / Engagé / Contacté), pas de pousser
          vers le bas du pipeline.
        </div>
      )}

      <PipelineBoard phases={PHASES} initialLeads={leads} />
    </div>
  );
}
