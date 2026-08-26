/**
 * Le menu principal du site public, écrit UNE fois.
 *
 * ── Pourquoi ce fichier existe ───────────────────────────────────────────────
 * La barre de navigation était écrite deux fois : `shared.tsx` la rendait pour
 * toutes les pages publiques, et `ExperienceCinema.tsx` la réécrivait pour
 * l'accueil, avec ses propres styles. Le 24 août 2026, ajouter une seule
 * entrée a demandé deux modifications et deux vérifications, et le premier
 * correctif a semblé ne rien faire parce qu'il avait été posé du mauvais côté.
 * Les libellés et les destinations vivent donc ici. Le rendu reste propre à
 * chaque barre, mais plus le contenu.
 *
 * ── Les Outils SAFE sont RETIRÉS de la navigation (2026-08-25) ────────────────
 * Décision CEO. Les pages `/calculateurs` existent toujours et répondent par
 * leur adresse : elles ne sont simplement plus annoncées, ni dans la barre, ni
 * au téléphone, ni dans le pied de page. Le jour où l'accès aux outils est
 * décidé (inscription simple, essais gratuits), l'entrée revient ici.
 *
 * Ce qui n'est PAS fait, et qui reste à décider : les routes elles-mêmes ne
 * sont ni supprimées ni bloquées. Un lien déjà partagé continue de fonctionner.
 *
 * ── Règle de contenu ─────────────────────────────────────────────────────────
 * Une entrée de menu mène à une page ou à une section qui EXISTE. Pas de
 * rubrique décorative, pas de destination à construire plus tard : un menu qui
 * promet une page absente coûte plus cher qu'un menu court.
 *
 * ── Les trois niveaux d'intention ────────────────────────────────────────────
 * À droite, la barre porte trois actions et pas une : « je suis déjà client »
 * (Connexion), « je veux parler à quelqu'un » (chemin tiède), « je veux
 * m'engager » (action pleine). Une seule est pleine.
 */

export type EntreeMenu = {
  label: string;
  href: string;
  /** Sous-entrées. Une rubrique n'ouvre un menu que si elle en a au moins deux. */
  sous?: { label: string; href: string; note?: string }[];
  /** Mise en avant : encre pleine dans la barre. Une seule entrée à la fois. */
  enAvant?: boolean;
};

export const MENU_PRINCIPAL: EntreeMenu[] = [
  {
    label: "SAFE Cabinet",
    href: "/fonctionnalites",
    sous: [
      { label: "Vue d’ensemble", href: "/fonctionnalites", note: "Ce que la suite couvre" },
      { label: "La journée", href: "/fonctionnalites#journee", note: "Ce qui demande votre attention" },
      { label: "Le temps et la facture", href: "/fonctionnalites#chaine", note: "Inscrit une fois, repris jusqu’au bout" },
      { label: "Les dossiers", href: "/fonctionnalites#dossiers", note: "L’histoire et les prochaines étapes" },
      { label: "Le fidéicommis", href: "/fonctionnalites#fideicommis", note: "Vérifié avant d’être certifié" },
      { label: "Les cinq écrans", href: "/fonctionnalites#ecrans", note: "Une seule application" },
    ],
  },
  { label: "Tarification", href: "/tarification" },
  /* « À propos » sort de Ressources et monte au premier rang (demande CEO du
     2026-08-25). Enterrée dans un sous-menu, la page qui dit QUI construit
     SAFE n'était atteignable qu'en deux gestes, alors que c'est la question
     que se pose un avocat devant un fournisseur qu'il ne connaît pas.
     Elle porte « en-avant » : la barre la met en encre pleine. */
  { label: "À propos", href: "/a-propos", enAvant: true },
  { label: "Questions fréquentes", href: "/faq" },
];

/** Les trois actions de droite. Une seule est pleine. */
export const ACTIONS_MENU = {
  connexion: { label: "Connexion", href: "/connexion" },
  tiede: { label: "Parler à quelqu’un", href: "/demo" },
  principale: { label: "Évaluer mon cabinet", href: "/audit-gratuit" },
} as const;
