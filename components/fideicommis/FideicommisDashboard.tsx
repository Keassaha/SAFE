"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SoldeCards } from "./SoldeCards";
import { TransactionsTable } from "./TransactionsTable";
import { ReleveGenerator } from "./ReleveGenerator";
import { Card, CardContent } from "@/components/ui/Card";
import { routes } from "@/lib/routes";

interface ClientOption {
  id: string;
  raisonSociale: string;
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

  return (
    <div className="space-y-6">
      <SoldeCards cabinetId={cabinetId} seuilBas={seuilBas} />

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
