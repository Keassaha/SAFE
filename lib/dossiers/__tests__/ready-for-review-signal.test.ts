import { describe, it, expect } from "vitest";
import {
  shouldEmitReadyForReviewSignal,
  buildDedupeKey,
  READY_FOR_REVIEW_REASON,
} from "@/lib/dossiers/ready-for-review-signal";
import type { PreparationState } from "@/lib/dossiers/preparation-status";

/**
 * Tests purs du helper de transition + dedupe key.
 * Doctrine: docs/product/READY_FOR_REVIEW_SIGNAL.md
 */

const ALL_STATES: PreparationState[] = [
  "bloque",
  "incomplet",
  "en_attente_client",
  "en_preparation",
  "pret_pour_revue",
];

describe("shouldEmitReadyForReviewSignal — transition vers pret_pour_revue", () => {
  it("émet quand before=en_preparation et after=pret_pour_revue", () => {
    expect(shouldEmitReadyForReviewSignal("en_preparation", "pret_pour_revue")).toBe(true);
  });

  it("émet pour toutes les transitions valides vers pret_pour_revue", () => {
    for (const before of ALL_STATES) {
      if (before === "pret_pour_revue") continue;
      expect(shouldEmitReadyForReviewSignal(before, "pret_pour_revue")).toBe(true);
    }
  });

  it("n'émet PAS si déjà pret_pour_revue avant et après (état inchangé)", () => {
    expect(shouldEmitReadyForReviewSignal("pret_pour_revue", "pret_pour_revue")).toBe(false);
  });

  it("n'émet PAS pour une régression (pret_pour_revue → autre état)", () => {
    for (const after of ALL_STATES) {
      if (after === "pret_pour_revue") continue;
      expect(shouldEmitReadyForReviewSignal("pret_pour_revue", after)).toBe(false);
    }
  });

  it("n'émet PAS si after n'est pas pret_pour_revue", () => {
    expect(shouldEmitReadyForReviewSignal("incomplet", "en_preparation")).toBe(false);
    expect(shouldEmitReadyForReviewSignal("bloque", "incomplet")).toBe(false);
    expect(shouldEmitReadyForReviewSignal("en_attente_client", "en_preparation")).toBe(false);
  });

  it("n'émet PAS si before est null (état inconnu — création neuve)", () => {
    expect(shouldEmitReadyForReviewSignal(null, "pret_pour_revue")).toBe(false);
    expect(shouldEmitReadyForReviewSignal(null, "incomplet")).toBe(false);
  });

  it("matrice complète des 25 transitions: seules 4 émettent", () => {
    let emits = 0;
    for (const before of ALL_STATES) {
      for (const after of ALL_STATES) {
        if (shouldEmitReadyForReviewSignal(before, after)) emits++;
      }
    }
    // 4 états non-prêts × 1 état prêt = 4 transitions émettantes
    expect(emits).toBe(4);
  });
});

describe("buildDedupeKey — clé canonique", () => {
  it("avec avocat: dossierId:avocatId", () => {
    expect(buildDedupeKey("dos_42", "user_av")).toBe("dos_42:user_av");
  });

  it("sans avocat: dossierId:no_avocat", () => {
    expect(buildDedupeKey("dos_42", null)).toBe("dos_42:no_avocat");
    expect(buildDedupeKey("dos_42", undefined)).toBe("dos_42:no_avocat");
  });

  it("clés stables: même input → même output", () => {
    const k1 = buildDedupeKey("dos_42", "user_1");
    const k2 = buildDedupeKey("dos_42", "user_1");
    expect(k1).toBe(k2);
  });

  it("clés distinctes pour dossiers différents", () => {
    expect(buildDedupeKey("dos_1", "user_1")).not.toBe(buildDedupeKey("dos_2", "user_1"));
  });

  it("clés distinctes pour avocats différents", () => {
    expect(buildDedupeKey("dos_1", "user_a")).not.toBe(buildDedupeKey("dos_1", "user_b"));
  });

  it("clé avec/sans avocat différentes (un avocat assigné après coup change la cible)", () => {
    expect(buildDedupeKey("dos_1", null)).not.toBe(buildDedupeKey("dos_1", "user_a"));
  });
});

describe("READY_FOR_REVIEW_REASON — constante", () => {
  it("expose une raison stable et lisible", () => {
    expect(READY_FOR_REVIEW_REASON).toBe("preparation_complete");
  });
});
