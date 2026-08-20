/**
 * SAFE — Calcul du partage du patrimoine familial (Québec).
 *
 * MODULE FEUILLE. Aucune importation, aucun état partagé, aucun accès à la base.
 * C'est la condition 2 du §5bis de REGLE_DE_BUILD.md : un outil de démonstration ne
 * touche ni aux trois registres d'ancrage ni au schéma commun.
 *
 * SOURCES, vérifiées le 2026-08-19 (registre : docs/research/REGISTRE_SOURCES_famille_QC.md)
 *   - C.c.Q. art. 414 à 426, texte intégral, Éditeur officiel du Québec
 *   - C.c.Q. art. 521.29 à 521.36 (patrimoine d'union parentale)
 *   - M.T. c. J.-Y.T., [2008] 2 R.C.S. 781, 2008 CSC 50, texte intégral vérifié sur le
 *     site de la Cour suprême du Canada
 *
 * CE MODULE NE REND JAMAIS UN AVIS JURIDIQUE. Il rend un calcul, son chemin, et la
 * liste de ce qu'il a refusé de trancher. C'est l'avocate qui signe sous serment.
 */

/** Ce que le patrimoine peut contenir. La catégorie commande le traitement fiscal. */
export type CategorieBien =
  | "residence_familiale"
  | "meuble_menage"
  | "vehicule_familial"
  | "regime_retraite"
  | "gains_rrq";

export type Regime = "patrimoine_familial" | "union_parentale";

export type CauseDissolution = "divorce" | "separation_corps" | "nullite" | "deces";

/**
 * Un apport fait pendant l'union pour acquérir ou améliorer un bien du patrimoine.
 *
 * Art. 418 al. 1 : déductible seulement s'il provient de biens échus par succession ou
 * donation, ou de leur remploi. Le régime d'union parentale en admet quatre sources
 * (art. 521.36 al. 2), d'où le champ `source`.
 */
export type SourceApport =
  | "succession_donation"
  | "remploi"
  | "biens_avant_union"
  | "fruits_et_revenus"
  | "autre";

export interface Apport {
  /** Valeur de l'apport lui-même. */
  montant: number;
  /** Valeur brute du bien AU MOMENT de l'apport. Sert de dénominateur à la proportion. */
  valeurBruteAuMoment: number;
  /** D'où vient la somme. Toutes les provenances ne se déduisent pas. */
  source: SourceApport;
}

/**
 * Quelles provenances se déduisent, selon le régime.
 *
 * Les deux régimes ne sont PAS symétriques, et c'est la source de l'erreur la plus
 * facile à commettre ici.
 *
 * Le patrimoine familial (art. 418 al. 1) n'admet que ce qui vient d'une succession ou
 * d'une donation, ou de leur remploi. Une somme épargnée avant le mariage n'ouvre
 * aucune déduction : elle a été mise dans le bien, elle y reste.
 *
 * Le patrimoine d'union parentale (art. 521.36 al. 2) en admet quatre, dont les biens
 * accumulés avant l'union et les fruits et revenus de ces biens. Transposer la règle
 * du mariage à l'union parentale ferait perdre une déduction légitime, et l'inverse en
 * accorderait une qui n'existe pas.
 */
export function sourceDeductible(source: SourceApport, regime: Regime): boolean {
  if (regime === "union_parentale") {
    return source !== "autre";
  }
  return source === "succession_donation" || source === "remploi";
}

export interface Bien {
  libelle: string;
  categorie: CategorieBien;
  /**
   * Date de référence des déductions : le MARIAGE pour le patrimoine familial
   * (art. 418), le moment de l'INCLUSION au patrimoine pour l'union parentale
   * (art. 521.36). Le module ne fait pas la différence : l'appelant fournit les
   * valeurs à la bonne date, et `regime` sert à nommer la date dans le chemin.
   */
  valeurBruteReference: number | null;
  detteReference: number;
  valeurBrutePartage: number;
  dettePartage: number;
  apports?: Apport[];
  /**
   * Ce bien peut-il se partager en nature, par transfert direct ?
   *
   * Question posée AVANT celle de l'impôt latent, et c'est volontaire : quand un REER
   * se partage par roulement, chaque époux reçoit sa moitié et paiera l'impôt à son
   * propre retrait. La question fiscale devient sans objet. C'est la solution que les
   * tribunaux privilégient, et elle explique pourquoi la déductibilité de l'impôt
   * latent n'a jamais été tranchée.
   */
  partageableEnNature?: boolean;
  /**
   * Charge fiscale estimée à la disposition du bien, en dollars.
   *
   * FOURNIE, JAMAIS CALCULÉE ICI. Le taux d'inclusion du gain en capital et les taux
   * marginaux combinés n'ont pas été vérifiés sur une source primaire, et un module
   * qui les devinerait produirait un chiffre invérifiable. L'appelant fournit le
   * montant ; le moteur se contente de montrer les deux partages.
   */
  chargeFiscaleLatente?: number;
}

