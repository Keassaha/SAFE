import { prisma } from "@/lib/db";

/**
 * Moteur « prochaine action clé » — Tour de contrôle de la Console SAFE Inc.
 *
 * Principe : à tout moment, une seule action mérite d'être faite maintenant.
 * Le moteur la calcule au lieu de la demander. Aucune liste à trier, aucun
 * arbitrage à faire de tête.
 *
 * Deux familles de candidats :
 *
 *  1. Les tâches EXPLICITES (modèle Task). Ce que vous avez décidé vous-même.
 *     Elles gagnent toujours contre une action déduite : votre décision d'hier
 *     bat une heuristique d'aujourd'hui.
 *
 *  2. Les actions DÉDUITES de l'état réel du pipeline (un client qui attend,
 *     un audit sans suite, un lead chaud qui refroidit). Elles existent sans
 *     que personne n'ait eu à les saisir, ce qui est exactement le point : une
 *     action qu'il faut penser à créer est une action qu'on oublie.
 *
 * Règle de silence : si un lead porte une tâche ouverte planifiée dans le futur
 * (report explicite), toutes ses actions déduites se taisent jusqu'à l'échéance.
 * Reporter veut dire reporter, pas « le redemander dans dix minutes ».
 */

const HOUR_MS = 1000 * 60 * 60;
const DAY_MS = HOUR_MS * 24;

export type SourceActionCle =
  | "TACHE"
  | "SUPPORT"
  | "ACTIVATION"
  | "ESSAI"
  | "AUDIT"
  | "REFROIDISSEMENT"
  | "PREMIER_CONTACT";

export type ActionCle = {
  /** Identifiant stable, encode la source : "task:<id>" ou "lead:<id>:REFROIDISSEMENT". */
  cle: string;
  source: SourceActionCle;
  /** Renseigné seulement si l'action est adossée à une Task réelle. */
  taskId: string | null;
  leadId: string | null;
  /** Verbe à l'impératif. Ce qu'on fait, pas ce qu'on observe. */
  titre: string;
  /** Le cabinet ou la personne concernée. */
  cible: string;
  /** Une phrase : pourquoi celle-là, pourquoi maintenant. */
  pourquoi: string;
  href: string;
  urgence: number;
  echeance: Date | null;
  /** Jours de retard (0 si dans les temps). Sert au ton d'affichage. */
  retardJours: number;
};

/** Bases d'urgence par source. L'écart entre deux paliers reste plus grand que
 *  ce que le retard peut ajouter, pour qu'un ordre de grandeur ne se renverse
 *  pas à cause de l'ancienneté seule. */
const BASE = {
  TACHE_RETARD: 1000,
  TACHE_JOUR: 900,
  SUPPORT: 800,
  ACTIVATION: 700,
  ESSAI: 640,
  AUDIT: 560,
  REFROIDISSEMENT: 400,
  PREMIER_CONTACT: 200,
} as const;

function joursDepuis(date: Date, maintenant: Date): number {
  return Math.max(0, Math.floor((maintenant.getTime() - date.getTime()) / DAY_MS));
}

function heuresDepuis(date: Date, maintenant: Date): number {
  return Math.max(0, Math.floor((maintenant.getTime() - date.getTime()) / HOUR_MS));
}

