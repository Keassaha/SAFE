"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Pencil, Plus, FileEdit, Search, FileText, BookOpen, FolderOpen, Scale, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LexTrackLawyer, LexTrackTask } from "@/types/gestion";
import { LEXTRACK_PHASES } from "@/types/gestion";
import { routes } from "@/lib/routes";

/* Palette harmonisée avec le design system SAFE (émeraude + or) */
const COLORS = {
  bg: "var(--safe-green-950, #081e18)",
  panel: "var(--safe-green-900, #0e3b2f)",
  border: "var(--safe-neutral-700, #2b3a34)",
  gold: "var(--safe-green-600, #7DAA98)",
  goldLight: "var(--safe-green-50, #F0F7F3)",
  urgent: "var(--safe-status-error, #b91c1c)",
  warning: "var(--safe-status-warning, #b45309)",
  ok: "var(--safe-green-600, #6fa690)",
  /* Phases : tons émeraude + or */
  phase1: "var(--safe-green-600, #6fa690)",
  phase2: "var(--safe-green-700, #3e7a66)",
  phase3: "var(--safe-green-700, #5A8F7B)",
  phase4: "var(--safe-green-800, #1f5a47)",
  text: "var(--safe-green-100, #e6f4ef)",
  muted: "var(--safe-neutral-500, #6b7280)",
  dimmed: "var(--safe-neutral-700, #2b3a34)",
};

const PHASE_COLORS = [COLORS.phase1, COLORS.phase2, COLORS.phase3, COLORS.phase4];

const TYPE_ICONS: Record<string, LucideIcon> = {
  analyse: Search,
  acte: FileText,
  recherche: BookOpen,
  admin: FolderOpen,
  audience: Scale,
  echeance: Clock,
};

const STATUS_COLORS: Record<string, string> = {
  done: COLORS.ok,
  inprogress: COLORS.gold,
  upcoming: COLORS.warning,
  todo: COLORS.dimmed,
};

function daysUntil(dateStr: string, todayStr?: string): number {
  const today = todayStr ? new Date(todayStr) : new Date();
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-CA", {
    day: "2-digit",
    month: "short",
  });
}

function DeadlinePill({
  deadline,
  status,
  todayStr,
  doneLabel,
}: {
  deadline: string;
  status: string;
  todayStr?: string;
  doneLabel: string;
}) {
  const days = daysUntil(deadline, todayStr);
  let color = COLORS.ok;
  let label = `+${days}j`;
  if (status === "done") {
    color = COLORS.muted;
    label = doneLabel;
  } else if (days < 0) {
    color = COLORS.urgent;
    label = `${days}j`;
  } else if (days <= 7) {
    color = COLORS.urgent;
    label = `${days}j`;
  } else if (days <= 21) {
    color = COLORS.warning;
    label = `${days}j`;
  }
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 4,
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        letterSpacing: 0.5,
      }}
    >
      {label}
    </span>
  );
}