export interface EtapeCalcul {
  libelle: string;
  formule: string;
  montant: number;
  reference: string;
}

/**
 * Une chose que le calcul REFUSE de trancher, et pourquoi.
 *
 * Trois champs qui ne sont pas décoratifs :
 *
 * `verifieLe` — une question non tranchée finit par se trancher. Sans date, un « pas
 * encore décidé » vérifié en 2026 s'affichera encore en 2029 alors que la Cour d'appel
 * aura statué entre-temps. Même risque qu'une table périmée : faux sans rien signaler.
 *
 * `leveePar` — ce qui transformerait le mur en piste. Un refus qui ne dit pas ce qui
 * le lèverait est un cul-de-sac.
 *
 * `code` — comptable. Si une zone tombe dans trente dossiers par an, elle passe en
 * tête de la prochaine recherche ; si elle ne tombe jamais, elle attend. Les dossiers
 * réels décident de l'ordre, pas nous.
 */
export interface Reserve {
  code:
    | "valeur_nette_negative_reference"
    | "valeur_brute_reference_nulle"
    | "impot_latent"
    | "partage_inegal_422";
  bien: string | null;
  message: string;
  reference: string;
  /** Date de la dernière vérification de l'état du droit sur ce point. */
  verifieLe: string;
  /** Ce qui permettrait de calculer au lieu de refuser. */
  leveePar: string;
}

/** Dernière vérification du corpus. Voir docs/research/REGISTRE_SOURCES_famille_QC.md. */
export const VERIFIE_LE = "2026-08-19";

export interface ResultatBien {
  libelle: string;
  /** null quand le calcul a été refusé pour ce bien. */
  valeurPartageable: number | null;
  /**
   * La seconde branche, quand la charge fiscale latente est en jeu et chiffrée.
   *
   * Deux courants s'opposent sur la déductibilité de cet impôt et aucun arrêt de
   * principe ne les départage. Dans un partage entre deux personnes, il n'existe donc
   * pas de branche « prudente » : tout défaut silencieux avantage l'un des conjoints.
   * On rend les deux, sans en présélectionner aucune.
   */
  valeurPartageableApresImpotLatent: number | null;
  etapes: EtapeCalcul[];
  reserves: Reserve[];
}

export interface Resultat {
  biens: ResultatBien[];
  /** Somme des valeurs partageables calculées. Exclut les biens refusés. */
  valeurPartageableTotale: number;
  partParConjoint: number;
  /** La seconde branche. `null` si aucun bien ne porte de charge fiscale chiffrée. */
  valeurPartageableTotaleApresImpotLatent: number | null;
  partParConjointApresImpotLatent: number | null;
  reserves: Reserve[];
  /** Vrai si au moins un bien n'a pas pu être calculé. */
  incomplet: boolean;
}

const R2 = (x: number) => Math.round(x * 100) / 100;

/**
 * La déduction de l'article 418, plus-value ET moins-value.
 *
 * UNE SEULE FORMULE POUR LES DEUX CAS, et c'est un résultat, pas une commodité.
 *
 * Le texte ne parle que de « plus-value acquise ». La Cour d'appel a comblé la lacune
 * en retenant un traitement SYMÉTRIQUE : au lieu de déduire la plus-value
 * proportionnelle, on retranche la moins-value proportionnelle de la déduction.
 * Algébriquement, les deux cas se ramènent à :
 *
 *     déduction = VN(référence) + (VB(partage) - VB(référence)) x VN(référence)/VB(référence)
 *
 * Quand la valeur a monté, le second terme est positif et s'ajoute à la déduction.
 * Quand elle a baissé, il est négatif et la réduit. Une seule ligne, deux régimes.
 */