function finDeJournee(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

const TITRE_TACHE: Record<string, string> = {
  FOLLOW_UP_EMAIL: "Envoyer le courriel de suivi",
  APPEL: "Appeler",
  LINKEDIN_DM: "Envoyer le DM LinkedIn",
  ENVOYER_RESSOURCE: "Envoyer la ressource",
  RELANCER: "Relancer",
  MEETING: "Tenir la rencontre",
  PREPARER_AUDIT: "Préparer l'audit",
  REVISION_BUNDLE: "Réviser le bundle",
  ACTIVATION_STEP: "Avancer l'activation",
};

/**
 * Calcule les actions clés du workspace, triées de la plus urgente à la moins
 * urgente. La première est LA prochaine action ; les suivantes servent de file
 * d'attente visible mais volontairement discrète.
 */
export async function calculerActionsCles(
  workspaceId: string,
  options: { maintenant?: Date; limite?: number } = {},
): Promise<ActionCle[]> {
  const maintenant = options.maintenant ?? new Date();
  const limite = options.limite ?? 5;
  const finAujourdhui = finDeJournee(maintenant);
  const seuilRefroidissement = new Date(maintenant.getTime() - 5 * DAY_MS);

  const [taches, tachesFutures, ticketsOuverts, leadsSignes, essais, auditsSansSuite, leadsChauds, jamaisContactes] =
    await Promise.all([
      // 1. Tâches explicites dues (en retard ou aujourd'hui)
      prisma.task.findMany({
        where: {
          statut: { in: ["A_FAIRE", "EN_COURS"] },
          dateEcheance: { not: null, lte: finAujourdhui },
          lead: { workspaceId },
        },
        select: {
          id: true,
          titre: true,
          description: true,
          type: true,
          priorite: true,
          dateEcheance: true,
          leadId: true,
          lead: { select: { raisonSociale: true } },
        },
      }),

      // Leads mis en sourdine par un report explicite
      prisma.task.findMany({
        where: {
          statut: { in: ["A_FAIRE", "EN_COURS"] },
          dateEcheance: { gt: finAujourdhui },
          leadId: { not: null },
          lead: { workspaceId },
        },
        select: { leadId: true },
      }),

      // 2. Clients qui attendent une réponse
      prisma.supportTicket.findMany({
        where: { statut: { in: ["NOUVEAU", "EN_COURS", "REOUVERT"] } },
        select: {
          id: true,
          titre: true,
          priorite: true,
          statut: true,
          createdAt: true,
          cabinet: { select: { nom: true, lead: { select: { id: true } } } },
          replies: {
            where: { isFromSafeInc: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),

      // 3. Signés qui n'ont pas de cabinet : l'activation n'a jamais démarré
      prisma.lead.findMany({
        where: { workspaceId, stageLead: "SIGNED", cabinetId: null },
        select: { id: true, raisonSociale: true, updatedAt: true, dateDerniereActivite: true },
      }),

      // 4. Essais Stripe qui arrivent à terme
      prisma.lead.findMany({
        where: {
          workspaceId,
          cabinetId: { not: null },
          cabinet: {
            nom: { not: "SAFE" },
            stripeSubscriptionStatus: "trialing",
            stripeTrialEnd: { not: null, lte: new Date(maintenant.getTime() + 7 * DAY_MS) },
          },
        },
        select: {
          id: true,
          raisonSociale: true,
          cabinet: { select: { stripeTrialEnd: true } },
        },
      }),

      // 5. Audits complétés restés sans suite
      prisma.lead.findMany({
        where: {
          workspaceId,
          stageLead: "AUDIT_COMPLETED",
          OR: [{ dateDerniereActivite: null }, { dateDerniereActivite: { lt: seuilRefroidissement } }],
        },
        select: { id: true, raisonSociale: true, score: true, dateDerniereActivite: true, updatedAt: true },
      }),

      // 6. Leads chauds qui refroidissent
      prisma.lead.findMany({
        where: {
          workspaceId,
          score: { gte: 55 },
          stageLead: {
            in: ["CONTACTED", "CONVERSING", "LEAD_MAGNET_SENT", "AUDIT_PROPOSED", "AUDIT_SCHEDULED", "CONSULTATION_PHASE2", "READY_TO_SIGN"],
          },
          statutLead: { notIn: ["CHURNED", "PAUSED"] },
          OR: [{ dateDerniereActivite: null }, { dateDerniereActivite: { lt: seuilRefroidissement } }],
        },
        select: { id: true, raisonSociale: true, score: true, stageLead: true, dateDerniereActivite: true, createdAt: true },
        orderBy: [{ score: "desc" }],
        take: 20,
      }),

      // 7. Filet : le meilleur lead jamais approché
      prisma.lead.findMany({
        where: {
          workspaceId,
          stageLead: { in: ["AWARENESS", "ENGAGED"] },
          statutLead: { notIn: ["CHURNED", "PAUSED"] },
          activities: { none: { direction: "OUTBOUND" } },
        },
        select: { id: true, raisonSociale: true, score: true, ville: true },
        orderBy: [{ score: "desc" }, { createdAt: "asc" }],
        take: 3,
      }),
    ]);

  const enSourdine = new Set(tachesFutures.map((t) => t.leadId).filter((id): id is string => !!id));
  const candidats: ActionCle[] = [];

  // ── 1. Tâches explicites ────────────────────────────────────────────────
  for (const t of taches) {
    const echeance = t.dateEcheance!;
    const retard = joursDepuis(finDeJournee(echeance), maintenant);
    const enRetard = retard > 0;
    const bonusPriorite = t.priorite === "HAUTE" ? 40 : t.priorite === "BASSE" ? -40 : 0;
    candidats.push({
      cle: `task:${t.id}`,
      source: "TACHE",
      taskId: t.id,
      leadId: t.leadId,
      titre: t.titre || TITRE_TACHE[t.type] || "Traiter la tâche",
      cible: t.lead?.raisonSociale ?? "SAFE Inc.",
      pourquoi: enRetard
        ? `Vous l'aviez planifiée pour il y a ${retard} jour${retard > 1 ? "s" : ""}.`
        : "Vous l'aviez planifiée pour aujourd'hui.",
      href: t.leadId ? `/console/clients/${t.leadId}` : "/console/pipeline",
      urgence: (enRetard ? BASE.TACHE_RETARD : BASE.TACHE_JOUR) + Math.min(80, retard * 8) + bonusPriorite,
      echeance,
      retardJours: retard,
    });
  }

  // ── 2. Support : un client qui paye et qui attend passe avant la prospection
  for (const ticket of ticketsOuverts) {
    const derniereReponse = ticket.replies[0]?.createdAt ?? null;
    const depuis = derniereReponse ?? ticket.createdAt;
    const heures = heuresDepuis(depuis, maintenant);
    // Un billet neuf a droit à quelques heures ; un billet déjà répondu, à une journée.
    const seuil = derniereReponse ? 24 : 4;
    if (heures < seuil) continue;
    const leadId = ticket.cabinet.lead?.id ?? null;
    candidats.push({
      cle: `ticket:${ticket.id}`,
      source: "SUPPORT",
      taskId: null,
      leadId,
      titre: derniereReponse ? "Relancer le billet de support" : "Répondre au billet de support",
      cible: ticket.cabinet.nom,
      pourquoi: `« ${ticket.titre} » attend depuis ${heures} h. C'est un cabinet client.`,
      href: `/console/support/${ticket.id}`,
      urgence: BASE.SUPPORT + Math.min(120, heures) + (ticket.priorite === "HAUTE" ? 60 : 0),
      echeance: null,
      retardJours: Math.floor(heures / 24),
    });
  }

  // ── 3. Signé sans activation ────────────────────────────────────────────
  for (const lead of leadsSignes) {
    if (enSourdine.has(lead.id)) continue;
    const depuis = lead.dateDerniereActivite ?? lead.updatedAt;
    const jours = joursDepuis(depuis, maintenant);
    candidats.push({
      cle: `lead:${lead.id}:ACTIVATION`,
      source: "ACTIVATION",
      taskId: null,
      leadId: lead.id,
      titre: "Démarrer l'activation",
      cible: lead.raisonSociale,
      pourquoi: `Signé depuis ${jours} jour${jours > 1 ? "s" : ""} et toujours sans cabinet ouvert.`,
      href: `/console/clients/${lead.id}`,
      urgence: BASE.ACTIVATION + Math.min(90, jours * 6),
      echeance: null,
      retardJours: jours,
    });
  }

  // ── 4. Essai qui expire ─────────────────────────────────────────────────
  for (const lead of essais) {
    if (enSourdine.has(lead.id)) continue;
    const fin = lead.cabinet?.stripeTrialEnd;
    if (!fin) continue;
    const joursRestants = Math.max(0, Math.ceil((fin.getTime() - maintenant.getTime()) / DAY_MS));
    candidats.push({
      cle: `lead:${lead.id}:ESSAI`,
      source: "ESSAI",
      taskId: null,
      leadId: lead.id,
      titre: joursRestants === 0 ? "Confirmer la bascule en abonnement" : "Préparer la fin d'essai",
      cible: lead.raisonSociale,
      pourquoi:
        joursRestants === 0
          ? "L'essai se termine aujourd'hui."
          : `L'essai se termine dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""}.`,
      href: `/console/clients/${lead.id}`,
      urgence: BASE.ESSAI + (7 - Math.min(7, joursRestants)) * 12,
      echeance: fin,
      retardJours: 0,
    });
  }

  // ── 5. Audit complété sans suite ────────────────────────────────────────
  for (const lead of auditsSansSuite) {
    if (enSourdine.has(lead.id)) continue;
    const depuis = lead.dateDerniereActivite ?? lead.updatedAt;
    const jours = joursDepuis(depuis, maintenant);
    candidats.push({
      cle: `lead:${lead.id}:AUDIT`,
      source: "AUDIT",
      taskId: null,
      leadId: lead.id,
      titre: "Présenter les résultats de l'audit",
      cible: lead.raisonSociale,
      pourquoi: `Audit complété, aucune suite depuis ${jours} jour${jours > 1 ? "s" : ""}. C'est le moment le plus chaud du funnel.`,
      href: `/console/clients/${lead.id}`,
      urgence: BASE.AUDIT + Math.min(80, jours * 5),
      echeance: null,
      retardJours: jours,
    });
  }

  // ── 6. Lead chaud qui refroidit ─────────────────────────────────────────
  for (const lead of leadsChauds) {
    if (enSourdine.has(lead.id)) continue;
    const depuis = lead.dateDerniereActivite ?? lead.createdAt;
    const jours = joursDepuis(depuis, maintenant);
    candidats.push({
      cle: `lead:${lead.id}:REFROIDISSEMENT`,
      source: "REFROIDISSEMENT",
      taskId: null,
      leadId: lead.id,
      titre: "Relancer la conversation",
      cible: lead.raisonSociale,
      pourquoi: `Score ${lead.score}/100, silence depuis ${jours} jour${jours > 1 ? "s" : ""}.`,
      href: `/console/clients/${lead.id}`,
      urgence: BASE.REFROIDISSEMENT + Math.min(60, jours * 3) + Math.round(lead.score / 3),
      echeance: null,
      retardJours: jours,
    });
  }

  // ── 7. Filet : ne jamais afficher une tour de contrôle vide ─────────────
  for (const lead of jamaisContactes) {
    if (enSourdine.has(lead.id)) continue;
    candidats.push({
      cle: `lead:${lead.id}:PREMIER_CONTACT`,
      source: "PREMIER_CONTACT",
      taskId: null,
      leadId: lead.id,
      titre: "Ouvrir la conversation",
      cible: lead.raisonSociale,
      pourquoi: `Meilleur score non approché (${lead.score}/100)${lead.ville ? `, ${lead.ville}` : ""}.`,
      href: `/console/clients/${lead.id}`,
      urgence: BASE.PREMIER_CONTACT + Math.round(lead.score / 2),
      echeance: null,
      retardJours: 0,
    });
  }

  // Un lead ne doit apparaître qu'une fois : on garde sa raison la plus urgente.
  const parLead = new Map<string, ActionCle>();
  const sansLead: ActionCle[] = [];
  for (const c of candidats) {
    if (!c.leadId) {
      sansLead.push(c);
      continue;
    }
    const existant = parLead.get(c.leadId);
    if (!existant || c.urgence > existant.urgence) parLead.set(c.leadId, c);
  }

  return [...parLead.values(), ...sansLead]
    .sort((a, b) => b.urgence - a.urgence || a.cle.localeCompare(b.cle))
    .slice(0, limite);
}
