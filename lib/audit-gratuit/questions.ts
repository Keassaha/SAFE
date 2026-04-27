/**
 * SAFE — Audit gratuit (v2)
 * 34 questions réparties en 6 sections.
 */

export type QType = "text" | "textarea" | "email" | "tel" | "url" | "number" | "radio" | "checkbox" | "scale10" | "radio-with-other" | "checkbox-with-other";

export interface QOption {
  value: string;
  label: string;
  sub?: string;
}

export interface Question {
  id: string;
  section: string;      // section id
  number: string;       // "1.1"
  type: QType;
  label: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  options?: QOption[];
  maxChecked?: number;
  /** Question conditionnelle : n'afficher que si la condition est vraie */
  showIf?: (answers: Record<string, unknown>) => boolean;
  /** Sous-questions regroupées (même carte) */
  subfields?: SubField[];
}

export interface SubField {
  id: string;
  type: QType;
  label: string;
  placeholder?: string;
  options?: QOption[];
  required?: boolean;
  help?: string;
}

export interface SectionDef {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  goal: string;
}

export const SECTIONS: SectionDef[] = [
  { id: "cabinet",    number: 1, title: "Votre cabinet en bref",                   subtitle: "Identification",                   goal: "Identifier votre cabinet" },
  { id: "equipe",     number: 2, title: "Vous et votre équipe",                    subtitle: "Qualification tarifaire",          goal: "Qualifier votre offre SAFE" },
  { id: "org",        number: 3, title: "Votre organisation et vos personnes-clés", subtitle: "Coût administratif actuel",        goal: "Chiffrer votre coût admin actuel" },
  { id: "pratique",   number: 4, title: "Votre pratique",                          subtitle: "Profil métier",                    goal: "Comprendre votre modèle de pratique" },
  { id: "outils",     number: 5, title: "Vos outils actuels",                      subtitle: "Concurrence et douleurs",          goal: "Détecter les frictions" },
  { id: "temps",      number: 6, title: "Le vrai enjeu : votre temps",             subtitle: "ROI projeté",                      goal: "Estimer votre ROI avec SAFE" },
];

export const PROVINCES: QOption[] = [
  { value: "QC", label: "Québec" },
  { value: "ON", label: "Ontario" },
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "Colombie-Britannique" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "Nouveau-Brunswick" },
  { value: "NS", label: "Nouvelle-Écosse" },
  { value: "PE", label: "Île-du-Prince-Édouard" },
  { value: "NL", label: "Terre-Neuve-et-Labrador" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
  { value: "NT", label: "Territoires du Nord-Ouest" },
  { value: "NU", label: "Nunavut" },
];

