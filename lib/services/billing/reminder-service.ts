/**
 * Service relances : création et envoi de relances pour factures en retard.
 *
 * Doctrine: docs/accounting/INVOICE_STATUS_NORMALIZATION.md
 *
 * « En retard » est dérivé dynamiquement (pas un état stocké).
 * Source de vérité unique = `whereInvoiceOverdue(now)` dans
 * `lib/billing/invoice-status.ts`. Le service ne lit plus
 * `invoiceStatus.OVERDUE` qui n'est jamais écrit en base.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { whereInvoiceOverdue } from "@/lib/billing/invoice-status";
import { relanceEmailHtml, sendEmail } from "@/lib/email";
import { displayInvoiceNumero } from "@/lib/facturation/invoice-numero-format";

export type ReminderType = "reminder_1" | "reminder_2" | "final_notice" | "interest_notice";
export type ReminderChannel = "email" | "manual" | "printed";

/** Crée une relance pour une facture */
export async function createReminder(params: {
  invoiceId: string;
  reminderType: ReminderType;
  channel?: ReminderChannel;
  note?: string | null;
  scheduledAt?: Date;
}): Promise<{ reminderId: string }> {
  const {
    invoiceId,
    reminderType,
    channel = "manual",
    note,
    scheduledAt = new Date(),
  } = params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) throw new Error("Facture introuvable");

  const reminder = await prisma.invoiceReminder.create({
    data: {
      invoiceId,
      reminderType,
      channel: channel as "email" | "manual" | "printed",
      scheduledAt,
      sentAt: channel === "manual" ? new Date() : undefined,
      status: channel === "manual" ? "sent" : "scheduled",
      note: note ?? undefined,
      reminderDay: undefined,
    },
  });

  await createAuditLog({
    cabinetId: invoice.cabinetId,
    entityType: "Invoice",
    entityId: invoiceId,
    action: "update",
    metadata: { reminderId: reminder.id, reminderType, channel },
    performedAt: new Date(),
  });

  return { reminderId: reminder.id };
}

/**
 * Liste les factures en retard (échéance dépassée, solde > 0).
 *
 * Le filtrage est entièrement délégué à `whereInvoiceOverdue(now)` qui couvre :
 *   - `invoiceStatus ∈ {ISSUED, PARTIALLY_PAID, OVERDUE}` (déjà émise)
 *   - `paymentStatus ∈ {UNPAID, PARTIAL}` (jamais payée)
 *   - `dateEcheance < now` (échéance dépassée)
 *
 * On ajoute un garde-fou `balanceDue > 0` directement au niveau Prisma plutôt
 * qu'en post-filter pour bénéficier de l'index et éviter le over-fetch.
 */
