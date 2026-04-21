import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SuiviPipelineView } from "./SuiviPipelineView";

export default async function FacturationSuiviPage() {
  const cabinetId = await requireCabinetId();

  // #region agent log
  fetch('http://127.0.0.1:7905/ingest/cde20f52-51ca-4c3b-9685-e616486be56a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'279431'},body:JSON.stringify({sessionId:'279431',runId:'pre-fix',hypothesisId:'H1',location:'app/(app)/facturation/suivi/page.tsx:10',message:'FacturationSuiviPage start',data:{cabinetId},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log

  const filters = {
    brouillons: { cabinetId, statut: "brouillon" as const },
    validees: { cabinetId, statut: { in: ["verification"] as const } },
    envoyees: {
      cabinetId,
      statut: { in: ["envoyee", "partiellement_payee", "payee", "en_retard"] as const },
    },
  };

  // #region agent log
  fetch('http://127.0.0.1:7905/ingest/cde20f52-51ca-4c3b-9685-e616486be56a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'279431'},body:JSON.stringify({sessionId:'279431',runId:'pre-fix',hypothesisId:'H1',location:'app/(app)/facturation/suivi/page.tsx:26',message:'FacturationSuiviPage prisma filters',data:{filters},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log

  const [brouillons, validees, envoyees] = await Promise.all([
    prisma.invoice.findMany({
      where: filters.brouillons,
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true } },
        invoiceLines: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: filters.validees,
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true } },
        invoiceLines: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: {
        ...filters.envoyees,
      },
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
        validees={validees}
        envoyees={envoyees}
        cabinetId={cabinetId}
      />
    </div>
  );
}
