import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/connexion" },
});

export const config = {
  matcher: [
    "/tableau-de-bord/:path*",
    "/clients/:path*",
    "/dossiers/:path*",
    "/temps/:path*",
    "/facturation/:path*",
    "/comptes/:path*",
    "/rapports/:path*",
    "/parametres/:path*",
  ],
};
