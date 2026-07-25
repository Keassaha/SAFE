import { buildMetadata } from "@/lib/seo";

// La route technique reste /audit-gratuit, le terme public est « diagnostic ».
export const metadata = buildMetadata({
  title: "Diagnostic gratuit",
  description:
    "Obtenez un diagnostic gratuit de la gestion de votre cabinet : facturation, temps facturable et fidéicommis.",
  path: "/audit-gratuit",
});

export default function AuditGratuitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
