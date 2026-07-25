"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupportSignal = { conversationId: string; side: "client" | "safe" };

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, { realtime: { params: { eventsPerSecond: 5 } } });
  return client;
}

export const supportChannels = {
  cabinet: (cabinetId: string) => `support:cabinet:${cabinetId}`,
  console: () => "support:console",
};

/**
 * S'abonne à un canal de support et appelle onSignal à chaque nouveau message.
 * Retourne une fonction de désabonnement (à utiliser dans le cleanup d'useEffect).
 */
export function subscribeSupport(topic: string, onSignal: (s: SupportSignal) => void): () => void {
  const c = getClient();
  if (!c) return () => {};
  const channel = c.channel(topic);
  channel
    .on("broadcast", { event: "support" }, (msg) => {
      onSignal(msg.payload as SupportSignal);
    })
    .subscribe();
  return () => {
    c.removeChannel(channel);
  };
}
