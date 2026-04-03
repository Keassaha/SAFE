import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Ne pas injecter NEXTAUTH_URL dans le bundle client via `env` : next-auth/react utilise
  // `basePath` (SessionProvider) + fetch relatif pour /session ; une URL figée peut diverger
  // de l’origine réelle (preview, autre port, tunnel) et provoquer des erreurs réseau.
  async redirects() {
    return [
      { source: "/journal/general", destination: "/comptabilite?tab=general", permanent: true },
      { source: "/journal/depenses", destination: "/comptabilite?tab=depenses", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
