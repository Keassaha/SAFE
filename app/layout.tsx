import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getServerSession } from "next-auth";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { StarsBackground } from "@/components/marketing/StarsBackground";
import { authOptions } from "@/lib/auth";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
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
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-sans bg-[var(--safe-darkest)] text-[var(--safe-white)]">
        <StarsBackground />
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
