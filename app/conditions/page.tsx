import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — SAFE",
  description: "Conditions d'utilisation de la plateforme SAFE.",
};

export default function ConditionsPage() {
  return (
    <>
      <Navbar />
      <main className="section-morning min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <h1 className="font-sans text-3xl sm:text-4xl font-bold text-[var(--safe-darkest)] mb-2 tracking-tight">
            Conditions d&apos;utilisation
          </h1>
          <p className="text-sm text-[var(--safe-text-muted)] font-sans mb-10">
            Dernière mise à jour : 11 avril 2026
          </p>

          <div className="prose prose-neutral max-w-none font-sans text-[var(--safe-dark)] leading-relaxed space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptation des conditions</h2>
              <p>
                En accédant à la plateforme SAFE ou en l&apos;utilisant, vous acceptez d&apos;être lié par les présentes conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser la plateforme. L&apos;utilisation de SAFE est réservée aux professionnels du droit dûment autorisés à exercer au Canada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description du service</h2>
              <p>
                SAFE est une plateforme de gestion administrative pour cabinets d&apos;avocats. Elle offre des fonctionnalités de facturation, de gestion des comptes en fidéicommis, de suivi de conformité réglementaire et d&apos;outils de productivité. SAFE est un outil administratif et ne fournit aucun conseil juridique.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Comptes et responsabilités</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion.</li>
                <li>Vous devez fournir des informations exactes et les maintenir à jour.</li>
                <li>Vous êtes responsable de toute activité effectuée sous votre compte.</li>
                <li>Vous devez signaler immédiatement tout accès non autorisé à votre compte.</li>
                <li>Un compte ne peut être partagé entre plusieurs cabinets distincts.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Obligations de conformité</h2>
              <p>
                SAFE fournit des outils pour faciliter la conformité au Règlement sur la comptabilité et les normes d&apos;exercice professionnel des avocats (B-1 r.5) et aux obligations équivalentes dans les autres provinces. Cependant :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>La responsabilité ultime de la conformité réglementaire incombe à l&apos;avocat utilisateur.</li>
                <li>SAFE ne se substitue pas à l&apos;obligation de l&apos;avocat de vérifier l&apos;exactitude de ses registres.</li>
                <li>Les rapports générés par SAFE sont des outils d&apos;aide et ne constituent pas une garantie de conformité.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Propriété des données</h2>
              <p>
                Vous conservez l&apos;entière propriété de toutes les données que vous saisissez dans SAFE. Nous ne revendiquons aucun droit de propriété sur vos données. À la résiliation de votre compte, vous pouvez exporter l&apos;ensemble de vos données dans un format structuré pendant une période de 90 jours.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Propriété intellectuelle</h2>
              <p>
                La plateforme SAFE, incluant son code source, son design, ses marques de commerce et sa documentation, est protégée par les lois canadiennes sur la propriété intellectuelle et les traités internationaux. Toute reproduction, distribution ou utilisation non autorisée est strictement interdite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Tarification et paiement</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les frais d&apos;abonnement sont facturés mensuellement ou annuellement selon le plan choisi.</li>
                <li>Les prix sont en dollars canadiens (CAD) et n&apos;incluent pas les taxes applicables (TPS/TVQ).</li>
                <li>Nous nous réservons le droit de modifier les tarifs avec un préavis de 30 jours.</li>
                <li>Les tarifs fondateurs sont verrouillés pour la durée de l&apos;abonnement actif.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Résiliation</h2>
              <p>
                Vous pouvez résilier votre abonnement à tout moment. La résiliation prend effet à la fin de la période de facturation en cours. Garantie de remboursement de 30 jours pour les nouveaux abonnements. Après résiliation, vos données restent accessibles en lecture seule pendant 90 jours pour permettre l&apos;exportation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation de responsabilité</h2>
              <p>
                Dans les limites permises par la loi applicable, SAFE ne pourra être tenu responsable de tout dommage indirect, accessoire, spécial ou consécutif résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser la plateforme. Notre responsabilité totale est limitée au montant des frais d&apos;abonnement payés au cours des 12 mois précédant la réclamation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Disponibilité du service</h2>
              <p>
                Nous nous efforçons de maintenir une disponibilité de 99,9%. Des interruptions planifiées pour maintenance seront communiquées au moins 48 heures à l&apos;avance. SAFE n&apos;est pas responsable des interruptions causées par des circonstances hors de notre contrôle.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Droit applicable et juridiction</h2>
              <p>
                Les présentes conditions sont régies par les lois de la province de Québec et les lois fédérales du Canada qui s&apos;y appliquent. Tout litige sera soumis aux tribunaux compétents du district judiciaire de Montréal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Modifications</h2>
              <p>
                Nous nous réservons le droit de modifier ces conditions. Toute modification substantielle sera communiquée par courriel au moins 30 jours avant son entrée en vigueur. L&apos;utilisation continue de la plateforme après l&apos;entrée en vigueur des modifications constitue une acceptation de celles-ci.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
              <p>
                Pour toute question relative aux présentes conditions, contactez-nous à <a href="mailto:jeremie@safecabinet.ca" className="text-[var(--safe-accent)] underline">jeremie@safecabinet.ca</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
