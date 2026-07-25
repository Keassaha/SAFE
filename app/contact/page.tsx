import PublicDemoPage from "@/components/public-site/DemoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Parlez-nous de votre cabinet et des vérifications qui prennent le plus de temps dans votre journée.",
  path: "/contact",
});

export default function ContactPage() {
  return <PublicDemoPage />;
}
