/**
 * SAFE — Entrée d'un client déjà servi par le cabinet.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI. Il décide de trois
 * choses, et rien d'autre :
 *
 *   1. ce qui reste ouvert sur une fiche, et avec quelle gravité ;
 *   2. l'écart entre le fidéicommis déclaré client par client et le solde du
 *      relevé bancaire ;
 *   3. l'avancement de la reprise.
 *
 * ── Deux règles qui gouvernent tout le fichier ──────────────────────────────
 *
 * **Rien ne bloque.** Aucune fonction ici ne dit « refusé ». Un cabinet qui
 * entre trente clients un soir de semaine abandonnera au troisième si le
 * logiciel exige d'abord une pièce d'identité scannée. Ce qui manque est
 * nommé, daté et rendu visible. C'est tout, et c'est déjà beaucoup plus que
 * ce qu'il a aujourd'hui.
 *
 * **Ce qui est déclaré n'est pas ce qui est prouvé.** Les dates viennent de
 * l'avocat, pas de SAFE. Le module raisonne donc sur des déclarations, et les
 * libellés qu'il produit disent « déclaré », jamais « vérifié ».
 */

/* ════════════════════════════════════════════════════════════════
   ENTRÉES
   ════════════════════════════════════════════════════════════════ */

/**
 * Le mandat en trois temps. Les trois sont indépendants : un mandat peut être
 * signé sans avoir jamais été versé au dossier, et c'est le cas courant chez
 * un cabinet qui classe son papier ailleurs.
 */
export interface EtatMandat {
  envoyeAt: Date | null;
  signeAt: Date | null;
  verseAuDossierAt: Date | null;
}

/**
 * Vérification d'identité du client.
 *
 * `EXEMPTEE` n'est pas un raccourci de confort : le règlement prévoit de
 * vraies exemptions (B-1 r.5 art. 21). Les confondre avec « pas fait »
 * afficherait un manquement là où il n'y en a pas, et le cabinet cesserait de
 * croire les alertes.
 */
export type EtatIdentite = "VERIFIEE" | "EXEMPTEE" | "A_FAIRE";

/** Ce que le cabinet déclare détenir pour ce client, au jour de son relevé. */
export interface FondsDetenus {
  montant: number;
  arreteAu: Date;
}

/** L'état déclaré d'une fiche, tel que l'écran d'entrée le recueille. */
export interface FicheEntree {
  /**
   * Dossier en cours, ou affaire terminée. Cette bascule commande la moitié du
   * fichier : on ne réclame pas d'échéance ni de mandat vivant à un dossier
   * clos il y a deux ans. Sans elle, la moitié des fiches s'afficherait en
   * rouge pour des obligations qui ne s'appliquent plus.
   */
  dossierEnCours: boolean;
  mandat: EtatMandat;
  /** Date de la vérification de conflits, faite dans SAFE ou déclarée faite avant. */
  conflitsVerifieAt: Date | null;
  identite: EtatIdentite;
  /** Consentement à la collecte des renseignements (Loi 25). */
  consentementAt: Date | null;
  /** `null` quand le cabinet déclare ne rien détenir pour ce client. */
  fondsDetenus: FondsDetenus | null;
  /** Nombre d'échéances saisies pour ce client. */
  nombreDatesQuiCourent: number;
  /**
   * Le cabinet a explicitement confirmé qu'aucune date ne court.
   *
   * Sans ce drapeau, « zéro date » est ambigu : ça veut dire soit « il n'y en
   * a pas », soit « je ne les ai pas encore saisies ». La différence est celle
   * entre un dossier calme et un dossier dont on ignore les échéances, et
   * c'est exactement le genre d'ambiguïté qui fait rater une prescription.
   */
  aucuneDateConfirmee: boolean;
}

/* ════════════════════════════════════════════════════════════════
   CE QUI RESTE OUVERT
   ════════════════════════════════════════════════════════════════ */

/**
 * Gravité d'un point resté ouvert.
 *
 *   `manquant`      une obligation du cabinet n'est pas couverte.
 *   `a_surveiller`  rien n'est enfreint, mais la situation appelle un geste.
 *
 * Deux niveaux, pas quatre. Une échelle plus fine se serait traduite par
 * quatre couleurs à l'écran, et une couleur qui ne commande aucun geste est
 * du bruit.
 */
export type GraviteElement = "manquant" | "a_surveiller";

