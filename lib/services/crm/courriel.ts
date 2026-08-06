import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { recomputeLeadScore } from "@/lib/services/crm/scoring";
import { appliquerVariables, trouverGabarit, type VariablesGabarit } from "@/lib/crm/gabarits";
import { lienDesabonnement } from "@/lib/crm/desabonnement";

/**
 * Moteur de courriel du CRM SAFE Inc.
 *
 * Un envoi passe toujours par deux temps : on construit, on montre, puis
 * seulement on envoie. `construireCourriel` ne touche à rien et sert autant à
 * l'aperçu qu'à l'envoi, ce qui garantit que ce que vous relisez est exactement
 * ce qui partira.
 *
 * Trois refus durs, avant toute chose :
 *  - contact marqué `doNotContact` : on n'écrit pas, jamais, sans exception ;
 *  - adresse marquée `INVALIDE` : on n'abîme pas la réputation du domaine ;
 *  - adresse absente : rien à faire.
 */

/** Identification de l'expéditeur, exigée par la LCAP dans tout message
 *  électronique commercial. L'adresse postale doit être réelle. */
const ADRESSE_POSTALE = process.env.SAFE_INC_ADRESSE_POSTALE ?? "";
const EXPEDITEUR_NOM = "SAFE Inc.";

export type CourrielConstruit = {
  destinataire: string;
  destinataireNom: string;
  sujet: string;
  /** Corps en texte simple, tel qu'il sera relu et modifiable à l'écran. */
  corps: string;
  html: string;
};

export type BlocageEnvoi = { bloque: true; raison: string };

/** Vérifie qu'on a le droit et les moyens d'écrire à ce contact. */
export function verifierDestinataire(contact: {
  email: string | null;
  emailStatut: string;
  doNotContact: boolean;
}): BlocageEnvoi | null {
  if (contact.doNotContact) {
    return { bloque: true, raison: "Ce contact s'est désabonné. Aucun envoi possible." };
  }
  if (!contact.email) {
    return { bloque: true, raison: "Aucune adresse courriel sur ce contact." };
  }
  if (contact.emailStatut === "INVALIDE" || contact.emailStatut === "BOUNCE") {
    return { bloque: true, raison: "Adresse invalide ou déjà rejetée. Corrigez-la avant d'écrire." };
  }
  return null;
}

function echapper(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Rend le corps texte en HTML sobre : un paragraphe par bloc séparé d'une ligne vide. */
function corpsEnHtml(corps: string, contactId: string): string {
  const paragraphes = corps
    .split(/\n{2,}/)
    .map((p) => `<p style="margin: 0 0 16px; line-height: 1.6;">${echapper(p.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("");

  const identification = [
    EXPEDITEUR_NOM,
    ADRESSE_POSTALE,
    "safecabinet.ca",
  ]
    .filter(Boolean)
    .map(echapper)
    .join(" &middot; ");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; font-size: 15px;">
      ${paragraphes}
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 28px 0 12px;" />
      <p style="margin: 0 0 6px; font-size: 12px; color: #6b6b6b; line-height: 1.5;">
        ${identification}
      </p>
      <p style="margin: 0; font-size: 12px; color: #6b6b6b; line-height: 1.5;">
        Vous ne souhaitez plus recevoir de courriels de notre part ?
        <a href="${lienDesabonnement(contactId)}" style="color: #6b6b6b;">Se désabonner</a>.
      </p>
    </div>
  `.trim();
}

/**
 * Construit le courriel sans rien envoyer. Sert à l'aperçu comme à l'envoi.
 * `corpsPersonnalise` permet de partir du gabarit puis de le réécrire.
 */
export async function construireCourriel(input: {
  contactId: string;
  gabaritId?: string | null;
  sujetPersonnalise?: string | null;
  corpsPersonnalise?: string | null;
  expediteur: string;
}): Promise<CourrielConstruit | BlocageEnvoi> {
  const contact = await prisma.leadContact.findUnique({
    where: { id: input.contactId },
    select: {
      id: true,
      prenom: true,
      nom: true,
      email: true,
      emailStatut: true,
      doNotContact: true,
      lead: { select: { raisonSociale: true, ville: true } },
    },
  });
  if (!contact) return { bloque: true, raison: "Contact introuvable." };

  const blocage = verifierDestinataire(contact);
  if (blocage) return blocage;

  const vars: VariablesGabarit = {
    prenom: contact.prenom,
    cabinet: contact.lead?.raisonSociale ?? "votre cabinet",
    expediteur: input.expediteur,
    ville: contact.lead?.ville ?? undefined,
  };

  let sujet = input.sujetPersonnalise?.trim() ?? "";
  let corps = input.corpsPersonnalise?.trim() ?? "";

  if (!sujet || !corps) {
    const gabarit = input.gabaritId ? trouverGabarit(input.gabaritId) : null;
    if (!gabarit) return { bloque: true, raison: "Choisissez un gabarit ou écrivez le message." };
    if (!sujet) sujet = appliquerVariables(gabarit.sujet, vars);
    if (!corps) corps = appliquerVariables(gabarit.corps, vars);
  } else {
    sujet = appliquerVariables(sujet, vars);
    corps = appliquerVariables(corps, vars);
  }

  return {
    destinataire: contact.email!,
    destinataireNom: `${contact.prenom} ${contact.nom}`.trim(),
    sujet,
    corps,
    html: corpsEnHtml(corps, contact.id),
  };
}

/**
 * Envoie pour de vrai, puis journalise. La reconstruction est refaite ici à
 * partir des mêmes entrées : l'écran ne peut pas faire partir un contenu
 * différent de celui qu'il a montré, ni contourner les refus durs.
 */
export async function envoyerCourrielLead(input: {
  contactId: string;
  gabaritId?: string | null;
  sujetPersonnalise?: string | null;
  corpsPersonnalise?: string | null;
  expediteur: string;
  userId: string;
}): Promise<{ ok: true; sujet: string } | { ok: false; error: string }> {
  const construit = await construireCourriel(input);
  if ("bloque" in construit) return { ok: false, error: construit.raison };

  const contact = await prisma.leadContact.findUnique({
    where: { id: input.contactId },
    select: { id: true, leadId: true },
  });
  if (!contact) return { ok: false, error: "Contact introuvable." };

  await sendEmail({
    to: construit.destinataire,
    subject: construit.sujet,
    html: construit.html,
  });

  await prisma.activity.create({
    data: {
      leadId: contact.leadId,
      contactId: contact.id,
      type: "EMAIL_ENVOYE",
      direction: "OUTBOUND",
      sujet: construit.sujet,
      contenu: construit.corps,
      statutEmail: "ENVOYE",
      createdBy: input.userId,
    },
  });

  await prisma.lead.update({
    where: { id: contact.leadId },
    data: { dateDerniereActivite: new Date() },
  });

  await recomputeLeadScore(contact.leadId);

  return { ok: true, sujet: construit.sujet };
}
