import { createHmac, timingSafeEqual } from "crypto";

/**
 * Lien de désabonnement des courriels CRM.
 *
 * La LCAP (loi canadienne anti-pourriel) impose que tout message électronique
 * commercial identifie clairement l'expéditeur et offre un mécanisme d'exclusion
 * simple, fonctionnel pendant au moins soixante jours et traité en dix jours
 * ouvrables. Le lien signé ci-dessous est ce mécanisme.
 *
 * Signature HMAC plutôt qu'identifiant nu : sans elle, n'importe qui pourrait
 * désabonner n'importe quel contact en devinant un identifiant.
 */

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!s) {
    throw new Error(
      "NEXTAUTH_SECRET manquant : impossible de signer les liens de désabonnement.",
    );
  }
  return s;
}

export function signerContact(contactId: string): string {
  return createHmac("sha256", secret())
    .update(`desabonnement:${contactId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifierSignature(contactId: string, signature: string): boolean {
  const attendue = signerContact(contactId);
  if (signature.length !== attendue.length) return false;
  return timingSafeEqual(Buffer.from(attendue), Buffer.from(signature));
}

export function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "https://safecabinet.ca"
  ).replace(/\/$/, "");
}

export function lienDesabonnement(contactId: string): string {
  return `${baseUrl()}/desabonnement?c=${encodeURIComponent(contactId)}&s=${signerContact(contactId)}`;
}
