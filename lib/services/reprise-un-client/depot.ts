/**
 * « Reprendre un client », version 4 (validée le 2026-10-01) : tout commence
 * par un dépôt de factures, et un dépôt ne concerne qu'UN client.
 *
 * Module PUR, testé sans base. Il décide :
 *   - de quel client parle le dépôt, et quelles factures n'en sont pas ;
 *   - si ce client est déjà au cabinet, et dans quel mandat ranger ;
 *   - si la fiche contredit ce qui est imprimé sur la facture ;
 *   - si une facture doit s'ouvrir d'emblée en correction (la lecture a hésité) ;
 *   - ce qui reste à compléter sur la fiche une fois le client repris.
 *
 * Spec : docs/product/SPEC_REPRISE_UN_CLIENT_A_LA_FOIS.md, §10.
 */

import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";
import { cleCroisement } from "@/lib/clients/croisement-conflits";
import {
  intitulesSeRecoupent,
  normaliseIntitule,
  ressemblancesClient,
} from "@/lib/services/reprise-historique/matcher";
import type { ClientConnu, MandatConnu } from "@/lib/services/reprise-un-client/contexte";
import type { ControleSaisie } from "@/lib/services/reprise-un-client/saisie";

/* ════════════════════════════════════════════════════════════════
   DE QUEL CLIENT PARLE CE DÉPÔT ?
   ════════════════════════════════════════════════════════════════ */

export interface FactureLue {
  id: string;
  /** `null` : la lecture n'a rien donné. La facture reste dans le dépôt. */
  extraction: PastInvoiceExtraction | null;
}

export interface ClientDuDepot {
  /** Le nom retenu, tel qu'imprimé. `null` si aucune facture ne le porte lisiblement. */
  nom: string | null;
  adresse: string | null;
  courriel: string | null;
  telephone: string | null;
  /** L'objet de mandat le plus fréquent parmi les factures retenues. */
  mandat: string | null;
  /** Factures de ce client, dans l'ordre du dépôt. */
  retenues: string[];
  /** Factures adressées à quelqu'un d'autre : écartées, jamais versées en silence. */
  ecartees: { id: string; nomLu: string }[];
}

function lePlusFrequent(valeurs: { cle: string; valeur: string }[]): string | null {
  const compte = new Map<string, { n: number; valeur: string; rang: number }>();
  valeurs.forEach((v, rang) => {
    const c = compte.get(v.cle);
    if (c) c.n += 1;
    else compte.set(v.cle, { n: 1, valeur: v.valeur, rang });
  });
  let meilleur: { n: number; valeur: string; rang: number } | null = null;
  for (const c of compte.values()) {
    // À égalité, la première facture déposée l'emporte : elle a été choisie en premier.
    if (!meilleur || c.n > meilleur.n || (c.n === meilleur.n && c.rang < meilleur.rang)) meilleur = c;
  }
  return meilleur?.valeur ?? null;
}

/**
 * Un dépôt ne concerne qu'un client (décision CEO du 2026-10-01).
 *
 * Le client retenu est le nom le plus fréquent ; à égalité, celui de la
 * première facture. Une facture qui porte un AUTRE nom est écartée et nommée,
 * pour que la personne la rattache d'un clic si ce n'est qu'une coquille. Une
 * facture sans nom lisible reste dans le dépôt : rien ne la contredit, et la
 * personne a déclaré déposer les factures d'un seul client.
 */
export function clientDuDepot(factures: FactureLue[]): ClientDuDepot {
  const nommees = factures
    .filter((f) => f.extraction?.clientNom?.trim())
    .map((f) => ({ id: f.id, nom: (f.extraction as PastInvoiceExtraction).clientNom!.trim() }));

  const nom = lePlusFrequent(nommees.map((f) => ({ cle: cleCroisement(f.nom), valeur: f.nom })));
  const cleRetenue = nom ? cleCroisement(nom) : null;

  const ecartees = nommees
    .filter((f) => cleRetenue !== null && cleCroisement(f.nom) !== cleRetenue)
    .map((f) => ({ id: f.id, nomLu: f.nom }));
  const idsEcartes = new Set(ecartees.map((e) => e.id));
  const retenues = factures.filter((f) => !idsEcartes.has(f.id)).map((f) => f.id);

  const extractionsRetenues = factures
    .filter((f) => !idsEcartes.has(f.id) && f.extraction)
    .map((f) => f.extraction as PastInvoiceExtraction);
  const premier = (cle: "clientAdresse" | "clientCourriel" | "clientTelephone") =>
    extractionsRetenues.map((e) => e[cle]?.trim()).find(Boolean) ?? null;

  const mandat = lePlusFrequent(
    extractionsRetenues
      .map((e) => e.dossierIntitule?.trim())
      .filter((v): v is string => Boolean(v))
      .map((v) => ({ cle: normaliseIntitule(v), valeur: v })),
  );

  return {
    nom,
    adresse: premier("clientAdresse"),
    courriel: premier("clientCourriel"),
    telephone: premier("clientTelephone"),
    mandat,
    retenues,
    ecartees,
  };
}

/* ════════════════════════════════════════════════════════════════
   CE CLIENT EST-IL DÉJÀ AU CABINET ?
   ════════════════════════════════════════════════════════════════ */

export type ReconnaissanceClient =
  | { statut: "connu"; client: ClientConnu }
  | { statut: "nouveau"; proches: { id: string; nom: string }[] };

