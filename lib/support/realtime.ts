import "server-only";

/**
 * Diffusion temps réel du support via Supabase Realtime (Broadcast).
 *
 * PRINCIPE DE CONFIDENTIALITÉ : on ne diffuse JAMAIS le contenu d'un message sur
 * le canal Realtime (canaux publics). On envoie seulement un signal opaque
 * { conversationId, side } ; le destinataire recharge ensuite le contenu via une
 * action serveur authentifiée. Un écouteur du canal n'obtient qu'un identifiant,
 * sans texte ni pièce jointe (obligation de secret professionnel du Barreau).
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supportChannels = {
  cabinet: (cabinetId: string) => `support:cabinet:${cabinetId}`,
  console: () => "support:console",
};

export type SupportSignal = {
  conversationId: string;
  side: "client" | "safe";
};

/**
 * Envoie un signal (fire-and-forget) sur un ou plusieurs canaux. Un échec de
 * diffusion ne doit jamais faire échouer l'envoi du message lui-même.
 */
export async function broadcastSupport(
  topics: string[],
  payload: SupportSignal,
): Promise<void> {
  if (!URL || !KEY || topics.length === 0) return;
  try {
    await fetch(`${URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        messages: topics.map((topic) => ({ topic, event: "support", payload })),
      }),
    });
  } catch (err) {
    console.error("broadcastSupport", err);
  }
}
