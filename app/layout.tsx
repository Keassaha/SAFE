import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Instrument_Serif } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getServerSession } from "next-auth";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";

import { authOptions } from "@/lib/auth";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { Toaster } from "sonner";
import "./globals.css";

/**
 * Instrument Serif — display éditorial italique (Rodrigo Fuenzalida).
 * Référence chez Hims, Thinking Machines, Phantom.
 * Pairing parfait avec Geist Sans pour le ton éditorial premium.
 */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  // metadataBase rend tous les liens (canonical, Open Graph) absolus.
  // Open Graph par défaut hérité par toutes les pages qui ne le redéfinissent pas.
  const base: Metadata = {
    metadataBase: new URL(SITE_URL),
    openGraph: {
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };

  if (locale === "en") {
    return {
      ...base,
      title: "SAFE — Automated Billing and Operations System",
      description: "Matter and time management for law firms",
      openGraph: { ...base.openGraph, locale: "en_CA" },
    };
  }

  return {
    ...base,
    title: "SAFE — Système Automatisé de Facturation et d'Exploitation",
    description: "Gestion des dossiers et des heures pour cabinets d'avocats",
    openGraph: { ...base.openGraph, locale: "fr_CA" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await getServerSession(authOptions);

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable}`}
      style={{
        "--font-inter": "var(--font-geist-sans)",
        "--font-jetbrains-loaded": "var(--font-geist-mono)",
      } as React.CSSProperties}
    >
      <body className="min-h-screen font-sans bg-slate-50 text-slate-800 antialiased selection:bg-forest-100 selection:text-forest-600">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider session={session ?? null}>
            <MotionProvider>{children}</MotionProvider>
          </SessionProvider>
          <Toaster richColors position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
