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
  /** Montant reçu saisi pour une facture partielle. */
  montantPaye?: number | null;
}

/** Nom que le rapprochement donne à un client dont la facture n'a rien dit. */
const NOM_ILLISIBLE = "Client sans nom lu";

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
  }
  if (!extraction.dateEmission) {
    bloquants.push("La date d'émission n'a pas été lue. Indiquez-la pour ranger la facture.");
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
    avertissements.push(`À vérifier sur la facture : ${extraction.champsIllisibles.join(", ")}.`);
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
