// Constantes éditoriales et de prix pour la page /tarification et le widget dashboard.
// Modifier directement ici pour mettre à jour la page publique.

export const TARIFICATION = {
  fondateurs: {
    placesPrises: 1,
    placesTotal: 50,
    prix: 990,
    deadlineJours: 90,
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
    question: "Le Pack Employé Virtuel a-t-il un engagement minimum ?",
    answer:
      "Non. Le Pack est un abonnement mensuel de 1 000 $, sans setup fee et résiliable en tout temps. Vous pouvez l'activer ou le désactiver à votre guise.",
  },
  {
    question: "SAFE est-il conforme aux exigences de mon Barreau ou de ma Law Society ?",
    answer:
      "SAFE est actuellement déployé pour le Québec (Barreau du Québec, Règlement B-1, r.5) et l'Ontario (LSO By-Law 9). Les autres juridictions canadiennes sont en cours d'intégration. La conformité par juridiction est validée à l'audit.",
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
    question: "L'offre Fondateurs reviendra-t-elle un jour ?",
    answer:
      "Non. L'offre Fondateurs est strictement limitée aux 50 premiers cabinets. Une fois les 50 places prises ou la deadline de 90 jours atteinte, elle est définitivement fermée. Les Fondateurs conservent leur prix Solo à vie.",
  },
] as const;
