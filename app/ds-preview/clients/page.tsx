import { Suspense } from "react";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientSummaryCards } from "@/components/clients/registry/ClientSummaryCards";
import { ClientSearchBar } from "@/components/clients/registry/ClientSearchBar";
import { ClientFilters } from "@/components/clients/registry/ClientFilters";
import { ClientTable, type ClientRow } from "@/components/clients/registry/ClientTable";
import { ClientPagination } from "@/components/clients/registry/ClientPagination";

/**
 * Aperçu du registre clients, hors authentification.
 *
 * Sert à juger la composition sur du contenu réel plutôt que sur un gabarit
 * (M1) : noms longs, solde de fidéicommis négatif, montant à sept chiffres,
 * client sans courriel, client sans responsable, client archivé. Ce sont les
 * cas qui cassent une mise en page, donc les seuls qui prouvent qu'elle tient.
 *
 * Cette route ne touche pas la base et n'est pas branchée à la navigation.
 * Elle disparaîtra quand le registre réel sera validé.
 */
export const dynamic = "force-dynamic";

const ilYA = (ms: number) => new Date(Date.now() - ms);
const MINUTE = 60_000;
const HEURE = 3_600_000;
const JOUR = 86_400_000;

const RANGEES: ClientRow[] = [
  {
    id: "apercu-1",
    typeClient: "personne_morale",
    status: "actif",
    raisonSociale: "Groupe immobilier Northfield et Associés inc.",
    prenom: null,
    nom: null,
    email: "comptabilite@northfield-immobilier.ca",
    telephone: "514 555-0142",
    langue: "fr",
    trustAccountBalance: 128_450.75,
    honorairesAccumules: 1_284_300.5,
    assignedLawyerNom: "Me Sophie Roy",
    dossiersActifsCount: 12,
    lastActivityAt: ilYA(35 * MINUTE),
  },
  {
    id: "apercu-2",
    typeClient: "personne_physique",
    status: "actif",
    raisonSociale: null,
    prenom: "Jean-Christophe",
    nom: "Tremblay-Beauchemin",
    email: "jc.tremblay@example.ca",
    telephone: "418 555-0198",
    langue: "fr",
    trustAccountBalance: 0,
    honorairesAccumules: 12_450,
    assignedLawyerNom: "Me Jean Côté",
    dossiersActifsCount: 4,
    lastActivityAt: ilYA(2 * HEURE),
  },
  {
    id: "apercu-3",
    typeClient: "personne_physique",
    status: "actif",
    raisonSociale: null,
    prenom: "Amélie",
    nom: "Lafleur",
    email: null,
    telephone: "450 555-0113",
    langue: "fr",
    /* Solde négatif : interdit par B-1 r.5, doit sauter aux yeux sans être
       la seule information portée par la couleur (C3). */
    trustAccountBalance: -1_725,
    honorairesAccumules: 3_890.25,
    assignedLawyerNom: "Me Sophie Roy",
    dossiersActifsCount: 1,
    lastActivityAt: ilYA(JOUR),
  },
  {
    id: "apercu-4",
    typeClient: "personne_morale",
    status: "inactif",
    raisonSociale: "Coopérative de solidarité Rive-Sud",
    prenom: null,
    nom: null,
    email: "direction@coop-rivesud.qc.ca",
    telephone: null,
    langue: "fr",
    trustAccountBalance: 2_500,
    honorairesAccumules: 0,
    assignedLawyerNom: null,
    dossiersActifsCount: 0,
    lastActivityAt: ilYA(9 * JOUR),
  },
  {
    id: "apercu-5",
    typeClient: "personne_physique",
    status: "actif",
    raisonSociale: null,
    prenom: "Marc",
    nom: "Sirois",
    email: "marc.sirois@example.com",
    telephone: "819 555-0177",
    langue: "en",
    trustAccountBalance: 7_500,
    honorairesAccumules: 24_120.8,
    assignedLawyerNom: "Me Karine Dubois",
    dossiersActifsCount: 3,
    lastActivityAt: ilYA(3 * JOUR),
  },
  {
    id: "apercu-6",
    typeClient: "personne_morale",
    status: "archive",
    raisonSociale: "9271-4408 Québec inc.",
    prenom: null,
    nom: null,
    email: "info@9271-4408.ca",
    telephone: null,
    langue: "fr",
    trustAccountBalance: 0,
    honorairesAccumules: 875,
    assignedLawyerNom: "Me Jean Côté",
    dossiersActifsCount: 0,
    lastActivityAt: ilYA(94 * JOUR),
  },
];

export default function ApercuRegistreClients() {
  const total = RANGEES.length;
  const actifs = RANGEES.filter((r) => r.status === "actif").length;
  const dossiers = RANGEES.reduce((s, r) => s + r.dossiersActifsCount, 0);
  const honoraires = RANGEES.reduce((s, r) => s + r.honorairesAccumules, 0);

  return (
    <div className="min-h-screen bg-si-canvas">
      {/* Marges de page du référentiel : 16 px mobile, 24 px tablette, 32 px bureau. */}
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Même en-tête, mêmes boutons et même barre d'outils que la vraie
            page : sinon l'aperçu valide une composition que personne ne verra. */}
        <PageHeader
          variant="dashboard"
          title="Clients"
          description="Données fictives. Sert à juger la composition sur des cas réels."
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" type="button">
                <Download className="mr-2 inline-block h-4 w-4" aria-hidden />
                Exporter CSV
              </Button>
              <Button type="button">Nouveau client</Button>
            </div>
          }
        />

        <ClientSummaryCards
          totalClients={total}
          activeClients={actifs}
          activeCasesCount={dossiers}
          unbilledAmount={honoraires}
        />

        <section aria-label="Liste des clients" className="safe-feuille overflow-hidden">
          <Suspense fallback={null}>
            <div className="flex flex-col gap-3 border-b border-si-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <ClientSearchBar />
              <ClientFilters />
            </div>
            <div>
              <ClientTable
                clients={RANGEES}
                canEdit
                canArchive
                sortBy="raisonSociale"
                sortOrder="asc"
              />
              <ClientPagination totalCount={318} currentPage={1} pageSize={50} />
            </div>
          </Suspense>
        </section>
      </div>
    </div>
  );
}
