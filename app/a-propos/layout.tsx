import { buildMetadata } from "@/lib/seo";

// La page /a-propos est un composant client, qui ne peut pas exporter de
// metadata. On porte donc le SEO via ce layout serveur.
export const metadata = buildMetadata({
  title: "À propos",
  description:
    "SAFE aide les petits cabinets d'avocats du Québec à gérer facturation, temps et comptabilité en fiducie. Découvrez notre mission.",
  path: "/a-propos",
});

export default function AProposLayout({ children }: { children: React.ReactNode }) {
  return children;
}
