import { NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { generateInvoicePdf, invoicePdfFilename } from "@/lib/services/billing/invoice-pdf";
import { loadPresentedInvoiceForCabinet } from "@/lib/services/billing/load-presented-invoice";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { cabinetId } = await requireCabinetAndUser();
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
