/**
 * Types pour la page Rapports SAFE (SAAS juridique).
 * Toutes les dates sont sérialisées en string ISO pour le passage RSC -> client.
 */

export interface RapportsFilters {
  dateDebut: string;
  dateFin: string;
  clientId: string | null;
  userId: string | null;
  statut: string | null;
}

export interface RapportFacturationRow {
  id: string;
  numero: string;
  client: string;
  dossier: string | null;
  avocat: string | null;
  date: string;
  montantHT: number;
  taxes: number;
  total: number;
  paiementRecu: number;
  solde: number;
  statut: string;
}

export interface ComptesRecevoirAging {
  range: "0-30" | "30-60" | "60-90" | "90+";
  label: string;
  montant: number;
  count: number;
}

export interface PerformanceAvocatRow {
  userId: string;
  nom: string;
  heuresTravaillees: number;
  heuresFacturees: number;
  revenusGeneres: number;
  tauxHoraireMoyen: number;
  tauxRealisation: number;
}

export interface RentabiliteDossierRow {
  dossierId: string;
  intitule: string;
  client: string;
  revenus: number;
  heures: number;
  paiements: number;
  profitEstime: number;
}

export interface RapportFideicommisSummary {
  depots: number;
  utilisations: number;
  solde: number;
  transactionsCount: number;
}

export interface RapportTaxesSummary {
  tpsCollectee: number;
  tvqCollectee: number;
  total: number;
}

export interface RapportDeboursRow {
  id: string;
  date: string;
  client: string;
  dossier: string | null;
  description: string;
  montant: number;
  factureNumero: string | null;
}

export interface RapportsPayload {
  filters: RapportsFilters;
  kpis: {
    revenusFactures: number;
    paiementsRecus: number;
    facturesImpayees: number;
    soldeFideicommis: number;
    heuresFacturables: number;
    tauxRealisation: number;
  };
  revenueByMonth: { monthKey: string; label: string; value: number }[];
  facturationRows: RapportFacturationRow[];
  comptesRecevoir: ComptesRecevoirAging[];
  performanceAvocats: PerformanceAvocatRow[];
  rentabiliteDossiers: RentabiliteDossierRow[];
  fideicommis: RapportFideicommisSummary;
  taxes: RapportTaxesSummary;
  deboursRows: RapportDeboursRow[];
  annuelImpots: {
    totalRevenus: number;
    totalTPS: number;
    totalTVQ: number;
    totalPaiements: number;
  };
  clients: { id: string; label: string }[];
  avocats: { id: string; label: string }[];
}
