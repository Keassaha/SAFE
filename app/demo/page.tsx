import PublicDemoPage from "@/components/public-site/DemoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Démo et contact",
  description:
    "En 20 minutes, regardons votre façon de tenir vos dossiers, votre temps et votre fidéicommis.",
  path: "/demo",
});

export default function DemoPage() {
  return <PublicDemoPage />;
}
