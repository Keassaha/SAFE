import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { JackPortfolio } from "./JackPortfolio";

/* Kanit 300-900, chargée par next/font plutôt que par une balise <link> vers
   Google : la police est auto-hébergée au build, donc aucune requête tierce au
   chargement et aucun décalage de mise en page. */
const kanit = Kanit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "Jack — 3D Creator",
  description: "Portfolio de Jack, créateur 3D.",
  /* Cette page vit sur le domaine de SAFE, un logiciel juridique. Sans cette
     directive, un portfolio 3D se retrouverait indexé sous safecabinet.ca et
     brouillerait le référencement du produit. */
  robots: { index: false, follow: false },
};

export default function JackPage() {
  return (
    <div className={kanit.variable}>
      <JackPortfolio />
    </div>
  );
}
