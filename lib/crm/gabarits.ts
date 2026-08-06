/**
 * Gabarits de courriel du CRM SAFE Inc.
 *
 * Voix SAFE : « vous », ton posé, jamais de peur, jamais de tiret long en milieu
 * de phrase. Le client est le héros, SAFE est le copilote. Chaque gabarit part
 * d'un problème concret, pas d'une présentation de produit.
 *
 * Les gabarits vivent dans le code plutôt qu'en base : ils font partie du
 * message de l'entreprise, ils méritent d'être versionnés et relus comme du
 * copywriting, pas édités à la volée dans un formulaire.
 */

export type VariablesGabarit = {
  prenom: string;
  cabinet: string;
  expediteur: string;
  ville?: string;
};

export type Gabarit = {
  id: string;
  nom: string;
  /** Quand s'en servir. Affiché dans le sélecteur, pour ne pas avoir à deviner. */
  usage: string;
  sujet: string;
  /** Corps en texte simple. Les paragraphes sont séparés par une ligne vide. */
  corps: string;
};

export const GABARITS: Gabarit[] = [
  {
    id: "PREMIER_CONTACT",
    nom: "Premier contact",
    usage: "Ouvrir la conversation avec un cabinet jamais approché.",
    sujet: "Une question sur la tenue de vos dossiers, {{prenom}}",
    corps: `Bonjour {{prenom}},

Je travaille avec des cabinets de la taille du vôtre sur un problème précis : le temps que l'adjointe passe à rassembler des informations qui existent déjà, éparpillées entre les courriels, les chèques et les dossiers papier.

Je ne cherche pas à vous vendre quoi que ce soit aujourd'hui. Je cherche à savoir si ce problème vous parle, ou si vous l'avez déjà réglé autrement.

Si c'est un sujet chez vous, répondez-moi en une ligne et je vous montrerai concrètement ce qu'on a bâti.

{{expediteur}}`,
  },
  {
    id: "INVITATION_AUDIT",
    nom: "Invitation à l'audit gratuit",
    usage: "Proposer l'audit après une première conversation.",
    sujet: "Un portrait de votre cabinet en 15 minutes",
    corps: `Bonjour {{prenom}},

Comme promis, voici ce que je peux faire de mon côté sans rien vous demander de plus qu'une quinzaine de minutes.

Je prépare un portrait de {{cabinet}} : où part le temps facturable, quels risques de conformité dorment dans les dossiers, et combien ça représente en argent sur une année. Vous repartez avec le document, que vous travailliez avec nous ensuite ou non.

Dites-moi seulement si un moment cette semaine ou la suivante vous conviendrait.

{{expediteur}}`,
  },
  {
    id: "SUITE_AUDIT",
    nom: "Suite d'audit",
    usage: "Présenter les résultats après un audit complété.",
    sujet: "Le portrait de {{cabinet}} est prêt",
    corps: `Bonjour {{prenom}},

J'ai terminé le portrait de {{cabinet}}. Il est prêt à vous être présenté.

Deux ou trois choses m'ont surpris et méritent qu'on en parle de vive voix plutôt que par écrit, parce qu'elles dépendent de votre façon de travailler et que je peux me tromper sur le contexte.

Vingt minutes suffisent. Dites-moi ce qui vous arrange.

{{expediteur}}`,
  },
  {
    id: "RELANCE_DOUCE",
    nom: "Relance posée",
    usage: "Reprendre contact après un silence, sans pression.",
    sujet: "Je reviens vers vous, {{prenom}}",
    corps: `Bonjour {{prenom}},

Je vous avais écrit il y a quelque temps et je n'ai pas eu de suite, ce qui est parfaitement normal à cette période.

Je reste disponible si le sujet redevient d'actualité chez vous. Et si ce n'est pas le cas, dites-le moi simplement : je cesserai de vous relancer et ce sera très bien ainsi.

{{expediteur}}`,
  },
  {
    id: "PLACE_FONDATRICE",
    nom: "Place fondatrice",
    usage: "Présenter l'offre des dix places à un cabinet prêt.",
    sujet: "Une des dix places fondatrices pour {{cabinet}}",
    corps: `Bonjour {{prenom}},

Nous ouvrons dix places fondatrices, et {{cabinet}} en fait partie de mon point de vue.

Concrètement : nous montons votre configuration nous-mêmes, vous payez un tarif fondateur pendant douze mois, et ce tarif reste gelé ensuite. Si ça ne vous convient pas dans les soixante premiers jours, vous partez et nous vous remboursons. Vous n'êtes engagé à rien au delà du mois en cours.

Je vous envoie les détails si vous voulez les regarder. Sinon, dites-moi non et je n'y reviens pas.

{{expediteur}}`,
  },
  {
    id: "SUIVI_CONSULTATION",
    nom: "Suivi de consultation",
    usage: "Récapituler après une consultation de validation.",
    sujet: "Ce que je retiens de notre échange",
    corps: `Bonjour {{prenom}},

Merci pour le temps que vous m'avez accordé. Voici ce que j'ai retenu, corrigez-moi si j'ai mal compris quelque chose.

[À compléter : les points retenus, dans vos mots à vous.]

Je vous laisse regarder tout ça tranquillement. Je vous relance une seule fois la semaine prochaine, pas davantage.

{{expediteur}}`,
  },
];

export function trouverGabarit(id: string): Gabarit | null {
  return GABARITS.find((g) => g.id === id) ?? null;
}

/** Remplace les {{variables}}. Une variable absente devient une chaîne vide
 *  plutôt que de laisser une accolade visible dans un courriel envoyé. */
export function appliquerVariables(texte: string, vars: VariablesGabarit): string {
  return texte.replace(/\{\{(\w+)\}\}/g, (_, cle: string) => {
    const valeur = (vars as Record<string, string | undefined>)[cle];
    return valeur ?? "";
  });
}
