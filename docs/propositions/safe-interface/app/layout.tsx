import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "SAFE",
  description:
    "Système Automatisé de Facturation et d'Exploitation. Facturation, fidéicommis et conformité pour les cabinets juridiques.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
