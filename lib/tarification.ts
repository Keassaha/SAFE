// Constantes éditoriales et de prix pour la page /tarification et le widget dashboard.
// Modifier directement ici pour mettre à jour la page publique.

export const TARIFICATION = {
  fondateurs: {
    placesPrises: 1,
    placesTotal: 5,
    moisGratuits: 12,
    abonnementVie: 50,
    prixRegulierBarre: 149,
    rachatUnique: 5000,
  },
  paliers: {
    solo: {
      prix: 99,
      prixAnnuel: 79,
      eco: 240,
    },
    cabinet: {
      prix: 149,
      prixAnnuel: 119,
    },
  },
  packEv: {
    prix: 1000,
  },
} as const;

export const AUTOMATIONS = [
  {
    num: "01",
    titre: "Intake client automatisé",
    desc: "Formulaire web, vérification de conflits, mandat, signature électronique, dépôt initial fidéicommis. Vous validez en un clic.",
  },
  {
    num: "02",
    titre: "Vérification de conflits",
    desc: "Cross-référence automatique de chaque nouveau client et partie adverse contre toute votre base. Rapport horodaté.",
  },
  {
    num: "03",
    titre: "Suivi des prescriptions et délais",
    desc: "Surveillance continue. Alertes 30, 15, 7 et 1 jour avant échéance.",
  },
  {
    num: "04",
    titre: "Génération de documents",
    desc: "Mandats, requêtes, mises en demeure, procurations pré-remplis. Vous relisez, vous signez.",
  },
  {
    num: "05",
    titre: "Relances de factures",
    desc: "Séquence automatique J+7, 15, 30, 45. Recouvrement moyen +28 %.",
  },
  {
    num: "06",
    titre: "Réconciliation fidéicommis",
    desc: "Rapprochement quotidien, alertes de seuil, rapport prêt à signer.",
  },
  {
    num: "07",
    titre: "Tri et synthèse des courriels",
    desc: "Classement par dossier, résumé en 3 lignes, priorisation des actions.",
  },
  {
    num: "08",
    titre: "Suivi des temps non facturés",
    desc: "Détection des heures non comptabilisées, bascule en facturable. 6 à 12 h par semaine récupérées.",
  },
  {
    num: "09",
    titre: "Rapports réglementaires automatiques",
    desc: "Déclaration annuelle fidéicommis, registre Loi 25, rapport FINTRAC.",
  },
  {
    num: "10",
    titre: "Synthèse de réunions et d'appels",
    desc: "Transcript, notes structurées, tâches assignées, suivi des engagements.",
  },
] as const;

export const FAQ_TARIFICATION = [
  {
    question: "Qu'est-ce qui est vraiment inclus dans la configuration sur mesure ?",
    answer:
      "L'audit de votre pratique, le choix du bundle adapté à votre cabinet (familial, immobilier, immigration, affaires, généraliste), les ajustements de relances, dashboard, templates, onglets visibles et permissions selon vos besoins. La configuration est incluse dès le palier Solo.",
  },
  {
    question: "SAFE est-il conforme aux exigences de mon Barreau ou de ma Law Society ?",
    answer:
      "SAFE est actuellement déployé pour le Québec (Barreau du Québec, Règlement B-1, r.5) et l'Ontario (LSO By-Law 9). Les autres juridictions canadiennes sont en cours d'intégration. Le périmètre réglementaire couvert pour votre juridiction est confirmé lors de l'audit. SAFE facilite le suivi de vos obligations, la responsabilité professionnelle reste la vôtre.",
  },
  {
    question: "Comment fonctionne la garantie d'activation sous 30 jours ?",
    answer:
      "Si votre première facture n'est pas envoyée et votre premier dossier n'est pas numérisé sous 30 jours, chaque jour de retard est offert sur votre abonnement et notre équipe d'activation reste mobilisée gratuitement jusqu'à la mise en service complète.",
  },
  {
    question: "Puis-je passer du palier Solo au palier Cabinet plus tard ?",
    answer:
      "Oui, en un clic depuis vos paramètres. Vos données, dossiers, configurations et historique sont conservés. Le changement est immédiat.",
  },
  {
    question: "Mes données sont-elles hébergées au Canada ?",
    answer:
      "Oui. SAFE est hébergé au Canada. Vos données ne quittent jamais le territoire canadien. Les données sensibles sont chiffrées AES-256. SAFE est conforme à la Loi 25 du Québec et à PIPEDA.",
  },
  {
    question: "L'offre fondatrice reviendra-t-elle un jour ?",
    answer:
      "Non. L'offre fondatrice est strictement limitée à 5 cabinets. Une fois les 5 places prises, elle est définitivement fermée. Les cabinets fondateurs conservent leur tarif de 50 $/mois à vie, ou leur accès via le rachat unique.",
  },
  {
    question: "Comment fonctionne le tarif gelé à vie ?",
    answer:
      "Vous signez maintenant et votre tarif fondateur de 50 $/mois est verrouillé pour toujours, au lieu de 149 $. Il n'augmentera jamais tant que vous restez membre. Les 12 premiers mois sont gratuits, à partir du jour où vous activez l'outil.",
  },
] as const;