export interface ElementOuvert {
  /** Clé stable, pour les tests et l'interface. Jamais montrée au cabinet. */
  cle: string;
  libelle: string;
  gravite: GraviteElement;
}

/**
 * Énumère ce qui reste ouvert sur une fiche, du plus grave au plus léger.
 *
 * L'ordre de la liste est l'ordre d'affichage : le cabinet lit les trois
 * premières lignes et s'arrête. Ce qui est en haut doit donc être ce qui
 * l'expose le plus.
 */
export function elementsOuverts(fiche: FicheEntree): ElementOuvert[] {
  const ouverts: ElementOuvert[] = [];

  /* ── Identité ────────────────────────────────────────────────────────────
   * Recevoir des fonds déclenche l'obligation de vérifier (B-1 r.5 art. 20).
   * Détenir de l'argent pour quelqu'un dont l'identité n'a jamais été
   * vérifiée est donc le manquement le plus lourd que cette fiche puisse
   * porter, et il passe devant tout le reste. Sans fonds détenus, la même
   * absence n'est qu'un point à surveiller. */
  if (fiche.identite === "A_FAIRE") {
    ouverts.push(
      fiche.fondsDetenus
        ? {
            cle: "identite_avec_fonds",
            libelle: "Des fonds sont détenus et l'identité n'est pas vérifiée",
            gravite: "manquant",
          }
        : {
            cle: "identite",
            libelle: "Identité du client à vérifier",
            gravite: "a_surveiller",
          },
    );
  }

  /* ── Conflits ────────────────────────────────────────────────────────────
   * Obligation déontologique à l'ouverture du mandat. Une fiche sans aucune
   * date de vérification ne prouve rien, même si le contrôle a bien eu lieu
   * en son temps : c'est la trace qui manque, pas forcément le geste. Le
   * libellé le dit ainsi, pour ne pas accuser le cabinet. */
  if (!fiche.conflitsVerifieAt) {
    ouverts.push({
      cle: "conflits",
      libelle: "Aucune vérification de conflits déclarée",
      gravite: "manquant",
    });
  }

  /* ── Mandat ──────────────────────────────────────────────────────────────
   * Trois situations distinctes, trois lectures distinctes. Un mandat parti
   * et jamais revenu est le cas que le cabinet a intérêt à voir : c'est du
   * travail en cours sans contrat signé. */
  const { envoyeAt, signeAt, verseAuDossierAt } = fiche.mandat;
  if (!signeAt) {
    ouverts.push(
      envoyeAt
        ? {
            cle: "mandat_envoye_non_signe",
            libelle: "Mandat envoyé, jamais signé en retour",
            gravite: "manquant",
          }
        : {
            cle: "mandat_absent",
            libelle: "Aucun mandat déclaré",
            gravite: "manquant",
          },
    );
  } else if (!verseAuDossierAt) {
    ouverts.push({
      cle: "mandat_non_verse",
      libelle: "Copie signée du mandat non versée au dossier",
      gravite: "a_surveiller",
    });
  }

  /* ── Échéances ───────────────────────────────────────────────────────────
   * Uniquement pour un dossier en cours : une affaire terminée n'a plus de
   * date qui court, et la réclamer produirait une alerte permanente et fausse.
   *
   * Le silence n'est pas une réponse. Tant que le cabinet n'a ni saisi une
   * date ni confirmé qu'il n'y en a aucune, SAFE afficherait un calme dont
   * personne ne répond. */
  if (fiche.dossierEnCours && fiche.nombreDatesQuiCourent === 0 && !fiche.aucuneDateConfirmee) {
    ouverts.push({
      cle: "dates_inconnues",
      libelle: "Aucune échéance saisie, et aucune confirmation qu'il n'y en a pas",
      gravite: "a_surveiller",
    });
  }

  /* ── Consentement (Loi 25) ───────────────────────────────────────────── */
  if (!fiche.consentementAt) {
    ouverts.push({
      cle: "consentement",
      libelle: "Consentement à la collecte non consigné",
      gravite: "a_surveiller",
    });
  }

  return trierParGravite(ouverts);
}

/** `manquant` d'abord, puis `a_surveiller`, chaque groupe dans son ordre d'ajout. */
function trierParGravite(elements: ElementOuvert[]): ElementOuvert[] {
  const rang: Record<GraviteElement, number> = { manquant: 0, a_surveiller: 1 };
  return [...elements].sort((a, b) => rang[a.gravite] - rang[b.gravite]);
}

