/**
 * SAFE — Carrière Solo
 * POST /api/carriere-solo/pdf
 *   Body : { answers: Answers }
 *   → Génère et renvoie la checklist personnalisée en PDF.
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { renderChecklistPdf } from "@/lib/carriere-solo/pdf";
import type { Answers, Horizon, Jurisdiction, PracticeArea, Status, Fear } from "@/lib/carriere-solo/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JURISDICTIONS: Jurisdiction[] = ["qc", "on"];
const STATUSES: Status[] = ["etudiant", "stagiaire", "admis_recent", "admis_5ans", "transition"];
const HORIZONS: Horizon[] = ["imminent", "moyen", "exploratoire"];
const FEARS: Fear[] = ["admin", "clients", "argent", "conformite", "mental"];
const AREAS: PracticeArea[] = ["famille", "immobilier", "corporatif", "criminel", "civil", "immigration"];

function parseAnswers(raw: unknown): Answers | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;

  const juridiction = a.juridiction as Jurisdiction;
  const statut = a.statut as Status;
  const horizon = a.horizon as Horizon;
  const peur = a.peur as Fear;
  const domaines = Array.isArray(a.domaines) ? (a.domaines as PracticeArea[]) : [];

  if (!JURISDICTIONS.includes(juridiction)) return null;
  if (!STATUSES.includes(statut)) return null;
  if (!HORIZONS.includes(horizon)) return null;
  if (!FEARS.includes(peur)) return null;
  const cleanDomaines = domaines.filter((d) => AREAS.includes(d));
  if (cleanDomaines.length === 0) return null;

  return { juridiction: juridiction as "qc" | "on", statut, horizon, peur, domaines: cleanDomaines };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (await isRateLimited(`carriere-solo-pdf:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes. Réessaie dans un instant." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const answers = parseAnswers((body as { answers?: unknown })?.answers);
  if (!answers) {
    return NextResponse.json({ error: "Réponses invalides ou incomplètes." }, { status: 400 });
  }

  try {
    const pdf = await renderChecklistPdf(answers);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="checklist-carriere-solo-safe.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[carriere-solo/pdf] generation failed:", e);
    return NextResponse.json({ error: "La génération du PDF a échoué." }, { status: 500 });
  }
}
