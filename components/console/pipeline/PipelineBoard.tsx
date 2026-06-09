"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { LayoutGrid, List } from "lucide-react";
import type { StageLead } from "@prisma/client";
import { updateLeadStage } from "@/app/(app)/console/pipeline/actions";

export type PipelineLead = {
  id: string;
  raisonSociale: string;
  stageLead: StageLead;
  score: number;
  province: string;
  ville: string | null;
  cabinetId: string | null;
};

type StageConfig = { key: StageLead; short: string };
type PhaseConfig = { phase: string; key: string; stages: StageConfig[] };

interface PipelineBoardProps {
  phases: PhaseConfig[];
  initialLeads: PipelineLead[];
}

/* ── Libellés de stage + prochaine action (clé du design TDAH) ────── */

const STAGE_LABEL: Record<StageLead, string> = {
  AWARENESS: "Awareness",
  ENGAGED: "Engagé",
  CONTACTED: "Contacté",
  CONVERSING: "En conversation",
  LEAD_MAGNET_SENT: "Lead magnet envoyé",
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

const NEXT_ACTION: Record<StageLead, string> = {
  AWARENESS: "Engager : like ou commentaire sur LinkedIn",
  ENGAGED: "Envoyer un premier DM de valeur",
  CONTACTED: "Relancer pour ouvrir la conversation",
  CONVERSING: "Proposer le lead magnet ou l'audit",
  LEAD_MAGNET_SENT: "Proposer l'audit gratuit",
  AUDIT_PROPOSED: "Planifier la date de l'audit",
  AUDIT_SCHEDULED: "Réaliser l'audit",
  AUDIT_COMPLETED: "Présenter le bundle et la consultation",
  CONSULTATION_PHASE2: "Envoyer la proposition",
  READY_TO_SIGN: "Faire signer le contrat",
  SIGNED: "Lancer l'activation du cabinet",
  ACTIVATION_IN_PROGRESS: "Terminer l'activation et les accès",
  LIVE: "Sur-livrer et capturer un témoignage",
  AMBASSADOR: "Demander une référence ou un case study",
};

function scoreColor(score: number) {
  if (score >= 70) return "border-l-emerald-500 bg-emerald-50/40";
  if (score >= 40) return "border-l-amber-500 bg-amber-50/30";
  return "border-l-zinc-300 bg-white";
}
function ScoreDot({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-zinc-400";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />;
}

/* ── Carte cabinet ────────────────────────────────────────────────── */

function LeadCard({
  lead,
  draggable = true,
  onDragStartCard,
}: {
  lead: PipelineLead;
  draggable?: boolean;
  onDragStartCard?: (lead: PipelineLead) => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStartCard?.(lead);
      }}
      className={`rounded border border-l-4 border-zinc-200 px-3 py-2 transition hover:border-emerald-300 hover:shadow-sm ${scoreColor(lead.score)} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/console/clients/${lead.id}`}
          className="line-clamp-2 text-xs font-semibold text-zinc-900 hover:text-emerald-700"
          draggable={false}
        >
          {lead.raisonSociale}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <ScoreDot score={lead.score} />
          <span className="tabular-nums text-[10px] text-zinc-600">{lead.score}</span>
        </div>
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
        {STAGE_LABEL[lead.stageLead]}
      </div>
      <div className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-zinc-700">
        <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        <span>{NEXT_ACTION[lead.stageLead]}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-400">
        <span>{lead.province}{lead.ville ? ` · ${lead.ville}` : ""}</span>
        {lead.cabinetId && <span className="text-emerald-700">· Client</span>}
      </div>
    </div>
  );
}

/* ── Colonne de phase (droppable) ─────────────────────────────────── */

