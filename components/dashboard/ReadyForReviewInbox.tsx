/**
 * SAFE — Inbox "dossiers prêts pour revue avocat".
 *
 * Doctrine: docs/product/READY_FOR_REVIEW_SIGNAL.md
 *
 * Bloc affiché en tête du tableau de bord pour les avocats et admin_cabinet.
 * Liste les signaux non lus, propose un bouton "Marquer comme vu" via une
 * server action.
 *
 * Server component pour la lecture; le bouton est un sous-composant client.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import type { ReadyForReviewSignalRow } from "@/lib/services/ready-for-review-service";
import { MarkSignalReadButton } from "./MarkSignalReadButton";

interface ReadyForReviewInboxProps {
  signals: ReadyForReviewSignalRow[];
}

export function ReadyForReviewInbox({ signals }: ReadyForReviewInboxProps) {
  // Si aucun signal, on n'affiche pas le bloc — pas d'inbox vide bruyante.
  if (signals.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Dossiers prêts pour revue" />
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2
            className="w-5 h-5 text-[var(--safe-status-success)]"
            aria-hidden
          />
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--safe-status-success-bg)] text-[var(--safe-status-success)] font-medium">
            {signals.length}
          </span>
          <p className="text-xs safe-text-secondary">
            Préparation terminée par l&apos;assistante — votre revue est attendue.
          </p>
        </div>
        <ul className="space-y-2">
          {signals.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 px-3 py-2 rounded-safe-sm border border-[var(--safe-status-success)]/30 bg-[var(--safe-status-success-bg)]/30"
            >
              <Link
                href={routes.dossier(s.dossierId)}
                className="min-w-0 flex-1 group"
              >
                <div className="text-sm font-medium safe-text-title truncate group-hover:underline">
                  {s.numeroDossier ? `${s.numeroDossier} — ` : ""}
                  {s.dossierIntitule}
                </div>
                <div className="text-xs safe-text-secondary truncate mt-0.5">
                  {s.clientName ?? "Sans client"}
                  {s.createdByName && ` · préparé par ${s.createdByName}`}
                  {" · "}
                  <span title={s.createdAt.toISOString()}>
                    {formatDate(s.createdAt)}
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-1.5 shrink-0">
                <MarkSignalReadButton signalId={s.id} />
                <Link
                  href={routes.dossier(s.dossierId)}
                  className="text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)]"
                  aria-label="Ouvrir le dossier"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
