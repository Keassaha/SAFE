import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { accesRepriseUnClient } from "@/lib/services/reprise-un-client/acces";
import {
  PreparerMandatError,
  preparerClientEtMandat,
  type PreparerMandatParams,
  type SectionsMandat,
} from "@/lib/services/reprise-un-client/preparer-mandat";
import type { EtatIdentite } from "@/lib/clients/entree-client";

export const dynamic = "force-dynamic";

/* Le corps arrive du navigateur : chaque champ est relu, jamais cru. */

const texte = (v: unknown, max = 500): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

const nombre = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

function date(v: unknown): Date | null {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const objet = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

function lireSections(brut: unknown): SectionsMandat {
  const s = objet(brut) ?? {};
  const sections: SectionsMandat = {};

  const identite = objet(s.identite);
  const etat = identite?.etat;
  if (identite && (etat === "VERIFIEE" || etat === "EXEMPTEE" || etat === "A_FAIRE")) {
    sections.verificationIdentite = {
      etat: etat as EtatIdentite,
      faiteLe: date(identite.faiteLe),
      pieceVue: texte(identite.pieceVue),
      ouConservee: texte(identite.ouConservee),
      motifExemption: texte(identite.motifExemption),
    };
  }

  const fonds = objet(s.fonds);
  const montant = nombre(fonds?.montant);
  const arreteAu = date(fonds?.arreteAu);
  if (fonds && montant !== null && arreteAu) {
    sections.fondsDetenus = { montant, arreteAu, recuATitreDe: texte(fonds.recuATitreDe) };
  }

  if (Array.isArray(s.echeances)) {
    sections.echeances = s.echeances
      .map(objet)
      .map((e) => ({ date: date(e?.date), libelle: texte(e?.libelle) }))
      .filter((e): e is { date: Date; libelle: string } => Boolean(e.date && e.libelle));
  }

  if (Array.isArray(s.parties)) {
    sections.parties = s.parties
      .map(objet)
      .map((p) => ({
        nomAffiche: texte(p?.nomAffiche),
        role: p?.role === "partie_adverse" ? ("partie_adverse" as const) : ("tiers" as const),
      }))
      .filter((p): p is { nomAffiche: string; role: "partie_adverse" | "tiers" } => Boolean(p.nomAffiche));
  }

  return sections;
}

/**
 * Obtient le client et le mandat sur lesquels verser les factures.
 * Appelé à l'enregistrement de la première facture, ou à « Terminer » pour un
 * client repris sans aucune facture.
 */
export async function POST(request: Request) {
  const acces = await accesRepriseUnClient();
  if (acces instanceof NextResponse) return acces;

  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const clientBrut = objet(corps.client);
  const mandatBrut = objet(corps.mandat);
  if (!clientBrut || !mandatBrut) {
    return NextResponse.json({ error: "Client ou mandat manquant." }, { status: 400 });
  }

  let client: PreparerMandatParams["client"];
  const clientId = texte(clientBrut.id, 64);
  const nouveauClient = objet(clientBrut.nouveau);
  if (clientId) {
    client = { id: clientId };
  } else if (nouveauClient) {
    client = {
      nouveau: {
        typeClient: nouveauClient.typeClient === "personne_physique" ? "personne_physique" : "personne_morale",
        raisonSociale: texte(nouveauClient.raisonSociale),
        prenom: texte(nouveauClient.prenom),
        nom: texte(nouveauClient.nom),
        occupation: texte(nouveauClient.occupation),
        natureActivites: texte(nouveauClient.natureActivites),
        email: texte(nouveauClient.email, 200),
        telephone: texte(nouveauClient.telephone, 40),
        langue: texte(nouveauClient.langue, 40),
        adresse: texte(nouveauClient.adresse),
      },
    };
  } else {
    return NextResponse.json({ error: "Client manquant." }, { status: 400 });
  }

  let mandat: PreparerMandatParams["mandat"];
  const mandatId = texte(mandatBrut.id, 64);
  const nouveauMandat = objet(mandatBrut.nouveau);
  if (mandatId) {
    mandat = { id: mandatId };
  } else if (nouveauMandat) {
    mandat = {
      nouveau: {
        intitule: texte(nouveauMandat.intitule, 300) ?? "",
        objetDuMandat: texte(nouveauMandat.objetDuMandat, 1000),
        tauxHoraire: nombre(nouveauMandat.tauxHoraire),
        enCours: nouveauMandat.enCours !== false,
        dateOuverture: date(nouveauMandat.dateOuverture),
        avocatResponsableId: texte(nouveauMandat.avocatResponsableId, 64),
      },
    };
  } else {
    return NextResponse.json({ error: "Mandat manquant." }, { status: 400 });
  }

  try {
    const resultat = await preparerClientEtMandat({
      cabinetId: acces.cabinetId,
      utilisateurId: acces.userId,
      client,
      mandat,
      conflitsVerifies: corps.conflitsVerifies === true,
      sections: lireSections(corps.sections),
    });
    revalidatePath("/clients");
    return NextResponse.json(resultat);
  } catch (err) {
    if (err instanceof PreparerMandatError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("Préparation du client et du mandat échouée :", err);
    return NextResponse.json(
      { error: "Une panne technique a empêché d'enregistrer le client. Rien n'a été créé." },
      { status: 500 },
    );
  }
}