function deductionArticle418(
  valeurBruteReference: number,
  valeurNetteReference: number,
  valeurBrutePartage: number,
): { proportion: number; variation: number; deduction: number } {
  const proportion = valeurNetteReference / valeurBruteReference;
  const variation = valeurBrutePartage - valeurBruteReference;
  return {
    proportion,
    variation,
    deduction: R2(valeurNetteReference + variation * proportion),
  };
}

export function calculerBien(bien: Bien, regime: Regime): ResultatBien {
  const etapes: EtapeCalcul[] = [];
  const reserves: Reserve[] = [];
  const dateRef =
    regime === "union_parentale" ? "à l'inclusion au patrimoine" : "au mariage";
  const refDeduction =
    regime === "union_parentale" ? "C.c.Q. art. 521.36" : "C.c.Q. art. 418";

  const valeurNettePartage = R2(bien.valeurBrutePartage - bien.dettePartage);
  etapes.push({
    libelle: "Valeur nette à la date d'évaluation",
    formule: `${bien.valeurBrutePartage} − ${bien.dettePartage}`,
    montant: valeurNettePartage,
    reference: "C.c.Q. art. 417",
  });

  let deductionTotale = 0;

  // ── Déduction au titre du bien possédé à la date de référence ────────────────
  // Un bien acquis PENDANT l'union n'en porte aucune, mais il peut tout de même
  // porter un apport : les deux déductions sont indépendantes, et les traiter dans
  // le même bloc faisait sauter la seconde.
  if (bien.valeurBruteReference !== null) {
    const valeurNetteReference = R2(bien.valeurBruteReference - bien.detteReference);

    // La proportion de l'art. 418 al. 2 a la valeur brute de référence au dénominateur.
    if (bien.valeurBruteReference <= 0) {
      reserves.push({
        code: "valeur_brute_reference_nulle",
        bien: bien.libelle,
        message:
          `La valeur brute ${dateRef} est nulle ou négative. La proportion de la ` +
          `déduction ne peut pas être établie. Vérifiez la valeur saisie.`,
        reference: refDeduction,
        verifieLe: VERIFIE_LE,
        leveePar:
          "Une valeur brute positive à cette date. C'est la seule réserve de cette " +
          "liste qui vient d'une saisie et non du droit.",
      });
      return {
        libelle: bien.libelle,
        valeurPartageable: null,
        valeurPartageableApresImpotLatent: null,
        etapes,
        reserves,
      };
    }

    // LA SEULE ZONE QUI RESTE VRAIMENT OUVERTE.
    // Une valeur nette négative à la date de référence rend la proportion négative, et
    // la déduction de plus-value devient un ajout. Aucune source consultée ne traite ce
    // cas. Le calcul s'arrête plutôt que d'inventer une règle.
    if (valeurNetteReference < 0) {
      reserves.push({
        code: "valeur_nette_negative_reference",
        bien: bien.libelle,
        message:
          `Les dettes dépassaient la valeur du bien ${dateRef}, de sorte que la ` +
          `proportion de l'article 418 devient négative. Appliqué à la lettre, le texte ` +
          `transforme alors la déduction en ajout : la valeur à partager dépasserait ` +
          `celle du bien lui-même. Ce résultat est absurde, ce qui est déjà un argument, ` +
          `mais le Code ne dit pas par quoi le remplacer. Deux lectures se défendent : ` +
          `ramener la déduction à zéro, ou ramener la proportion à zéro. Les deux ` +
          `reviennent à ne rien déduire pour ce bien. Ce calcul s'arrête plutôt que de ` +
          `choisir à votre place.`,
        reference: refDeduction,
        verifieLe: VERIFIE_LE,
        leveePar:
          "Une décision sur le traitement d'une proportion négative. Au 2026-08-20, " +
          "aucune n'a été trouvée : CanLII refuse les outils automatisés et la recherche " +
          "de SOQUIJ passe par un contrôle anti-robot. Une consultation humaine de l'une " +
          "ou l'autre lèverait la réserve, ou confirmerait que la question reste au juge.",
      });
      return {
        libelle: bien.libelle,
        valeurPartageable: null,
        valeurPartageableApresImpotLatent: null,
        etapes,
        reserves,
      };
    }

    etapes.push({
      libelle: `Valeur nette ${dateRef}`,
      formule: `${bien.valeurBruteReference} − ${bien.detteReference}`,
      montant: valeurNetteReference,
      reference: refDeduction,
    });

    const d = deductionArticle418(
      bien.valeurBruteReference,
      valeurNetteReference,
      bien.valeurBrutePartage,
    );
    etapes.push({
      libelle:
        d.variation >= 0
          ? "Plus-value proportionnelle à déduire"
          : "Moins-value proportionnelle à retrancher de la déduction",
      formule:
        `${d.variation} × (${valeurNetteReference} ÷ ${bien.valeurBruteReference}) ` +
        `= ${d.variation} × ${R2(d.proportion)}`,
      montant: R2(d.variation * d.proportion),
      reference: `${refDeduction} al. 2`,
    });
    deductionTotale = d.deduction;
  }

  // ── Apports faits pendant l'union ────────────────────────────────────────────
  // Même mécanique, avec la valeur du bien AU MOMENT DE L'APPORT au dénominateur
  // (art. 418 al. 2, second cas). C'est aussi la façon dont se calcule le remploi :
  // le bien de remploi porte les déductions du bien d'origine, rapportées à son prix
  // d'achat.
  for (const a of bien.apports ?? []) {
    if (a.valeurBruteAuMoment <= 0) continue;

    // Une provenance non admissible ne se déduit pas, et le calcul le DIT plutôt que
    // de l'ignorer en silence. Sinon l'utilisateur croit sa déduction prise en compte.
    if (!sourceDeductible(a.source, regime)) {
      etapes.push({
        libelle: "Apport écarté : cette provenance n'ouvre pas de déduction",
        formule: `${a.montant} non déduit`,
        montant: 0,
        reference:
          regime === "union_parentale"
            ? "C.c.Q. art. 521.36 al. 2"
            : "C.c.Q. art. 418 al. 1, succession ou donation seulement",
      });
      continue;
    }

    const proportionApport = a.montant / a.valeurBruteAuMoment;
    const plusValueDepuis = bien.valeurBrutePartage - a.valeurBruteAuMoment;
    const dedApport = R2(a.montant + plusValueDepuis * proportionApport);
    deductionTotale = R2(deductionTotale + dedApport);
    etapes.push({
      libelle: "Apport et sa plus-value proportionnelle",
      formule:
        `${a.montant} + (${bien.valeurBrutePartage} − ${a.valeurBruteAuMoment}) × ` +
        `(${a.montant} ÷ ${a.valeurBruteAuMoment})`,
      montant: dedApport,
      reference: `${refDeduction} al. 1 et 2`,
    });
  }

  const brut = R2(valeurNettePartage - deductionTotale);

  // PLANCHER À ZÉRO, SANS COMPENSATION ENTRE BIENS.
  // Position majoritaire : les tribunaux refusent de déduire plus que la valeur du bien
  // qui subsiste dans le patrimoine. Une décision isolée s'en écarte, et la question
  // n'a pas été définitivement écartée par la Cour d'appel.
  const valeurPartageable = Math.max(0, brut);
  if (brut < 0) {
    etapes.push({
      libelle: "Solde négatif ramené à zéro",
      formule: `max(0, ${brut})`,
      montant: 0,
      reference: "Position majoritaire, à confirmer sur la jurisprudence récente",
    });
  }

  return finaliser(bien, valeurPartageable, etapes, reserves, deductionTotale);
}

