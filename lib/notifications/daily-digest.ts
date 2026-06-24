import type { NavetteMessageType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getNavetteInbox } from "@/lib/navette/navette-service";
import { detectAndEmitUrgentActes } from "@/lib/navette/acte-urgent-scan";
import { countPendingHours } from "@/lib/payroll/employee-hours-service";

/**
 * Digest courriel quotidien — « notifications calmes » (N7b).
 * Doctrine : docs/product/SPEC_aaliyah_home_navette.md §8.
 *
 * Un seul résumé par jour et par personne (assistante & avocate). Règle du
 * silence : aucun envoi si rien d'actionnable. Préférence on/off par
 * utilisateur (`User.digestOptOut`). Thème SAFE, sans emoji. Pas de push.
 */

export type DigestLocale = "fr" | "en";

export interface DigestNavetteItem {
  type: NavetteMessageType;
  dossierLabel: string;
  body: string | null;
  dueISO: string | null;
}

export interface DigestDeadline {
  label: string;
  dossierLabel: string;
  daysUntil: number;
}

export interface DigestTask {
  titre: string;
  dossierLabel: string;
  daysOverdue: number;
}

export interface DigestData {
  recipientName: string;
  navetteNeedsMe: { count: number; items: DigestNavetteItem[] };
  upcomingDeadlines: DigestDeadline[];
  overdueTasks: { count: number; items: DigestTask[] };
  pendingHoursToApprove: number;
}

// ——— i18n autonome (les courriels sortent du contexte next-intl) ———

const STR: Record<DigestLocale, Record<string, string>> = {
  fr: {
    subject: "Votre résumé du jour",
    greeting: "Bonjour",
    intro: "Voici ce qui demande votre attention aujourd’hui.",
    navetteTitle: "Navette : en attente de vous",
    deadlinesTitle: "Échéances proches",
    tasksTitle: "Tâches en retard",
    hoursTitle: "Heures à approuver",
    hoursLine: "{n} soumission(s) d’heures en attente d’approbation.",
    openApp: "Ouvrir SAFE",
    today: "aujourd’hui",
    tomorrow: "demain",
    inDays: "dans {n} j",
    overdueBy: "en retard de {n} j",
    due: "échéance",
    footer:
      "Vous recevez ce résumé une fois par jour. Pour le désactiver, ouvrez SAFE puis « Mon temps & ma paye » ou vos préférences.",
    more: "+ {n} de plus",
    typeSentBack: "Retour à corriger",
    typeQuestion: "Question",
    typeReadyForReview: "Prêt pour revue",
    typeApproved: "Approuvé",
    typeInfo: "Info",
    typeReply: "Réponse",
    typeDocumentReady: "Document prêt",
    typeInvoiceReady: "Facture prête",
    typeActeUrgent: "Acte urgent",
  },
  en: {
    subject: "Your daily summary",
    greeting: "Hello",
    intro: "Here is what needs your attention today.",
    navetteTitle: "Navette: waiting on you",
    deadlinesTitle: "Upcoming deadlines",
    tasksTitle: "Overdue tasks",
    hoursTitle: "Hours to approve",
    hoursLine: "{n} hours submission(s) awaiting approval.",
    openApp: "Open SAFE",
    today: "today",
    tomorrow: "tomorrow",
    inDays: "in {n} d",
    overdueBy: "{n} d overdue",
    due: "due",
    footer:
      "You receive this summary once a day. To turn it off, open SAFE then “My time & pay” or your preferences.",
    more: "+ {n} more",
    typeSentBack: "Sent back to fix",
    typeQuestion: "Question",
    typeReadyForReview: "Ready for review",
    typeApproved: "Approved",
    typeInfo: "Info",
    typeReply: "Reply",
    typeDocumentReady: "Document ready",
    typeInvoiceReady: "Invoice ready",
    typeActeUrgent: "Urgent task",
  },
};

