import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getServerSession } from "next-auth";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { authOptions } from "@/lib/auth";
import { Toaster } from "sonner";
import "./globals.css";

/** Cookies + session : pas de mise en cache statique du layout racine. */
export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  axes: ["opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

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
      className={`${inter.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-screen font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider session={session ?? null}>{children}</SessionProvider>
          <Toaster richColors position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
