/**
 * SAFE — Vue de la file de travail de l'assistante (V2 actionnable).
 *
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md §9
 *
 * Évolutions V2 :
 *   - tabs `Tous` / `Mes dossiers` (scope filter)
 *   - bouton `Assigner à moi` sur le bucket Sans assistante
 *   - chaque "prochaine action" devient cliquable vers la bonne route
 *   - badge `Prêt pour revue` sur les cartes du bucket dédié
 */

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  AlertOctagon,
  UserCheck,
  Hourglass,
  ClipboardCheck,
  ListChecks,
  CalendarClock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import type {
  AssistantQueue,
  AssistantQueueItem,
  AssistantTaskItem,
  AssistantEventItem,
} from "@/lib/dossiers/assistant-queue";
import { formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { getKindCanonicalLink } from "@/lib/dossiers/missing-item-action-link";
import { AssignToSelfButton } from "./AssignToSelfButton";

interface AssistantQueueViewProps {
  queue: AssistantQueue;
  /** Scope courant ("all" ou "mine"). */
  currentScope: "all" | "mine";
  /** Le caller a-t-il le droit de s'auto-assigner ? */
  canSelfAssign: boolean;
}

export function AssistantQueueView({ queue, currentScope, canSelfAssign }: AssistantQueueViewProps) {
  const totalItems =
    queue.incomplete.length +
    queue.unassigned.length +
    queue.awaitingClient.length +
    queue.readyForReview.length +
    queue.myAdminTasks.length +
    queue.upcomingDeadlines.length;

  return (
    <div className="space-y-5">
      {/* Tabs scope */}
      <ScopeTabs current={currentScope} />

      {totalItems === 0 ? (
        <Card>
          <CardContent>
            <div className="py-10 text-center text-sm safe-text-secondary">
              {currentScope === "mine"
                ? "Aucun dossier ne demande votre attention en ce moment."
                : "Aucun dossier en attente d'action — le cabinet est en ordre."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DossierBucketCard
            title="Incomplets"
            description="Dossiers avec manquants critiques à traiter"
            icon={<AlertOctagon className="w-5 h-5 text-[var(--safe-status-error)]" aria-hidden />}
            items={queue.incomplete}
            emptyMessage="Aucun dossier incomplet."
          />
          {currentScope === "all" && (
            <DossierBucketCard
              title="Sans assistante"
              description="Dossiers actifs encore à assigner"
              icon={<UserCheck className="w-5 h-5 text-[var(--safe-status-warning)]" aria-hidden />}
              items={queue.unassigned}
              emptyMessage="Tous les dossiers actifs ont une assistante."
              showSelfAssign={canSelfAssign}
            />
          )}
          <DossierBucketCard
            title="En attente du client"
            description="Le dossier attend une réponse client"
            icon={<Hourglass className="w-5 h-5 text-[var(--safe-text-secondary)]" aria-hidden />}
            items={queue.awaitingClient}
            emptyMessage="Aucun dossier en attente client."
          />
          <DossierBucketCard
            title="Prêts pour revue"
            description="Préparation terminée, attente de l'avocat"
            icon={<ClipboardCheck className="w-5 h-5 text-[var(--safe-status-success)]" aria-hidden />}
            items={queue.readyForReview}
            emptyMessage="Aucun dossier prêt pour revue."
            highlightReadyForReview
          />
          <TaskBucketCard
            title="Mes tâches admin"
            description="Tâches qui vous sont assignées"
            items={queue.myAdminTasks}
          />
          <EventBucketCard
            title="Échéances à venir"
            description="Événements dans les 14 prochains jours"
            items={queue.upcomingDeadlines}
          />
        </div>
      )}
    </div>
  );
}

/* ───────── Tabs scope ───────── */

function ScopeTabs({ current }: { current: "all" | "mine" }) {
  const baseTab =
    "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-safe-sm border transition-colors";
  const active = "bg-emerald-50 border-emerald-300 text-emerald-800";
  const inactive = "bg-white border-[var(--safe-neutral-border)] safe-text-secondary hover:bg-neutral-50";
  return (
    <div className="flex items-center gap-2">
      <Link
        href={routes.gestionAssistante}
        className={`${baseTab} ${current === "all" ? active : inactive}`}
      >
        Tous les dossiers
      </Link>
      <Link
        href={`${routes.gestionAssistante}?scope=mine`}
        className={`${baseTab} ${current === "mine" ? active : inactive}`}
      >
        Mes dossiers
      </Link>
    </div>
  );
}

/* ───────── Sous-composants ───────── */

interface DossierBucketProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: AssistantQueueItem[];
  emptyMessage: string;
  /** Affiche le bouton "Assigner à moi" sur chaque ligne (bucket Sans assistante). */
  showSelfAssign?: boolean;
  /** Met en valeur visuellement les items "prêts pour revue". */
  highlightReadyForReview?: boolean;
}

function DossierBucketCard({
  title,
  description,
  icon,
  items,
  emptyMessage,
  showSelfAssign,
  highlightReadyForReview,
}: DossierBucketProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-[var(--safe-text-secondary)]">
            {items.length}
          </span>
        </div>
        <p className="text-xs safe-text-secondary mb-3">{description}</p>
        {items.length === 0 ? (
          <p className="text-sm safe-text-secondary py-3 text-center">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.dossierId}>
                <DossierItemRow
                  item={item}
                  showSelfAssign={!!showSelfAssign}
                  highlightReadyForReview={!!highlightReadyForReview}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface DossierItemRowProps {
  item: AssistantQueueItem;
  showSelfAssign: boolean;
  highlightReadyForReview: boolean;
}

function DossierItemRow({ item, showSelfAssign, highlightReadyForReview }: DossierItemRowProps) {
  const dossierHref = routes.dossier(item.dossierId);

  // Lien d'action: route concrète dérivée du `topMissingKind` ou fiche dossier par défaut.
  const actionHref =
    item.topMissingKind && item.topMissingKind !== "assistant"
      ? getKindCanonicalLink(item.topMissingKind, {
          dossierId: item.dossierId,
          clientId: item.clientId,
        }) ?? dossierHref
      : dossierHref;

  const isReady = highlightReadyForReview && item.state === "pret_pour_revue";

  return (
    <div
      className={`relative px-3 py-2 rounded-safe-sm border transition-colors ${
        isReady
          ? "border-[var(--safe-status-success)]/40 bg-[var(--safe-status-success-bg)]/40"
          : "border-[var(--safe-neutral-border)]/60 hover:bg-neutral-50/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={dossierHref} className="block">
            <div className="text-sm font-medium safe-text-title truncate hover:underline">
              {item.numeroDossier ? `${item.numeroDossier} — ` : ""}
              {item.dossierIntitule}
            </div>
            <div className="text-xs safe-text-secondary truncate mt-0.5">
              {item.clientName}
            </div>
          </Link>

          {/* Action principale cliquable */}
          {item.nextAction && (
            <Link
              href={actionHref}
              className="text-xs mt-1.5 inline-flex items-center gap-1 text-[var(--safe-status-warning)] hover:text-[var(--safe-status-warning)]/80 font-medium hover:underline"
            >
              → {item.nextAction}
            </Link>
          )}
          {!item.nextAction && isReady && (
            <span className="text-xs mt-1.5 inline-flex items-center gap-1 text-[var(--safe-status-success)] font-medium">
              <CheckCircle2 className="w-3 h-3" aria-hidden />
              Prêt pour revue avocat
            </span>
          )}

          {/* Bouton "Assigner à moi" sur le bucket Sans assistante */}
          {showSelfAssign && (
            <div className="mt-2">
              <AssignToSelfButton dossierId={item.dossierId} compact />
            </div>
          )}
        </div>

        <Link
          href={dossierHref}
          className="shrink-0 mt-0.5 text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)]"
          aria-label="Ouvrir le dossier"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

interface TaskBucketProps {
  title: string;
  description: string;
  items: AssistantTaskItem[];
}

function TaskBucketCard({ title, description, items }: TaskBucketProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="w-5 h-5 text-[var(--safe-icon-default)]" aria-hidden />
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-[var(--safe-text-secondary)]">
            {items.length}
          </span>
        </div>
        <p className="text-xs safe-text-secondary mb-3">{description}</p>
        {items.length === 0 ? (
          <p className="text-sm safe-text-secondary py-3 text-center">
            Aucune tâche assignée pour l&apos;instant.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((task) => (
              <li key={task.taskId}>
                <Link
                  href={routes.dossier(task.dossierId)}
                  className="block px-3 py-2 rounded-safe-sm border border-[var(--safe-neutral-border)]/60 hover:bg-neutral-50/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium safe-text-title truncate">
                        {task.titre}
                      </div>
                      <div className="text-xs safe-text-secondary truncate mt-0.5">
                        {task.dossierIntitule}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 safe-text-secondary capitalize">
                          {task.priorite}
                        </span>
                        {task.daysOverdue !== null && task.daysOverdue > 0 && (
                          <span className="text-[var(--safe-status-error)] font-medium">
                            En retard de {task.daysOverdue} jour(s)
                          </span>
                        )}
                        {task.dateEcheance && task.daysOverdue === null && (
                          <span className="safe-text-secondary">
                            {formatDate(task.dateEcheance)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--safe-text-secondary)] shrink-0 mt-0.5" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface EventBucketProps {
  title: string;
  description: string;
  items: AssistantEventItem[];
}

function EventBucketCard({ title, description, items }: EventBucketProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock className="w-5 h-5 text-[var(--safe-icon-default)]" aria-hidden />
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-[var(--safe-text-secondary)]">
            {items.length}
          </span>
        </div>
        <p className="text-xs safe-text-secondary mb-3">{description}</p>
        {items.length === 0 ? (
          <p className="text-sm safe-text-secondary py-3 text-center">
            Aucune échéance dans les 14 prochains jours.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((evt) => (
              <li key={evt.eventId}>
                <Link
                  href={routes.gestionLexTrackDossier(evt.dossierId)}
                  className="block px-3 py-2 rounded-safe-sm border border-[var(--safe-neutral-border)]/60 hover:bg-neutral-50/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium safe-text-title truncate">
                        {evt.titre}
                      </div>
                      <div className="text-xs safe-text-secondary truncate mt-0.5">
                        {evt.dossierIntitule} — {evt.type}
                      </div>
                      <div className="text-xs mt-1.5 safe-text-secondary">
                        {formatDate(evt.date)} ·{" "}
                        <span
                          className={
                            evt.daysUntil <= 3
                              ? "text-[var(--safe-status-error)] font-medium"
                              : evt.daysUntil <= 7
                                ? "text-[var(--safe-status-warning)] font-medium"
                                : ""
                          }
                        >
                          dans {evt.daysUntil} jour(s)
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--safe-text-secondary)] shrink-0 mt-0.5" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
