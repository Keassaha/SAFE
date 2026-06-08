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
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
type PhaseConfig = { phase: string; emoji: string; stages: StageConfig[] };

interface PipelineBoardProps {
  phases: PhaseConfig[];
  initialLeads: PipelineLead[];
}

function scoreColor(score: number) {
  if (score >= 70) return "border-l-emerald-500 bg-emerald-50/40";
  if (score >= 40) return "border-l-amber-500 bg-amber-50/30";
  return "border-l-zinc-300 bg-white";
}

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-zinc-400";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />;
}

function LeadCard({ lead, isOverlay = false }: { lead: PipelineLead; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id, data: { type: "lead", lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded border border-l-4 border-zinc-200 px-3 py-2 transition hover:border-emerald-300 hover:shadow-sm ${scoreColor(lead.score)} ${
        isOverlay ? "shadow-lg ring-2 ring-emerald-500" : ""
      } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/console/leads/${lead.id}`}
          className="line-clamp-2 text-xs font-medium text-zinc-900 hover:text-emerald-700"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {lead.raisonSociale}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <ScoreDot score={lead.score} />
          <span className="tabular-nums text-[10px] text-zinc-600">{lead.score}</span>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-zinc-500">
        {lead.province}
        {lead.ville && ` · ${lead.ville}`}
      </div>
      {lead.cabinetId && (
        <div className="mt-1 inline-flex items-center text-[10px] text-emerald-700">
          ✓ Client
        </div>
      )}
    </div>
  );
}

function StageColumn({ stage, leads }: { stage: StageConfig; leads: PipelineLead[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.key,
    data: { type: "stage", stage: stage.key },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-md border bg-zinc-50/40 transition-colors ${
        isOver ? "border-emerald-400 bg-emerald-50/60" : "border-zinc-200"
      }`}
    >
      <div className="border-b border-zinc-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-700">
            {stage.short}
          </span>
          <span className="tabular-nums text-xs text-zinc-500">{leads.length}</span>
        </div>
      </div>
      <div className="flex min-h-[80px] flex-col gap-2 p-2">
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-200 px-2 py-3 text-center text-[10px] text-zinc-400">
              Glissez ici
            </div>
          ) : (
            leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export function PipelineBoard({ phases, initialLeads }: PipelineBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeLead, setActiveLead] = useState<PipelineLead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id);
    if (lead) setActiveLead(lead);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const draggedLead = leads.find((l) => l.id === active.id);
    if (!draggedLead) return;

    const overData = over.data.current;
    let targetStage: StageLead | undefined;
    if (overData?.type === "stage") {
      targetStage = overData.stage as StageLead;
    } else if (overData?.type === "lead") {
      targetStage = (overData.lead as PipelineLead).stageLead;
    }

    if (!targetStage || targetStage === draggedLead.stageLead) return;

    const previousLeads = leads;
    setLeads((prev) =>
      prev.map((l) => (l.id === draggedLead.id ? { ...l, stageLead: targetStage } : l)),
    );
    setError(null);

    startTransition(async () => {
      const result = await updateLeadStage(draggedLead.id, targetStage);
      if (!result.ok) {
        setLeads(previousLeads);
        setError(result.error);
      }
    });
  }

  const leadsByStage = new Map<StageLead, PipelineLead[]>();
  for (const phase of phases) {
    for (const stage of phase.stages) leadsByStage.set(stage.key, []);
  }
  for (const lead of leads) {
    const arr = leadsByStage.get(lead.stageLead);
    if (arr) arr.push(lead);
  }

  return (
    <>
      {error && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
          ⚠️ {error}
        </div>
      )}
      {isPending && (
        <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] text-blue-700">
          Mise à jour en cours…
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {phases.map((phase) => {
            const phaseCount = phase.stages
              .map((s) => leadsByStage.get(s.key)?.length ?? 0)
              .reduce((a, b) => a + b, 0);
            return (
              <section key={phase.phase}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {phase.emoji} {phase.phase}
                  </h2>
                  <span className="text-xs text-zinc-500">
                    {phaseCount} lead{phaseCount > 1 ? "s" : ""}
                  </span>
                </div>
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${phase.stages.length}, minmax(220px, 1fr))`,
                  }}
                >
                  {phase.stages.map((stage) => (
                    <StageColumn
                      key={stage.key}
                      stage={stage}
                      leads={leadsByStage.get(stage.key) ?? []}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
