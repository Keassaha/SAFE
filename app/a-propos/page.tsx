import PublicAboutPage from "@/components/public-site/AboutPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "À propos",
  description:
    "SAFE est né d’un problème administratif observé dans un cabinet : d’un fichier Excel à SAFE Cabinet, puis à une suite d’outils. L’origine, la vision et la méthode.",
  path: "/a-propos",
});

export default function AProposPage() {
  return <PublicAboutPage />;
}
