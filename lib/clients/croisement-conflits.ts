/**
 * SAFE — Croisement de conflits, tous contre tous.
 *
 * Module PUR : aucun accès Prisma. Il reçoit la liste des personnes connues du
 * cabinet, clients et parties confondus, et rend les rapprochements.
 *
 * ── Pourquoi une passe « tous contre tous » ─────────────────────────────────
 *
 * La recherche de conflits ordinaire compare UN nouveau nom à ce qui existe
 * déjà. C'est le bon geste au quotidien, et c'est insuffisant pendant une
 * reprise : le premier client entré n'a été comparé à personne, le deuxième au
 * premier seulement, et ainsi de suite. Une collision entre le client n° 2 et
 * la partie adverse du client n° 27 n'est vue par personne.
 *
 * Cette passe se lance une fois la reprise terminée et referme ce trou.
 *
 * ── La clé de rapprochement, et pourquoi elle n'est pas `clientDedupeKey` ───
 *
 * La normalisation des noms est CELLE DU PRODUIT : `normalizeClientName`, qui
 * ôte les accents, la ponctuation et les formes juridiques (« Acme Inc. » et
 * « ACME, Incorporated » donnent tous deux « acme »). Ce module ne réinvente
 * rien de cela.
 *
 * Il ajoute une seule chose, et il faut savoir pourquoi : les mots sont TRIÉS.
 *
 * `clientDedupeKey` trie les mots d'une personne physique, pour absorber
 * « Marielle Aubin » et « Aubin, Marielle ». Il ne les trie PAS pour une
 * personne morale, où l'ordre porte du sens. Cette asymétrie convient tant
 * qu'on compare une fiche client à une autre fiche client, parce que chaque
 * fiche déclare sa nature.
 *
 * Une partie adverse, elle, n'est qu'un nom libre : personne n'a dit si
 * « Marielle Aubin » est une femme ou une raison sociale. Appliquer les deux
 * règles selon un type inconnu revient à ne comparer les deux côtés que par
 * chance. Le trou serait silencieux, et c'est exactement le trou que cette
 * passe existe pour fermer.
 *
 * On trie donc les deux côtés. Le prix est connu : « Marie Claire » et
 * « Claire Marie » se rapprochent. C'est déjà le compromis retenu pour les
 * personnes dans le reste du produit, et un faux rapprochement se lit et se
 * rejette en trois secondes, là où un conflit manqué ne se lit jamais.
 */

import { normalizeClientName } from "./normalize-name";

export type NatureEntite = "client" | "partie_adverse" | "tiers";

/**
 * Clé de rapprochement d'un nom, quelle que soit sa nature.
 *
 * Une seule fonction pour les deux côtés du croisement : c'est la condition
 * pour qu'un client et une partie adverse puissent se rencontrer. Voir l'en-tête
 * du fichier pour le raisonnement.
 */
export function cleCroisement(nom: string | null | undefined): string {
  const normalise = normalizeClientName(nom);
  if (!normalise) return "";
  return normalise.split(/\s+/).filter(Boolean).sort().join(" ");
}

export interface EntiteCroisement {
  id: string;
  nature: NatureEntite;
  /** Nom affichable, tel qu'il sera montré à l'avocat. */
  libelle: string;
  /** Clé normalisée, produite par `cleCroisement`. Jamais calculée autrement. */
  cle: string;
  /** Courriel en minuscules, quand il est connu. Second signal de rapprochement. */
  email?: string | null;
  /** Pour une partie : le dossier où elle figure, et le client de ce dossier. */
  dossierId?: string | null;
  dossierIntitule?: string | null;
  dossierClientId?: string | null;
}

export type GraviteAppariement =
  /** Nous représentons quelqu'un qui est aussi partie adverse ailleurs. */
  | "conflit"
  /** Deux fiches pour la même personne. Pas un conflit : un doublon à fusionner. */
  | "doublon"
  /** À regarder, sans plus : un tiers qui porte le nom d'un client. */
  | "signal";

export interface Appariement {
  gravite: GraviteAppariement;
  a: EntiteCroisement;
  b: EntiteCroisement;
  /** Phrase montrée à l'avocat. Dit ce qui a été trouvé, jamais ce qu'il doit faire. */
  explication: string;
  /** Ce qui a rapproché les deux : le nom, ou le courriel. */
  motif: "nom" | "courriel";
}

const RANG: Record<GraviteAppariement, number> = { conflit: 0, doublon: 1, signal: 2 };

/** Identifiant stable d'une paire, sans égard à l'ordre. Sert à ne la produire qu'une fois. */
function clePaire(a: EntiteCroisement, b: EntiteCroisement): string {
  return [a.id, b.id].sort().join("::");
}

