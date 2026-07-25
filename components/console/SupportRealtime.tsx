"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeSupport, supportChannels } from "@/lib/support/realtime-browser";

/**
 * Rafraîchit une page console (server component) en temps réel à chaque nouveau
 * message de support. Optionnellement filtré sur un fil précis.
 */
export function SupportRealtime({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  useEffect(() => {
    return subscribeSupport(supportChannels.console(), (sig) => {
      if (conversationId && sig.conversationId !== conversationId) return;
      router.refresh();
    });
  }, [router, conversationId]);
  return null;
}