/** Pose la ligne de conclusion, puis les réserves qui ne se calculent pas. */
function finaliser(
  bien: Bien,
  valeurPartageable: number,
  etapes: EtapeCalcul[],
  reserves: Reserve[],
  deductionTotale: number,
): ResultatBien {
  etapes.push({
    libelle: "Valeur partageable",
    formule: `${etapes[0].montant} − ${deductionTotale}`,
    montant: valeurPartageable,
    reference: "C.c.Q. art. 416",
  });

  // La seconde branche ne se calcule que si la charge fiscale a été chiffrée ET que le
  // partage en nature est écarté. Sinon la question ne se pose pas.
  const enNature = bien.partageableEnNature === true;
  const charge = bien.chargeFiscaleLatente;
  let apresImpot: number | null = null;
  if (!enNature && charge !== undefined && charge > 0) {
    apresImpot = Math.max(0, R2(valeurPartageable - charge));
    etapes.push({
      libelle: "Seconde branche : valeur partageable après charge fiscale latente",
      formule: `max(0, ${valeurPartageable} − ${charge})`,
      montant: apresImpot,
      reference: "C.c.Q. art. 416 et 417, lecture non tranchée",
    });
  }

  // L'IMPÔT LATENT N'EST PAS CALCULÉ, ET LA QUESTION SE POSE DANS LE BON ORDRE.
  // Deux courants s'opposent sur sa déductibilité et aucun arrêt de principe ne les
  // départage. En pratique, les tribunaux partagent le bien EN NATURE, ce qui rend la
  // question sans objet. On signale donc d'abord le partage en nature.
  if (bien.categorie === "regime_retraite" && !enNature) {
    reserves.push({
      code: "impot_latent",
      bien: bien.libelle,
      message:
        apresImpot === null
          ? "Ce bien portera de l'impôt à sa liquidation. La première question n'est " +
            "pas de savoir si cet impôt se déduit, mais si le bien peut se partager en " +
            "nature : chaque conjoint reçoit alors sa part et paiera l'impôt à son " +
            "propre retrait. Si le partage en nature est impossible, chiffrez la charge " +
            "fiscale et ce calcul rendra les deux montants."
          : "Deux lectures s'opposent et aucun arrêt de principe ne les départage. Les " +
            "deux montants sont donnés sans qu'aucun soit retenu par défaut : dans un " +
            "partage entre deux personnes, tout défaut avantage l'un des conjoints. " +
            "C'est à vous de choisir, et de dire pourquoi.",
      reference: "C.c.Q. art. 416 et 417, question non tranchée",
      verifieLe: VERIFIE_LE,
      leveePar:
        "Un arrêt de la Cour d'appel ou de la Cour suprême départageant les deux " +
        "courants, ou, plus simplement, un partage en nature qui rend la question " +
        "sans objet.",
    });
  }

  return {
    libelle: bien.libelle,
    valeurPartageable,
    valeurPartageableApresImpotLatent: apresImpot,
    etapes,
    reserves,
  };
}

