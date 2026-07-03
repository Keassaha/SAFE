import { NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { generateInvoicePdf, invoicePdfFilename } from "@/lib/services/billing/invoice-pdf";
import { loadPresentedInvoiceForCabinet } from "@/lib/services/billing/load-presented-invoice";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { cabinetId } = await requireCabinetAndUser();
  // La génération PDF (@react-pdf) est coûteuse : plafonner le débit par cabinet
  // pour éviter un déni de service. 30/min couvre largement la consultation légitime.
  if (await isRateLimited(`invoice-pdf-${cabinetId}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans une minute." },
      { status: 429 }
    );
  }
  const { id } = await params;
  const invoice = await loadPresentedInvoiceForCabinet(id, cabinetId);

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const pdf = await generateInvoicePdf(invoice);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoicePdfFilename(invoice)}"`,
      "Cache-Control": "no-store",
    },
  });
}
