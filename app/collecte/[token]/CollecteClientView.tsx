"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCalendarDate } from "@/lib/utils/format";

/**
 * Ce que le client voit et fait.
 *
 * UNE INTENTION : déposer ce qu'on lui demande. La page ne fait rien d'autre.
 *
 * ELLE PARLE COMME UN HUMAIN. Pas de « document requis », pas d'état technique, pas
 * de code. Chaque ligne dit ce qu'on attend et pourquoi, et ce qui a été reçu se voit
 * tout de suite.
 */

type Piece = {
  id: string;
  libelle: string;
  raison: string | null;
  etat: string;
  echeance: string | null;
  motifRemplacement: string | null;
};

/** Ce que le client comprend. Volontairement moins de nuances que les huit états. */
function etatLisible(etat: string): { texte: string; fait: boolean } {
  switch (etat) {
    case "RECUE":
    case "A_VERIFIER":
      return { texte: "Reçu, en cours de vérification", fait: true };
    case "ACCEPTEE":
      return { texte: "Accepté", fait: true };
    case "A_REMPLACER":
      return { texte: "À remplacer", fait: false };
    default:
      return { texte: "À fournir", fait: false };
  }
}

export function CollecteClientView({
  token,
  cabinet,
  dossier,
  pieces,
}: {
  token: string;
  cabinet: string;
  dossier: string;
  pieces: Piece[];
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  const restantes = pieces.filter((p) => !etatLisible(p.etat).fait);

  async function deposer(pieceId: string, fichier: File) {
    setEnCours(pieceId);
    setErreurs((e) => ({ ...e, [pieceId]: "" }));

    const form = new FormData();
    form.append("expectedDocumentId", pieceId);
    form.append("fichier", fichier);

    try {
      const res = await fetch(`/api/collecte/${token}/depot`, { method: "POST", body: form });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErreurs((e) => ({ ...e, [pieceId]: data.error ?? "Le dépôt n'a pas fonctionné." }));
      } else {
        router.refresh();
      }
    } catch {
      setErreurs((e) => ({
        ...e,
        [pieceId]: "Le dépôt n'a pas fonctionné. Vérifiez votre connexion et réessayez.",
      }));
    } finally {
      setEnCours(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="space-y-1">
        <p className="text-[12px] uppercase tracking-[0.06em] text-si-muted">{cabinet}</p>
        <h1 className="font-serif text-[24px] text-si-ink">Documents à fournir</h1>
        <p className="text-[13px] text-si-muted">{dossier}</p>
      </header>

      <p className="mt-4 text-[14px] leading-relaxed text-si-ink">
        {restantes.length === 0
          ? "Nous avons tout reçu. Merci, vous n'avez rien d'autre à faire pour l'instant."
          : restantes.length === 1
            ? "Il reste un document à nous transmettre."
            : `Il reste ${restantes.length} documents à nous transmettre.`}
      </p>

      <ul className="mt-6 space-y-3">
        {pieces.map((p) => {
          const etat = etatLisible(p.etat);
          const erreur = erreurs[p.id];
          return (
            <li key={p.id} className="rounded-lg border border-si-line bg-si-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-[15px] text-si-ink">{p.libelle}</p>
                <span
                  className={`text-[12px] ${etat.fait ? "text-si-verified" : "text-si-muted"}`}
                >
                  {etat.texte}
                </span>
              </div>

              {p.raison ? (
                <p className="mt-1 text-[13px] leading-relaxed text-si-muted">{p.raison}</p>
              ) : null}

              {p.echeance ? (
                <p className="mt-1 text-[12px] tabular-nums text-si-muted">
                  À fournir avant le {formatCalendarDate(p.echeance)}
                </p>
              ) : null}

              {/* Le motif du refus est montré au client : sans lui, il redépose la
                  même chose et personne ne comprend pourquoi ça bloque. */}
              {p.etat === "A_REMPLACER" && p.motifRemplacement ? (
                <p className="mt-2 rounded-md border border-si-line bg-si-canvas px-3 py-2 text-[13px] text-si-ink">
                  {p.motifRemplacement}
                </p>
              ) : null}

              {!etat.fait || p.etat === "A_REMPLACER" ? (
                <div className="mt-3">
                  <label
                    className="inline-flex cursor-pointer items-center rounded-md border border-si-line bg-si-surface px-3 py-2 text-[13px] font-medium text-si-ink transition-colors hover:bg-si-canvas"
                    htmlFor={`f-${p.id}`}
                  >
                    {enCours === p.id ? "Envoi en cours…" : "Choisir un fichier"}
                  </label>
                  <input
                    id={`f-${p.id}`}
                    type="file"
                    className="sr-only"
                    accept="application/pdf,image/jpeg,image/png,image/heic"
                    disabled={enCours !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void deposer(p.id, f);
                      e.target.value = "";
                    }}
                  />
                  <p className="mt-1.5 text-[12px] text-si-muted">
                    PDF ou photo, jusqu&apos;à 25 Mo.
                  </p>
                </div>
              ) : null}

              {erreur ? (
                <p className="mt-2 text-[13px] text-si-danger-ink" role="alert">
                  {erreur}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-[12px] leading-relaxed text-si-muted">
        Ce lien vous est personnel. Ne le transmettez à personne.
      </p>
    </main>
  );
}