/** Une fiche est complète quand plus rien n'est ouvert. Elle reste enregistrable avant. */
export function ficheComplete(fiche: FicheEntree): boolean {
  return elementsOuverts(fiche).length === 0;
}

/* ════════════════════════════════════════════════════════════════
   FIDÉICOMMIS : CE QUI EST DÉCLARÉ CONTRE CE QUI EST À LA BANQUE
   ════════════════════════════════════════════════════════════════ */

export type StatutEcartFideicommis =
  /** Le déclaré et le relevé tombent juste. */
  | "equilibre"
  /** Le relevé porte plus que la somme des clients : il manque un client, ou une somme s'explique. */
  | "reste_a_attribuer"
  /** Les clients totalisent plus que le relevé. Anomalie sérieuse : un découvert se prépare. */
  | "trop_attribue"
  /** Aucun relevé saisi : on additionne sans rien conclure. */
  | "releve_absent";

export interface EcartFideicommis {
  totalDeclare: number;
  soldeReleve: number | null;
  /** Relevé moins déclaré. `null` tant qu'aucun relevé n'est saisi. */
  ecart: number | null;
  statut: StatutEcartFideicommis;
}

/**
 * Arrondi au cent.
 *
 * Les montants sont des `Float` en base, hérités du schéma d'origine.
 * Additionner trente soldes en virgule flottante produit des queues de
 * comparaison du genre 11399,999999999998, et l'écran annoncerait un écart de
 * deux millièmes de cent là où tout tombe juste. On arrondit donc à chaque
 * total, pas seulement à l'affichage : c'est le total qui sert de verdict.
 */
function auCent(montant: number): number {
  return Math.round(montant * 100) / 100;
}

/**
 * Compare la somme des fidéicommis déclarés client par client au solde du
 * relevé bancaire.
 *
 * C'est le contrôle qui sauve la reprise. Un cabinet qui entre ses clients
 * sans lui obtient un registre de fidéicommis plausible et faux, et c'est le
 * registre que le Barreau inspecte. L'écart doit se refermer à la fin ; s'il
 * reste, il y a un client oublié ou une somme à expliquer.
 */
export function ecartFideicommis(params: {
  /** Les soldes déclarés, un par client. Les clients sans fonds n'y figurent pas. */
  declares: number[];
  /** Solde du compte en fidéicommis au relevé. `null` si le cabinet ne l'a pas saisi. */
  soldeReleve: number | null;
}): EcartFideicommis {
  const totalDeclare = auCent(params.declares.reduce((somme, montant) => somme + montant, 0));

  if (params.soldeReleve === null) {
    return { totalDeclare, soldeReleve: null, ecart: null, statut: "releve_absent" };
  }

  const soldeReleve = auCent(params.soldeReleve);
  const ecart = auCent(soldeReleve - totalDeclare);

  const statut: StatutEcartFideicommis =
    ecart === 0 ? "equilibre" : ecart > 0 ? "reste_a_attribuer" : "trop_attribue";

  return { totalDeclare, soldeReleve, ecart, statut };
}

/* ════════════════════════════════════════════════════════════════
   AVANCEMENT
   ════════════════════════════════════════════════════════════════ */

export interface ProgressionEntree {
  entres: number;
  misDeCote: number;
  /** `null` quand aucun objectif n'a été posé. */
  restants: number | null;
  /** Entier de 0 à 100. `null` quand aucun objectif n'a été posé. */
  pourcentage: number | null;
}

/**
 * Avancement de la reprise.
 *
 * `objectif` est déclaratif : le cabinet annonce « j'ai trente clients ». Il
 * peut se tromper, et il se trompera. D'où deux garde-fous : un objectif
 * absent ne produit aucun dénominateur inventé, et un nombre d'entrées
 * supérieur à l'objectif ne produit ni reste négatif ni pourcentage au-dessus
 * de cent. Une barre de progression qui déborde est le genre de détail qui
 * fait douter de tout le reste de l'écran.
 */
export function progressionEntree(params: {
  entres: number;
  misDeCote: number;
  objectif: number | null;
}): ProgressionEntree {
  const { entres, misDeCote } = params;
  const objectif = params.objectif !== null && params.objectif > 0 ? params.objectif : null;

  if (objectif === null) {
    return { entres, misDeCote, restants: null, pourcentage: null };
  }

  return {
    entres,
    misDeCote,
    restants: Math.max(0, objectif - entres),
    pourcentage: Math.min(100, Math.round((entres / objectif) * 100)),
  };
}
