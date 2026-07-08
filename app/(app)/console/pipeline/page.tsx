import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  PipelineBoard,
  type PipelineLead,
} from "@/components/console/pipeline/PipelineBoard";
import type { StageLead } from "@prisma/client";

// 4 phases lisibles (au lieu de 13 colonnes). Chaque phase regroupe ses stages ;
// la carte affiche le stage précis + la prochaine action. Spec : CONSOLE_CONSULTANT_REFACTOR_v1.
const PHASES: {
  phase: string;
  key: string;
  stages: { key: StageLead; short: string }[];
}[] = [
  {
    phase: "À engager",
    key: "engager",
    stages: [
      { key: "AWARENESS", short: "Awareness" },
      { key: "ENGAGED", short: "Engagé" },
    ],
  },
  {
    phase: "En conversation",
    key: "conversation",
    stages: [
      { key: "CONTACTED", short: "Contacté" },
      { key: "CONVERSING", short: "Conversation" },
      { key: "LEAD_MAGNET_SENT", short: "Lead magnet" },
    ],
  },
  {
    phase: "Audit & décision",
    key: "audit",
    stages: [
      { key: "AUDIT_PROPOSED", short: "Audit proposé" },
      { key: "AUDIT_SCHEDULED", short: "Audit planifié" },
      { key: "AUDIT_COMPLETED", short: "Audit fait" },
      { key: "CONSULTATION_PHASE2", short: "Consultation" },
      { key: "READY_TO_SIGN", short: "Prêt à signer" },
    ],
  },
  {
    phase: "Clients",
    key: "clients",
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
        description={`${leads.length} cabinet${leads.length > 1 ? "s" : ""} en cours — glissez une carte vers une phase pour la faire avancer`}
      />

      {workspace.workMode === "PRECHAUFFAGE" && (
        <p className="text-xs text-si-muted">
          Phase préchauffage : l'objectif est de remplir les deux premières colonnes (À engager, En conversation), pas de pousser vers la signature.
        </p>
      )}

      <PipelineBoard phases={PHASES} initialLeads={leads} />
    </div>
  );
}
