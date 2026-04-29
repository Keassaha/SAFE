/**
 * SAFE — Carte "État de préparation" sur la fiche dossier (V2).
 *
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
 *
 * Évolutions V2 :
 *   - chaque manquant devient cliquable (deep link via le helper canonique)
 *   - le bucket "assistant" propose un bouton `Assigner à moi`
 *   - badge `Prêt pour revue` mis en avant
 */

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, Hourglass, ArrowRight } from "lucide-react";
import {
  PREPARATION_STATE_LABELS,
  SEVERITY_LABELS,
  type PreparationStatus,
  type PreparationState,
  type MissingItemSeverity,
  type MissingItem,
} from "@/lib/dossiers/preparation-status";
import {
  getMissingItemAction,
  getKindCanonicalLink,
} from "@/lib/dossiers/missing-item-action-link";
import { AssignToSelfButton } from "@/components/gestion/AssignToSelfButton";

interface DossierPreparationCardProps {
  status: PreparationStatus;
  /** Identifiants pour construire les deep links. */
  dossierId: string;
  clientId: string;
  /** Le caller a-t-il le droit de s'auto-assigner ? */
  canSelfAssign?: boolean;
}

const STATE_ICON: Record<PreparationState, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  bloque: AlertOctagon,
  incomplet: AlertTriangle,
  en_attente_client: Hourglass,
  en_preparation: Info,
  pret_pour_revue: CheckCircle2,
};

const STATE_TONE: Record<PreparationState, string> = {
  bloque: "text-[var(--safe-status-error)]",
  incomplet: "text-[var(--safe-status-error)]",
  en_attente_client: "text-[var(--safe-text-secondary)]",
  en_preparation: "text-[var(--safe-status-warning)]",
  pret_pour_revue: "text-[var(--safe-status-success)]",
};

const SEVERITY_TONE: Record<MissingItemSeverity, string> = {
  blocking: "text-[var(--safe-status-error)] bg-[var(--safe-status-error-bg)]",
  critical: "text-[var(--safe-status-error)] bg-[var(--safe-status-error-bg)]",
  warning: "text-[var(--safe-status-warning)] bg-[var(--safe-status-warning-bg)]",
  info: "safe-text-secondary bg-neutral-100",
};

export function DossierPreparationCard({
  status,
  dossierId,
  clientId,
  canSelfAssign = false,
}: DossierPreparationCardProps) {
  const Icon = STATE_ICON[status.state];
  const tone = STATE_TONE[status.state];
  const isReady = status.state === "pret_pour_revue";

  const ctx = { dossierId, clientId };

  // Action principale: 1er manquant trié par sévérité, ou null si tout est prêt.
  const topItem = status.missingItems[0] ?? null;
  const topItemHref = topItem ? getKindCanonicalLink(topItem.kind, ctx) : null;

  return (
    <Card>
      <CardHeader title="État de préparation" />
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Icon className={`w-6 h-6 ${tone}`} aria-hidden />
          <div className="flex-1 min-w-0">
            <div className={`text-base font-semibold ${tone}`}>
              {PREPARATION_STATE_LABELS[status.state]}
            </div>
            {status.nextAction && (
              <div className="text-sm safe-text-title mt-0.5">
                <span className="font-medium">Prochaine action :</span>{" "}
                {topItemHref && topItem?.kind !== "assistant" ? (
                  <Link href={topItemHref} className="text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1">
                    {status.nextAction}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </Link>
                ) : (
                  <span>{status.nextAction}</span>
                )}
              </div>
            )}
            {isReady && !status.nextAction && (
              <div className="text-sm safe-text-secondary mt-0.5">
                Tout est prêt — l&apos;avocat peut relire.
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {isReady && (
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--safe-status-success-bg)] text-[var(--safe-status-success)] font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" aria-hidden />
                Prêt pour revue
              </span>
            )}
            {status.readyToBill && (
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--safe-status-success-bg)] text-[var(--safe-status-success)] font-medium">
                Prêt à facturer
              </span>
            )}
          </div>
        </div>

        {/* Bouton "Assigner à moi" si manquant assistant. */}
        {canSelfAssign &&
          status.missingItems.some((m) => m.kind === "assistant") && (
            <div className="mb-3">
              <AssignToSelfButton dossierId={dossierId} />
            </div>
          )}

        {status.missingItems.length === 0 ? (
          <p className="text-sm safe-text-secondary py-2">Aucun manquant détecté.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider font-medium safe-text-secondary">
              Manquants ({status.missingItems.length})
            </p>
            <ul className="space-y-1.5">
              {status.missingItems.map((item, i) => (
                <li key={`${item.kind}-${i}`} className="text-sm">
                  <MissingItemRow item={item} ctx={ctx} canSelfAssign={canSelfAssign} dossierId={dossierId} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MissingItemRowProps {
  item: MissingItem;
  ctx: { dossierId: string; clientId: string };
  canSelfAssign: boolean;
  dossierId: string;
}

function MissingItemRow({ item, ctx, canSelfAssign, dossierId }: MissingItemRowProps) {
  const action = getMissingItemAction(item, ctx);

  const badge = (
    <span
      className={`shrink-0 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${SEVERITY_TONE[item.severity]}`}
    >
      {SEVERITY_LABELS[item.severity]}
    </span>
  );

  if (action.kind === "self_assign") {
    return (
      <div className="flex items-start gap-2">
        {badge}
        <div className="flex-1 flex items-center justify-between gap-2 flex-wrap">
          <span className="safe-text-title">{item.label}</span>
          {canSelfAssign && <AssignToSelfButton dossierId={dossierId} compact />}
        </div>
      </div>
    );
  }

  if (action.kind === "link") {
    return (
      <div className="flex items-start gap-2">
        {badge}
        <Link
          href={action.href}
          className="safe-text-title hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
        >
          {item.label}
          <ArrowRight className="w-3.5 h-3.5 text-emerald-700" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      {badge}
      <span className="safe-text-title">{item.label}</span>
    </div>
  );
}