function s(locale: DigestLocale, key: string, vars?: Record<string, string | number>): string {
  let out = STR[locale][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
  return out;
}

function typeLabel(locale: DigestLocale, type: NavetteMessageType): string {
  const map: Record<NavetteMessageType, string> = {
    sent_back: "typeSentBack",
    question: "typeQuestion",
    ready_for_review: "typeReadyForReview",
    approved: "typeApproved",
    info: "typeInfo",
    reply: "typeReply",
    document_ready: "typeDocumentReady",
    invoice_ready: "typeInvoiceReady",
    acte_urgent: "typeActeUrgent",
  };
  return s(locale, map[type]);
}

function daysLabel(locale: DigestLocale, days: number): string {
  if (days <= 0) return s(locale, "today");
  if (days === 1) return s(locale, "tomorrow");
  return s(locale, "inDays", { n: days });
}

// ——— Règle du silence ———

export function hasDigestContent(d: DigestData): boolean {
  return (
    d.navetteNeedsMe.count > 0 ||
    d.upcomingDeadlines.length > 0 ||
    d.overdueTasks.count > 0 ||
    d.pendingHoursToApprove > 0
  );
}

// ——— Rendu (pur) ———

export function digestSubject(d: DigestData, locale: DigestLocale): string {
  const bits: string[] = [];
  if (d.navetteNeedsMe.count > 0) bits.push(`${d.navetteNeedsMe.count} ${s(locale, "navetteTitle").toLowerCase()}`);
  if (d.upcomingDeadlines.length > 0) bits.push(`${d.upcomingDeadlines.length} ${s(locale, "deadlinesTitle").toLowerCase()}`);
  const base = s(locale, "subject");
  return bits.length ? `${base} · ${bits.join(" · ")}` : base;
}

const FOREST = "#1F3A2E";
const INK = "#18181B";
const BODY = "#3F3F46";
const MUTED = "#71717A";
const BORDER = "#E4E4E7";
const SOFT = "#EEF5F0";

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, meta: string, sub: string | null): string {
  return `
    <tr>
      <td style="padding:10px 0;border-top:1px solid ${BORDER};">
        <div style="font-size:14px;color:${INK};font-weight:600;">${escapeHtml(label)}</div>
        ${sub ? `<div style="font-size:13px;color:${BODY};margin-top:2px;">${escapeHtml(sub)}</div>` : ""}
        <div style="font-size:12px;color:${MUTED};margin-top:2px;">${escapeHtml(meta)}</div>
      </td>
    </tr>`;
}

function section(title: string, rows: string): string {
  if (!rows) return "";
  return `
    <tr><td style="padding:18px 24px 4px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${FOREST};">${escapeHtml(title)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">${rows}</table>
    </td></tr>`;
}

