import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";

/**
 * Domaine 4 — Facturation (spec §5.2.4).
 * `to_complete` tant que le gabarit de facture n'est pas personnalisé
 * (mention légale ou signature). La simple présence d'un défaut ne suffit pas.
 */
export function evaluateBilling(snapshot: CabinetReadinessSnapshot): DomainResult {
  const b = snapshot.billing;
  const customized = b.hasNotice || b.hasSignature;
  const passed = b.hasInvoiceConfig && customized;
  return {
    domain: "billing",
    title: "Facturation",
    state: passed ? "complete" : "to_complete",
    checks: [
      {
        id: "invoice_config",
        label: "Gabarit de facture configuré",
        passed: b.hasInvoiceConfig,
        evidence: b.template,
      },
      {
        id: "customized",
        label: "Personnalisé (mention ou signature)",
        passed: customized,
        evidence: customized ? "oui" : null,
      },
    ],
    evidence: passed ? "Gabarit de facture personnalisé." : null,
    action: passed ? null : "Personnaliser le gabarit de facture (mention légale, signature).",
  };
}
