"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canCreateClients } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import {
  enregistrerEntreeClient,
  EntreeClientError,
  type EcheanceEntree,
  type PartieEntree,
} from "@/lib/services/entree-client/enregistrer-entree-client";
import type { EtatIdentite } from "@/lib/clients/entree-client";

/**
 * Traduit le formulaire d'entrée en appel de service.
 *
 * Cette couche ne décide de rien. Elle lit des chaînes, les convertit, et
 * laisse le service refuser ce qui doit l'être. Toute règle métier écrite ici
 * serait une seconde vérité, invérifiable par les tests du service.
 */

/** Une date de formulaire vide vaut « non déclaré », jamais « aujourd'hui ». */
function dateOuNull(valeur: FormDataEntryValue | null): Date | null {
  if (typeof valeur !== "string") return null;
  const texte = valeur.trim();
  if (!texte) return null;
  const date = new Date(texte);
  return Number.isNaN(date.getTime()) ? null : date;
}

function texteOuNull(valeur: FormDataEntryValue | null): string | null {
  return typeof valeur === "string" && valeur.trim() ? valeur.trim() : null;
}

/**
 * Lit un montant saisi à la québécoise.
 *
 * « 1 500,00 $ » doit valoir 1500. Sans ce nettoyage, `Number()` rend `NaN`,
 * et un solde de fidéicommis perdu en silence est exactement le genre d'erreur
 * que tout ce chantier cherche à empêcher. Les espaces insécables comptent :
 * c'est ce que produit un copier-coller depuis un relevé.
 */
function montantOuNull(valeur: FormDataEntryValue | null): number | null {
  if (typeof valeur !== "string") return null;
  const nettoye = valeur
    .replace(/[\s  ]/g, "")
    .replace(/\$/g, "")
    .replace(",", ".");
  if (!nettoye) return null;
  const nombre = Number(nettoye);
  return Number.isFinite(nombre) ? nombre : null;
}

/** Les échéances arrivent en lignes parallèles : `echeanceDate[]` et `echeanceLibelle[]`. */
function lireEcheances(formData: FormData): EcheanceEntree[] {
  const dates = formData.getAll("echeanceDate");
  const libelles = formData.getAll("echeanceLibelle");
  const echeances: EcheanceEntree[] = [];
  for (let i = 0; i < dates.length; i += 1) {
    const date = dateOuNull(dates[i]);
    const libelle = texteOuNull(libelles[i] ?? null);
    // Une ligne à moitié remplie est ignorée plutôt que refusée : elle vient
    // d'un champ ajouté puis abandonné, pas d'une erreur à signaler.
    if (date && libelle) echeances.push({ date, libelle });
  }
  return echeances;
}

function lireParties(formData: FormData): PartieEntree[] {
  const noms = formData.getAll("partieNom");
  const roles = formData.getAll("partieRole");
  const parties: PartieEntree[] = [];
  for (let i = 0; i < noms.length; i += 1) {
    const nom = texteOuNull(noms[i] ?? null);
    if (!nom) continue;
    const role = roles[i] === "tiers" ? "tiers" : "partie_adverse";
    parties.push({ nomAffiche: nom, role });
  }
  return parties;
}

export async function enregistrerEntree(formData: FormData) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canCreateClients(role as UserRole)) {
    redirect("/clients/entree?erreur=droits");
  }

  const etatIdentite = ((): EtatIdentite => {
    const brut = formData.get("identiteEtat");
    return brut === "VERIFIEE" || brut === "EXEMPTEE" ? brut : "A_FAIRE";
  })();

  const montantFonds =
    formData.get("detientFonds") === "oui" ? montantOuNull(formData.get("fondsMontant")) : null;
  const arreteAu = dateOuNull(formData.get("fondsArreteAu"));

  const terminee = formData.get("intention") !== "mettre_de_cote";

  try {
    const resultat = await enregistrerEntreeClient({
      cabinetId,
      utilisateurId: userId,
      clientId: texteOuNull(formData.get("clientId")),
      identite: {
        typeClient:
          formData.get("typeClient") === "personne_morale" ? "personne_morale" : "personne_physique",
        prenom: texteOuNull(formData.get("prenom")),
        nom: texteOuNull(formData.get("nom")),
        raisonSociale: texteOuNull(formData.get("raisonSociale")),
        occupation: texteOuNull(formData.get("occupation")),
        natureActivites: texteOuNull(formData.get("natureActivites")),
        email: texteOuNull(formData.get("email")),
        telephone: texteOuNull(formData.get("telephone")),
        langue: texteOuNull(formData.get("langue")),
      },
      dossier: {
        intitule: (texteOuNull(formData.get("dossierIntitule")) ?? "").trim(),
        enCours: formData.get("dossierEtat") !== "termine",
        tauxHoraire: montantOuNull(formData.get("tauxHoraire")),
        objetDuMandat: texteOuNull(formData.get("objetDuMandat")),
      },
      mandatEnvoyeAt: dateOuNull(formData.get("mandatEnvoyeAt")),
      mandatSigneAt: dateOuNull(formData.get("mandatSigneAt")),
      mandatVerseAuDossierAt: dateOuNull(formData.get("mandatVerseAt")),
      conflitsVerifieAt: dateOuNull(formData.get("conflitsVerifieAt")),
      conflitsNotes: texteOuNull(formData.get("conflitsNotes")),
      consentementAt: dateOuNull(formData.get("consentementAt")),
      verificationIdentite: {
        etat: etatIdentite,
        faiteLe: dateOuNull(formData.get("identiteFaiteLe")),
        pieceVue: texteOuNull(formData.get("identitePiece")),
        ouConservee: texteOuNull(formData.get("identiteOuConservee")),
        motifExemption: texteOuNull(formData.get("identiteMotifExemption")),
      },
      fondsDetenus:
        montantFonds !== null
          ? {
              montant: montantFonds,
              // Sans date de relevé, le solde ne se rapproche de rien. On prend
              // le jour même plutôt que de refuser : le cabinet corrigera, et
              // une somme consignée vaut mieux qu'une somme perdue.
              arreteAu: arreteAu ?? new Date(),
              recuATitreDe: texteOuNull(formData.get("fondsTitre")),
            }
          : null,
      echeances: lireEcheances(formData),
      aucuneDateConfirmee: formData.get("aucuneDate") === "on",
      parties: lireParties(formData),
      terminee,
    });

    revalidatePath("/clients");
    revalidatePath("/clients/entree");

    // Terminé : on repart sur une fiche vierge, prêt pour le suivant. Mis de
    // côté : on retourne au registre, la fiche reste dans la file.
    redirect(
      terminee
        ? `/clients/entree?enregistre=${resultat.clientId}`
        : `/clients?misDeCote=${resultat.clientId}`,
    );
  } catch (error) {
    if (error instanceof EntreeClientError) {
      redirect(`/clients/entree?erreur=${error.code}`);
    }
    throw error;
  }
}
