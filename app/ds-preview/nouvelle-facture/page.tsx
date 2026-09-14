"use client";

import { CreateInvoiceView } from "@/app/(app)/facturation/nouvelle/CreateInvoiceView";

/**
 * Contrôle visuel de la préparation de facture, hors authentification.
 *
 * C'est le plus gros écran du périmètre (2 452 lignes) et le seul qui n'avait
 * aucune route de contrôle : il fallait une session et onze requêtes pour le
 * voir. Les données sont fictives, le composant est le vrai.
 *
 * Rendu tel qu'il s'ouvre : deux prestations reprises du dossier, aucun débours,
 * aucun rabais — le cas ordinaire, celui où deux des quatre sections
 * s'affichaient vides avant le 2026-09-14.
 */
const CABINET = {
  nom: "Cabinet Camille Roy",
  adresse: "1200 avenue McGill College, bureau 1500, Montréal QC H3B 4G7",
  telephone: "514 555-0188",
  email: "info@cabinetroy.ca",
  barreauNumero: null,
  logoUrl: null,
  config: null,
};

const CLIENT = {
  id: "c1",
  typeClient: "personne_physique",
  raisonSociale: null,
  prenom: "Marie-Ève",
  nom: "Ouellet",
  billingAddress: "418 rue Sherbrooke Est",
  billingCity: "Montréal",
  billingProvince: "QC",
  billingPostalCode: "H2X 1E3",
  billingCountry: "Canada",
  telephone: "514 555-0142",
  email: "marie-eve.ouellet@courriel.ca",
  dossiers: [
    {
      id: "d1",
      intitule: "Contestation de saisie avant jugement",
      numeroDossier: "2026-0039",
      reference: null,
      tauxHoraire: 300,
    },
  ],
};

const AVOCATE = { id: "u1", nom: "Me Camille Roy", defaultHourlyRate: 300 };

const BILLABLES = [
  {
    id: "t1",
    sourceType: "time_entry" as const,
    clientId: "c1",
    dossierId: "d1",
    dossierLabel: "2026-0039 — Contestation de saisie avant jugement",
    description: "Contestation de saisie avant jugement",
    date: "2026-09-10",
    hours: 4.5,
    rate: 300,
    amount: 1350,
    montantBase: 1350,
    ajustement: 0,
    taxable: true,
    responsableUserId: "u1",
    responsableNom: "Me Camille Roy",
    rabais: 0,
    rabaisRaison: null,
  },
  {
    id: "t2",
    sourceType: "time_entry" as const,
    clientId: "c1",
    dossierId: "d1",
    dossierLabel: "2026-0039 — Contestation de saisie avant jugement",
    description: "Appel avec la partie adverse",
    date: "2026-09-12",
    hours: 1.8,
    rate: 300,
    amount: 540,
    montantBase: 540,
    ajustement: 0,
    taxable: true,
    responsableUserId: "u1",
    responsableNom: "Me Camille Roy",
    rabais: 0,
    rabaisRaison: null,
  },
];

export default function ApercuNouvelleFacture() {
  return (
    <CreateInvoiceView
      cabinet={CABINET}
      clients={[CLIENT]}
      billingMode="horaire"
      currentUser={AVOCATE}
      lawyers={[AVOCATE]}
      nextInvoiceNumber="2026-0043"
      initialClientId="c1"
      clientBillables={BILLABLES}
      tauxHoraireDefaut={300}
    />
  );
}
