import { buildMetadata } from "@/lib/seo";

// Page /contact client : SEO porté par ce layout serveur.
export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Une question sur SAFE ? Contactez l'équipe. Logiciel de gestion pour petits cabinets d'avocats du Québec.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