/**
 * Un nom IDENTIQUE (casse, accents, ponctuation et ordre des mots mis à part)
 * est reconnu d'office : c'est « documenté ». Un nom seulement PROCHE est
 * proposé, jamais rattaché seul : une coquille et un homonyme se ressemblent,
 * et confondre deux clients d'un cabinet a des conséquences réelles.
 */
export function reconnaitreClient(nomLu: string | null, clients: ClientConnu[]): ReconnaissanceClient {
  const cle = cleCroisement(nomLu);
  if (!cle) return { statut: "nouveau", proches: [] };
  const exact = clients.find((c) => cleCroisement(c.nom) === cle);
  if (exact) return { statut: "connu", client: exact };
  const proches = ressemblancesClient(
    nomLu,
    clients.map((c) => ({ id: c.id, nom: c.nom, dossiers: [] })),
  ).map((r) => ({ id: r.clientId, nom: r.nom }));
  return { statut: "nouveau", proches };
}

/**
 * Le mandat dans lequel ranger : celui dont l'intitulé recoupe l'objet lu
 * (même règle prudente que la reprise en lot : « Divorce » ne recoupe pas
 * « Divorce 2 »). Sinon un mandat en cours s'il n'y en a qu'un. Sinon aucun :
 * la personne choisit, ou un nouveau mandat est proposé avec l'objet lu.
 */
export function reconnaitreMandat(objetLu: string | null, mandats: MandatConnu[]): MandatConnu | null {
  if (objetLu?.trim()) {
    const recoupe = mandats.find((m) => intitulesSeRecoupent(m.intitule, objetLu));
    if (recoupe) return recoupe;
    // Un objet lu qui ne recoupe aucun mandat désigne un NOUVEAU mandat.
    return null;
  }
  const enCours = mandats.filter((m) => m.enCours);
  return enCours.length === 1 ? enCours[0] : null;
}

/* ════════════════════════════════════════════════════════════════
   LA FICHE CONTREDIT-ELLE LA FACTURE ?
   ════════════════════════════════════════════════════════════════ */

function plat(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type ComparaisonCoordonnee = "rien" | "identique" | "a_ajouter" | "differente";

/**
 * Compare une coordonnée imprimée sur la facture à celle de la fiche.
 * La fiche n'est JAMAIS remplacée en silence : la différence est montrée, et
 * c'est la personne qui décide de mettre la fiche à jour.
 */
export function comparerCoordonnee(lue: string | null, fiche: string | null): ComparaisonCoordonnee {
  const l = lue ? plat(lue) : "";
  const f = fiche ? plat(fiche) : "";
  if (!l) return "rien";
  if (!f) return "a_ajouter";
  // Une adresse de fiche plus complète (code postal en plus) n'est pas une différence.
  if (l === f || f.includes(l) || l.includes(f)) return "identique";
  return "differente";
}

/* ════════════════════════════════════════════════════════════════
   RELEVÉ OU CORRECTION ?
   ════════════════════════════════════════════════════════════════ */

/**
 * Premier correctif de la version 4. Une lecture sûre s'affiche en relevé, et
 * « Corriger » reste à un clic. Une lecture qui a hésité s'ouvre d'emblée en
 * correction : sur un mauvais scan, imposer un clic par facture pour corriger
 * ce qu'on sait déjà douteux serait une perte de temps répétée.
 */
export function ouvrirEnCorrection(params: {
  lectureEchouee?: boolean;
  saisieALaMain: boolean;
  extraction: PastInvoiceExtraction | null;
  controle: ControleSaisie;
}): boolean {
  if (params.lectureEchouee || params.saisieALaMain || !params.extraction) return true;
  if (params.extraction.confianceOcr !== "haute") return true;
  if (params.extraction.champsIllisibles.length > 0) return true;
  // Le paiement se choisit dans les deux présentations : seuls les défauts du
  // papier lui-même justifient d'ouvrir en correction.
  const defautsDuPapier = params.controle.bloquants.filter(
    (b) => !["STATUT_MANQUANT", "DATE_PAIEMENT_MANQUANTE", "MODE_MANQUANT", "MONTANT_RECU_MANQUANT", "MONTANT_RECU_ATTEINT_TOTAL", "PAIEMENT_AVANT_EMISSION", "PAIEMENT_FUTUR"].includes(b.code),
  );
  if (defautsDuPapier.length > 0) return true;
  return params.controle.avertissements.some((a) => a.code === "ECART_DETAIL");
}

/* ════════════════════════════════════════════════════════════════
   CE QUI RESTE À COMPLÉTER SUR LA FICHE
   ════════════════════════════════════════════════════════════════ */

export type ResteACompleter = "IDENTITE" | "FIDEICOMMIS";

/**
 * Second correctif de la version 4. L'identité et le fidéicommis ont quitté
 * le parcours pour l'alléger ; ils reviennent ICI, nommés, une fois le client
 * repris. Un solde en fidéicommis oublié, c'est un registre faux, et la
 * responsabilité de l'avocat devant le Barreau.
 */
export function resteACompleter(params: {
  identiteVerifiee: boolean;
  soldeFideicommisDeclare: boolean;
}): ResteACompleter[] {
  const reste: ResteACompleter[] = [];
  if (!params.identiteVerifiee) reste.push("IDENTITE");
  if (!params.soldeFideicommisDeclare) reste.push("FIDEICOMMIS");
  return reste;
}
