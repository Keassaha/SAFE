import { NextResponse } from "next/server";
import { accesRepriseUnClient } from "@/lib/services/reprise-un-client/acces";
import { chargerContexteRepriseUnClient } from "@/lib/services/reprise-un-client/contexte";

export const dynamic = "force-dynamic";

/** Clients et mandats du cabinet, avocats, régime de taxes. Lecture seule. */
export async function GET() {
  const acces = await accesRepriseUnClient();
  if (acces instanceof NextResponse) return acces;
  return NextResponse.json(await chargerContexteRepriseUnClient(acces.cabinetId));
}