export function renderDigestHtml(
  d: DigestData,
  locale: DigestLocale,
  appUrl: string,
  cabinetName?: string,
): string {
  const navetteRows = d.navetteNeedsMe.items
    .map((i) =>
      row(
        i.dossierLabel,
        typeLabel(locale, i.type),
        i.body ? i.body.slice(0, 140) : null,
      ),
    )
    .join("");
  const navetteExtra =
    d.navetteNeedsMe.count > d.navetteNeedsMe.items.length
      ? `<tr><td style="padding:6px 0;font-size:12px;color:${MUTED};">${s(locale, "more", { n: d.navetteNeedsMe.count - d.navetteNeedsMe.items.length })}</td></tr>`
      : "";

  const deadlineRows = d.upcomingDeadlines
    .map((dl) => row(dl.label, `${dl.dossierLabel} · ${daysLabel(locale, dl.daysUntil)}`, null))
    .join("");

  const taskRows = d.overdueTasks.items
    .map((tk) => row(tk.titre, `${tk.dossierLabel} · ${s(locale, "overdueBy", { n: tk.daysOverdue })}`, null))
    .join("");

  const hoursRows =
    d.pendingHoursToApprove > 0
      ? row(s(locale, "hoursLine", { n: d.pendingHoursToApprove }), "", null)
      : "";

  return `<!DOCTYPE html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
        <tr><td style="background:${FOREST};padding:20px 24px;">
          <div style="color:#FFFFFF;font-size:16px;font-weight:700;">SAFE${cabinetName ? ` · ${escapeHtml(cabinetName)}` : ""}</div>
          <div style="color:${SOFT};font-size:13px;margin-top:2px;">${escapeHtml(s(locale, "subject"))}</div>
        </td></tr>
        <tr><td style="padding:20px 24px 0;">
          <div style="font-size:15px;color:${INK};">${escapeHtml(s(locale, "greeting"))} ${escapeHtml(d.recipientName)},</div>
          <div style="font-size:14px;color:${BODY};margin-top:4px;">${escapeHtml(s(locale, "intro"))}</div>
        </td></tr>
        ${section(s(locale, "navetteTitle"), navetteRows + navetteExtra)}
        ${section(s(locale, "deadlinesTitle"), deadlineRows)}
        ${section(s(locale, "tasksTitle"), taskRows)}
        ${section(s(locale, "hoursTitle"), hoursRows)}
        <tr><td style="padding:24px;">
          <a href="${escapeHtml(appUrl)}" style="display:inline-block;background:${FOREST};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;">${escapeHtml(s(locale, "openApp"))}</a>
        </td></tr>
        <tr><td style="padding:0 24px 24px;">
          <div style="font-size:12px;color:${MUTED};border-top:1px solid ${BORDER};padding-top:12px;">${escapeHtml(s(locale, "footer"))}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ——— Collecte + envoi ———

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "https://app.safecabinet.ca"
  );
}

interface DigestUser {
  id: string;
  nom: string;
  email: string;
  role: string;
}

/** Construit les données de digest d'un utilisateur (sans envoi). */
export async function collectUserDigest(
  cabinetId: string,
  user: DigestUser,
  pendingHoursCabinet: number,
  now: Date,
): Promise<DigestData> {
  const navetteRows = await getNavetteInbox(cabinetId, user.id, user.role, "needs_me", 6);
  const navetteCount = navetteRows.length;

  // Échéances ≤ 3 jours (cabinet) — calme, pas de bruit lointain.
  const horizonEnd = new Date(now.getTime() + 3 * 86_400_000);
  const events = await prisma.dossierEvenement.findMany({
    where: { dossier: { cabinetId }, date: { gte: now, lte: horizonEnd } },
    include: { dossier: { select: { intitule: true, numeroDossier: true } } },
    orderBy: { date: "asc" },
    take: 6,
  });

  // Tâches en retard assignées à l'utilisateur.
  const tasks = await prisma.dossierTache.findMany({
    where: {
      assigneeId: user.id,
      statut: { in: ["a_faire", "en_cours"] },
      dateEcheance: { lt: now },
      dossier: { cabinetId },
    },
    include: { dossier: { select: { intitule: true, numeroDossier: true } } },
    orderBy: { dateEcheance: "asc" },
    take: 6,
  });

  const matterLabel = (intitule: string, numero: string | null) => numero?.trim() || intitule;

  // Heures à approuver : pertinent pour avocate / admin uniquement.
  const canApproveHours = user.role === "avocat" || user.role === "admin_cabinet";

  return {
    recipientName: (user.nom ?? "").trim().split(/\s+/)[0] || user.nom,
    navetteNeedsMe: {
      count: navetteCount,
      items: navetteRows.map((r) => ({
        type: r.type,
        dossierLabel: matterLabel(r.dossierIntitule, r.numeroDossier),
        body: r.body,
        dueISO: r.dueDate ? r.dueDate.toISOString() : null,
      })),
    },
    upcomingDeadlines: events.map((e) => ({
      label: e.titre?.trim() || e.type,
      dossierLabel: matterLabel(e.dossier.intitule, e.dossier.numeroDossier),
      daysUntil: Math.max(0, Math.round((e.date.getTime() - now.getTime()) / 86_400_000)),
    })),
    overdueTasks: {
      count: tasks.length,
      items: tasks.map((tk) => ({
        titre: tk.titre,
        dossierLabel: matterLabel(tk.dossier.intitule, tk.dossier.numeroDossier),
        daysOverdue: Math.max(
          1,
          Math.round((now.getTime() - (tk.dateEcheance?.getTime() ?? now.getTime())) / 86_400_000),
        ),
      })),
    },
    pendingHoursToApprove: canApproveHours ? pendingHoursCabinet : 0,
  };
}

export interface RunDigestResult {
  cabinets: number;
  candidates: number;
  sent: number;
  skippedEmpty: number;
  skippedOptOut: number;
  failed: number;
}

interface RunDigestOptions {
  now?: Date;
  /** Restreint à un cabinet (test / déclenchement ciblé). */
  cabinetId?: string;
  /** Locale par défaut des courriels (faute de préférence par utilisateur). */
  locale?: DigestLocale;
}

/**
 * Parcourt les cabinets et envoie un digest à chaque utilisateur concerné
 * (assistante / avocate / admin) ayant un courriel et n'ayant pas désactivé.
 * Règle du silence : aucun envoi si rien d'actionnable.
 */
export async function runDailyDigest(options: RunDigestOptions = {}): Promise<RunDigestResult> {
  const now = options.now ?? new Date();
  const locale: DigestLocale = options.locale ?? "en";
  const result: RunDigestResult = {
    cabinets: 0,
    candidates: 0,
    sent: 0,
    skippedEmpty: 0,
    skippedOptOut: 0,
    failed: 0,
  };

  const cabinets = await prisma.cabinet.findMany({
    where: options.cabinetId ? { id: options.cabinetId } : {},
    select: { id: true, nom: true },
  });
  result.cabinets = cabinets.length;
  const appUrl = appBaseUrl();

  for (const cabinet of cabinets) {
    // P5 — émet les « actes urgents » du jour AVANT de composer les digests,
    // pour qu'ils remontent dans la navette ET dans le courriel du même run.
    try {
      await detectAndEmitUrgentActes(cabinet.id, now);
    } catch {
      // scan best-effort : n'interrompt pas l'envoi du digest
    }

    const users = await prisma.user.findMany({
      where: {
        cabinetId: cabinet.id,
        role: { in: ["assistante", "avocat", "admin_cabinet"] },
      },
      select: { id: true, nom: true, email: true, role: true, digestOptOut: true },
    });

    const pendingHoursCabinet = await countPendingHours(cabinet.id);

    for (const user of users) {
      result.candidates += 1;
      if (user.digestOptOut) {
        result.skippedOptOut += 1;
        continue;
      }
      if (!user.email) {
        result.skippedEmpty += 1;
        continue;
      }

      const data = await collectUserDigest(cabinet.id, user, pendingHoursCabinet, now);
      if (!hasDigestContent(data)) {
        result.skippedEmpty += 1;
        continue;
      }

      const subject = digestSubject(data, locale);
      const html = renderDigestHtml(data, locale, appUrl, cabinet.nom);

      let status = "sent";
      try {
        await sendEmail({ to: user.email, subject, html, cabinetNom: cabinet.nom });
        result.sent += 1;
      } catch {
        status = "failed";
        result.failed += 1;
      }

      await prisma.notificationLog.create({
        data: {
          cabinetId: cabinet.id,
          type: "daily_digest",
          channel: "email",
          sentTo: user.email,
          subject,
          status,
          metadata: JSON.stringify({
            navette: data.navetteNeedsMe.count,
            deadlines: data.upcomingDeadlines.length,
            overdue: data.overdueTasks.count,
            hours: data.pendingHoursToApprove,
          }),
        },
      });
    }
  }

  return result;
}
