import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* ── Performance ── */
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  /* ── Images ── */
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  /* ── Headers — Cache + Security ── */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  /* ── Redirects ── */
  async redirects() {
    return [
      { source: "/journal/general", destination: "/comptabilite?tab=general", permanent: true },
      { source: "/journal/depenses", destination: "/comptabilite?tab=depenses", permanent: true },
    ];
  },

  /* ── Experimental: optimize package imports ── */
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "sonner",
      "d3-scale",
      "d3-shape",
      "d3-array",
    ],
  },
};

export default withNextIntl(nextConfig);
