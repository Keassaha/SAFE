import type { FactureRepriseSaisie } from "@/lib/services/reprise-historique/construire-lot";

/**
 * Ce qui empêche de verser une facture, et ce qui mérite d'être dit avant.
 *
 * Le service refuse déjà l'impossible, mais il le refuse APRÈS le clic, une
 * fois l'attente passée et le lot à moitié écrit. Ces contrôles disent la même
 * chose AVANT, carte par carte, pour qu'on sache quoi corriger.
 *
 * Deux niveaux, et la distinction compte :
 *
 * - **bloquant** : écrire produirait une fiche fausse ou un déchet (un client
 *   nommé « Client sans nom lu », une facture sans montant). On refuse.
 * - **avertissement** : on peut verser, mais quelque chose n'a pas été lu et le
 *   cabinet doit le savoir. Une ligne de détail manquante ne fausse pas la
 *   facture, dont le total vient du papier, mais elle manquera au dossier.
 */

export interface ControleFacture {
  bloquants: string[];
  avertissements: string[];
}

export interface ContexteControle {
  /** Empreintes des fichiers déjà présents dans le lot, dans l'ordre de dépôt. */
  empreintesDuLot?: { id: string; hash?: string }[];
  /** Numéros lus sur les autres factures du lot, dans l'ordre de dépôt. */
  numerosDuLot?: { id: string; numero: string | null }[];
  /** Montant reçu saisi pour une facture partielle. */
  montantPaye?: number | null;
  /** Injectable pour les tests. Par défaut, le jour même. */
  aujourdhui?: Date;
}

/** Un exercice « précédent » ne commence pas avant l'informatique de bureau. */
const ANNEE_PLANCHER = 1990;

/** Nom que le rapprochement donne à un client dont la facture n'a rien dit. */
const NOM_ILLISIBLE = "Client sans nom lu";

function arrondir(montant: number): number {
  return Math.round(montant * 100) / 100;
}

/**
 * La lecture nomme les champs comme le fait le code (`dossierIntitule`), ce qui
 * ne veut rien dire pour une avocate. On les dit en français, et on laisse
 * passer tel quel ce qu'on ne connaît pas plutôt que de l'escamoter.
 */
const NOM_DES_CHAMPS: Record<string, string> = {
  numeroFacture: "le numéro de facture",
  clientNom: "le nom du client",
  dossierIntitule: "l'objet du mandat",
  dateEmission: "la date d'émission",
  montantTotal: "le montant total",
  taxes: "les taxes",
  tps: "la TPS",
  tvq: "la TVQ",
  lignes: "le détail des prestations",
  heures: "les heures",
  tauxHoraire: "le taux horaire",
  "taux horaire": "le taux horaire",
  montant: "un montant",
  description: "une description",
  date: "une date",
};

function enFrancais(champ: string): string {
  return NOM_DES_CHAMPS[champ] ?? NOM_DES_CHAMPS[champ.trim()] ?? champ;
}

