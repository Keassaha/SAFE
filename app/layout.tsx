import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getServerSession } from "next-auth";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";

import { authOptions } from "@/lib/auth";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

/**
 * Fonts — local-first to keep builds reproducible.
 *
 * - Geist Sans / Mono are bundled through the `geist` package.
 * - The editorial serif is exposed as a CSS variable with a local fallback stack.
 */
const editorialSerifStack =
  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  if (locale === "en") {
    return {
      title: "SAFE — Automated Billing and Operations System",
      description: "Matter and time management for law firms",
    };
  }

  return {
    title: "SAFE — Système Automatisé de Facturation et d'Exploitation",
    description: "Gestion des dossiers et des heures pour cabinets d'avocats",
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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{ "--font-instrument-serif": editorialSerifStack } as React.CSSProperties}
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
