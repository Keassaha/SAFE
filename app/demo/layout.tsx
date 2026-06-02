import { buildMetadata } from "@/lib/seo";

// Page /demo client : SEO porté par ce layout serveur.
export const metadata = buildMetadata({
  title: "Démo",
  description:
    "Voyez SAFE en action : facturation, suivi du temps et comptabilité en fiducie pour petits cabinets d'avocats du Québec. Réservez une démo.",
  path: "/demo",
});

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
