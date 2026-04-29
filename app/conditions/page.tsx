import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — SAFE",
  description:
    "Conditions générales d'utilisation et d'abonnement à la plateforme SAFE pour les cabinets d'avocats au Canada.",
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
            Dernière mise à jour : 28 avril 2026
          </p>

          <div className="prose prose-neutral max-w-none font-sans text-[var(--safe-dark)] leading-relaxed space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Parties et acceptation</h2>
              <p>
                Les présentes conditions générales d&apos;utilisation (les « <strong>Conditions</strong> ») s&apos;appliquent
                à l&apos;accès au site public <strong>safecabinet.ca</strong> et à l&apos;utilisation de la plateforme
                <strong> SAFE</strong> (la « <strong>Plateforme</strong> »), exploitées par <strong>SAFE Cabinet inc.</strong>,
                société constituée au Québec (« <strong>SAFE</strong> », « nous »).
              </p>
              <p className="mt-3">
                Le cabinet d&apos;avocats ou l&apos;organisme professionnel qui souscrit à la Plateforme est désigné
                comme le « <strong>Client</strong> ». Les utilisateurs autorisés par le Client (avocats, assistantes,
                comptabilité, administration) sont désignés comme les « <strong>Utilisateurs</strong> ».
              </p>
              <p className="mt-3">
                En créant un compte, en signant un bon de commande, en activant un abonnement ou en utilisant la
                Plateforme, le Client confirme avoir lu, compris et accepté ces Conditions, qui forment, avec le bon
                de commande applicable et la <a href="/confidentialite" className="text-[var(--safe-accent)] underline">politique de confidentialité</a>,
                l&apos;intégralité du contrat liant les parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Autorité de lier le cabinet</h2>
              <p>
                La personne qui accepte les présentes Conditions au nom du Client déclare disposer de
                l&apos;<strong>autorité requise</strong> pour engager juridiquement son cabinet. À défaut, elle ne doit
                pas accepter ces Conditions ni utiliser la Plateforme. Les obligations souscrites lient le Client et
                non personnellement la personne signataire, sauf engagement personnel exprès.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Description du service</h2>
              <p>
                SAFE est une plateforme infonuagique de gestion administrative pour cabinets d&apos;avocats. Elle
                comprend, dans des proportions susceptibles d&apos;évoluer&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>la gestion de dossiers, clients, échéances et documents&nbsp;;</li>
                <li>la facturation (brouillons, factures validées, paiements, paiements partiels, intérêts, relances)&nbsp;;</li>
                <li>la tenue d&apos;un compte en fidéicommis avec relevés mensuels en mode <em>append-only</em> (voir section&nbsp;7)&nbsp;;</li>
                <li>la tenue d&apos;un journal général comptable, également <em>append-only</em>&nbsp;;</li>
                <li>des outils d&apos;aide à la conformité réglementaire (B-1 r.5 au Québec, By-Laws de la LSO en Ontario, équivalents dans les autres provinces)&nbsp;;</li>
                <li>des fonctions assistées par <strong>intelligence artificielle</strong>, notamment la classification automatique de documents, fournies à titre de suggestion soumise à validation humaine.</li>
              </ul>
              <p className="mt-3">
                La Plateforme est fournie « telle qu&apos;elle est », dans l&apos;état où elle se trouve à la date
                d&apos;utilisation. Les fonctionnalités peuvent évoluer, être ajoutées, modifiées ou retirées sans
                qu&apos;une fonction donnée puisse être considérée comme un engagement contractuel permanent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. SAFE n&apos;est pas un service de conseil</h2>
              <p>
                SAFE est un <strong>outil technologique</strong>. <strong>SAFE ne fournit aucun conseil juridique,
                fiscal, comptable, déontologique ou réglementaire</strong>. Les libellés, modèles, suggestions de
                classement, alertes, signaux et rapports affichés sont des aides à la décision&nbsp;: leur
                interprétation, leur validation et leur application relèvent de l&apos;Utilisateur et, en dernier
                ressort, de l&apos;avocat responsable.
              </p>
              <p className="mt-3">
                Aucune décision produisant des effets juridiques significatifs au sens de l&apos;article 12.1 de la
                Loi 25 n&apos;est prise par la Plateforme à propos d&apos;une personne physique. Les
                fonctionnalités assistées par IA <strong>n&apos;exécutent pas d&apos;action automatisée</strong>{" "}
                sans validation par un Utilisateur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Éligibilité, comptes et rôles</h2>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  L&apos;utilisation de la Plateforme est réservée aux <strong>professionnels du droit</strong>{" "}
                  membres en règle d&apos;un barreau canadien, à leur cabinet et au personnel autorisé par celui-ci.
                </li>
                <li>
                  Les comptes sont <strong>nominatifs et personnels</strong>. Le partage d&apos;identifiants entre
                  plusieurs personnes physiques est interdit.
                </li>
                <li>
                  La Plateforme repose sur un système de rôles applicatifs (<em>administrateur du cabinet, avocat,
                  assistante juridique, comptabilité</em>) que le Client attribue, modifie et révoque sous sa propre
                  responsabilité.
                </li>
                <li>
                  Le Client est responsable de toute activité effectuée à partir de ses comptes et doit signaler sans
                  délai à <a href="mailto:jeremie@safecabinet.ca" className="text-[var(--safe-accent)] underline">jeremie@safecabinet.ca</a>{" "}
                  toute compromission soupçonnée.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Obligations du Client</h2>
              <p>Le Client demeure exclusivement responsable&nbsp;:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  de l&apos;<strong>exactitude</strong> et de la complétude des données saisies (identités, coordonnées,
                  écritures comptables, mouvements de fidéicommis, factures, libellés)&nbsp;;
                </li>
                <li>
                  de la <strong>supervision</strong> des accès, des rôles attribués et de l&apos;activité de ses
                  Utilisateurs&nbsp;;
                </li>
                <li>
                  de la <strong>validation humaine</strong> des sorties produites par la Plateforme avant tout dépôt
                  réglementaire, communication à un client final ou décision opérationnelle (factures envoyées,
                  relevés de fidéicommis, rapports, classifications de documents, suggestions IA)&nbsp;;
                </li>
                <li>
                  du respect de ses propres obligations envers ses clients&nbsp;: mandat, secret professionnel, conflits
                  d&apos;intérêts, devoir de compétence et de surveillance&nbsp;;
                </li>
                <li>
                  du respect des règles applicables à sa pratique (Code de déontologie, règlements et règles de
                  comptabilité de son barreau, obligations fiscales, obligations en matière de lutte au blanchiment).
                </li>
              </ul>
              <p className="mt-3">
                Les outils d&apos;aide à la conformité fournis par la Plateforme sont des <strong>aides
                opérationnelles</strong>, pas une garantie ni une attestation de conformité. La conformité ultime
                demeure une obligation professionnelle personnelle de l&apos;avocat.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Mode <em>append-only</em> de la comptabilité et du fidéicommis</h2>
              <p>
                Le journal général, le journal de fidéicommis et l&apos;historique de facturation fonctionnent en mode
                <strong> append-only</strong>&nbsp;: les écritures, transactions et factures validées ne peuvent être
                ni modifiées ni supprimées. Une correction prend la forme d&apos;une <strong>contre-écriture</strong>{" "}
                ou d&apos;une note de crédit datée et tracée, conservant l&apos;intégralité de l&apos;historique.
              </p>
              <p className="mt-3">
                Cette doctrine, alignée sur les attentes des barreaux et des vérificateurs, fait partie intégrante du
                service. Elle ne peut être désactivée à la demande du Client.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Usages interdits</h2>
              <p>Le Client et ses Utilisateurs s&apos;engagent à ne pas&nbsp;:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>contourner les contrôles d&apos;accès, le système de rôles ou le cloisonnement multi-cabinet&nbsp;;</li>
                <li>tenter de rétro-ingéniérer, décompiler ou copier la Plateforme, sauf dans la mesure où la loi l&apos;autorise impérativement&nbsp;;</li>
                <li>extraire massivement les données par des moyens automatisés non documentés (le Client peut en revanche exporter ses propres données via les fonctions prévues à cet effet)&nbsp;;</li>
                <li>déposer dans la Plateforme des contenus illicites, diffamatoires, contrefaits, frauduleux, ou des données qui ne sont pas raisonnablement nécessaires à l&apos;exécution d&apos;un mandat&nbsp;;</li>
                <li>utiliser la Plateforme pour blanchir des fonds, financer des activités illicites, ou contourner des obligations de vigilance et de signalement&nbsp;;</li>
                <li>se servir de la Plateforme dans le but de proposer un service concurrent à SAFE.</li>
              </ul>
              <p className="mt-3">
                Le Client est responsable des contenus qu&apos;il dépose dans la Plateforme. SAFE n&apos;exerce
                aucune surveillance éditoriale active mais peut, sur signalement crédible ou décision d&apos;une
                autorité, restreindre l&apos;accès à un contenu manifestement illicite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Propriété et utilisation des données du Client</h2>
              <p>
                Le Client conserve la <strong>pleine propriété</strong> des données qu&apos;il dépose dans la
                Plateforme (dossiers, écritures, transactions, factures, documents, registres). SAFE ne revendique
                aucun droit de propriété sur ces données et ne les commercialise pas.
              </p>
              <p className="mt-3">
                SAFE traite ces données <strong>exclusivement</strong> pour fournir, sécuriser, maintenir et améliorer
                le service au profit du Client, dans les conditions précisées par la <a href="/confidentialite" className="text-[var(--safe-accent)] underline">politique de confidentialité</a>.
              </p>
              <p className="mt-3">
                <strong>Données du Client et IA</strong>&nbsp;: les données du Client ne sont pas utilisées pour
                entraîner des modèles d&apos;intelligence artificielle généralistes au bénéfice de tiers. Lorsque la
                Plateforme appelle un modèle tiers (par exemple pour la classification de documents), seules les
                données strictement nécessaires sont transmises, dans les conditions des fournisseurs concernés.
              </p>
              <p className="mt-3">
                À la résiliation, le Client dispose d&apos;une période de <strong>quatre-vingt-dix (90) jours</strong>{" "}
                pour exporter ses données via les fonctions d&apos;export prévues. Au-delà, et sauf obligation légale
                plus longue, SAFE supprime les données conformément à sa politique de conservation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Propriété intellectuelle de la Plateforme</h2>
              <p>
                La Plateforme, son code, son interface, ses gabarits, ses identifiants visuels, ses bases de
                connaissance et sa documentation sont la propriété exclusive de SAFE et sont protégés par les lois
                canadiennes sur la propriété intellectuelle.
              </p>
              <p className="mt-3">
                SAFE concède au Client une licence <strong>non exclusive, non cessible, révocable et limitée</strong>{" "}
                à l&apos;utilisation de la Plateforme pour les besoins internes du cabinet, pendant la durée de
                l&apos;abonnement. Sont notamment interdits&nbsp;: la copie, la redistribution, la sous-licence,
                l&apos;intégration dans un service concurrent et l&apos;utilisation à des fins de
                <em>benchmark</em> public sans accord écrit préalable.
              </p>
              <p className="mt-3">
                <strong>Retours et suggestions</strong>&nbsp;: si le Client transmet à SAFE des suggestions ou retours
                d&apos;expérience, SAFE peut les utiliser librement pour améliorer le service, sans rémunération ni
                obligation, tout en respectant la confidentialité des données du Client.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Services tiers et sous-traitants</h2>
              <p>
                Pour fournir le service, SAFE recourt à des sous-traitants techniques (notamment hébergement
                applicatif, base de données, traitement des paiements, courriel transactionnel, modèles
                d&apos;intelligence artificielle pour les fonctions assistées). La liste des principaux
                sous-traitants figure dans la <a href="/confidentialite" className="text-[var(--safe-accent)] underline">politique de confidentialité</a>{" "}
                et peut évoluer.
              </p>
              <p className="mt-3">
                La Plateforme peut renvoyer vers des services tiers (par exemple un widget de prise de
                rendez-vous). L&apos;utilisation de ces services tiers est régie par leurs propres conditions et
                politiques&nbsp;; SAFE n&apos;en est pas responsable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Disponibilité, maintenance et incidents</h2>
              <p>
                SAFE déploie des efforts commercialement raisonnables pour offrir un service stable et sécurisé sur
                une infrastructure infonuagique située au Canada. <strong>Aucun engagement chiffré de
                disponibilité</strong> n&apos;est consenti par les présentes&nbsp;; un éventuel SLA chiffré ne pourra
                résulter que d&apos;un avenant signé.
              </p>
              <p className="mt-3">
                Les fenêtres de maintenance planifiée font l&apos;objet, dans la mesure du possible, d&apos;un préavis
                raisonnable. SAFE peut également effectuer des interventions d&apos;urgence sans préavis lorsque la
                sécurité, l&apos;intégrité des données ou la stabilité du service l&apos;exigent.
              </p>
              <p className="mt-3">
                En cas d&apos;incident significatif affectant le service, SAFE en informe le Client dans des délais
                raisonnables. Les modalités relatives aux incidents de confidentialité sont précisées dans la
                politique de confidentialité.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Tarifs, taxes et paiement</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les frais d&apos;abonnement sont indiqués dans le bon de commande ou dans la grille tarifaire en vigueur.</li>
                <li>
                  Sauf mention contraire, les prix sont en <strong>dollars canadiens</strong> (CAD) et n&apos;incluent
                  pas la TPS, la TVQ ni les autres taxes applicables, qui s&apos;ajoutent au montant facturé.
                </li>
                <li>La facturation est mensuelle ou annuelle selon le plan choisi&nbsp;; le paiement est traité par un processeur certifié.</li>
                <li>
                  En cas de retard de paiement, SAFE peut, après avis adressé au Client, suspendre l&apos;accès à la
                  Plateforme jusqu&apos;à régularisation. Le Client demeure redevable des sommes échues pour la
                  période de suspension.
                </li>
                <li>
                  SAFE peut faire évoluer ses tarifs avec un préavis écrit raisonnable, généralement d&apos;au moins
                  trente (30) jours. Les conditions tarifaires « fondateurs » applicables sont précisées au bon de
                  commande&nbsp;; à défaut, elles ne sont pas opposables à SAFE.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Durée, résiliation et suspension</h2>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  L&apos;abonnement est consenti pour la durée prévue au bon de commande, et reconduit tacitement par
                  périodes équivalentes, sauf résiliation préalable par l&apos;une des parties.
                </li>
                <li>
                  <strong>Résiliation par le Client</strong>&nbsp;: à tout moment depuis l&apos;espace administrateur ou
                  par courriel adressé à <a href="mailto:jeremie@safecabinet.ca" className="text-[var(--safe-accent)] underline">jeremie@safecabinet.ca</a>.
                  La résiliation prend effet à la fin de la période de facturation en cours, sans remboursement
                  prorata, sauf disposition particulière du bon de commande ou du droit applicable.
                </li>
                <li>
                  <strong>Résiliation par SAFE</strong>&nbsp;: en cas de manquement grave du Client (notamment défaut
                  de paiement persistant, usage frauduleux, atteinte à la sécurité, utilisation manifestement
                  contraire à la loi ou aux présentes Conditions), après mise en demeure restée sans effet pendant
                  quinze (15) jours, ou immédiatement en cas de menace sérieuse pour le service ou pour des tiers.
                </li>
                <li>
                  <strong>Suspension préventive</strong>&nbsp;: SAFE peut suspendre temporairement l&apos;accès à un
                  compte présentant un risque de sécurité avéré, le temps d&apos;une investigation, et en informe le
                  Client dès que possible.
                </li>
                <li>
                  <strong>Effets de la résiliation</strong>&nbsp;: l&apos;accès en lecture est, dans la mesure du
                  possible, maintenu pendant une période raisonnable d&apos;<strong>environ quatre-vingt-dix (90)
                  jours</strong> pour permettre l&apos;export.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">15. Garanties limitées</h2>
              <p>
                SAFE garantit que la Plateforme est fournie avec un soin professionnel raisonnable, conforme à la
                description du service publiée et au cadre légal applicable.
              </p>
              <p className="mt-3">
                Dans toute la mesure permise par la loi, <strong>aucune autre garantie</strong> n&apos;est consentie,
                qu&apos;elle soit expresse ou implicite, notamment quant à&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>l&apos;absence d&apos;interruption ou d&apos;erreur&nbsp;;</li>
                <li>l&apos;adéquation à un usage particulier propre au Client&nbsp;;</li>
                <li>l&apos;exactitude des résultats produits à partir de données saisies par le Client ou de classifications proposées par les fonctions IA&nbsp;;</li>
                <li>l&apos;atteinte d&apos;un objectif commercial, fiscal ou réglementaire spécifique du Client.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">16. Limitation de responsabilité</h2>
              <p>Dans toute la mesure permise par la loi&nbsp;:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  SAFE n&apos;est pas responsable des dommages <strong>indirects, accessoires, spéciaux, punitifs ou
                  consécutifs</strong>, ni de la perte de profits, de clientèle, de réputation ou de données, même si
                  la possibilité en avait été signalée&nbsp;;
                </li>
                <li>
                  la <strong>responsabilité totale cumulée</strong> de SAFE pour tout fait générateur, quelle qu&apos;en
                  soit la cause, est limitée au <strong>montant des frais d&apos;abonnement effectivement payés par le
                  Client au cours des douze (12) mois précédant</strong> le fait générateur&nbsp;;
                </li>
                <li>
                  SAFE n&apos;est en aucun cas responsable d&apos;une <strong>sanction disciplinaire, déontologique,
                  administrative ou fiscale</strong> imposée au Client&nbsp;: ces conséquences relèvent de la
                  responsabilité professionnelle de l&apos;avocat utilisateur.
                </li>
              </ul>
              <p className="mt-3">
                Aucune disposition des présentes Conditions n&apos;exclut ni ne limite une responsabilité qui ne peut
                pas être limitée en vertu du droit applicable, notamment en cas de faute lourde, intentionnelle ou de
                fraude.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">17. Indemnisation par le Client</h2>
              <p>
                Le Client s&apos;engage à indemniser SAFE et à la tenir indemne de toute réclamation, plainte,
                procédure ou condamnation introduite par un tiers (incluant les clients du Client, ses anciens
                associés, des autorités professionnelles ou fiscales) lorsqu&apos;une telle réclamation découle&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>du contenu déposé par le Client ou ses Utilisateurs dans la Plateforme&nbsp;;</li>
                <li>d&apos;un manquement du Client à ses obligations professionnelles ou réglementaires&nbsp;;</li>
                <li>d&apos;un usage de la Plateforme contraire aux présentes Conditions ou au droit applicable.</li>
              </ul>
              <p className="mt-3">
                Cette obligation s&apos;applique sous réserve d&apos;une notification raisonnable par SAFE et d&apos;une
                possibilité raisonnable, pour le Client, de participer à la défense.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">18. Force majeure</h2>
              <p>
                Aucune des parties ne sera responsable d&apos;un manquement résultant d&apos;un événement de force
                majeure, incluant notamment&nbsp;: défaillance d&apos;un fournisseur d&apos;infrastructure
                (hébergeur, fournisseur d&apos;authentification, processeur de paiement, fournisseur de modèle d&apos;IA),
                interruption d&apos;Internet, attaque informatique massive non imputable à un défaut de diligence
                raisonnable, décision d&apos;une autorité publique, catastrophe naturelle, conflit social ou pandémie.
                La partie concernée s&apos;efforce raisonnablement d&apos;atténuer les effets de l&apos;événement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">19. Confidentialité</h2>
              <p>
                Chaque partie s&apos;engage à préserver la confidentialité des informations qu&apos;elle reçoit de
                l&apos;autre dans le cadre de l&apos;utilisation de la Plateforme. Les modalités de traitement des
                renseignements personnels figurent dans la <a href="/confidentialite" className="text-[var(--safe-accent)] underline">politique de confidentialité</a>,
                qui fait partie intégrante du contrat.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">20. Cession</h2>
              <p>
                Le Client ne peut céder ni transférer ses droits et obligations au titre des présentes sans
                l&apos;accord écrit préalable de SAFE. SAFE peut céder ses droits et obligations à un successeur en
                cas d&apos;opération sur ses titres ou ses actifs, sous réserve que ce successeur s&apos;engage envers
                le Client à un niveau de protection au moins équivalent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">21. Modifications des Conditions</h2>
              <p>
                SAFE peut faire évoluer les présentes Conditions pour refléter l&apos;évolution du service, du cadre
                légal ou de ses sous-traitants. Toute modification substantielle est notifiée au Client par courriel
                ou via la Plateforme, dans un délai raisonnable, généralement d&apos;au moins <strong>trente
                (30) jours</strong> avant son entrée en vigueur. Le Client qui refuse une modification substantielle
                peut résilier son abonnement sans frais avant l&apos;entrée en vigueur de la nouvelle version.
                À défaut, l&apos;utilisation continue de la Plateforme après cette entrée en vigueur vaut
                acceptation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">22. Divers</h2>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>Indépendance des stipulations</strong>&nbsp;: si une disposition des présentes est jugée
                  invalide, les autres dispositions demeurent pleinement applicables.
                </li>
                <li>
                  <strong>Absence de renonciation</strong>&nbsp;: le fait, pour SAFE, de ne pas se prévaloir d&apos;un
                  droit à un moment donné ne saurait valoir renonciation à ce droit.
                </li>
                <li>
                  <strong>Intégralité du contrat</strong>&nbsp;: les Conditions, le bon de commande applicable et la
                  politique de confidentialité forment l&apos;intégralité de l&apos;accord et prévalent sur tout
                  document antérieur.
                </li>
                <li>
                  <strong>Langue</strong>&nbsp;: les présentes sont rédigées en français&nbsp;; toute version anglaise
                  fournie l&apos;est à titre de courtoisie. En cas de divergence, la version française fait foi.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">23. Droit applicable et juridiction</h2>
              <p>
                Les présentes Conditions sont régies par les lois applicables dans la <strong>province de Québec</strong>{" "}
                et les lois fédérales du Canada qui s&apos;y appliquent, à l&apos;exclusion de leurs règles de conflit
                de lois. Tout litige relèvera de la compétence exclusive des tribunaux du <strong>district judiciaire
                de Montréal</strong>, sous réserve des dispositions impératives contraires applicables au Client.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">24. Contact</h2>
              <p>
                Pour toute question relative aux présentes Conditions, à l&apos;abonnement, à un incident ou à
                l&apos;exercice des droits prévus à la politique de confidentialité&nbsp;:
              </p>
              <p className="mt-3">
                SAFE Cabinet inc.<br />
                Courriel&nbsp;:{" "}
                <a href="mailto:jeremie@safecabinet.ca" className="text-[var(--safe-accent)] underline">
                  jeremie@safecabinet.ca
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
