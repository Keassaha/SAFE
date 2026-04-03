"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

/**
 * Session toujours définie côté client : `undefined` ferait croire à NextAuth qu’aucune session serveur
 * n’a été fournie (`hasInitialSession === false`) et déclencherait un fetch /api/auth/session.
 */
export function SessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null | undefined;
}) {
  const stableSession = session === undefined || session === null ? null : session;

  return (
    <NextAuthSessionProvider
      basePath="/api/auth"
      session={stableSession}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