function PhaseColumn({
  phase,
  leads,
  onDropLead,
  onDragStartCard,
}: {
  phase: PhaseConfig;
  leads: PipelineLead[];
  onDropLead: (leadId: string, phase: PhaseConfig) => void;
  onDragStartCard: (lead: PipelineLead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: phase.key, data: { type: "phase" } });
  const [nativeOver, setNativeOver] = useState(false);

  return (
    <div
      ref={setNodeRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!nativeOver) setNativeOver(true);
      }}
      onDragLeave={() => setNativeOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setNativeOver(false);
        const leadId = e.dataTransfer.getData("text/plain");
        if (leadId) onDropLead(leadId, phase);
      }}
      className={`flex min-h-[120px] flex-col rounded-lg border bg-zinc-50/40 transition-colors ${
        isOver || nativeOver ? "border-emerald-400 bg-emerald-50/60" : "border-zinc-200"
      }`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2.5">
        <span className="text-sm font-semibold text-zinc-900">{phase.phase}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs tabular-nums text-zinc-500">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {leads.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-200 px-2 py-4 text-center text-[10px] text-zinc-400">
            Déposez un cabinet ici
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onDragStartCard={onDragStartCard} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Vue liste priorisée ──────────────────────────────────────────── */

function ListView({ phases, leadsByPhase }: { phases: PhaseConfig[]; leadsByPhase: Map<string, PipelineLead[]> }) {
  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const leads = leadsByPhase.get(phase.key) ?? [];
        return (
          <section key={phase.key}>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">{phase.phase}</h2>
              <span className="text-xs text-zinc-500">{leads.length}</span>
            </div>
            {leads.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-200 px-3 py-3 text-xs text-zinc-400">
                Aucun cabinet à cette phase.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <ul className="divide-y divide-zinc-100">
                  {leads.map((lead) => (
                    <li key={lead.id}>
                      <Link
                        href={`/console/clients/${lead.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-zinc-50"
                      >
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          lead.score >= 70 ? "bg-emerald-100 text-emerald-800"
                          : lead.score >= 40 ? "bg-amber-100 text-amber-800"
                          : "bg-zinc-100 text-zinc-600"}`}>
                          {lead.score}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-zinc-900">{lead.raisonSociale}</span>
                            <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-600">
                              {STAGE_LABEL[lead.stageLead]}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-zinc-600">
                            Prochaine action : {NEXT_ACTION[lead.stageLead]}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-zinc-400">
                          {lead.province}{lead.ville ? ` · ${lead.ville}` : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ── Board ────────────────────────────────────────────────────────── */

export function PipelineBoard({ phases, initialLeads }: PipelineBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeLead, setActiveLead] = useState<PipelineLead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Map stage → phase key (pour savoir où ranger un lead).
  const stageToPhase = new Map<StageLead, string>();
  for (const phase of phases) {
    for (const stage of phase.stages) stageToPhase.set(stage.key, phase.key);
  }

  function moveLead(leadId: string, phase: PhaseConfig) {
    const dragged = leads.find((l) => l.id === leadId);
    setActiveLead(null);
    if (!dragged) return;

    // Pas de changement si déjà dans cette phase.
    if (stageToPhase.get(dragged.stageLead) === phase.key) return;

    const targetStage = phase.stages[0].key; // entrée de phase
    const previous = leads;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stageLead: targetStage } : l)));
    setError(null);

    startTransition(async () => {
      const result = await updateLeadStage(leadId, targetStage);
      if (!result.ok) {
        setLeads(previous);
        setError(result.error);
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;
    const phase = phases.find((p) => p.key === over.id);
    if (phase) moveLead(String(active.id), phase);
  }
  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id);
    if (lead) setActiveLead(lead);
  }

  // Regroupe par phase, trié par score décroissant.
  const leadsByPhase = new Map<string, PipelineLead[]>();
  for (const phase of phases) leadsByPhase.set(phase.key, []);
  for (const lead of [...leads].sort((a, b) => b.score - a.score)) {
    const key = stageToPhase.get(lead.stageLead);
    if (key) leadsByPhase.get(key)?.push(lead);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-800">{error}</div>
        )}
        {isPending && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] text-blue-700">Mise à jour…</div>
        )}
        <div className="ml-auto inline-flex rounded-md border border-zinc-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setView("board")}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${view === "board" ? "bg-emerald-600 text-white" : "text-zinc-600 hover:text-zinc-900"}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Tableau
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${view === "list" ? "bg-emerald-600 text-white" : "text-zinc-600 hover:text-zinc-900"}`}
          >
            <List className="h-3.5 w-3.5" /> Liste
          </button>
        </div>
      </div>

      {view === "list" ? (
        <ListView phases={phases} leadsByPhase={leadsByPhase} />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {phases.map((phase) => (
              <PhaseColumn
                key={phase.key}
                phase={phase}
                leads={leadsByPhase.get(phase.key) ?? []}
                onDropLead={moveLead}
                onDragStartCard={setActiveLead}
              />
            ))}
          </div>
          <DragOverlay>{activeLead ? <LeadCard lead={activeLead} draggable={false} /> : null}</DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
