import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import { getToken } from "next-auth/jwt";
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { APERCU_DESIGN_PREFIXE, apercuDesignFerme } from "@/lib/apercu-design";

function isProtectedPath(pathname: string): boolean {
  const prefixes = [
    "/tableau-de-bord",
    "/clients",
    "/dossiers",
    "/temps",
    "/facturation",
    "/comptes",
    "/rapports",
    "/parametres",
    "/journal",
    "/comptabilite",
    "/employees",
    "/outils",
    "/gestion",
    "/import",
    "/conformite",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const authMiddleware = withAuth({
  pages: { signIn: "/connexion" },
});

function nextAuthSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
}

/**
 * Si un cookie de session NextAuth est présent mais indéchiffrable (ex. secret changé),
 * on retire le cookie de la requête et on demande au navigateur de le supprimer pour
 * éviter JWT_SESSION_ERROR à chaque rendu (notamment dans le layout racine).
 */
async function stripUnreadableSessionCookie(request: NextRequest): Promise<{
  request: NextRequest;
  cleared: boolean;
}> {
  const secret = nextAuthSecret();
  const plain = request.cookies.get("next-auth.session-token");
  const secure = request.cookies.get("__Secure-next-auth.session-token");
  const hasCookie = Boolean(plain?.value || secure?.value);
  if (!hasCookie || !secret) {
    return { request, cleared: false };
  }

  const token = await getToken({ req: request, secret });
  if (token) {
    return { request, cleared: false };
  }

  const headers = new Headers(request.headers);
  const cookieHeader = headers.get("cookie") ?? "";
  const parts = cookieHeader.split(";").map((c) => c.trim()).filter(Boolean);
  const filtered = parts.filter((c) => {
    const name = c.split("=")[0]?.trim();
    return name !== "next-auth.session-token" && name !== "__Secure-next-auth.session-token";
  });
  if (filtered.length > 0) {
    headers.set("cookie", filtered.join("; "));
  } else {
    headers.delete("cookie");
  }

  return { request: new NextRequest(request.url, { headers }), cleared: true };
}

function attachSessionCookieDeletes(res: NextResponse | Response): NextResponse | Response {
  if (res instanceof NextResponse) {
    res.cookies.delete("next-auth.session-token");
    res.cookies.delete("__Secure-next-auth.session-token");
  }
  return res;
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { request: req, cleared } = await stripUnreadableSessionCookie(request);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);

  /**
   * Les contrôles visuels `/ds-preview` n'existent pas en production.
   *
   * Ce sont des pages sans authentification qui rendent des composants réels
   * sur des données inventées ; elles étaient servies publiquement. On répond
   * 404 avant tout rendu, donc la route est indiscernable d'une route absente.
   * Le layout du dossier reprend la même règle : voir `lib/apercu-design.ts`.
   */
  if (
    apercuDesignFerme() &&
    (req.nextUrl.pathname === APERCU_DESIGN_PREFIXE ||
      req.nextUrl.pathname.startsWith(`${APERCU_DESIGN_PREFIXE}/`))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  // Rediriger les utilisateurs connectés qui visitent /connexion ou /inscription vers le dashboard
  const authPages = ["/connexion", "/inscription"];
  if (authPages.includes(req.nextUrl.pathname)) {
    /**
     * Sauf si un layout protégé vient de nous renvoyer ici.
     *
     * Le rappel `jwt` révoque une session dont le compte a disparu (base
     * réinitialisée, employé désactivé, mot de passe réinitialisé), mais le
     * drapeau `revoked` ne redescend pas dans le cookie du navigateur. Ce
     * middleware ne lit que le jeton brut : il le trouve déchiffrable, croit
     * l'utilisateur connecté et le renvoie au tableau de bord, qui le renvoie
     * au formulaire. Boucle infinie, sans porte de sortie puisque le
     * formulaire lui-même rebondit.
     *
     * Le marqueur posé par le layout coupe la boucle et purge le cookie mort.
     */
    if (req.nextUrl.searchParams.get("session") === "expiree") {
      const res = NextResponse.next({ request: { headers: requestHeaders } });
      return attachSessionCookieDeletes(res);
    }
    const secret = nextAuthSecret();
    if (secret) {
      const token = await getToken({ req, secret });
      if (token) {
        return NextResponse.redirect(new URL("/tableau-de-bord", req.url));
      }
    }
  }

  if (isProtectedPath(req.nextUrl.pathname)) {
    const res = await authMiddleware(req as NextRequestWithAuth, event);
    if (res) {
      return cleared ? attachSessionCookieDeletes(res) : res;
    }
    return cleared
      ? attachSessionCookieDeletes(NextResponse.next({ request: { headers: requestHeaders } }))
      : NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (cleared) {
    return attachSessionCookieDeletes(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
