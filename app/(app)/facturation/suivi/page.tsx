import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { InvoiceStatut } from "@prisma/client";
import { SuiviPipelineView } from "./SuiviPipelineView";

export default async function FacturationSuiviPage() {
  const cabinetId = await requireCabinetId();

  const envoyeeStatuts: InvoiceStatut[] = ["envoyee", "partiellement_payee", "payee", "en_retard"];

  const [brouillons, envoyees] = await Promise.all([
    prisma.invoice.findMany({
      where: { cabinetId, statut: "brouillon" },
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true } },
        invoiceLines: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { cabinetId, statut: { in: envoyeeStatuts } },
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true } },
        invoiceLines: true,
      },
      orderBy: { dateEmission: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <SuiviPipelineView
        brouillons={brouillons}
        validees={[]}
        envoyees={envoyees}
        cabinetId={cabinetId}
      />
    </div>
  );
}