function TaskCard({
  task,
  lawyer,
  onClick,
  selected,
  todayStr,
  typeLabels,
  statusLabels,
}: {
  task: LexTrackTask;
  lawyer: LexTrackLawyer;
  onClick: (t: LexTrackTask) => void;
  selected: boolean;
  todayStr?: string;
  typeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
}) {
  const Icon = TYPE_ICONS[task.type] ?? FileText;
  const statusColor = STATUS_COLORS[task.status] ?? COLORS.dimmed;
  const isAudience = task.type === "audience";
  return (
    <div
      onClick={() => onClick(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(task)}
      style={{
        background: selected ? "var(--safe-green-800, #1f5a47)" : isAudience ? "var(--safe-green-900, #0e3b2f)" : COLORS.panel,
        border: `1px solid ${selected ? COLORS.gold : isAudience ? "rgba(232, 181, 71, 0.4)" : COLORS.border}`,
        borderLeft: `3px solid ${isAudience ? COLORS.gold : lawyer.color}`,
        borderRadius: 6,
        padding: "10px 12px",
        cursor: "pointer",
        marginBottom: 6,
        opacity: task.status === "done" ? 0.65 : 1,
        boxShadow: isAudience ? "0 0 12px rgba(232, 181, 71, 0.15)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <Icon style={{ width: 14, height: 14, flexShrink: 0, color: COLORS.text }} aria-hidden />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.text,
                fontFamily: "Georgia, serif",
              }}
            >
              {task.title}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 10, color: COLORS.muted }}>
              {formatDate(task.deadline)}
            </span>
            <DeadlinePill
              deadline={task.deadline}
              status={task.status}
              todayStr={todayStr}
              doneLabel={statusLabels.done ?? ""}
            />
            <span
              style={{
                fontSize: 10,
                color: statusColor,
                fontWeight: 600,
              }}
            >
              ● {statusLabels[task.status] ?? task.status}
            </span>
          </div>
        </div>
        {task.priority === "critique" && task.status !== "done" && (
          <span
            style={{
              fontSize: 10,
              color: COLORS.urgent,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            !
          </span>
        )}
      </div>
    </div>
  );
}

function TimelineBar({
  tasks,
  todayStr,
}: {
  tasks: LexTrackTask[];
  todayStr?: string;
}) {
  const tg = useTranslations("gestion");
  const today = todayStr ? new Date(todayStr) : new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 1);
  start.setDate(1);
  const end = new Date(today);
  end.setMonth(end.getMonth() + 4);
  end.setDate(1);
  const totalMs = end.getTime() - start.getTime();
  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: COLORS.muted,
          marginBottom: 8,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {tg("timelineTitle")}
      </div>
      <div
        style={{
          position: "relative",
          height: 36,
          background: COLORS.border,
          borderRadius: 6,
          overflow: "visible",
        }}
      >
        {LEXTRACK_PHASES.map((phase, i) => {
          const phaseTasks = tasks.filter((t) => t.phase === i);
          if (!phaseTasks.length) return null;
          const minD = new Date(
            Math.min(...phaseTasks.map((t) => new Date(t.deadline).getTime()))
          );
          const maxD = new Date(
            Math.max(...phaseTasks.map((t) => new Date(t.deadline).getTime()))
          );
          const left = ((minD.getTime() - start.getTime()) / totalMs) * 100;
          const width =
            ((maxD.getTime() - minD.getTime()) / totalMs) * 100;
          return (
            <div
              key={phase}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${left}%`,
                width: `${Math.max(width, 2)}%`,
                background: `${PHASE_COLORS[i]}33`,
                borderLeft: `2px solid ${PHASE_COLORS[i]}66`,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  fontSize: 9,
                  color: PHASE_COLORS[i],
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {phase}
              </span>
            </div>
          );
        })}
        {tasks
          .filter((t) => t.type === "audience")
          .map((t) => {
            const pos =
              ((new Date(t.deadline).getTime() - start.getTime()) / totalMs) *
              100;
            return (
              <div
                key={t.id}
                title={t.title}
                style={{
                  position: "absolute",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  left: `${pos}%`,
                  width: 10,
                  height: 10,
                  background: COLORS.gold,
                  borderRadius: "50%",
                  border: `2px solid ${COLORS.bg}`,
                  zIndex: 2,
                  boxShadow: `0 0 6px ${COLORS.gold}`,
                }}
              />
            );
          })}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${((today.getTime() - start.getTime()) / totalMs) * 100}%`,
            width: 2,
            background: COLORS.urgent,
            zIndex: 3,
          }}
        >
          <span
            style={{
              position: "absolute",
              bottom: -18,
              left: 4,
              fontSize: 9,
              color: COLORS.urgent,
              whiteSpace: "nowrap",
              fontWeight: 700,
            }}
          >
            {tg("today")}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: COLORS.muted,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export interface LexTrackBoardProps {
  dossierId?: string;
  dossierTitle: string;
  dossierRef?: string;
  lawyers: LexTrackLawyer[];
  tasks: LexTrackTask[];
  onTaskStatusChange?: (taskId: string, newStatus: LexTrackTask["status"]) => void;
  todayStr?: string; // pour démo/débug : "2026-03-08"
}

export function LexTrackBoard({
  dossierId,
  dossierTitle,
  dossierRef,
  lawyers,
  tasks,
  onTaskStatusChange,
  todayStr,
}: LexTrackBoardProps) {
  const tg = useTranslations("gestion");

  const typeLabels: Record<string, string> = {
    analyse: tg("typeAnalysis"),
    acte: tg("typeAct"),
    recherche: tg("typeResearch"),
    admin: tg("typeAdmin"),
    audience: tg("typeHearing"),
    echeance: tg("typeDeadline"),
  };

  const statusLabels: Record<string, string> = {
    done: tg("statusDone"),
    inprogress: tg("statusInProgress"),
    upcoming: tg("statusImminent"),
    todo: tg("statusTodo"),
  };

  const [selectedTask, setSelectedTask] = useState<LexTrackTask | null>(null);
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [activeLawyer, setActiveLawyer] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<LexTrackTask[]>(tasks);

  const filtered = localTasks.filter(
    (t) =>
      (activePhase === null || t.phase === activePhase) &&
      (activeLawyer === null || t.lawyerId === activeLawyer)
  );

  const done = localTasks.filter((t) => t.status === "done").length;
  const total = localTasks.length;
  const progressPct = total ? Math.round((done / total) * 100) : 0;
  const urgent = localTasks.filter(
    (t) => t.status !== "done" && daysUntil(t.deadline, todayStr) <= 7
  ).length;
  const inProgress = localTasks.filter((t) => t.status === "inprogress").length;

  const statusOrder: LexTrackTask["status"][] = [
    "todo",
    "inprogress",
    "upcoming",
    "done",
  ];

  function cycleStatus(task: LexTrackTask) {
    const idx = statusOrder.indexOf(task.status);
    const next = statusOrder[(idx + 1) % statusOrder.length];
    const updated = { ...task, status: next };
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === task.id ? updated : t))
    );
    setSelectedTask(updated);
    onTaskStatusChange?.(task.id, next);
  }

  const displayTitle = dossierRef
    ? tg("dossierRefTitle", { ref: dossierRef, title: dossierTitle })
    : dossierTitle;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "var(--font-sans), 'Plus Jakarta Sans', -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: var(--safe-green-950, #081e18); }
        ::-webkit-scrollbar-thumb { background: var(--safe-neutral-700, #2b3a34); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: COLORS.panel,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: COLORS.gold,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              ⚖ {tg("planning")}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "Georgia, serif",
              }}
            >
              {displayTitle}
            </div>
          </div>
          {/* Outils d'édition */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
            {dossierId && (
              <Link
                href={routes.dossier(dossierId)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.gold}44`,
                  background: `${COLORS.gold}11`,
                  color: COLORS.gold,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all .2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = `${COLORS.gold}22`;
                  e.currentTarget.style.borderColor = `${COLORS.gold}66`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = `${COLORS.gold}11`;
                  e.currentTarget.style.borderColor = `${COLORS.gold}44`;
                }}
              >
                <Pencil size={14} />
                {tg("editMatter")}
              </Link>
            )}
            <Link
              href={dossierId ? `${routes.dossier(dossierId)}?onglet=actes` : routes.dossiers}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: "transparent",
                color: COLORS.text,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                transition: "all .2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = `${COLORS.ok}15`;
                e.currentTarget.style.borderColor = `${COLORS.ok}44`;
                e.currentTarget.style.color = COLORS.ok;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.text;
              }}
            >
              <Plus size={14} />
              {tg("addAct")}
            </Link>
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[
            [tg("progression"), `${progressPct}%`, COLORS.ok],
            [tg("statusInProgress"), inProgress, COLORS.gold],
            [
              tg("urgent"),
              urgent,
              urgent > 0 ? COLORS.urgent : COLORS.muted,
            ],
          ].map(([l, v, c]) => (
            <div key={String(l)} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: c as string,
                  fontFamily: "Georgia, serif",
                }}
              >
                {v}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: COLORS.muted,
                  letterSpacing: 0.5,
                }}
              >
                {l}
              </div>
            </div>
          ))}
          <div
            style={{
              width: 80,
              height: 6,
              background: COLORS.border,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: COLORS.ok,
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      </div>

      <TimelineBar tasks={localTasks} todayStr={todayStr} />

      {/* Filters */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { label: tg("allPhases"), val: null as number | null },
            ...LEXTRACK_PHASES.map((p, i) => ({ label: p, val: i })),
          ].map(({ label, val }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActivePhase(val)}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                border: `1px solid ${activePhase === val ? (val === null ? COLORS.gold : PHASE_COLORS[val ?? 0]) : COLORS.border}`,
                background:
                  activePhase === val
                    ? val === null
                      ? `${COLORS.gold}22`
                      : `${PHASE_COLORS[val ?? 0]}22`
                    : "transparent",
                color:
                  activePhase === val
                    ? val === null
                      ? COLORS.gold
                      : PHASE_COLORS[val ?? 0]
                    : COLORS.muted,
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: COLORS.border }} />
        <div style={{ display: "flex", gap: 6 }}>
          {lawyers.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() =>
                setActiveLawyer(activeLawyer === l.id ? null : l.id)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 20,
                cursor: "pointer",
                border: `1px solid ${activeLawyer === l.id ? l.color : COLORS.border}`,
                background:
                  activeLawyer === l.id ? `${l.color}22` : "transparent",
                opacity: activeLawyer && activeLawyer !== l.id ? 0.4 : 1,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: `${l.color}33`,
                  border: `1px solid ${l.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: l.color,
                  fontWeight: 700,
                }}
              >
                {l.initials}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: COLORS.text,
                  fontWeight: 500,
                }}
              >
                {l.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${lawyers.length}, 1fr)`,
              gap: 12,
              minWidth: 900,
            }}
          >
            {lawyers.map((lawyer) => {
              const lawyerTasks = filtered.filter(
                (t) => t.lawyerId === lawyer.id
              );
              const lDone = lawyerTasks.filter((t) => t.status === "done").length;
              return (
                <div
                  key={lawyer.id}
                  style={{
                    background: COLORS.panel,
                    border: `1px solid ${COLORS.border}`,
                    borderTop: `3px solid ${lawyer.color}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: `${lawyer.color}22`,
                          border: `2px solid ${lawyer.color}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: lawyer.color,
                        }}
                      >
                        {lawyer.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                          {lawyer.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: COLORS.muted,
                          }}
                        >
                          {lawyer.role}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 3,
                          background: COLORS.border,
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: lawyerTasks.length
                              ? `${(lDone / lawyerTasks.length) * 100}%`
                              : "0%",
                            background: lawyer.color,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          color: COLORS.muted,
                        }}
                      >
                        {lDone}/{lawyerTasks.length}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 10,
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 320px)",
                    }}
                  >
                    {LEXTRACK_PHASES.map((phase, pi) => {
                      const phaseTasks = lawyerTasks.filter(
                        (t) => t.phase === pi
                      );
                      if (!phaseTasks.length) return null;
                      return (
                        <div key={phase} style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 6,
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 2,
                                background: PHASE_COLORS[pi],
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                color: PHASE_COLORS[pi],
                                fontWeight: 600,
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                              }}
                            >
                              {phase}
                            </span>
                          </div>
                          {phaseTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              lawyer={lawyer}
                              onClick={setSelectedTask}
                              selected={selectedTask?.id === task.id}
                              todayStr={todayStr}
                              typeLabels={typeLabels}
                              statusLabels={statusLabels}
                            />
                          ))}
                        </div>
                      );
                    })}
                    {!lawyerTasks.length && (
                      <div
                        style={{
                          padding: 20,
                          textAlign: "center",
                          color: COLORS.dimmed,
                          fontSize: 12,
                        }}
                      >
                        {tg("noActsInView")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selectedTask && (() => {
          const lawyer =
            lawyers.find((l) => l.id === selectedTask.lawyerId) ?? lawyers[0];
          const SelIcon = TYPE_ICONS[selectedTask.type] ?? FileText;
          const selStatusColor = STATUS_COLORS[selectedTask.status] ?? COLORS.dimmed;
          return (
            <div
              style={{
                width: 300,
                background: COLORS.panel,
                borderLeft: `1px solid ${COLORS.border}`,
                overflowY: "auto",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: `1px solid ${COLORS.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: COLORS.gold,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  {tg("actDetail")}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.muted,
                    cursor: "pointer",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                  aria-label={tg("closeLabel")}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: 18 }}>
                <div
                  style={{ fontSize: 24, marginBottom: 8, display: "flex", alignItems: "center" }}
                >
                  <SelIcon style={{ width: 24, height: 24, color: COLORS.gold }} aria-hidden />
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: COLORS.text,
                    marginBottom: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {selectedTask.title}
                </div>
                <div
                  style={{
                    background: COLORS.bg,
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 14,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: COLORS.muted,
                      lineHeight: 1.6,
                    }}
                  >
                    {selectedTask.desc}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <Row label={tg("responsible")}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: `${lawyer.color}33`,
                          border: `1px solid ${lawyer.color}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 8,
                          color: lawyer.color,
                          fontWeight: 700,
                        }}
                      >
                        {lawyer.initials}
                      </div>
                      <span style={{ fontSize: 12 }}>{lawyer.name}</span>
                    </div>
                  </Row>
                  <Row label={tg("phase")}>
                    <span
                      style={{
                        fontSize: 12,
                        color: PHASE_COLORS[selectedTask.phase],
                      }}
                    >
                      {LEXTRACK_PHASES[selectedTask.phase]}
                    </span>
                  </Row>
                  <Row label={tg("deadline")}>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 12 }}>
                        {formatDate(selectedTask.deadline)}
                      </span>
                      <DeadlinePill
                        deadline={selectedTask.deadline}
                        status={selectedTask.status}
                        todayStr={todayStr}
                        doneLabel={statusLabels.done ?? ""}
                      />
                    </div>
                  </Row>
                  <Row label={tg("priorityLabel")}>
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          selectedTask.priority === "critique"
                            ? COLORS.urgent
                            : selectedTask.priority === "haute"
                              ? COLORS.warning
                              : COLORS.muted,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {selectedTask.priority}
                    </span>
                  </Row>
                  <Row label={tg("status")}>
                    <span
                      style={{
                        fontSize: 12,
                        color: selStatusColor,
                        fontWeight: 600,
                      }}
                    >
                      ● {statusLabels[selectedTask.status] ?? selectedTask.status}
                    </span>
                  </Row>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  {selectedTask.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: COLORS.dimmed,
                        color: COLORS.muted,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                  <button
                    type="button"
                    onClick={() => cycleStatus(selectedTask)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 6,
                      border: `1px solid ${COLORS.gold}44`,
                      background: `${COLORS.gold}11`,
                      color: COLORS.gold,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      letterSpacing: 0.5,
                    }}
                  >
                    → {tg("advanceStatus")}
                  </button>
                  {dossierId && (
                    <Link
                      href={routes.dossier(dossierId)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: 10,
                        borderRadius: 6,
                        border: `1px solid ${COLORS.border}`,
                        background: "transparent",
                        color: COLORS.text,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                    >
                      <FileEdit size={14} />
                      {tg("editAct")}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
