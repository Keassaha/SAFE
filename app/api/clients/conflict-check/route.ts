import { NextResponse } from "next/server";
import { getSessionOrRespond } from "@/lib/auth/session";
import { runClientConflictCheck } from "@/lib/services/conflict-check-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const sessionOrResp = await getSessionOrRespond();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const { cabinetId } = sessionOrResp;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const typeClient = typeof body.typeClient === "string" ? body.typeClient : undefined;
  const raisonSociale = typeof body.raisonSociale === "string" ? body.raisonSociale : undefined;
  const prenom = typeof body.prenom === "string" ? body.prenom : undefined;
  const nom = typeof body.nom === "string" ? body.nom : undefined;
  const email = typeof body.email === "string" ? body.email : undefined;

  const result = await runClientConflictCheck(cabinetId, {
    typeClient,
    raisonSociale,
    prenom,
    nom,
    email,
  });

  return NextResponse.json(result);
}
