import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — SAFE",
  description: "Politique de confidentialité de SAFE, conforme à la Loi 25 du Québec.",
};

export default function ConfidentialitePage() {
  return (
    <>
      <Navbar />
      <main className="section-morning min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <h1 className="font-sans text-3xl sm:text-4xl font-bold text-[var(--safe-darkest)] mb-2 tracking-tight">
            Politique de confidentialité
          </h1>
          <p className="text-sm text-[var(--safe-text-muted)] font-sans mb-10">
            Dernière mise à jour : 11 avril 2026
          </p>

          <div className="prose prose-neutral max-w-none font-sans text-[var(--safe-dark)] leading-relaxed space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p>
                SAFE (&quot;nous&quot;, &quot;notre&quot;, &quot;la plateforme&quot;) s&apos;engage à protéger la vie privée de ses utilisateurs conformément à la Loi sur la protection des renseignements personnels dans le secteur privé (Loi 25, Québec), à la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE, Canada) et au Règlement général sur la protection des données (RGPD) lorsqu&apos;applicable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Renseignements collectés</h2>
              <p>Nous collectons les catégories de renseignements suivantes :</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Informations d&apos;identification :</strong> nom, prénom, adresse courriel, numéro de téléphone, nom du cabinet.</li>
                <li><strong>Informations professionnelles :</strong> numéro de membre du Barreau, province d&apos;exercice, spécialités.</li>
                <li><strong>Données d&apos;utilisation :</strong> journaux de connexion, adresse IP, type de navigateur, pages visitées.</li>
                <li><strong>Données financières :</strong> informations de facturation traitées par notre processeur de paiement certifié PCI-DSS (Stripe). Nous ne stockons aucun numéro de carte de crédit.</li>
                <li><strong>Données des dossiers :</strong> informations relatives aux mandats, fidéicommis et facturation saisies par l&apos;utilisateur dans la plateforme.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Finalités du traitement</h2>
              <p>Vos renseignements sont utilisés pour :</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Fournir, maintenir et améliorer les services SAFE.</li>
                <li>Assurer la conformité au Règlement B-1 r.5 du Barreau du Québec et aux obligations équivalentes en Ontario.</li>
                <li>Communiquer avec vous concernant votre compte, les mises à jour du service et le support technique.</li>
                <li>Respecter nos obligations légales et réglementaires.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Hébergement et sécurité des données</h2>
              <p>
                Toutes les données sont hébergées exclusivement au Canada, sur des serveurs situés à Montréal et Toronto. Les mesures de sécurité incluent :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Chiffrement AES-256 au repos et TLS 1.3 en transit.</li>
                <li>Sauvegardes automatiques quotidiennes avec rétention de 90 jours.</li>
                <li>Authentification multifacteur disponible pour tous les comptes.</li>
                <li>Journalisation complète des accès aux données sensibles.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Partage des renseignements</h2>
              <p>
                Nous ne vendons, ne louons et ne partageons aucun renseignement personnel à des tiers à des fins commerciales. Vos données peuvent être partagées uniquement avec :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Nos sous-traitants techniques (hébergement, paiement) liés par des ententes de confidentialité.</li>
                <li>Les autorités compétentes lorsque requis par la loi.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Conservation des données</h2>
              <p>
                Les renseignements personnels sont conservés aussi longtemps que votre compte est actif ou que nécessaire pour fournir les services. À la fermeture du compte, les données sont supprimées dans un délai de 90 jours, sauf obligation légale de conservation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Vos droits (Loi 25)</h2>
              <p>Conformément à la Loi 25, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos renseignements personnels.</li>
                <li><strong>Droit de rectification :</strong> corriger des renseignements inexacts ou incomplets.</li>
                <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données.</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et couramment utilisé.</li>
                <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment.</li>
              </ul>
              <p className="mt-3">
                Pour exercer ces droits, écrivez-nous à <a href="mailto:ptiahou@gmail.com" className="text-[var(--safe-accent)] underline">ptiahou@gmail.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Responsable de la protection des renseignements</h2>
              <p>
                Conformément à la Loi 25, un responsable de la protection des renseignements personnels a été désigné. Pour toute question relative à cette politique, contactez-nous à <a href="mailto:ptiahou@gmail.com" className="text-[var(--safe-accent)] underline">ptiahou@gmail.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Modifications</h2>
              <p>
                Nous nous réservons le droit de modifier cette politique à tout moment. Toute modification substantielle sera communiquée par courriel au moins 30 jours avant son entrée en vigueur.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
