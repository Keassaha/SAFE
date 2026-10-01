/**
 * Ce dont l'écran « Reprendre un client » a besoin avant la première saisie :
 * les clients du cabinet et leurs mandats (étapes 1 et 2), les avocats qui
 * peuvent être responsables d'un mandat, et le régime de taxes du cabinet
 * (étape 3 : TVH en Ontario, TPS et TVQ au Québec).
 */

import { prisma } from "@/lib/db";
import { getCabinetTaxConfigById } from "@/lib/billing/cabinet-tax-config";
import { champsDeTaxe, type ChampTaxe } from "@/lib/services/reprise-un-client/saisie";
import { parseCabinetConfig } from "@/lib/cabinet-config";
import type { TaxMode } from "@/lib/billing/types";

export interface MandatConnu {
  id: string;
  intitule: string;
  tauxHoraire: number | null;
  enCours: boolean;
}

export interface ClientConnu {
  id: string;
  nom: string;
  typeClient: string;
  mandats: MandatConnu[];
  /** Coordonnées de la fiche, pour les comparer à celles imprimées sur la facture. */
  adresse?: string | null;
  courriel?: string | null;
  telephone?: string | null;
  identiteVerifiee?: boolean;
}

export interface ContexteRepriseUnClient {
  clients: ClientConnu[];
  avocats: { id: string; nom: string }[];
  taxes: { mode: TaxMode; province: string; champs: ChampTaxe[] };
  /** Taux horaire par défaut du cabinet, proposé quand un mandat n'en porte pas. */
  tauxDefaut: number | null;
}

export function nomDuClient(c: { raisonSociale: string | null; prenom: string | null; nom: string | null }): string {
  return c.raisonSociale?.trim() || [c.prenom, c.nom].filter(Boolean).join(" ").trim();
}

const STATUTS_EN_COURS = new Set(["actif", "ouvert", "en_attente"]);

export async function chargerContexteRepriseUnClient(cabinetId: string): Promise<ContexteRepriseUnClient> {
  const [clients, avocats, cabinet] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      select: {
        id: true,
        typeClient: true,
        raisonSociale: true,
        prenom: true,
        nom: true,
        adresse: true,
        email: true,
        telephone: true,
        identityVerified: true,
        dossiers: {
          select: { id: true, intitule: true, tauxHoraire: true, statut: true },
          orderBy: { dateOuverture: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { cabinetId, role: { in: ["avocat", "admin_cabinet"] }, desactiveLe: null },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.cabinet.findUnique({ where: { id: cabinetId }, select: { config: true } }),
  ]);

  const config = parseCabinetConfig(cabinet?.config ?? null);
  const taxConfig = await getCabinetTaxConfigById(cabinetId, prisma, config.province ?? "QC");

  return {
    clients: clients
      .map((c) => ({
        id: c.id,
        nom: nomDuClient(c),
        typeClient: String(c.typeClient),
        adresse: c.adresse ?? null,
        courriel: c.email ?? null,
        telephone: c.telephone ?? null,
        identiteVerifiee: Boolean(c.identityVerified),
        mandats: c.dossiers.map((d) => ({
          id: d.id,
          intitule: d.intitule,
          tauxHoraire: d.tauxHoraire ?? null,
          enCours: STATUTS_EN_COURS.has(String(d.statut)),
        })),
      }))
      .filter((c) => c.nom)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    avocats: avocats.map((a) => ({ id: a.id, nom: a.nom ?? "" })).filter((a) => a.nom),
    taxes: {
      mode: taxConfig.mode,
      province: taxConfig.province,
      champs: champsDeTaxe(taxConfig.mode, taxConfig.rates),
    },
    tauxDefaut: config.tauxHoraireDefaut ?? null,
  };
}
