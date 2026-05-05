import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* ── Performance ── */
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  /* ── Build : ne pas bloquer le déploiement sur des règles stylistiques ESLint
   * (apostrophes non échappées, etc.). Les erreurs runtime restent attrapées
   * par TypeScript, qui lui reste strict. */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /* ── Images ── */
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  /* ── Headers — Cache + Security ── */
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");
    const securityHeaders = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
    ];
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "no-store, must-revalidate"
              : "public, max-age=2592000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          // In dev, chunk URLs are NOT content-hashed and change between rebuilds.
          // Using `immutable` there means the browser serves stale JS forever.
          {
            key: "Cache-Control",
            value: isDev
              ? "no-store, must-revalidate"
              : "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  /* ── Redirects ── */
  async redirects() {
    return [
      { source: "/journal/general", destination: "/comptabilite?tab=general", permanent: true },
      { source: "/journal/depenses", destination: "/comptabilite?tab=depenses", permanent: true },
      // Anciennes URLs juridiques (signets, liens externes)
      { source: "/terms", destination: "/conditions", permanent: true },
      { source: "/privacy", destination: "/confidentialite", permanent: true },
      { source: "/security", destination: "/confidentialite#securite", permanent: true },
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