export function controlerFacture(
  facture: FactureRepriseSaisie,
  contexte: ContexteControle = {},
): ControleFacture {
  const bloquants: string[] = [];
  const avertissements: string[] = [];
  const { extraction, match, statutPaiement } = facture;

  // ── Ce sans quoi on n'écrit pas ───────────────────────────────────────────
  if (extraction.montantTotal === null) {
    bloquants.push("Le montant total n'a pas été lu. Sans lui, la facture ne veut rien dire.");
  } else if (extraction.montantTotal <= 0) {
    bloquants.push("Le montant total lu est nul ou négatif : un chiffre a été mal lu.");
  }
  if (!extraction.dateEmission) {
    bloquants.push("La date d'émission n'a pas été lue. Indiquez-la pour ranger la facture.");
  } else {
    // Une reprise regarde le passé. Une date à venir, ou d'avant l'informatique
    // de bureau, est une année mal lue, pas une facture exotique.
    const aujourdhui = contexte.aujourdhui ?? new Date();
    const emission = new Date(`${extraction.dateEmission}T00:00:00.000Z`);
    const jourMeme = new Date(
      Date.UTC(aujourdhui.getUTCFullYear(), aujourdhui.getUTCMonth(), aujourdhui.getUTCDate()),
    );
    if (emission.getTime() > jourMeme.getTime()) {
      bloquants.push(
        `La date lue (${extraction.dateEmission}) est dans le futur : un exercice précédent est derrière nous.`,
      );
    } else if (emission.getUTCFullYear() < ANNEE_PLANCHER) {
      bloquants.push(`L'année lue (${emission.getUTCFullYear()}) est invraisemblable : relisez la date.`);
    }
  }
  if (match.client.statut === "nouveau" && match.client.clientNom === NOM_ILLISIBLE) {
    bloquants.push(
      "Le nom du client n'a pas été lu. Verser créerait une fiche sans nom : corrigez-le d'abord.",
    );
  }

  // ── Le statut de paiement, qui se demande et ne se devine pas ────────────
  if (!statutPaiement) {
    bloquants.push("Dites si cette facture a été payée.");
  } else if (statutPaiement !== "impayee") {
    if (!facture.datePaiement) {
      bloquants.push(
        statutPaiement === "payee" ? "Indiquez la date du paiement." : "Indiquez la date de réception.",
      );
    } else if (extraction.dateEmission && facture.datePaiement < extraction.dateEmission) {
      // Un client ne règle pas une facture avant qu'elle existe.
      bloquants.push(
        `Le paiement (${facture.datePaiement}) précède la facture (${extraction.dateEmission}) : une des deux dates a été mal lue.`,
      );
    }
    if (statutPaiement === "partielle") {
      const paye = contexte.montantPaye ?? null;
      if (paye === null || paye <= 0) {
        bloquants.push("Indiquez le montant réellement reçu.");
      } else if (extraction.montantTotal !== null && paye >= extraction.montantTotal) {
        bloquants.push(
          "Le montant reçu atteint le total : la facture est payée, pas partielle.",
        );
      }
    }
  }

  // ── Le même fichier déposé deux fois avant d'avoir été versé ─────────────
  // L'anti-doublon de la base ne voit que ce qui est déjà écrit : dans un lot
  // pas encore versé, il ne verrait rien passer.
  const empreintes = contexte.empreintesDuLot ?? [];
  const moi = empreintes.find((e) => e.id === facture.id);
  if (moi?.hash) {
    const premier = empreintes.find((e) => e.hash === moi.hash);
    if (premier && premier.id !== facture.id) {
      bloquants.push("Ce fichier est déjà dans le dépôt : retirez-en un des deux.");
    }
  }

  // ── Le total et le détail doivent se répondre ───────────────────────────
  // Un chiffre mal lu (528 devenu 5 280) ne se voit nulle part ailleurs : la
  // facture s'écrit, le journal suit, et l'erreur dort. Ici elle parle.
  const lignesLues = extraction.lignes.filter((l) => l.montant !== null);
  const toutesLignesLues = lignesLues.length === extraction.lignes.length;
  if (extraction.montantTotal !== null && lignesLues.length > 0 && toutesLignesLues) {
    const sommeLignes = arrondir(lignesLues.reduce((s, l) => s + (l.montant as number), 0));
    const taxesLues = arrondir((extraction.tps ?? 0) + (extraction.tvq ?? 0));
    const ecart = arrondir(extraction.montantTotal - sommeLignes - taxesLues);
    if (Math.abs(ecart) >= 0.02) {
      avertissements.push(
        taxesLues > 0
          ? `Le détail ne tombe pas sur le total : ${sommeLignes} + ${taxesLues} de taxes ne font pas ${extraction.montantTotal} (écart de ${arrondir(Math.abs(ecart))}). Le total du papier fera foi.`
          : `Le détail ne tombe pas sur le total : les lignes font ${sommeLignes}, la facture dit ${extraction.montantTotal} (écart de ${arrondir(Math.abs(ecart))}). Si la facture porte des taxes, elles n'ont pas été lues.`,
      );
    }
  }
  const ligneTropGrosse = extraction.montantTotal !== null
    ? lignesLues.find((l) => (l.montant as number) > extraction.montantTotal!)
    : undefined;
  if (ligneTropGrosse) {
    avertissements.push(
      `La ligne « ${ligneTropGrosse.description} » dépasse le total de la facture : un chiffre a sans doute été mal lu.`,
    );
  }

  // ── Deux factures du lot qui portent le même numéro ─────────────────────
  const numeros = contexte.numerosDuLot ?? [];
  const monNumero = numeros.find((n) => n.id === facture.id)?.numero;
  if (monNumero) {
    const premier = numeros.find((n) => n.numero === monNumero);
    if (premier && premier.id !== facture.id) {
      bloquants.push(
        `Une autre facture du dépôt porte déjà le numéro ${monNumero} : soit c'est la même, soit un numéro a été mal lu.`,
      );
    }
  }

  // ── Ce qu'on peut verser, mais qu'il faut dire ──────────────────────────
  const lignesSansMontant = extraction.lignes.filter((l) => l.montant === null).length;
  if (lignesSansMontant > 0) {
    avertissements.push(
      lignesSansMontant === 1
        ? "Une ligne n'a pas de montant lisible : elle ne sera pas reprise au détail."
        : `${lignesSansMontant} lignes n'ont pas de montant lisible : elles ne seront pas reprises au détail.`,
    );
  }
  if (extraction.lignes.length === 0) {
    avertissements.push("Aucune ligne de détail n'a été lue : seul le total sera repris.");
  }
  if (extraction.champsIllisibles.length > 0) {
    avertissements.push(
      `À vérifier sur la facture : ${extraction.champsIllisibles.map(enFrancais).join(", ")}.`,
    );
  }
  if (extraction.confianceOcr === "basse") {
    avertissements.push("La facture se lit mal : relisez les montants avant de verser.");
  }
  if (!extraction.numeroFacture) {
    avertissements.push("Le numéro de facture n'a pas été lu : SAFE lui en donnera un.");
  }

  return { bloquants, avertissements };
}

/** Une facture est versable quand rien ne la bloque. */
export function versable(controle: ControleFacture): boolean {
  return controle.bloquants.length === 0;
}
