import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CreateInvoiceView } from "./CreateInvoiceView";

export default async function NouvelleFacturePage() {
  const cabinetId = await requireCabinetId();

  const [cabinet, clients] = await Promise.all([
    prisma.cabinet.findUniqueOrThrow({
      where: { id: cabinetId },
      select: {
        nom: true,
        adresse: true,
        telephone: true,
        email: true,
        barreauNumero: true,
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
  ]);

  return <CreateInvoiceView cabinet={cabinet} clients={clients} />;
}