export async function listOverdueInvoices(cabinetId: string, filters?: {
  clientId?: string;
  limit?: number;
}) {
  const now = new Date();
  return prisma.invoice.findMany({
    where: {
      cabinetId,
      ...whereInvoiceOverdue(now),
      balanceDue: { gt: 0 },
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
    },
    orderBy: { dateEcheance: "asc" },
    take: filters?.limit ?? 100,
    include: {
      client: { select: { id: true, raisonSociale: true } },
      dossier: { select: { id: true, intitule: true } },
    },
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   ENVOI D'UNE RELANCE
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Résultat d'un envoi de relance.
 *
 * Discriminé plutôt que booléen : la route doit distinguer « pas de courriel
 * chez le client » (400, l'utilisateur peut corriger) de « Resend a refusé »
 * (502, il ne peut rien y faire). Le patron vient de `ResultatEnvoiFacture`.
 */
export type ResultatRelance =
  | { statut: "facture_introuvable" }
  | { statut: "client_sans_courriel" }
  | { statut: "pas_en_retard" }
  | { statut: "deja_payee" }
  | { statut: "envoi_echoue"; message: string }
  | { statut: "envoyee"; joursDeRetard: number; destinataire: string };

/** Jours entiers écoulés depuis l'échéance. Zéro si elle n'est pas passée. */
export function joursDeRetard(dateEcheance: Date, maintenant: Date): number {
  const ms = maintenant.getTime() - dateEcheance.getTime();
  return ms <= 0 ? 0 : Math.floor(ms / 86_400_000);
}

/**
 * Envoie un rappel de paiement au client, puis en garde la trace.
 *
 * `createReminder` ci-dessus n'envoyait rien : il ENREGISTRAIT qu'une relance
 * avait eu lieu. Personne ne l'appelait, et la colonne « Relance » du registre
 * lisait donc un champ que rien n'écrivait. Voir
 * `docs/journal/2026-08-27_relance_factures_absente.md`.
 *
 * Trois garde-fous avant tout envoi, dans cet ordre :
 *   1. la facture existe et appartient au cabinet ;
 *   2. elle est réellement en retard, au sens canonique de
 *      `whereInvoiceOverdue` ; on ne relance pas une facture à échoir ;
 *   3. il reste quelque chose à payer.
 *
 * L'ordre compte : on ne veut pas dire « pas de courriel » à propos d'une
 * facture déjà payée.
 *
 * L'écriture de la trace suit l'envoi, jamais l'inverse : une trace posée avant
 * un envoi qui échoue ferait croire au cabinet qu'il a relancé.
 */
export async function envoyerRelanceFacture(params: {
  invoiceId: string;
  cabinetId: string;
  maintenant?: Date;
}): Promise<ResultatRelance> {
  const { invoiceId, cabinetId } = params;
  const maintenant = params.maintenant ?? new Date();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, cabinetId },
    include: {
      client: {
        select: {
          email: true,
          langue: true,
          typeClient: true,
          raisonSociale: true,
          prenom: true,
          nom: true,
        },
      },
      cabinet: { select: { nom: true } },
    },
  });
  if (!invoice) return { statut: "facture_introuvable" };
  if (invoice.balanceDue <= 0) return { statut: "deja_payee" };

  const enRetard = await prisma.invoice.count({
    where: { id: invoiceId, cabinetId, ...whereInvoiceOverdue(maintenant) },
  });
  if (enRetard === 0) return { statut: "pas_en_retard" };

  const destinataire = invoice.client?.email?.trim();
  if (!destinataire) return { statut: "client_sans_courriel" };

  const jours = joursDeRetard(invoice.dateEcheance, maintenant);
  // La langue du CLIENT, pas celle de l'utilisateur qui clique.
  const langue = invoice.client?.langue?.toLowerCase() === "en" ? "en" : "fr";
  const intl = langue === "en" ? "en-CA" : "fr-CA";
  const cabinetNom = invoice.cabinet?.nom ?? "Cabinet";

  const { subject, html } = relanceEmailHtml({
    clientName: nomClientRelance(invoice.client),
    cabinetName: cabinetNom,
    invoiceNumber: displayInvoiceNumero(invoice.numero),
    amount: new Intl.NumberFormat(intl, { style: "currency", currency: "CAD" }).format(
      invoice.balanceDue,
    ),
    dueDate: new Intl.DateTimeFormat(intl, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(invoice.dateEcheance),
    daysOverdue: jours,
    shareUrl: invoice.shareToken
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/facture/${invoice.shareToken}`
      : undefined,
    language: langue,
  });

  try {
    await sendEmail({ to: destinataire, subject, html, cabinetNom });
  } catch (err) {
    return {
      statut: "envoi_echoue",
      message: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }

  await createReminder({
    invoiceId,
    reminderType: jours >= 30 ? "final_notice" : jours >= 15 ? "reminder_2" : "reminder_1",
    channel: "email",
    note: `Relance manuelle, J+${jours}`,
  });

  /* `lastReminderDay` est ce que le registre affiche. Sans cette ligne, la
     colonne « Relance » resterait vide alors que le courriel est parti. */
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { lastReminderDay: jours },
  });

  return { statut: "envoyee", joursDeRetard: jours, destinataire };
}

/** Nom d'appel du client. Même règle que le registre : jamais vide. */
function nomClientRelance(client: {
  typeClient: string;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
} | null): string {
  if (!client) return "Madame, Monsieur";
  if (client.typeClient === "personne_physique") {
    const complet = [client.prenom, client.nom].filter(Boolean).join(" ").trim();
    if (complet) return complet;
  }
  return client.raisonSociale?.trim() || "Madame, Monsieur";
}
