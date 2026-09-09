"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SoldeCards } from "./SoldeCards";
import { TransactionsTable } from "./TransactionsTable";
import { ReleveGenerator } from "./ReleveGenerator";
import { ReconciliationAlert } from "./ReconciliationAlert";
import { TrustAlertsPanel } from "./TrustAlertsPanel";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { Scale, FileText, ShieldAlert } from "lucide-react";
import { useCabinetProvince } from "@/components/providers/CabinetProvinceProvider";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";

interface ClientOption {
  id: string;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
}

interface DossierOption {
  id: string;
  clientId: string;
  intitule: string;
  numeroDossier: string | null;
}

export interface FideicommisDashboardProps {
  cabinetId: string | null;
  canEdit: boolean;
  clients: ClientOption[];
  dossiers: DossierOption[];
  seuilBas?: number;
}

export function FideicommisDashboard({
  cabinetId,
  canEdit,
  clients,
  dossiers,
  seuilBas = 500,
}: FideicommisDashboardProps) {
  const tf = useTranslations("fideicommis");
  const copy = getTrustRegulatorCopy(useCabinetProvince());

  return (
    <div className="space-y-6">
      <ReconciliationAlert />
      <TrustAlertsPanel />
      <SoldeCards cabinetId={cabinetId} seuilBas={seuilBas} />

      <div className="flex flex-wrap gap-3">
        {/* Le bouton « Briefing du jour » est retiré le 2026-09-09.
            L'écran qu'il ouvrait ne compose que trois choses qui ont déjà leur
            propre destination : les alertes de sécurité (bouton voisin), le
            temps non facturé et les créances en retard. C'était le seul vrai
            doublon du produit, et un cinquième endroit où commencer sa journée.
            La route reste servie pour les signets, elle n'est simplement plus
            annoncée. Voir docs/product/VOCABULAIRE_SAFE.md §7. */}
        <Link href="/comptes/rapprochement">
          <Button variant="secondary">
            <Scale className="w-4 h-4" />
            {copy.reconciliationButton}
          </Button>
        </Link>
        <Link href="/comptes/rapports">
          <Button variant="secondary">
            <FileText className="w-4 h-4" />
            {copy.complianceReportsButton}
          </Button>
        </Link>
        <Link href={routes.securite}>
          <Button variant="secondary">
            <ShieldAlert className="w-4 h-4" />
            Points à surveiller
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-[var(--safe-text-secondary)]">
            {tf.rich("trustInfo", {
              link: (chunks) => (
                <Link href={routes.facturation} className="text-primary-600 hover:underline font-medium">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionsTable cabinetId={cabinetId} clients={clients} dossiers={dossiers} />
        </div>
        <div>
          <ReleveGenerator clients={clients} dossiers={dossiers} disabled={!cabinetId} />
        </div>
      </div>
    </div>
  );
}
