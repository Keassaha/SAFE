"use client";

import { useEffect } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // #region agent log
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const href = typeof window !== "undefined" ? window.location.href : "";
    fetch("/api/auth/session")
      .then(async (res) => {
        const contentType = res.headers.get("content-type") ?? "";
        const body = await res.text();
        fetch('http://127.0.0.1:7625/ingest/04818075-f511-48cf-9bfe-b5154b454078',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'45748b'},body:JSON.stringify({sessionId:'45748b',runId:'run1',hypothesisId:'H1',location:'SessionProvider.tsx:fetch_ok',message:'Client fetch /api/auth/session OK',data:{origin,href,status:res.status,contentType,resUrl:res.url,bodyLen:body.length},timestamp:Date.now()})}).catch(()=>{});
      })
      .catch((e) => {
        fetch('http://127.0.0.1:7625/ingest/04818075-f511-48cf-9bfe-b5154b454078',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'45748b'},body:JSON.stringify({sessionId:'45748b',runId:'run1',hypothesisId:'H1',location:'SessionProvider.tsx:fetch_failed',message:'Client fetch /api/auth/session failed',data:{origin,href,errorName:e instanceof Error?e.name:'non-Error',errorMessage:e instanceof Error?e.message:String(e)},timestamp:Date.now()})}).catch(()=>{});
      });
    // #endregion
  }, []);

  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
