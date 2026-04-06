import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import { getToken } from "next-auth/jwt";
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";

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

  if (isProtectedPath(req.nextUrl.pathname)) {
    const res = await authMiddleware(req as NextRequestWithAuth, event);
    if (res) {
      return cleared ? attachSessionCookieDeletes(res) : res;
    }
    return cleared
      ? attachSessionCookieDeletes(NextResponse.next({ request: { headers: req.headers } }))
      : NextResponse.next();
  }

  if (cleared) {
    return attachSessionCookieDeletes(NextResponse.next({ request: { headers: req.headers } }));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