/**
 * Qualifie une paire, ou l'écarte.
 *
 * Retourne `null` quand la paire ne mérite pas d'être montrée. Deux cas :
 *
 *   - **deux parties externes.** La même partie adverse dans deux dossiers est
 *     courante et ne dit rien de nous : nous ne la représentons dans aucun des
 *     deux. L'afficher noierait les vrais conflits sous du bruit ;
 *   - **une partie et le client de son propre dossier.** C'est une erreur de
 *     saisie, pas un conflit : quelqu'un a inscrit son client comme partie
 *     adverse de lui-même. Le signaler comme conflit ferait douter du reste.
 */
function qualifier(a: EntiteCroisement, b: EntiteCroisement, motif: "nom" | "courriel"): Appariement | null {
  const client = a.nature === "client" ? a : b.nature === "client" ? b : null;
  const autre = client === a ? b : a;

  if (!client) return null; // deux parties externes

  if (autre.nature === "client") {
    return {
      gravite: "doublon",
      a,
      b,
      motif,
      explication:
        motif === "courriel"
          ? "Deux fiches portent le même courriel. Il s'agit probablement de la même personne."
          : "Deux fiches portent le même nom. Il s'agit probablement de la même personne.",
    };
  }

  // Une partie rattachée au dossier de ce client même : saisie, pas conflit.
  if (autre.dossierClientId && autre.dossierClientId === client.id) return null;

  if (autre.nature === "partie_adverse") {
    return {
      gravite: "conflit",
      a: client,
      b: autre,
      motif,
      explication: autre.dossierIntitule
        ? `Vous représentez cette personne, et elle figure comme partie adverse dans « ${autre.dossierIntitule} ».`
        : "Vous représentez cette personne, et elle figure comme partie adverse dans un autre dossier.",
    };
  }

  return {
    gravite: "signal",
    a: client,
    b: autre,
    motif,
    explication: autre.dossierIntitule
      ? `Un tiers de « ${autre.dossierIntitule} » porte le nom d'un de vos clients.`
      : "Un tiers porte le nom d'un de vos clients.",
  };
}

/**
 * Croise toutes les entités entre elles et rend les rapprochements trouvés,
 * du plus grave au plus léger.
 *
 * Le coût est quadratique dans le pire des cas, mais seulement à l'intérieur
 * d'un groupe de même clé : on ne compare jamais deux noms différents. Un
 * cabinet de mille personnes dont dix portent le même nom fait quarante-cinq
 * comparaisons, pas cinq cent mille.
 */
export function croiserConflits(entites: EntiteCroisement[]): Appariement[] {
  const appariements: Appariement[] = [];
  const dejaVues = new Set<string>();

  const ajouter = (a: EntiteCroisement, b: EntiteCroisement, motif: "nom" | "courriel") => {
    if (a.id === b.id) return;
    const cle = clePaire(a, b);
    // Une paire rapprochée par le nom ET par le courriel ne se montre qu'une
    // fois : c'est un seul fait, pas deux.
    if (dejaVues.has(cle)) return;
    const appariement = qualifier(a, b, motif);
    if (!appariement) return;
    dejaVues.add(cle);
    appariements.push(appariement);
  };

  /* ── Rapprochement par le nom ──────────────────────────────────────────── */
  const parCle = new Map<string, EntiteCroisement[]>();
  for (const entite of entites) {
    const cle = entite.cle.trim();
    if (!cle) continue; // une entité sans nom exploitable ne se rapproche de rien
    const groupe = parCle.get(cle);
    if (groupe) groupe.push(entite);
    else parCle.set(cle, [entite]);
  }
  for (const groupe of parCle.values()) {
    if (groupe.length < 2) continue;
    for (let i = 0; i < groupe.length; i += 1) {
      for (let j = i + 1; j < groupe.length; j += 1) {
        ajouter(groupe[i], groupe[j], "nom");
      }
    }
  }

  /* ── Rapprochement par le courriel ─────────────────────────────────────
   * Deuxième passe, parce qu'une personne change de nom plus souvent qu'elle
   * ne change d'adresse : mariage, raison sociale, coquille de saisie. */
  const parCourriel = new Map<string, EntiteCroisement[]>();
  for (const entite of entites) {
    const courriel = entite.email?.trim().toLowerCase();
    if (!courriel) continue;
    const groupe = parCourriel.get(courriel);
    if (groupe) groupe.push(entite);
    else parCourriel.set(courriel, [entite]);
  }
  for (const groupe of parCourriel.values()) {
    if (groupe.length < 2) continue;
    for (let i = 0; i < groupe.length; i += 1) {
      for (let j = i + 1; j < groupe.length; j += 1) {
        ajouter(groupe[i], groupe[j], "courriel");
      }
    }
  }

  return appariements.sort((x, y) => RANG[x.gravite] - RANG[y.gravite]);
}

/** Compte par gravité, pour l'en-tête de l'écran. */
export function compterParGravite(appariements: Appariement[]): Record<GraviteAppariement, number> {
  return appariements.reduce(
    (compte, a) => {
      compte[a.gravite] += 1;
      return compte;
    },
    { conflit: 0, doublon: 0, signal: 0 } as Record<GraviteAppariement, number>,
  );
}
