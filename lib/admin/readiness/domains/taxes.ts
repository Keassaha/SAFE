import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";
import { getDefaultTaxConfig } from "@/lib/billing/taxes";
import { normalizeProvince } from "../retention-requirements";

const TITLE = "Taxes";

/**
 * Domaine 3 — Taxes (spec §5.2.3).
 * Présence des numéros d'inscription cohérents avec le mode de taxe de la province.
 * `to_complete` (et NON blocking) si manquants : l'inscription est facultative sous
 * le seuil de 30 000 $, on ne peut donc pas l'exiger sans connaître le chiffre d'affaires.
 */
export function evaluateTaxes(snapshot: CabinetReadinessSnapshot): DomainResult {
  const province = normalizeProvince(snapshot.province);
  if (!province) {
    return {
      domain: "taxes",
      title: TITLE,
      state: "not_applicable",
      checks: [],
      evidence: "Province non définie : taxes non déterminables.",
      action: null,
    };
  }

  const mode = getDefaultTaxConfig(province).mode;
  const n = snapshot.taxNumbers;
  const expected: { id: string; label: string; value?: string }[] =
    mode === "hst"
      ? [{ id: "hst", label: "N° HST", value: n.hstNumber }]
      : mode === "tps_tvq"
        ? [
            { id: "gst", label: "N° TPS", value: n.gstNumber },
            { id: "qst", label: "N° TVQ", value: n.qstNumber },
          ]
        : [{ id: "gst", label: "N° TPS", value: n.gstNumber }];

  const checks = expected.map((e) => ({
    id: `tax_${e.id}`,
    label: e.label,
    passed: Boolean(e.value),
    evidence: e.value ? e.value : null,
  }));

  if (checks.every((c) => c.passed)) {
    return {
      domain: "taxes",
      title: TITLE,
      state: "complete",
      checks,
      evidence: `Numéros d'inscription enregistrés (${province}).`,
      action: null,
    };
  }
  return {
    domain: "taxes",
    title: TITLE,
    state: "to_complete",
    checks,
    evidence: null,
    action: "Renseigner les numéros d'inscription aux taxes (facultatif sous le seuil de 30 000 $).",
  };
}
