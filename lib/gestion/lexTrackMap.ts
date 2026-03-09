/**
 * Mapping Prisma DossierActe / User -> LexTrack (types UI).
 */

import type { DossierActe, User } from "@prisma/client";
import type { LexTrackLawyer, LexTrackTask } from "@/types/gestion";
import { type LexTrackPhase } from "@prisma/client";

const PHASE_ORDER: LexTrackPhase[] = [
  "INSTRUCTION",
  "MISE_EN_ETAT",
  "PLAIDOIRIES",
  "DELIBERE",
];

/* Palette SAFE : émeraude + or pour cohérence avec le design system */
const LAWYER_COLORS = [
  "#e8b547", /* gold-400 */
  "#6fa690", /* green-600 */
  "#3e7a66", /* green-700 */
  "#1f5a47", /* green-800 */
];

function phaseToIndex(phase: LexTrackPhase): 0 | 1 | 2 | 3 {
  const i = PHASE_ORDER.indexOf(phase);
  return (i >= 0 ? i : 0) as 0 | 1 | 2 | 3;
}

function getInitials(nom: string): string {
  const parts = nom.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "");
  }
  return nom.slice(0, 2).toUpperCase();
}

export interface DossierActeWithAssignee extends DossierActe {
  assignee: User;
}

export function dossierActeToTask(acte: DossierActeWithAssignee): LexTrackTask {
  let tags: string[] = [];
  if (acte.tags) {
    try {
      const parsed = JSON.parse(acte.tags) as unknown;
      tags = Array.isArray(parsed) ? parsed : [];
    } catch {
      tags = [];
    }
  }
  return {
    id: acte.id,
    lawyerId: acte.assigneeId,
    phase: phaseToIndex(acte.phase),
    title: acte.title,
    type: acte.type as LexTrackTask["type"],
    status: acte.status as LexTrackTask["status"],
    deadline: acte.deadline.toISOString().slice(0, 10),
    priority: acte.priority as LexTrackTask["priority"],
    desc: acte.description ?? "",
    tags,
  };
}

/** Accepte User complet ou sélection partielle (id, nom, role). */
export function usersToLawyers(
  users: Array<{ id: string; nom: string; role: string }>
): LexTrackLawyer[] {
  return users.map((u, i) => ({
    id: u.id,
    name: u.nom,
    initials: getInitials(u.nom),
    role: u.role === "avocat" ? "Avocat" : u.role === "admin_cabinet" ? "Responsable" : "Équipe",
    color: LAWYER_COLORS[i % LAWYER_COLORS.length],
  }));
}
