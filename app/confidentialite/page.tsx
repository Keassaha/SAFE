import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — SAFE",
  description:
    "Politique de confidentialité de SAFE Inc., conforme à la Loi 25 (Québec) et à la LPRPDE (Canada). Distinction entre site public et plateforme, sous-traitants nommés, droits des personnes, procédure d'incident.",
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
            Dernière mise à jour : 28 avril 2026
          </p>

          <div className="prose prose-neutral max-w-none font-sans text-[var(--safe-dark)] leading-relaxed space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Entité responsable et portée du document</h2>
              <p>
                La présente politique est publiée par <strong>SAFE Cabinet inc.</strong> (« SAFE », « nous »), société
                constituée au Québec, dont le siège est à Montréal. Elle décrit la manière dont nous traitons les
                renseignements personnels dans le cadre&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>du site public</strong> <code>safecabinet.ca</code> (formulaires de contact, demande d&apos;audit
                  gratuit, prise de rendez-vous, infolettres, navigation) — pour ces traitements, SAFE agit comme
                  <strong> responsable du traitement</strong> au sens de la Loi 25&nbsp;;
                </li>
                <li>
                  <strong>de la plateforme SAFE</strong> (espace de travail réservé aux cabinets clients : dossiers,
                  comptabilité, fidéicommis, facturation, documents) — pour ces traitements, le cabinet client est
                  <strong> responsable du traitement</strong> et SAFE agit comme <strong>prestataire de services</strong>
                  {" "}au sens de l&apos;article 18.3 de la Loi sur la protection des renseignements personnels dans le
                  secteur privé. Les engagements de SAFE en cette qualité sont encadrés par notre entente d&apos;abonnement.
                </li>
              </ul>
              <p className="mt-3">
                Les obligations applicables sont&nbsp;: la <strong>Loi 25</strong> (Québec, RLRQ c. P-39.1), la
                <strong> LPRPDE</strong> (Canada), et le <strong>RGPD</strong> lorsque l&apos;utilisateur est situé dans
                l&apos;Espace économique européen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Renseignements collectés sur le site public</h2>
              <p>Lorsque vous interagissez avec safecabinet.ca, nous pouvons recueillir&nbsp;:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>Coordonnées professionnelles</strong> : nom, prénom, courriel, numéro de téléphone, nom du
                  cabinet, nombre d&apos;avocats, province d&apos;exercice — soumis volontairement via les formulaires de
                  contact, d&apos;audit gratuit et d&apos;onboarding.
                </li>
                <li>
                  <strong>Réponses au questionnaire d&apos;audit</strong> : volumétrie, outils utilisés, douleurs
                  opérationnelles. Ces renseignements sont stockés afin de produire le rapport personnalisé qui vous est
                  retourné.
                </li>
                <li>
                  <strong>Données techniques</strong> : adresse IP, type de navigateur, pages consultées, horodatage,
                  référents. Ces données sont collectées via les journaux d&apos;hébergement et, le cas échéant, des
                  outils d&apos;analyse de trafic en mode anonymisé.
                </li>
              </ul>
              <p className="mt-3">
                <strong>Bases juridiques</strong> : votre consentement (formulaires) et notre intérêt légitime à assurer
                la sécurité, la performance et le suivi commercial du site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Renseignements traités dans la plateforme SAFE</h2>
              <p>
                Lorsqu&apos;un cabinet client utilise la plateforme, SAFE héberge et traite, pour son compte, les
                renseignements qu&apos;il y dépose&nbsp;: identité des avocats et du personnel, identité et coordonnées
                des clients du cabinet, contenu des dossiers, écritures comptables, mouvements de fidéicommis, factures,
                documents joints, journaux d&apos;activité.
              </p>
              <p className="mt-3">
                <strong>Le cabinet demeure le responsable du traitement</strong> de ces renseignements&nbsp;: il
                détermine ce qu&apos;il dépose dans la plateforme, qui y a accès, combien de temps il conserve les
                données et comment il répond aux demandes des personnes concernées (ses propres clients).
              </p>
              <p className="mt-3">
                <strong>SAFE</strong> agit comme prestataire de services. Nous nous engageons contractuellement à&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>n&apos;utiliser ces renseignements que pour exécuter le service convenu&nbsp;;</li>
                <li>ne pas les communiquer à des tiers sans instruction du cabinet ou obligation légale&nbsp;;</li>
                <li>appliquer des mesures de sécurité raisonnables (voir section&nbsp;6)&nbsp;;</li>
                <li>aviser le cabinet en cas d&apos;incident de confidentialité affectant ses données.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Finalités du traitement</h2>
              <p>Les renseignements sont utilisés pour&nbsp;:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>fournir, maintenir et améliorer la plateforme et le service client&nbsp;;</li>
                <li>répondre aux demandes de contact, de démonstration et d&apos;audit&nbsp;;</li>
                <li>
                  produire les outils de conformité au <strong>Règlement sur la comptabilité et les normes
                  d&apos;exercice professionnel des avocats</strong> (B-1 r.5, Québec) et aux obligations équivalentes
                  dans les autres provinces canadiennes&nbsp;;
                </li>
                <li>facturer l&apos;abonnement et tenir notre propre comptabilité&nbsp;;</li>
                <li>assurer la sécurité, prévenir les fraudes, détecter les abus&nbsp;;</li>
                <li>respecter nos obligations légales, fiscales et réglementaires.</li>
              </ul>
              <p className="mt-3">
                Nous n&apos;utilisons pas vos renseignements ni ceux de vos clients à des fins de profilage automatisé,
                de revente, ni d&apos;entraînement de modèles d&apos;intelligence artificielle au bénéfice de tiers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Sous-traitants et destinataires</h2>
              <p>
                Pour fournir le service, nous faisons appel à un nombre limité de sous-traitants spécialisés. Chacun est
                lié par un contrat conforme à la Loi 25 et n&apos;agit qu&apos;à notre instruction&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Hébergement applicatif</strong> : Vercel Inc. — exécution du site et de l&apos;application.</li>
                <li>
                  <strong>Base de données et authentification</strong> : Supabase — région d&apos;hébergement
                  configurée au Canada.
                </li>
                <li>
                  <strong>Paiements</strong> : Stripe Payments Canada Ltd. — traitement certifié PCI-DSS&nbsp;; SAFE
                  ne stocke aucun numéro de carte.
                </li>
                <li><strong>Courriel transactionnel</strong> : Resend — expédition des courriels de service.</li>
              </ul>
              <p className="mt-3">
                La liste à jour des sous-traitants peut être obtenue sur demande à l&apos;adresse indiquée à la
                section&nbsp;11. Tout ajout ou changement substantiel sera communiqué aux cabinets clients avant son
                entrée en vigueur, leur permettant de s&apos;y opposer dans les conditions prévues à l&apos;entente
                d&apos;abonnement.
              </p>
              <p className="mt-3">
                Hors sous-traitants, vos renseignements ne sont communiqués à des tiers qu&apos;en réponse à une
                obligation légale (ordonnance, demande d&apos;une autorité compétente) ou pour défendre nos droits.
                <strong> SAFE ne vend ni ne loue les renseignements personnels.</strong>
              </p>
            </section>

            <section id="securite" className="scroll-mt-32">
              <h2 className="text-xl font-semibold mb-3">6. Localisation et sécurité des données</h2>
              <p>
                Les données de la plateforme sont hébergées sur une infrastructure cloud située <strong>au
                Canada</strong>. Certains sous-traitants peuvent occasionnellement traiter des données techniques
                (journaux, télémétrie, courriel) hors Canada&nbsp;; dans ce cas, nous nous assurons d&apos;un niveau de
                protection comparable au sens de l&apos;article 17 de la Loi 25.
              </p>
              <p className="mt-3">Mesures de sécurité en place&nbsp;:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>chiffrement <strong>TLS&nbsp;1.2+</strong> en transit et <strong>AES-256</strong> au repos&nbsp;;</li>
                <li>cloisonnement multi-cabinet par identifiant&nbsp;: chaque requête applicative est filtrée par <code>cabinetId</code>&nbsp;;</li>
                <li>authentification forte&nbsp;; mots de passe hachés (jamais stockés en clair)&nbsp;;</li>
                <li>journal d&apos;audit applicatif (modèle <code>AuditLog</code>)&nbsp;: accès, créations, modifications, suppressions&nbsp;;</li>
                <li>sauvegardes chiffrées avec rétention de 30 jours&nbsp;;</li>
                <li>contrôle d&apos;accès basé sur les rôles (<em>admin de cabinet, avocat, assistante, comptabilité</em>)&nbsp;;</li>
                <li>revues de sécurité périodiques et tests de restauration.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Durées de conservation</h2>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>Données de la plateforme</strong> : pendant toute la durée de l&apos;abonnement, puis 90 jours
                  pour permettre l&apos;export par le cabinet, puis suppression — sauf obligation légale plus longue
                  applicable au cabinet (notamment l&apos;obligation de conservation comptable et les obligations du
                  Barreau du Québec).
                </li>
                <li>
                  <strong>Renseignements collectés via le site public</strong> (formulaires, audit gratuit) : 24 mois à
                  compter du dernier contact, puis suppression ou anonymisation.
                </li>
                <li><strong>Journaux applicatifs et journaux d&apos;accès</strong> : 12 mois.</li>
                <li><strong>Sauvegardes</strong> : 30 jours.</li>
                <li>
                  <strong>Pièces comptables</strong> nous concernant (factures émises, justificatifs) : conservées
                  conformément aux délais fiscaux canadiens (généralement 7 ans).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Vos droits</h2>
              <p>Conformément à la Loi 25, vous disposez des droits suivants&nbsp;:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Droit d&apos;accès</strong> à vos renseignements personnels.</li>
                <li><strong>Droit de rectification</strong> des renseignements inexacts ou incomplets.</li>
                <li><strong>Droit à la cessation de la diffusion ou à la désindexation</strong> dans les cas prévus par la loi.</li>
                <li><strong>Droit à la portabilité</strong> dans un format technologique structuré et couramment utilisé.</li>
                <li><strong>Droit de retirer votre consentement</strong> à tout moment, sans effet rétroactif sur les traitements déjà effectués.</li>
                <li><strong>Droit d&apos;être informé</strong> de toute décision automatisée vous concernant — SAFE n&apos;en prend pas à votre sujet.</li>
              </ul>
              <p className="mt-3">
                <strong>Important</strong> — Si votre demande porte sur des renseignements que votre cabinet d&apos;avocats
                a saisis dans la plateforme à titre de responsable du traitement (par exemple, vos coordonnées en tant
                que client d&apos;un cabinet utilisateur de SAFE), vous devez vous adresser <strong>directement au
                cabinet concerné</strong>. SAFE relaiera la demande au cabinet si elle nous parvient.
              </p>
              <p className="mt-3">
                Pour les données dont SAFE est responsable (site public, abonnement), nous répondons dans un délai de
                <strong> 30 jours</strong> à compter de la réception d&apos;une demande complète et identifiée. Si vous
                estimez que votre demande n&apos;a pas été traitée correctement, vous pouvez saisir la
                <strong> Commission d&apos;accès à l&apos;information du Québec</strong> (<a href="https://www.cai.gouv.qc.ca" className="text-[var(--safe-accent)] underline">cai.gouv.qc.ca</a>) ou le
                <strong> Commissariat à la protection de la vie privée du Canada</strong> (<a href="https://www.priv.gc.ca" className="text-[var(--safe-accent)] underline">priv.gc.ca</a>).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Témoins (cookies) et technologies similaires</h2>
              <p>
                Le site public utilise un nombre limité de témoins&nbsp;: témoins strictement nécessaires (session,
                sécurité) qui ne requièrent pas de consentement, et, le cas échéant, témoins de mesure d&apos;audience
                en mode anonymisé. La plateforme authentifiée utilise des témoins de session indispensables au
                fonctionnement du service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Incidents de confidentialité</h2>
              <p>
                Conformément à l&apos;article 3.5 de la Loi 25, en cas d&apos;incident de confidentialité présentant un
                risque sérieux de préjudice, nous&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>prenons sans délai les mesures raisonnables pour en diminuer les risques&nbsp;;</li>
                <li>avisons la Commission d&apos;accès à l&apos;information du Québec et les personnes concernées&nbsp;;</li>
                <li>tenons un registre des incidents conformément à la loi.</li>
              </ul>
              <p className="mt-3">
                Lorsque l&apos;incident affecte les données d&apos;un cabinet client, nous l&apos;avisons sans délai
                déraisonnable et coopérons à l&apos;exécution de ses propres obligations envers ses clients.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Responsable de la protection des renseignements personnels</h2>
              <p>
                Conformément à la Loi 25, un responsable de la protection des renseignements personnels (RPRP) est
                désigné chez SAFE&nbsp;:
              </p>
              <p className="mt-3">
                <strong>Jérémie Tiahou</strong>, président<br />
                SAFE Cabinet inc.<br />
                Courriel&nbsp;:{" "}
                <a href="mailto:jeremie@safecabinet.ca" className="text-[var(--safe-accent)] underline">
                  jeremie@safecabinet.ca
                </a>
              </p>
              <p className="mt-3">
                Toute demande relative à la présente politique, à l&apos;exercice d&apos;un droit ou à un incident peut
                être adressée par courriel à cette adresse, en précisant la nature de la demande et un moyen
                d&apos;identification raisonnable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Modifications</h2>
              <p>
                Nous pouvons modifier cette politique pour refléter une évolution du service, du cadre légal ou de nos
                sous-traitants. Toute modification substantielle est communiquée aux cabinets clients par courriel au
                moins <strong>30 jours</strong> avant son entrée en vigueur. La version en ligne fait foi&nbsp;; la date
                de dernière mise à jour figure au sommet du présent document.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
