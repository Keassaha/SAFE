"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeInternalUser } from "@/lib/safe-inc";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { attachDemandeSiteToCrm } from "@/lib/crm/lead-from-demande";

/**
 * Actions de la file des demandes.
 *
 * La garde est refaite ici, et pas seulement dans le layout : une action de
 * serveur s'appelle par le réseau, elle ne passe pas par le layout de la page
 * qui l'a affichée. Sans ce contrôle, n'importe quel compte authentifié
 * pourrait changer l'état d'une demande.
 */

type Resultat = { ok: true } | { ok: false; error: string };

async function garderConsole(): Promise<Resultat> {
  const { userId, role } = await requireCabinetAndUser();
  const interne = await isSafeInternalUser(userId);
  if (!interne || !canManageCabinetSettings(role as UserRole)) {
    return { ok: false, error: "Accès réservé à l'équipe SAFE Inc." };
  }
  return { ok: true };
}

const ETATS = ["NOUVELLE", "REPONDUE", "PLANIFIEE", "CLOSE"] as const;
type Etat = (typeof ETATS)[number];

export async function changerEtatDemande(
  id: string,
  etat: Etat,
): Promise<Resultat> {
  const garde = await garderConsole();
  if (!garde.ok) return garde;
  if (!ETATS.includes(etat)) return { ok: false, error: "État inconnu." };

  await prisma.demandeSite.update({
    where: { id },
    data: {
      statut: etat,
      // « Traitée le » marque le moment où la demande cesse d'attendre. Revenir
      // à NOUVELLE efface la date : une demande qui attend de nouveau n'a pas
      // de date de traitement.
      traiteeLe: etat === "NOUVELLE" ? null : new Date(),
    },
  });

  revalidatePath("/console/demandes");
  revalidatePath(`/console/demandes/${id}`);
  return { ok: true };
}

/**
 * Rejoue le rattachement au CRM d'une demande qui n'y est pas entrée.
 *
 * Le rattachement automatique est volontairement non bloquant à la réception :
 * quand il échoue, la demande est quand même gardée. Ce bouton est la seconde
 * chance, déclenchée à la main depuis la fiche.
 */
export async function rejouerRattachementCrm(id: string): Promise<Resultat> {
  const garde = await garderConsole();
  if (!garde.ok) return garde;

  const crm = await attachDemandeSiteToCrm(id);
  await prisma.demandeSite.update({
    where: { id },
    data: { crmNote: crm.ok ? crm.note : `Échec du rattachement CRM : ${crm.error}` },
  });

  revalidatePath("/console/demandes");
  revalidatePath(`/console/demandes/${id}`);
  return crm.ok ? { ok: true } : { ok: false, error: crm.error };
}
