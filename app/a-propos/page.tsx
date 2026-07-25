import PublicAboutPage from "@/components/public-site/AboutPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "À propos",
  description:
    "SAFE a été créé à partir du travail réel d’un cabinet et des vérifications qui demandaient trop de reprises manuelles.",
  path: "/a-propos",
});

export default function AProposPage() {
  return <PublicAboutPage />;
}
