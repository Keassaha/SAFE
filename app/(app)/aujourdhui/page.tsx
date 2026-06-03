import { getLocale, getTranslations } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { normalizeAppLocale } from "@/lib/i18n/locale";
import { getAssistantQueue } from "@/lib/dossiers/assistant-queue";
import { getNavetteInbox } from "@/lib/navette/navette-service";
import { nextActionByKind } from "@/lib/dossiers/dossier-resume";
import {
  AaliyahTodayView,
  type AaliyahTodayData,
  type TodayFocusRow,
} from "@/components/today/AaliyahTodayView";

/**
 * Dashboard « Today » de l'assistante (Aaliyah). Compose la file existante
 * (`getAssistantQueue`) + la Navette (`getNavetteInbox`). Bilingue (EN défaut).
 */
export default async function AujourdhuiPage() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const locale = normalizeAppLocale(await getLocale());
  const t = await getTranslations("todayUi");

  const [user, queue, inboxNeedsMe] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { nom: true } }),
    getAssistantQueue(cabinetId, userId),
    getNavetteInbox(cabinetId, userId, role, "needs_me", 8),
  ]);

  const firstName = (user?.nom ?? "").trim().split(/\s+/)[0] || "—";

  // Échéance la plus proche par dossier (pour rattacher un compte à rebours).
  const soonestByDossier = new Map<string, number>();
  for (const e of queue.upcomingDeadlines) {
    const cur = soonestByDossier.get(e.dossierId);
    if (cur == null || e.daysUntil < cur) soonestByDossier.set(e.dossierId, e.daysUntil);
  }

  const matterIds = new Set(
    [...queue.incomplete, ...queue.awaitingClient, ...queue.readyForReview, ...queue.unassigned].map(
      (x) => x.dossierId,
    ),
  );
  const overdueTasks = queue.myAdminTasks.filter((tk) => (tk.daysOverdue ?? 0) > 0);

  const matterLabel = (intitule: string, numero: string | null) => numero?.trim() || intitule;

  // ── Prochaine action (une seule) ──
  let nextAction: AaliyahTodayData["nextAction"] = null;
  const sentBack = inboxNeedsMe.find((m) => m.type === "sent_back");
  if (sentBack) {
    nextAction = {
      text: t("nextActionFixSentBack"),
      dossierId: sentBack.dossierId,
      matterLabel: matterLabel(sentBack.dossierIntitule, sentBack.numeroDossier),
      countdownDays: sentBack.dueDate
        ? Math.max(0, Math.round((sentBack.dueDate.getTime() - Date.now()) / 86_400_000))
        : null,
      countdownLabel: null,
    };
  } else {
    const top = queue.incomplete[0] ?? queue.unassigned[0] ?? null;
    if (top) {
      nextAction = {
        text: top.topMissingKind ? nextActionByKind(top.topMissingKind, locale) : t("noNextAction"),
        dossierId: top.dossierId,
        matterLabel: matterLabel(top.dossierIntitule, top.numeroDossier),
        countdownDays: soonestByDossier.get(top.dossierId) ?? null,
        countdownLabel: null,
      };
    }
  }

  // ── Inbox Navette (needs me) ──
  const inbox = inboxNeedsMe.map((m) => ({
    id: m.id,
    dossierId: m.dossierId,
    type: m.type,
    body: m.body,
    matterLabel: matterLabel(m.dossierIntitule, m.numeroDossier),
    authorName: m.authorName,
  }));

  // ── Today's focus (manquants + tâches admin) ──
  const focus: TodayFocusRow[] = [
    ...queue.incomplete.slice(0, 3).map((d) => ({
      id: `m-${d.dossierId}`,
      dossierId: d.dossierId,
      title: d.topMissingKind ? nextActionByKind(d.topMissingKind, locale) : t("focusCompleteMatter"),
      matterLabel: matterLabel(d.dossierIntitule, d.numeroDossier),
      daysUntil: soonestByDossier.get(d.dossierId) ?? null,
    })),
    ...queue.myAdminTasks.slice(0, 3).map((tk) => ({
      id: `t-${tk.taskId}`,
      dossierId: tk.dossierId,
      title: tk.titre,
      matterLabel: tk.dossierIntitule,
      daysUntil:
        tk.dateEcheance != null
          ? Math.round((tk.dateEcheance.getTime() - Date.now()) / 86_400_000)
          : null,
      overdue: (tk.daysOverdue ?? 0) > 0,
    })),
  ].slice(0, 5);

  const data: AaliyahTodayData = {
    firstName,
    dateLabel: new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date()),
    activeMatters: matterIds.size,
    omissions: overdueTasks.length,
    nextAction,
    inbox,
    focus,
    deadlines: queue.upcomingDeadlines.slice(0, 5).map((e) => ({
      dossierId: e.dossierId,
      label: e.titre?.trim() || e.type,
      matterLabel: e.dossierIntitule,
      daysUntil: e.daysUntil,
    })),
    awaiting: queue.awaitingClient.slice(0, 5).map((d) => ({
      dossierId: d.dossierId,
      matterLabel: matterLabel(d.dossierIntitule, d.numeroDossier),
      clientName: d.clientName,
    })),
    weekReady: queue.readyForReview.length,
  };

  return <AaliyahTodayView data={data} />;
}
