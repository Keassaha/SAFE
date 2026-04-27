import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getCabinetInterfaceDerived } from "@/lib/services/cabinet-interface";
import { CreateInvoiceView } from "./CreateInvoiceView";

export default async function NouvelleFacturePage() {
  const { cabinetId, userId } = await requireCabinetAndUser();

  // Detect billing mode — shared React.cache fetch with the app layout
  const { billingMode } = await getCabinetInterfaceDerived(cabinetId);

  const [cabinet, clients, forfaitServices, currentUser, lawyers] = await Promise.all([
    prisma.cabinet.findUniqueOrThrow({
      where: { id: cabinetId },
      // NB: barreauNumero volontairement exclu — donnée confidentielle
      // qui ne doit pas apparaître sur la facture ni dans le formulaire.
      select: {
        nom: true,
        adresse: true,
        telephone: true,
        email: true,
      },
    }),
    prisma.client.findMany({
      where: { cabinetId },
      select: {
        id: true,
        raisonSociale: true,
        billingAddress: true,
        billingCity: true,
        billingProvince: true,
        billingPostalCode: true,
        billingCountry: true,
        telephone: true,
        email: true,
      },
      orderBy: { raisonSociale: "asc" },
    }),
    // Only fetch the forfait catalog when the cabinet actually needs it
    billingMode === "forfait"
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
  ]);

  return (
    <CreateInvoiceView
      cabinet={cabinet}
      clients={clients}
      billingMode={billingMode}
      forfaitServices={forfaitServices}
      currentUser={currentUser ?? { id: userId, nom: "" }}
      lawyers={lawyers}
    />
  );
}
