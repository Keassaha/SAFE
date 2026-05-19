/**
 * SAFE — Carrière Solo
 * Générateur de checklist dynamique.
 * Filtre le corpus selon les réponses du questionnaire.
 */

import { CHECKLIST } from "./checklist-data";
import {
  type Answers,
  type ChecklistItem,
  type GeneratedChecklist,
  type SectionId,
  SECTION_META,
} from "./types";

const PRIORITY_RANK: Record<ChecklistItem["priority"], number> = {
  critique: 0,
  important: 1,
  recommande: 2,
};

function matchesJurisdiction(item: ChecklistItem, answers: Answers): boolean {
  if (item.jurisdiction === "both") return true;
  return item.jurisdiction === answers.juridiction;
}

function matchesPracticeArea(item: ChecklistItem, answers: Answers): boolean {
  // Items sans practiceAreas restrictives s'appliquent à tous les domaines.
  if (!item.practiceAreas || item.practiceAreas.length === 0) return true;
  // Sinon : au moins un chevauchement avec les domaines choisis.
  return item.practiceAreas.some((p) => answers.domaines.includes(p));
}

function matchesStatus(item: ChecklistItem, answers: Answers): boolean {
  if (!item.appliesToStatus || item.appliesToStatus.length === 0) return true;
  return item.appliesToStatus.includes(answers.statut);
}

/**
 * Pour un horizon "imminent" : on ne montre que critique + important.
 * Pour les autres horizons : tout.
 * Cette règle peut évoluer mais reflète la voix "à l'essentiel".
 */
function passesHorizonFilter(
  item: ChecklistItem,
  answers: Answers
): boolean {
  if (answers.horizon !== "imminent") return true;
  return item.priority !== "recommande";
}

export function generateChecklist(answers: Answers): GeneratedChecklist {
  const filtered = CHECKLIST.filter(
    (item) =>
      matchesJurisdiction(item, answers) &&
      matchesPracticeArea(item, answers) &&
      matchesStatus(item, answers) &&
      passesHorizonFilter(item, answers)
  );

  // Tri intra-section : critique → important → recommandé, puis ordre du corpus.
  const sorted = [...filtered].sort((a, b) => {
    const sectionDiff =
      SECTION_META.findIndex((s) => s.id === a.section) -
      SECTION_META.findIndex((s) => s.id === b.section);
    if (sectionDiff !== 0) return sectionDiff;
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });

  // Groupement par section, en ne gardant que les sections non vides.
  const sections = SECTION_META
    .map((meta) => ({
      meta,
      items: sorted.filter((item) => item.section === meta.id),
    }))
    .filter((s) => s.items.length > 0);

  const totalItems = sorted.length;
  const criticalCount = sorted.filter((i) => i.priority === "critique").length;

  return {
    answers,
    sections,
    totalItems,
    criticalCount,
  };
}

/**
 * Renvoie true si l'item doit être visuellement renforcé pour la peur déclarée.
 * Utilisé par les composants de rendu pour ajouter un badge "À ATTAQUER EN PRIORITÉ".
 */
export function isHighlightedForFear(
  item: ChecklistItem,
  answers: Answers
): boolean {
  if (!item.highlightForFear || item.highlightForFear.length === 0) return false;
  return item.highlightForFear.includes(answers.peur);
}

/**
 * Compte le nombre d'items mis en avant pour la peur du persona.
 * Utile pour l'en-tête "X éléments à attaquer en priorité dans ta peur N°1".
 */
export function countHighlightsForFear(
  generated: GeneratedChecklist
): number {
  return generated.sections.reduce(
    (acc, section) =>
      acc +
      section.items.filter((item) => isHighlightedForFear(item, generated.answers))
        .length,
    0
  );
}

/**
 * Renvoie la liste des sections présentes dans la checklist générée.
 * Utile pour le sommaire navigable.
 */
export function getSectionsSummary(
  generated: GeneratedChecklist
): Array<{ id: SectionId; title: string; count: number; critical: number }> {
  return generated.sections.map((s) => ({
    id: s.meta.id,
    title: s.meta.title,
    count: s.items.length,
    critical: s.items.filter((i) => i.priority === "critique").length,
  }));
}
