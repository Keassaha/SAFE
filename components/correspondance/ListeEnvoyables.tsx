"use client";

/**
 * La liste des pièces transmissibles d'un dossier (lot 0.5).
 *
 * Séparée de `NouvelEnvoiDossier` pour la même raison que la chronologie l'est
 * de son chargement : un composant qui ne fait que rendre des props se juge à
 * l'oeil sur ses cas limites, dans `/ds-preview/correspondance`, sans base ni
 * session (PS-092).
 */

import { useTranslations } from "next-intl";
import { FileText, Receipt } from "lucide-react";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import { documentEstBrouillon } from "@/lib/services/correspondance/envoyables";
import type { DocumentEnvoyable, FactureEnvoyable } from "@/lib/services/correspondance/envoyables";

export interface ListeEnvoyablesProps {
  documents: DocumentEnvoyable[];
  factures: FactureEnvoyable[];
  clientAUnCourriel?: boolean;
  dossierFerme?: boolean;
  chargement?: boolean;
  erreur?: string | null;
  onChoisirDocument: (id: string) => void;
  onChoisirFacture: (id: string) => void;
}

export function ListeEnvoyables({
  documents,
  factures,
  clientAUnCourriel = true,
  dossierFerme = false,
  chargement = false,
  erreur = null,
  onChoisirDocument,
  onChoisirFacture,
}: ListeEnvoyablesProps) {
  const t = useTranslations("matterDetailUi");
  const { formatCurrency } = useFormatteurs();

  const rien = documents.length === 0 && factures.length === 0;

  /* Les deux avertissements se posent AVANT la liste, et n'empêchent pas de
     choisir : c'est l'avocate qui juge s'il est encore approprié d'écrire sur
     un dossier fermé. Un blocage automatique déciderait à sa place. */
  const avertissements = (
    <>
      {!clientAUnCourriel ? (
        <p className="mb-3 rounded-md bg-si-amber/[0.13] px-3 py-2 text-xs text-si-amber-ink">
          {t("corrNoClientEmail")}
        </p>
      ) : null}
      {dossierFerme ? (
        <p className="mb-3 rounded-md bg-si-amber/[0.13] px-3 py-2 text-xs text-si-amber-ink">
          {t("corrClosedMatter")}
        </p>
      ) : null}
    </>
  );

  if (chargement) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <span className="sr-only">{t("corrLoading")}</span>
        <div className="h-[44px] rounded-md bg-si-surface2" />
        <div className="h-[44px] rounded-md bg-si-surface2" />
      </div>
    );
  }

  if (erreur) {
    return (
      <p className="text-[13px] text-si-danger-ink" role="alert">
        {erreur}
      </p>
    );
  }

  if (rien) {
    return (
      <>
        {avertissements}
        <div className="py-6 text-center">
          <p className="text-[13px] font-medium text-si-ink">{t("corrNothingToSendTitle")}</p>
          <p className="mx-auto mt-1 max-w-[46ch] text-[13px] text-si-muted">{t("corrNothingToSendHint")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      {avertissements}
      <div className="space-y-4">
        {documents.length > 0 ? (
          <section>
            <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-si-muted">
              {t("corrSectionDocuments")}
            </h4>
            <ul className="space-y-1">
              {documents.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onChoisirDocument(d.id)}
                    className="safe-zoom-menu flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-si-subtle" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-si-ink">{d.titre}</span>
                    {documentEstBrouillon(d.statut) ? (
                      <span className="shrink-0 rounded-full border border-si-line px-2 py-0.5 text-[11px] text-si-muted">
                        {t("corrDraftBadge")}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {factures.length > 0 ? (
          <section>
            <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-si-muted">
              {t("corrSectionInvoices")}
            </h4>
            <ul className="space-y-1">
              {factures.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => onChoisirFacture(f.id)}
                    className="safe-zoom-menu flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left"
                  >
                    <Receipt className="h-4 w-4 shrink-0 text-si-subtle" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-si-ink">{f.numero}</span>
                    {/* Loi L1 : tout montant en mono tabulaire, aligné à droite,
                        jamais tronqué. */}
                    <span className="shrink-0 font-mono text-[12px] tabular-nums text-si-muted">
                      {formatCurrency(f.montantTotal)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
