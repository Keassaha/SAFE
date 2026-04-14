/* ─────────────────────────────────────────────
   Onboarding — Traductions FR / EN complètes
   ───────────────────────────────────────────── */

import type { Lang } from "./types";

const t = {
  /* ═══ Commun ═══ */
  welcome: {
    fr: "Bonjour / Hello",
    en: "Hello / Bonjour",
  },
  welcomeSub: {
    fr: "Choisissez votre langue",
    en: "Please select your language",
  },
  next: { fr: "Suivant", en: "Next" },
  back: { fr: "Précédent", en: "Back" },
  stepOf: { fr: "Étape {n} sur 8", en: "Step {n} of 8" },
  required: { fr: "Ce champ est requis", en: "This field is required" },
  optional: { fr: "(optionnel)", en: "(optional)" },
  other: { fr: "Autre", en: "Other" },
  otherPlaceholder: { fr: "Précisez...", en: "Please specify..." },
  yes: { fr: "Oui", en: "Yes" },
  no: { fr: "Non", en: "No" },
  submitting: { fr: "Envoi en cours...", en: "Submitting..." },

  /* ═══ Commentaires Jérémie ═══ */
  jeremie0: {
    fr: "Bonjour. Je suis Jérémie, fondateur de SAFE. Ce court audit me permettra de configurer votre espace exactement selon votre pratique. Commençons.",
    en: "Hello. I'm Jérémie, founder of SAFE. This short audit will allow me to configure your workspace exactly around your practice. Let's get started.",
  },
  jeremie1: {
    fr: "Parfait. Maintenant, parlons de votre pratique.",
    en: "Great. Now let's talk about your practice.",
  },
  jeremie2: {
    fr: "Bien. La facturation, c'est souvent là que les cabinets perdent le plus de temps. On va régler ça.",
    en: "Good. Billing is often where firms lose the most time. We'll fix that.",
  },
  jeremie3: {
    fr: "Merci. Le fidéicommis est l'une des parties les plus sensibles de votre pratique. Quelques questions importantes.",
    en: "Thank you. Trust accounting is one of the most sensitive parts of your practice. A few important questions.",
  },
  jeremie4: {
    fr: "Très bien. Parlons maintenant de votre équipe et de la façon dont vous organisez vos accès.",
    en: "Very good. Let's now talk about your team and how you organize access.",
  },
  jeremie5: {
    fr: "Vous êtes bien entouré. Voyons maintenant vos outils actuels — ce que vous utilisez aujourd'hui et ce qu'on migre.",
    en: "Good team setup. Let's look at your current tools — what you use today and what we'll migrate.",
  },
  jeremie6: {
    fr: "On y est presque. Dernière étape — vos priorités. Ce qui compte le plus pour vous.",
    en: "Almost there. Last step — your priorities. What matters most to you.",
  },
  jeremie7: {
    fr: "C'est tout ce dont j'avais besoin. Voici ce que ça représente pour votre cabinet.",
    en: "That's all I needed. Here's what this represents for your firm.",
  },

  /* ═══ Étape 1 — Informations du cabinet ═══ */
  step1Title: { fr: "Informations du cabinet", en: "Firm Information" },
  firmName: { fr: "Nom du cabinet", en: "Firm name" },
  leadName: { fr: "Prénom et nom de l'avocat principal", en: "Lead attorney full name" },
  email: { fr: "Courriel", en: "Email" },
  province: { fr: "Province", en: "Province" },
  address: { fr: "Adresse complète", en: "Full address" },
  phone: { fr: "Téléphone", en: "Phone" },
  website: { fr: "Site web", en: "Website" },
  logo: { fr: "Logo du cabinet", en: "Firm logo" },
  logoUpload: { fr: "Téléverser un logo", en: "Upload a logo" },
  firmColors: { fr: "Couleurs du cabinet", en: "Firm colors" },
  firmColorsPlaceholder: { fr: "Ex: bleu marine, or", en: "E.g.: navy blue, gold" },
  emailInvalid: { fr: "Courriel invalide", en: "Invalid email" },

  /* ═══ Étape 2 — Type de pratique ═══ */
  step2Title: { fr: "Type de pratique", en: "Practice Type" },
  practiceAreas: { fr: "Domaines de droit pratiqués", en: "Areas of practice" },
  practiceAreasHint: { fr: "Choix multiples possibles", en: "Multiple choices allowed" },
  areaFamily: { fr: "Droit de la famille", en: "Family Law" },
  areaCriminal: { fr: "Droit criminel", en: "Criminal Law" },
  areaCivil: { fr: "Droit civil", en: "Civil Law" },
  areaRealEstate: { fr: "Droit immobilier", en: "Real Estate Law" },
  areaCorporate: { fr: "Droit corporatif", en: "Corporate Law" },
  areaEstates: { fr: "Successions", en: "Wills & Estates" },
  areaLitigation: { fr: "Litige", en: "Litigation" },
  areaImmigration: { fr: "Immigration", en: "Immigration" },
  areaOther: { fr: "Autre", en: "Other" },
  monthlyNewFiles: { fr: "Volume mensuel de nouveaux dossiers", en: "Monthly new files" },
  files1_5: { fr: "1 à 5", en: "1 to 5" },
  files6_15: { fr: "6 à 15", en: "6 to 15" },
  files16_30: { fr: "16 à 30", en: "16 to 30" },
  files30plus: { fr: "30+", en: "30+" },
  clientType: { fr: "Type de clientèle", en: "Client type" },
  clientIndividuals: { fr: "Particuliers", en: "Individuals" },
  clientBusinesses: { fr: "Entreprises", en: "Businesses" },
  clientMixed: { fr: "Mixte", en: "Mixed" },

  /* ═══ Étape 3 — Facturation ═══ */
  step3Title: { fr: "Facturation", en: "Billing" },
  billingMethod: { fr: "Mode de facturation principal", en: "Primary billing method" },
  billingHourly: { fr: "À l'heure", en: "Hourly" },
  billingFlatFee: { fr: "Forfait", en: "Flat fee" },
  billingPerTask: { fr: "Par tâche", en: "Per task" },
  billingMixed: { fr: "Mixte", en: "Mixed" },
  hourlyRate: { fr: "Taux horaire moyen (si applicable)", en: "Average hourly rate (if applicable)" },
  hourlyRatePlaceholder: { fr: "Ex: 250", en: "E.g.: 250" },
  billingFrequency: { fr: "Fréquence de facturation", en: "Billing frequency" },
  freqPerFile: { fr: "Par dossier", en: "Per file" },
  freqMonthly: { fr: "Mensuel", en: "Monthly" },
  freqOnDemand: { fr: "À la demande", en: "On demand" },
  paymentTerms: { fr: "Délai de paiement standard", en: "Standard payment terms" },
  terms15: { fr: "15 jours", en: "15 days" },
  terms30: { fr: "30 jours", en: "30 days" },
  termsReceipt: { fr: "À réception", en: "Upon receipt" },
  paymentMethods: { fr: "Méthodes de paiement acceptées", en: "Accepted payment methods" },
  paymentMethodsHint: { fr: "Choix multiples possibles", en: "Multiple choices allowed" },
  methodWire: { fr: "Virement", en: "Wire transfer" },
  methodCheque: { fr: "Chèque", en: "Cheque" },
  methodCard: { fr: "Carte", en: "Card" },
  methodCash: { fr: "Comptant", en: "Cash" },
  taxesApplicable: { fr: "Taxes applicables", en: "Applicable taxes" },
  taxesAuto: { fr: "Déterminé automatiquement selon votre province", en: "Automatically determined by your province" },

  /* ═══ Étape 4 — Fidéicommis ═══ */
  step4Title: { fr: "Fidéicommis", en: "Trust Account" },
  hasTrustAccount: { fr: "Avez-vous un compte en fidéicommis ?", en: "Do you have a trust account?" },
  trustAccountCount: { fr: "Nombre de comptes", en: "Number of accounts" },
  trust1: { fr: "1", en: "1" },
  trust2: { fr: "2", en: "2" },
  trust3plus: { fr: "3+", en: "3+" },
  reconciliationFreq: { fr: "Fréquence de réconciliation", en: "Reconciliation frequency" },
  freqWeekly: { fr: "Hebdomadaire", en: "Weekly" },
  freqMonthlyTrust: { fr: "Mensuelle", en: "Monthly" },
  freqIrregular: { fr: "Irrégulière", en: "Irregular" },
  auditIssues: {
    fr: "Avez-vous eu des problèmes lors d'une inspection ?",
    en: "Have you had issues during a Law Society audit?",
  },
  auditNo: { fr: "Non", en: "No" },
  auditYes: { fr: "Oui", en: "Yes" },
  auditFirst: { fr: "Première inspection", en: "First audit" },

  /* ═══ Étape 5 — Équipe et accès ═══ */
  step5Title: { fr: "Équipe et accès", en: "Team & Access" },
  teamStructure: { fr: "Composition de l'équipe", en: "Team structure" },
  teamSolo: { fr: "Avocat seul", en: "Solo attorney" },
  teamPlusAssistant: { fr: "Avocat + assistante", en: "Attorney + assistant" },
  teamMultiAttorneys: { fr: "Plusieurs avocats", en: "Multiple attorneys" },
  teamFull: { fr: "Avocats + personnel administratif", en: "Attorneys + admin staff" },
  totalUsers: { fr: "Nombre total d'utilisateurs", en: "Total number of users" },
  whoPreparesInvoices: { fr: "Qui prépare les factures ?", en: "Who prepares invoices?" },
  invoicePrepAttorney: { fr: "Avocat", en: "Attorney" },
  invoicePrepAssistant: { fr: "Assistante", en: "Assistant" },
  invoicePrepBoth: { fr: "Les deux", en: "Both" },
  techComfort: { fr: "Niveau de confort technologique", en: "Tech comfort level" },
  techBeginner: { fr: "Débutant", en: "Beginner" },
  techIntermediate: { fr: "Intermédiaire", en: "Intermediate" },
  techAdvanced: { fr: "Avancé", en: "Advanced" },

  /* ═══ Étape 6 — Outils et migration ═══ */
  step6Title: { fr: "Outils actuels et migration", en: "Current Tools & Migration" },
  currentSoftware: { fr: "Logiciel actuel de gestion", en: "Current practice management software" },
  swExcel: { fr: "Excel", en: "Excel" },
  swClio: { fr: "Clio", en: "Clio" },
  swPCLaw: { fr: "PCLaw", en: "PCLaw" },
  swCosmolex: { fr: "Cosmolex", en: "Cosmolex" },
  swPaper: { fr: "Papier", en: "Paper" },
  hasDataToMigrate: { fr: "Avez-vous des données à migrer ?", en: "Do you have data to migrate?" },
  migrateNotSure: { fr: "Je ne sais pas", en: "Not sure" },
  dataFormat: { fr: "Format des données", en: "Data format" },
  formatExcel: { fr: "Excel", en: "Excel" },
  formatPDF: { fr: "PDF", en: "PDF" },
  formatSoftware: { fr: "Logiciel", en: "Software" },
  formatPaper: { fr: "Papier", en: "Paper" },
  primaryDevice: { fr: "Appareil principal de travail", en: "Primary work device" },
  deviceWindows: { fr: "PC Windows", en: "Windows PC" },
  deviceMac: { fr: "Mac", en: "Mac" },
  deviceBoth: { fr: "Les deux", en: "Both" },

  /* ═══ Étape 7 — Priorités ═══ */
  step7Title: { fr: "Priorités", en: "Priorities" },
  urgentChallenges: { fr: "Problème le plus urgent", en: "Most urgent challenge" },
  urgentHint: { fr: "Maximum 3 choix", en: "Maximum 3 choices" },
  challengeTrust: { fr: "Fidéicommis difficile à gérer", en: "Trust account management" },
  challengeBilling: { fr: "Facturation prend trop de temps", en: "Billing takes too long" },
  challengeAudit: { fr: "Inspection du Barreau qui approche", en: "Upcoming Law Society audit" },
  challengeProfitability: {
    fr: "Manque de visibilité sur la rentabilité",
    en: "Lack of profitability visibility",
  },
  challengeAdmin: { fr: "Trop d'administration", en: "Too much administration" },
  challengeCompliance: {
    fr: "Outils non conformes PIPEDA/Loi 25",
    en: "Non-compliant tools (PIPEDA/Law 25)",
  },
  goLiveTimeline: { fr: "Quand voulez-vous être opérationnel ?", en: "When do you want to go live?" },
  goLiveASAP: { fr: "Le plus tôt possible", en: "ASAP" },
  goLive30: { fr: "Dans 30 jours", en: "Within 30 days" },
  goLive60_90: { fr: "Dans 60-90 jours", en: "Within 60-90 days" },

  /* ═══ Étape 8 — Offre ═══ */
  step8Title: { fr: "Votre offre personnalisée", en: "Your personalized offer" },
  offerIntro: {
    fr: "Honnêtement ? Votre cabinet a tout ce qu'il faut pour fonctionner différemment. Voici ce que la mise en place de votre espace SAFE représente concrètement.",
    en: "Honestly? Your firm has everything it takes to operate differently. Here's what setting up your SAFE workspace actually represents.",
  },
  valueTable: { fr: "Tableau de valeur", en: "Value breakdown" },
  totalValue: { fr: "Valeur totale", en: "Total value" },
  whatYouPay: { fr: "Ce que vous payez aujourd'hui :", en: "What you pay today:" },
  perMonth: { fr: "/mois", en: "/month" },
  noSetupFees: {
    fr: "Sans frais de configuration. Sans engagement.",
    en: "No setup fees. No commitment.",
  },
  founderOffer: {
    fr: "Offre réservée aux 50 premiers cabinets fondateurs au Canada.",
    en: "Offer reserved for the first 50 founding firms across Canada.",
  },
  bookCall: { fr: "Réservez votre appel de démarrage", en: "Book your onboarding call" },
  preferredDate: { fr: "Date souhaitée", en: "Preferred date" },
  preferredTime: { fr: "Heure souhaitée", en: "Preferred time" },
  timeMorning: { fr: "Matin", en: "Morning" },
  timeAfternoon: { fr: "Après-midi", en: "Afternoon" },
  timeEvening: { fr: "Soir", en: "Evening" },
  optionalMessage: { fr: "Message optionnel", en: "Optional message" },
  confirmCall: {
    fr: "Confirmer mon appel de démarrage",
    en: "Confirm my onboarding call",
  },
  thankYou: {
    fr: "Merci ! Nous vous contacterons sous peu pour confirmer votre rendez-vous.",
    en: "Thank you! We'll contact you shortly to confirm your appointment.",
  },
} as const;

export type TranslationKey = keyof typeof t;

export function T(key: TranslationKey, lang: Lang): string {
  return t[key][lang];
}

/** Replace {n} placeholder */
export function Tf(key: TranslationKey, lang: Lang, vars: Record<string, string | number>): string {
  let result: string = t[key][lang];
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(`{${k}}`, String(v));
  }
  return result;
}