export function calculerPartage(params: {
  regime: Regime;
  cause: CauseDissolution;
  biens: Bien[];
}): Resultat {
  const { regime, cause, biens } = params;

  // Au décès, les gains du Régime de rentes et certains droits de retraite sortent du
  // patrimoine (art. 415 al. 3). Mêmes biens, patrimoine différent.
  const retenus =
    cause === "deces"
      ? biens.filter((b) => b.categorie !== "gains_rrq")
      : biens;

  const resultats = retenus.map((b) => calculerBien(b, regime));
  const calcules = resultats.filter((r) => r.valeurPartageable !== null);
  const total = R2(
    calcules.reduce((s, r) => s + (r.valeurPartageable ?? 0), 0),
  );

  const reserves = resultats.flatMap((r) => r.reserves);

  // L'art. 422 ne se calcule pas. Mais depuis 2008 son critère se NOMME, ce qui vaut
  // mieux que le silence.
  reserves.push({
    code: "partage_inegal_422",
    bien: null,
    message:
      "Ce calcul suppose un partage égal. Le tribunal peut y déroger, mais seulement " +
      "pour une injustice de nature ÉCONOMIQUE : il faut que, par leurs actes durant " +
      "le mariage, les conjoints aient violé leur obligation de contribuer à la " +
      "formation et au maintien du patrimoine. Une inégalité de contributions ne " +
      "suffit pas, la Cour suprême y voit une conséquence prévisible du mariage.",
    reference: "M.T. c. J.-Y.T., [2008] 2 R.C.S. 781, 2008 CSC 50, par. 25 et 28 à 32",
    verifieLe: VERIFIE_LE,
    leveePar:
      "Rien. Ce n'est pas une lacune du droit mais une appréciation confiée au " +
      "tribunal. Aucun calcul ne la remplacera.",
  });

  // La seconde branche n'existe qu'à partir du moment où au moins un bien porte une
  // charge fiscale chiffrée. Les autres biens y entrent à leur valeur ordinaire.
  const avecCharge = calcules.some((r) => r.valeurPartageableApresImpotLatent !== null);
  const totalApresImpot = avecCharge
    ? R2(
        calcules.reduce(
          (s, r) => s + (r.valeurPartageableApresImpotLatent ?? r.valeurPartageable ?? 0),
          0,
        ),
      )
    : null;

  return {
    biens: resultats,
    valeurPartageableTotale: total,
    partParConjoint: R2(total / 2),
    valeurPartageableTotaleApresImpotLatent: totalApresImpot,
    partParConjointApresImpotLatent: totalApresImpot === null ? null : R2(totalApresImpot / 2),
    reserves,
    incomplet: calcules.length !== resultats.length,
  };
}
