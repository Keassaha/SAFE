import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { HonorairesView } from "./HonorairesView";

export default async function FacturationHonorairesPage() {
  const cabinetId = await requireCabinetId();

  // Get all billable time entries grouped by client
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      cabinetId,
      facturable: true,
      invoiceId: null,
      billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] },
    },
    include: {
      client: { select: { id: true, raisonSociale: true } },
      dossier: { select: { id: true, intitule: true } },
    },
  });

  // Get all billable expenses grouped by client
  const expenses = await prisma.expense.findMany({
    where: {
      cabinetId,
      invoiceId: null,
      billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] },
    },
    include: {
      client: { select: { id: true, raisonSociale: true } },
      dossier: { select: { id: true, intitule: true } },
    },
  });

  // Get cabinet settings for threshold
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { id: true, nom: true },
  });

  return (
    <div className="space-y-6">
      <HonorairesView
        cabinetId={cabinetId}
        timeEntries={timeEntries}
        expenses={expenses}
      />
    </div>
  );
}
