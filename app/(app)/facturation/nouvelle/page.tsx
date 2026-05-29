import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getNextInvoiceNumero } from "@/lib/facturation/numero-facture";
import { getCabinetInterfaceDerived } from "@/lib/services/cabinet-interface";
import { buildBillableTimeEntryWhere } from "@/lib/billing/queries";
import { CreateInvoiceView } from "./CreateInvoiceView";

export default async function NouvelleFacturePage({
  searchParams,
}: {
  searchParams?: Promise<{
    clientId?: string;
    timeEntryIds?: string;
    expenseIds?: string;
    registreTacheIds?: string;
  }>;
}) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  // Detect billing mode — shared React.cache fetch with the app layout
  const { billingMode } = await getCabinetInterfaceDerived(cabinetId);

  const [
    cabinet,
    clients,
    forfaitServices,
    currentUser,
    lawyers,
    nextInvoiceNumber,
    timeEntries,
    expenses,
    registreTaches,
  ] = await Promise.all([
    prisma.cabinet.findUniqueOrThrow({
      where: { id: cabinetId },
      // Identité publique du cabinet, requise pour rendre la facture
      // conforme au Barreau et aux exigences de l'ARC (n° LSO + n° HST/GST/QST
      // exposés via Cabinet.config.taxNumbers).
      select: {
        nom: true,
        adresse: true,
        telephone: true,
        email: true,
        barreauNumero: true,
        logoUrl: true,
        config: true,
      },
    }),
    prisma.client.findMany({
      where: { cabinetId },
      select: {
        id: true,
        typeClient: true,
        raisonSociale: true,
        prenom: true,
        nom: true,
        billingAddress: true,
        billingCity: true,
        billingProvince: true,
        billingPostalCode: true,
        billingCountry: true,
        telephone: true,
        email: true,
        dossiers: {
          where: { statut: { in: ["ouvert", "actif", "en_attente"] } },
          select: { id: true, intitule: true, numeroDossier: true, reference: true },
          orderBy: { dateOuverture: "desc" },
          take: 5,
        },
      },
      orderBy: [{ raisonSociale: "asc" }, { nom: "asc" }],
    }),
    // Only fetch the forfait catalog when the cabinet actually needs it.
    // Mode "mixed" peut combiner forfait + horaire sur une même facture,
    // donc on charge aussi le catalogue de forfaits dans ce cas.
    billingMode === "forfait" || billingMode === "mixed"
      ? prisma.forfaitService.findMany({
          where: { cabinetId, actif: true },
          select: {
            id: true,
            code: true,
            nom: true,
            description: true,
            montant: true,
            categorie: true,
            sousType: true,
            taxable: true,
          },
          orderBy: [{ sortOrder: "asc" }, { nom: "asc" }],
        })
      : Promise.resolve([]),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nom: true },
    }),
    // Billable users (avocates + admin_cabinet) — for line-item "Responsable" picker
    prisma.user.findMany({
      where: { cabinetId, isBillable: true },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    getNextInvoiceNumero(cabinetId),
    prisma.timeEntry.findMany({
      where: buildBillableTimeEntryWhere(cabinetId),
      select: {
        id: true,
        clientId: true,
        dossierId: true,
        date: true,
        dureeMinutes: true,
        description: true,
        tauxHoraire: true,
        montant: true,
        durationHours: true,
        hourlyRate: true,
        feeAmount: true,
        taxable: true,
        userId: true,
        user: { select: { nom: true } },
        dossier: { select: { clientId: true, intitule: true, numeroDossier: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.expense.findMany({
      where: {
        cabinetId,
        invoiceId: null,
        billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] },
      },
      select: {
        id: true,
        clientId: true,
        matterId: true,
        expenseDate: true,
        description: true,
        vendorName: true,
        amount: true,
        taxable: true,
        matter: { select: { intitule: true, numeroDossier: true } },
      },
      orderBy: { expenseDate: "asc" },
    }),
    prisma.registreTache.findMany({
      where: {
        cabinetId,
        statut: "complete",
        invoiceLineId: null,
        clientId: { not: null },
      },
      select: {
        id: true,
        clientId: true,
        dossierId: true,
        description: true,
        montantBase: true,
        ajustement: true,
        rabais: true,
        rabaisRaison: true,
        montantFinal: true,
        taxable: true,
        date: true,
        dossier: { select: { intitule: true, numeroDossier: true } },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const billables = [
    ...timeEntries.flatMap((entry) => {
      const clientId = entry.clientId ?? entry.dossier?.clientId ?? null;
      if (!clientId) return [];
      return {
        id: entry.id,
        sourceType: "time_entry" as const,
        clientId,
        dossierId: entry.dossierId,
        dossierLabel: entry.dossier
          ? [entry.dossier.numeroDossier, entry.dossier.intitule].filter(Boolean).join(" — ")
          : null,
        description: entry.description ?? "Honoraires",
        date: entry.date.toISOString().split("T")[0],
        hours: entry.durationHours ?? entry.dureeMinutes / 60,
        rate: entry.hourlyRate ?? entry.tauxHoraire,
        amount: entry.feeAmount ?? entry.montant,
        montantBase: entry.feeAmount ?? entry.montant,
        ajustement: 0,
        taxable: entry.taxable ?? true,
        responsableUserId: entry.userId,
        responsableNom: entry.user.nom,
        rabais: 0,
        rabaisRaison: null,
      };
    }),
    ...expenses.map((expense) => ({
      id: expense.id,
      sourceType: "expense" as const,
      clientId: expense.clientId,
      dossierId: expense.matterId,
      dossierLabel: expense.matter
        ? [expense.matter.numeroDossier, expense.matter.intitule].filter(Boolean).join(" — ")
        : null,
      description: expense.vendorName
        ? `${expense.description} — ${expense.vendorName}`
        : expense.description,
      date: expense.expenseDate.toISOString().split("T")[0],
      hours: 0,
      rate: 0,
      amount: expense.amount,
      montantBase: expense.amount,
      ajustement: 0,
      taxable: expense.taxable,
      responsableUserId: null,
      responsableNom: null,
      rabais: 0,
      rabaisRaison: null,
    })),
    ...registreTaches.map((tache) => ({
      id: tache.id,
      sourceType: "registre_tache" as const,
      clientId: tache.clientId ?? "",
      dossierId: tache.dossierId,
      dossierLabel: [tache.dossier.numeroDossier, tache.dossier.intitule]
        .filter(Boolean)
        .join(" — "),
      description: tache.description,
      date: tache.date.toISOString().split("T")[0],
      hours: 0,
      rate: 0,
      amount: tache.montantBase + tache.ajustement,
      montantBase: tache.montantBase,
      ajustement: tache.ajustement,
      taxable: tache.taxable,
      responsableUserId: null,
      responsableNom: null,
      rabais: tache.rabais,
      rabaisRaison: tache.rabaisRaison,
    })),
  ];
  const selectedTimeEntryIds = new Set(
    (resolvedSearchParams.timeEntryIds ?? "").split(",").filter(Boolean)
  );
  const selectedExpenseIds = new Set(
    (resolvedSearchParams.expenseIds ?? "").split(",").filter(Boolean)
  );
  const selectedRegistreTacheIds = new Set(
    (resolvedSearchParams.registreTacheIds ?? "").split(",").filter(Boolean)
  );
  const hasExplicitSelection =
    selectedTimeEntryIds.size > 0 ||
    selectedExpenseIds.size > 0 ||
    selectedRegistreTacheIds.size > 0;
  const filteredBillables = hasExplicitSelection
    ? billables.filter((item) => {
        if (item.sourceType === "time_entry") return selectedTimeEntryIds.has(item.id);
        if (item.sourceType === "expense") return selectedExpenseIds.has(item.id);
        if (item.sourceType === "registre_tache") return selectedRegistreTacheIds.has(item.id);
        return false;
      })
    : billables;

  return (
    <CreateInvoiceView
      cabinet={cabinet}
      clients={clients}
      billingMode={billingMode}
      forfaitServices={forfaitServices}
      currentUser={currentUser ?? { id: userId, nom: "" }}
      lawyers={lawyers}
      nextInvoiceNumber={nextInvoiceNumber}
      initialClientId={resolvedSearchParams.clientId ?? ""}
      clientBillables={filteredBillables}
    />
  );
}
