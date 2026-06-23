import Link from "next/link";
import { Clock, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { DossierResume, ResumeLocale } from "@/lib/dossiers/dossier-resume";

/**
 * T1 — Carte « Où j'en étais ? » (context-resume).
 *
 * Présentational, sans état : reçoit un `DossierResume` déjà calculé par
 * `getDossierResume()`. Bilingue (chrome inline). Incarne les principes TDAH :
 * mémoire externalisée (résumé), temps visible (compte à rebours), une action
 * à la fois, état de repos « 0 oubli ». Max 2 couleurs (vert SAFE + neutres).
 */

const ACCENT = "#0F2A22";
const ACCENT_SOFT = "#E9F1EC";

const CHROME = {
  en: {
    title: "Where I left off",
    caughtUp: "All caught up",
    nextAction: "Next action",
    doItNow: "Do it now",
    critical: "critical item",
    blocking: "blocking issue",
    overdue: "overdue task",
    dueToday: "due today",
    expiresIn: "in",
    day: "day",
    days: "days",
  },
  fr: {
    title: "Où j'en étais ?",
    caughtUp: "Rien n'est oublié",
    nextAction: "Prochaine action",
    doItNow: "Faire maintenant",
    critical: "élément critique",
    blocking: "blocage",
    overdue: "tâche en retard",
    dueToday: "aujourd'hui",
    expiresIn: "dans",
    day: "jour",
    days: "jours",
  },
} as const;

function plural(n: number, one: string): string {
  // "1 overdue task" / "2 overdue tasks" ; "1 tâche en retard" / "2 tâches en retard"
  return `${n} ${one}${n > 1 ? "s" : ""}`;
}

interface Props {
  resume: DossierResume;
  locale?: ResumeLocale;
  /** Lien de la prochaine action (T1 : ancre/section du dossier, pas de nouvelle route). */
  nextActionHref?: string;
}

export function DossierResumeCard({ resume, locale = "en", nextActionHref }: Props) {
  const t = CHROME[locale];
  const caughtUp =
    resume.state === "pret_pour_revue" &&
    resume.counts.overdueTasks === 0 &&
    resume.counts.blockingIssues === 0;

  const d = resume.nearestDeadline;
  const urgent = d ? d.daysLeft <= 2 : false;
  const soon = d ? d.daysLeft <= 7 : false;
  const countdownColors = urgent
    ? { bg: "#FBEDED", fg: "#9B2C2C" }
    : soon
      ? { bg: "#FCF3E6", fg: "#B45309" }
      : { bg: "#F3F4F6", fg: "#4B5563" };

  const hasAlerts = resume.counts.overdueTasks > 0 || resume.counts.blockingIssues > 0 || soon;

  return (
    <section
      className="rounded-2xl border border-si-line bg-si-surface p-5 shadow-sm"
      aria-label={t.title}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-si-muted/50">
          {t.title}
        </h2>
        {caughtUp ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: ACCENT_SOFT, color: ACCENT }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {t.caughtUp}
          </span>
        ) : null}
      </div>

      {/* Résumé narratif (mémoire externalisée) */}
      <p
        className="mt-3 pl-3.5 text-[15px] leading-relaxed text-si-ink"
        style={{ borderLeft: `3px solid ${ACCENT}` }}
      >
        {resume.summary}
      </p>

      {/* Alertes : critiques + compte à rebours (temps visible) */}
      {hasAlerts ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {resume.counts.blockingIssues > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FBEDED] px-3 py-1.5 text-[13px] font-semibold text-[#9B2C2C]">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              {plural(resume.counts.blockingIssues, t.blocking)}
            </span>
          ) : resume.counts.criticalMissing > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FCF3E6] px-3 py-1.5 text-[13px] font-semibold text-[#B45309]">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              {plural(resume.counts.criticalMissing, t.critical)}
            </span>
          ) : null}

          {resume.counts.overdueTasks > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FBEDED] px-3 py-1.5 text-[13px] font-semibold text-[#9B2C2C]">
              {plural(resume.counts.overdueTasks, t.overdue)}
            </span>
          ) : null}

          {d && soon ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold"
              style={{ backgroundColor: countdownColors.bg, color: countdownColors.fg }}
            >
              <Clock className="h-4 w-4" aria-hidden />
              {d.label} ·{" "}
              {d.daysLeft === 0
                ? t.dueToday
                : `${t.expiresIn} ${d.daysLeft} ${d.daysLeft > 1 ? t.days : t.day}`}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Prochaine action — une seule, mise en avant */}
      {resume.nextAction ? (
        <div
          className="mt-4 flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
          style={{ backgroundColor: ACCENT_SOFT, borderColor: "#D6E6DC" }}
        >
          <div className="min-w-0">
            <div
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: ACCENT }}
            >
              {t.nextAction}
            </div>
            <div className="mt-0.5 text-[15px] font-semibold text-si-ink">
              {resume.nextAction}
            </div>
          </div>
          {nextActionHref ? (
            <Link
              href={nextActionHref}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: ACCENT }}
            >
              {t.doItNow}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
