import { buildMetadata } from "@/lib/seo";

// Page /audit-gratuit client : SEO porté par ce layout serveur.
export const metadata = buildMetadata({
  title: "Audit gratuit",
  description:
    "Obtenez un audit gratuit de la gestion de votre cabinet : facturation, temps facturable, comptabilité en fiducie. Identifiez les pertes de revenus.",
  path: "/audit-gratuit",
});

export default function AuditGratuitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
