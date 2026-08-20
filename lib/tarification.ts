// Constantes éditoriales et de prix pour la page /tarification et le widget dashboard.
// Modifier directement ici pour mettre à jour la page publique.

/**
 * Formate un prix en français canadien : virgule décimale, et pas de « ,00 »
 * inutile sur un montant rond.
 *
 * Les paliers s'interpolaient directement dans le JSX (`{cabinet.prix} $`).
 * Tant que tous les prix étaient entiers, ça passait. Depuis que le palier
 * Cabinet vaut 149,99, l'interpolation brute affiche « 149.99 $ » sur un site
 * francophone destiné à des avocats du Québec.
 */
export function prixFr(montant: number): string {
  return montant.toLocaleString("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export const TARIFICATION = {
  fondateurs: {
    // Offre v2, décision CEO 2026-07-27. Voir docs/marketing/ventes/OFFRE_FONDATRICE_v2.md.
    // Le compteur affiché doit toujours être le vrai : ne jamais gonfler placesPrises.
    placesPrises: 1,
    placesTotal: 10,
    // 12 mois à tarif fondateur, puis tarif fondateur gelé (apres*), pas le tarif régulier.
    // C'est ce gel qui supprime le doublement du coût au 13e mois.
    dureeMois: 12,
    premiereAnneeSolo: 50,
    premiereAnneeCabinet: 75,
    apresSolo: 79,
    apresCabinet: 119,
    // Paiement annuel fondateur : 12 mois d'avance, un mois offert.
    annuelSolo: 550,
    annuelCabinet: 825,
    // Remboursement des premiers mois si le cabinet juge que SAFE ne lui apporte rien.
    garantieJours: 60,
    // Capacité réelle de mise en route, qui fonde la rareté annoncée.
    miseEnRouteParMois: 2,
  },
  paliers: {
    solo: {
      prix: 99,
      prixAnnuel: 79,
      eco: 240,
    },
    cabinet: {
      // 149,99 et non 149 : aligné sur `PLANS.professionnel`, que ce palier
      // facture réellement (mapping dans `PLAN_NOM_PUBLIC`, lib/stripe.ts).
      prix: 149.99,
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
    desc: "Séquence automatique J+7, 15, 30, 45. Vos créances cessent de vieillir en silence.",
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
    desc: "Détection des heures non comptabilisées, bascule en facturable. Le temps oublié redevient facturable.",
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
      "Non. L'offre fondatrice est limitée à 10 cabinets. Une fois les 10 places prises, elle est définitivement fermée.",
  },
  {
    question: "Pourquoi seulement dix places ?",
    answer:
      "Parce que la mise en route de chaque cabinet est faite à la main, et qu'il n'est pas possible d'en faire plus de deux par mois sans bâcler. Dix cabinets représentent cinq mois de travail. Les places s'ouvrent donc au fur et à mesure, et le compteur affiché est le vrai.",
  },
  {
    question: "Comment fonctionne le tarif fondateur ?",
    answer:
      "Vos douze premiers mois sont à 50 $ par mois pour une pratique individuelle et 75 $ par mois pour un cabinet avec adjointe. Ensuite, votre tarif fondateur reste gelé à 79 $ ou 119 $ par mois tant que votre abonnement demeure actif, au lieu des 99 $ ou 149,99 $ du tarif régulier. Votre coût ne double pas au treizième mois.",
  },
  {
    question: "Qu'est-ce qui est fait par vous, et qu'est-ce qui reste à ma charge ?",
    answer:
      "La mise en route est faite par nous : paramétrage du cabinet, reprise de vos dossiers actifs, de vos clients et de vos soldes de fidéicommis, et la formation de votre adjointe, une séance en direct puis de courtes vidéos qu'elle reprend à son rythme. Vous n'avez pas de formulaires à remplir ni de données à ressaisir. Vous nous envoyez ce que vous avez, dans l'état où c'est. S'y ajoute un atelier hebdomadaire avec les autres cabinets fondateurs, où vos questions sont traitées.",
  },
  {
    question: "Qu'est-ce qui se passe si je change d'avis ?",
    answer:
      "L'abonnement est mensuel, résiliable en tout temps, sans pénalité et sans justification à donner. Si dans les soixante premiers jours vous jugez que SAFE ne vous apporte rien, les mois payés vous sont remboursés. Vos données restent les vôtres et s'exportent quand vous le voulez, dans un format lisible.",
  },
  {
    question: "Qu'est-ce que vous demandez en retour ?",
    answer:
      "Trente minutes par mois les trois premiers mois, puis une fois par trimestre, à date fixe, pour nous dire ce qui bloque. Votre nom et quelques phrases le jour où les résultats seront là, que vous relisez et que vous pouvez refuser de publier. Et deux présentations à des confrères dans les six premiers mois, si et seulement si vous êtes satisfait.",
  },
] as const;