export const QUESTIONS: Question[] = [
  // ─── SECTION 1 : Cabinet ───────────────────────────────────────────
  {
    id: "raison_sociale", section: "cabinet", number: "1.1", type: "text",
    label: "Quelle est la raison sociale de votre cabinet ?",
    placeholder: "Ex. Tremblay Avocats S.E.N.C.R.L.", required: true,
  },
  {
    id: "localisation", section: "cabinet", number: "1.2", type: "text",
    label: "Où exercez-vous ?", required: true,
    subfields: [
      { id: "ville", type: "text", label: "Ville", placeholder: "Ex. Montréal", required: true },
      { id: "province", type: "radio", label: "Province / territoire", options: PROVINCES, required: true },
    ],
  },
  {
    id: "site_web", section: "cabinet", number: "1.3", type: "url",
    label: "Votre site web",
    help: "Facultatif — si vous en avez un.", placeholder: "https://",
  },
  {
    id: "forme_juridique", section: "cabinet", number: "1.4", type: "radio-with-other",
    label: "Forme juridique de votre cabinet", required: true,
    options: [
      { value: "individuelle",  label: "Entreprise individuelle" },
      { value: "inc",           label: "Société par actions (Inc.)" },
      { value: "senc",          label: "S.E.N.C. / S.E.N.C.R.L." },
      { value: "autre",         label: "Autre" },
    ],
  },

  // ─── SECTION 2 : Vous & équipe (qualification tarifaire) ───────────
  {
    id: "identite", section: "equipe", number: "2.1", type: "text",
    label: "Votre nom complet et votre titre", required: true,
    subfields: [
      { id: "nom_complet", type: "text", label: "Nom complet", placeholder: "Prénom Nom", required: true },
      { id: "titre", type: "text", label: "Titre", placeholder: "Avocat, notaire, parajuriste…", required: true },
    ],
  },
  {
    id: "annees_pratique", section: "equipe", number: "2.2", type: "radio",
    label: "Depuis combien d'années pratiquez-vous ?", required: true,
    options: [
      { value: "lt2",   label: "Moins de 2 ans" },
      { value: "2_5",   label: "2 à 5 ans" },
      { value: "6_15",  label: "6 à 15 ans" },
      { value: "gt15",  label: "Plus de 15 ans" },
    ],
  },
  {
    id: "nb_utilisateurs", section: "equipe", number: "2.3", type: "radio-with-other",
    label: "Combien d'utilisateurs auraient besoin d'accéder à SAFE au quotidien ?",
    help: "Cette réponse détermine l'offre qui vous sera proposée.", required: true,
    options: [
      { value: "1",     label: "1 utilisateur",   sub: "Je travaille seul(e)" },
      { value: "2",     label: "2 utilisateurs" },
      { value: "3plus", label: "3 utilisateurs ou plus" },
    ],
  },
  {
    id: "contact", section: "equipe", number: "2.4", type: "text",
    label: "Vos coordonnées pour recevoir votre rapport", required: true,
    subfields: [
      { id: "email",     type: "email", label: "Courriel",   placeholder: "vous@cabinet.ca", required: true },
      { id: "telephone", type: "tel",   label: "Téléphone",  placeholder: "(514) 555-0199",  required: true },
    ],
  },

  // ─── SECTION 3 : Organisation ──────────────────────────────────────
  {
    id: "gestion_facturation", section: "org", number: "3.1", type: "radio",
    label: "Qui gère la facturation au quotidien dans votre cabinet ?", required: true,
    options: [
      { value: "moi",          label: "Moi-même (le praticien)" },
      { value: "adjoint",      label: "Mon adjoint(e) / secrétaire juridique" },
      { value: "parajuriste",  label: "Mon/ma technicien(ne) juridique ou parajuriste" },
      { value: "externe",      label: "Un teneur de livres / CPA externe" },
      { value: "personne",     label: "Personne de façon systématique", sub: "C'est un problème" },
    ],
  },
  {
    id: "gestion_fideicommis", section: "org", number: "3.2", type: "radio",
    label: "Qui gère le compte en fidéicommis (dépôts, retraits, conciliation) ?", required: true,
    options: [
      { value: "moi",       label: "Moi-même" },
      { value: "adjoint",   label: "Mon adjoint(e) à l'interne" },
      { value: "externe",   label: "Mon teneur de livres / CPA externe" },
      { value: "aucun",     label: "Je n'ai pas de système structuré" },
      { value: "na",        label: "Non applicable — pas de compte en fidéicommis" },
    ],
  },
  {
    id: "adjoint_statut", section: "org", number: "3.3", type: "radio",
    label: "Avez-vous un(e) adjoint(e) administratif(ve) ou secrétaire juridique ?", required: true,
    options: [
      { value: "tp",       label: "Oui, à temps plein", sub: "30 h/semaine ou plus" },
      { value: "pt",       label: "Oui, à temps partiel", sub: "Moins de 30 h/semaine" },
      { value: "partage",  label: "Oui, partagé(e) avec d'autres praticiens" },
      { value: "non",      label: "Non, pas encore" },
      { value: "jamais",   label: "Non, et je n'en prévois pas" },
    ],
  },
  {
    id: "adjoint_detail", section: "org", number: "3.4", type: "text",
    label: "Parlez-nous un peu plus de votre adjoint(e)",
    showIf: (a) => ["tp", "pt", "partage"].includes(String(a.adjoint_statut || "")),
    subfields: [
      { id: "prenom",  type: "text",   label: "Prénom", placeholder: "Ex. Marie", required: true },
      { id: "heures",  type: "number", label: "Nombre d'heures travaillées par semaine", placeholder: "Ex. 35", required: true },
      { id: "taux",    type: "radio",  label: "Taux horaire approximatif", required: true, options: [
        { value: "lt20",      label: "Moins de 20 $/h" },
        { value: "20_28",     label: "20 à 28 $/h" },
        { value: "29_38",     label: "29 à 38 $/h" },
        { value: "39_50",     label: "39 à 50 $/h" },
        { value: "gt50",      label: "Plus de 50 $/h" },
        { value: "na",        label: "Je préfère ne pas répondre" },
      ] },
      { id: "aisance_tech", type: "radio", label: "À quel point est-il/elle à l'aise avec les nouvelles technologies ?", required: true, options: [
        { value: "tres",    label: "Très à l'aise", sub: "Adopte rapidement de nouveaux outils" },
        { value: "plutot",  label: "Plutôt à l'aise", sub: "Apprend bien avec un peu de formation" },
        { value: "moyen",   label: "Moyennement", sub: "A besoin d'accompagnement" },
        { value: "peu",     label: "Peu à l'aise", sub: "Préfère les méthodes connues" },
        { value: "inconnu", label: "Je ne sais pas" },
      ] },
    ],
  },
  {
    id: "comptable_statut", section: "org", number: "3.5", type: "radio",
    label: "Avez-vous un teneur de livres ou comptable qui s'occupe de votre comptabilité ?", required: true,
    options: [
      { value: "int_tp",   label: "Oui, à l'interne, temps plein" },
      { value: "int_pt",   label: "Oui, à l'interne, temps partiel" },
      { value: "externe",  label: "Oui, externe", sub: "Firme comptable / travailleur autonome" },
      { value: "moi",      label: "Non, je fais tout moi-même" },
      { value: "defi",     label: "Non, et c'est un défi pour moi" },
    ],
  },
  {
    id: "comptable_detail", section: "org", number: "3.6", type: "text",
    label: "Parlez-nous de votre teneur de livres / comptable",
    showIf: (a) => ["int_tp", "int_pt", "externe"].includes(String(a.comptable_statut || "")),
    subfields: [
      { id: "nom",       type: "text",  label: "Prénom ou nom de la firme (facultatif)", placeholder: "Ex. Comptabilité ABC" },
      { id: "cout",      type: "radio", label: "Coût approximatif de ses services", required: true, options: [
        { value: "lt300",    label: "Moins de 300 $/mois" },
        { value: "300_600",  label: "300 à 600 $/mois" },
        { value: "601_1200", label: "601 à 1 200 $/mois" },
        { value: "1201_2500",label: "1 201 à 2 500 $/mois" },
        { value: "gt2500",   label: "Plus de 2 500 $/mois" },
        { value: "salarie",  label: "Salarié(e) interne" },
        { value: "na",       label: "Je préfère ne pas répondre" },
      ] },
      { id: "frequence", type: "radio", label: "Fréquence de collaboration", required: true, options: [
        { value: "hebdo",   label: "Hebdomadaire" },
        { value: "mensuel", label: "Mensuelle" },
        { value: "trim",    label: "Trimestrielle" },
        { value: "annuel",  label: "Annuelle", sub: "Fin d'année seulement" },
        { value: "besoin",  label: "Au besoin / ponctuellement" },
      ] },
    ],
  },
  {
    id: "autres_roles", section: "org", number: "3.7", type: "checkbox",
    label: "Autres rôles présents dans votre cabinet",
    help: "Cochez tous ceux qui s'appliquent.",
    options: [
      { value: "parajuriste_tp", label: "Parajuriste / technicien(ne) juridique — temps plein" },
      { value: "parajuriste_pt", label: "Parajuriste / technicien(ne) juridique — temps partiel" },
      { value: "stagiaire",      label: "Stagiaire en droit" },
      { value: "receptionniste_tp", label: "Réceptionniste — temps plein" },
      { value: "receptionniste_pt", label: "Réceptionniste — temps partiel" },
      { value: "associes",       label: "Autre(s) avocat(s) ou notaire(s) associé(s)" },
      { value: "aucun",          label: "Aucun autre rôle" },
    ],
  },
  {
    id: "utilisateur_principal", section: "org", number: "3.8", type: "radio",
    label: "Qui sera l'utilisateur principal de SAFE au quotidien ?", required: true,
    options: [
      { value: "moi",       label: "Moi (le praticien)" },
      { value: "adjoint",   label: "Mon adjoint(e)" },
      { value: "comptable", label: "Mon teneur de livres interne" },
      { value: "mix",       label: "Un mix de plusieurs personnes" },
      { value: "inconnu",   label: "Je ne sais pas encore" },
    ],
  },

  // ─── SECTION 4 : Pratique ──────────────────────────────────────────
  {
    id: "domaines_pratique", section: "pratique", number: "4.1", type: "textarea",
    label: "Décrivez vos principaux domaines de pratique et, si vous le souhaitez, le type de clientèle que vous servez",
    help: "Par exemple : droit de la famille et droit immobilier, principalement pour des particuliers ; ou droit des affaires pour des PME québécoises.",
    placeholder: "Ex. Droit familial et civil, principalement pour des particuliers au Québec…",
    required: true,
  },
  {
    id: "dossiers_actifs", section: "pratique", number: "4.2", type: "radio",
    label: "Combien de dossiers actifs gérez-vous actuellement ?", required: true,
    options: [
      { value: "lt10",   label: "Moins de 10" },
      { value: "10_30",  label: "10 à 30" },
      { value: "31_75",  label: "31 à 75" },
      { value: "76_150", label: "76 à 150" },
      { value: "gt150",  label: "Plus de 150" },
    ],
  },
  {
    id: "nouveaux_mois", section: "pratique", number: "4.3", type: "radio",
    label: "Combien de nouveaux dossiers ouvrez-vous en moyenne par mois ?", required: true,
    options: [
      { value: "lt5",   label: "Moins de 5" },
      { value: "5_15",  label: "5 à 15" },
      { value: "16_30", label: "16 à 30" },
      { value: "gt30",  label: "Plus de 30" },
    ],
  },
  {
    id: "mode_facturation", section: "pratique", number: "4.4", type: "radio",
    label: "Comment facturez-vous principalement ?", required: true,
    options: [
      { value: "horaire",    label: "À l'heure" },
      { value: "forfait",    label: "Au forfait / prix fixe" },
      { value: "mixte",      label: "Mixte", sub: "Les deux" },
      { value: "commission", label: "À la commission / pourcentage", sub: "Ex. droit immobilier, successions" },
    ],
  },
  {
    id: "taux_horaire", section: "pratique", number: "4.5", type: "radio",
    label: "Dans quelle fourchette se situe votre taux horaire ?",
    showIf: (a) => ["horaire", "mixte"].includes(String(a.mode_facturation || "")),
    options: [
      { value: "lt150",  label: "Moins de 150 $/h" },
      { value: "150_250",label: "150 à 250 $/h" },
      { value: "251_400",label: "251 à 400 $/h" },
      { value: "gt400",  label: "Plus de 400 $/h" },
      { value: "na",     label: "Non applicable" },
    ],
  },
  {
    id: "type_clientele", section: "pratique", number: "4.6", type: "radio",
    label: "Quel type de clientèle servez-vous principalement ?", required: true,
    options: [
      { value: "particuliers", label: "Particuliers uniquement" },
      { value: "entreprises",  label: "Entreprises / PME uniquement" },
      { value: "mixte",        label: "Mixte", sub: "Particuliers et entreprises" },
      { value: "institutionnel", label: "Institutionnel / gouvernemental / organismes" },
    ],
  },
  {
    id: "langues", section: "pratique", number: "4.7", type: "checkbox-with-other",
    label: "Dans quelle(s) langue(s) servez-vous vos clients ?", required: true,
    options: [
      { value: "fr",     label: "Français" },
      { value: "en",     label: "Anglais" },
      { value: "autre",  label: "Autres langues" },
    ],
  },
  {
    id: "aide_juridique", section: "pratique", number: "4.8", type: "radio",
    label: "Acceptez-vous les mandats d'aide juridique (Québec) ou de Legal Aid Ontario ?", required: true,
    options: [
      { value: "reg",   label: "Oui, régulièrement" },
      { value: "occ",   label: "Oui, occasionnellement" },
      { value: "non",   label: "Non" },
      { value: "na",    label: "Non applicable" },
    ],
  },
  {
    id: "fideicommis_usage", section: "pratique", number: "4.9", type: "radio",
    label: "Gérez-vous un compte en fidéicommis ?", required: true,
    options: [
      { value: "actif",   label: "Oui, activement", sub: "Mouvements fréquents" },
      { value: "peu",     label: "Oui, mais peu de mouvements" },
      { value: "non",     label: "Non" },
      { value: "bientot", label: "Pas encore, mais j'en aurai bientôt besoin" },
    ],
  },
  {
    id: "evolution", section: "pratique", number: "4.10", type: "radio",
    label: "Comment décririez-vous l'évolution de votre pratique au cours des 12 derniers mois ?", required: true,
    options: [
      { value: "forte",    label: "En forte croissance", sub: "Plus de 25 % de dossiers" },
      { value: "moderee",  label: "En croissance modérée" },
      { value: "stable",   label: "Stable" },
      { value: "ralenti",  label: "En ralentissement" },
      { value: "demarre",  label: "Je démarre à peine ma pratique" },
    ],
  },

  // ─── SECTION 5 : Outils actuels ────────────────────────────────────
  {
    id: "logiciel_actuel", section: "outils", number: "5.1", type: "radio-with-other",
    label: "Quel logiciel principal utilisez-vous pour gérer votre cabinet ?", required: true,
    options: [
      { value: "pclaw",        label: "PCLaw" },
      { value: "jurisevolution",label: "JurisEvolution" },
      { value: "clio",         label: "Clio" },
      { value: "jurisconcept", label: "Juris Concept" },
      { value: "aucun",        label: "Excel / papier / aucun logiciel dédié" },
      { value: "autre",        label: "Autre" },
    ],
  },
  {
    id: "satisfaction", section: "outils", number: "5.2", type: "scale10",
    label: "Sur 10, quel est votre niveau de satisfaction avec votre système actuel ?",
    help: "1 = très insatisfait, 10 = parfait.", required: true,
  },
  {
    id: "frustrations", section: "outils", number: "5.3", type: "checkbox-with-other",
    label: "Qu'est-ce qui vous frustre le plus dans votre organisation actuelle ?",
    help: "Cochez jusqu'à 3.", maxChecked: 3,
    options: [
      { value: "interface",      label: "Interface complexe / peu intuitive" },
      { value: "cout",           label: "Coût trop élevé" },
      { value: "province",       label: "Manque de fonctionnalités adaptées à ma province" },
      { value: "fideicommis",    label: "Difficultés avec le compte en fidéicommis" },
      { value: "facturation",    label: "Facturation lente ou compliquée" },
      { value: "impayes",        label: "Pas de visibilité claire sur les factures impayées" },
      { value: "mobile",         label: "Pas de mobilité", sub: "Pas d'app mobile / accès à distance" },
      { value: "admin",          label: "Trop de temps perdu en tâches administratives" },
      { value: "autre",          label: "Autre" },
    ],
  },

  // ─── SECTION 6 : Temps / ROI ───────────────────────────────────────
  {
    id: "heures_admin", section: "temps", number: "6.1", type: "radio",
    label: "Combien d'heures par semaine consacrez-vous personnellement à des tâches administratives non facturables ?",
    help: "Facturation, suivi des paiements, conciliation, classement, conformité, etc.",
    required: true,
    options: [
      { value: "lt2",   label: "Moins de 2 heures" },
      { value: "2_5",   label: "2 à 5 heures" },
      { value: "6_10",  label: "6 à 10 heures" },
      { value: "gt10",  label: "Plus de 10 heures" },
    ],
  },
  {
    id: "visibilite_creances", section: "temps", number: "6.2", type: "radio",
    label: "Pouvez-vous, en moins de 60 secondes, me dire combien d'argent vous est dû par vos clients en ce moment ?",
    required: true,
    options: [
      { value: "facile",   label: "Oui, facilement" },
      { value: "logiciel", label: "Oui, mais je dois consulter mon logiciel" },
      { value: "manuel",   label: "Non, je devrais faire un calcul manuel" },
      { value: "non",      label: "Non, pas du tout" },
    ],
  },
  {
    id: "delai_paiement", section: "temps", number: "6.3", type: "radio",
    label: "Quel est votre délai moyen pour qu'un client règle effectivement sa facture, à partir du moment où vous l'envoyez ?",
    required: true,
    options: [
      { value: "lt15",   label: "Moins de 15 jours" },
      { value: "15_30",  label: "15 à 30 jours" },
      { value: "31_60",  label: "31 à 60 jours" },
      { value: "gt60",   label: "Plus de 60 jours" },
      { value: "inconnu",label: "Je ne sais pas précisément" },
    ],
  },
  {
    id: "urgence", section: "temps", number: "6.4", type: "radio",
    label: "Quel est votre niveau d'urgence pour améliorer votre système actuel ?", required: true,
    options: [
      { value: "urgent",    label: "Urgent", sub: "Dans le mois qui vient" },
      { value: "important", label: "Important", sub: "Dans les 3 prochains mois" },
      { value: "moyen",     label: "Moyen", sub: "Dans les 6 prochains mois" },
      { value: "info",      label: "Je me renseigne simplement" },
    ],
  },
  {
    id: "automatisation_reve", section: "temps", number: "6.5", type: "textarea",
    label: "Si vous pouviez automatiser une seule chose demain dans votre cabinet, laquelle serait-ce ?",
    help: "Une phrase suffit.", placeholder: "Ex. La conciliation du fidéicommis chaque mois…",
    required: true,
  },
];

/** Filtre les questions selon les conditions actuelles */
export function visibleQuestions(answers: Record<string, unknown>): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

/** Retourne les questions d'une section (filtrées). */
export function sectionQuestions(sectionId: string, answers: Record<string, unknown>): Question[] {
  return visibleQuestions(answers).filter((q) => q.section === sectionId);
}
