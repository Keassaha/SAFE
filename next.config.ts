import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* ── Performance ── */
  compress: true,
  poweredByHeader: false,

  /* ── Images ── */
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },

  /* ── Experimental perf ── */
  experimental: {
    optimizeCss: true,
  },

  /* ── Redirects ── */
  async redirects() {
    return [
      { source: "/journal/general", destination: "/comptabilite?tab=general", permanent: true },
      { source: "/journal/depenses", destination: "/comptabilite?tab=depenses", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
