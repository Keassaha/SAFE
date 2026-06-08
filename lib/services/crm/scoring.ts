import { prisma } from "@/lib/db";
import { computeFirmographicScore } from "@/lib/validations/crm-lead";

/**
 * Service de scoring CRM — recalcule les 3 dimensions du score d'un Lead.
 *
 * Firmographique (0-40)  : profil cabinet (province, taille, fidéicommis, domaine)
 * Engagement (0-40)      : interactions (activités inbound, LinkedIn, lead magnets, meetings)
 * Enrichissement (0-20)  : qualité des données (emails valides, LinkedIn, logiciel connu)
 *
 * Total = somme des trois (max 100).
 */
export async function recomputeLeadScore(leadId: string): Promise<{
  firmographique: number;
  engagement: number;
  enrichissement: number;
  total: number;
} | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      activities: { select: { type: true, direction: true } },
      contacts: { select: { emailStatut: true, linkedinUrl: true } },
      linkedInEngagements: { select: { id: true } },
      leadMagnetConsumptions: { select: { id: true } },
    },
  });

  if (!lead) return null;

  // --- Firmographique (0-40) ---
  const firmographique = computeFirmographicScore({
    province: lead.province,
    tailleCabinet: lead.tailleCabinet,
    aTrustAccounting: lead.aTrustAccounting,
    domainesPratique: lead.domainesPratique,
  });

  // --- Engagement (0-40) ---
  let engagement = 0;
  const hasInbound = lead.activities.some((a) => a.direction === "INBOUND");
  if (hasInbound) engagement += 15;
  if (lead.linkedInEngagements.length >= 3) engagement += 10;
  if (lead.leadMagnetConsumptions.length >= 1) engagement += 10;
  const hasMeetingOrDemo = lead.activities.some(
    (a) => a.type === "MEETING" || a.type === "DEMO",
  );
  if (hasMeetingOrDemo) engagement += 5;
  engagement = Math.min(40, engagement);

  // --- Enrichissement (0-20) ---
  let enrichissement = 0;
  const hasValidEmail = lead.contacts.some((c) => c.emailStatut === "VALIDE");
  if (hasValidEmail) enrichissement += 10;
  const hasLinkedin = lead.contacts.some((c) => !!c.linkedinUrl);
  if (hasLinkedin) enrichissement += 5;
  if (lead.logicielActuel) enrichissement += 5;
  enrichissement = Math.min(20, enrichissement);

  const total = firmographique + engagement + enrichissement;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      scoreFirmographique: firmographique,
      scoreEngagement: engagement,
      scoreEnrichissement: enrichissement,
      score: total,
    },
  });

  return { firmographique, engagement, enrichissement, total };
}
