"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/request";

/**
 * Ce que le client voit et fait.
 *
 * UNE INTENTION : déposer ce qu'on lui demande. La page ne fait rien d'autre.
 *
 * ELLE PARLE COMME UN HUMAIN. Pas de « document requis », pas d'état technique, pas
 * de code. Chaque ligne dit ce qu'on attend et pourquoi, et ce qui a été reçu se voit
 * tout de suite.
 *
 * ET DANS SA LANGUE. Les messages viennent du fournisseur posé par la page serveur,
 * qui les a choisis d'après la fiche du client. `locale` sert aussi au format de date :
 * un anglophone qui lit « 2026-09-18 » sur une page anglaise et le reste en français
 * verrait un montage, pas un document de son cabinet.
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
function etatLisible(etat: string): { cle: string; fait: boolean } {
  switch (etat) {
    case "RECUE":
    case "A_VERIFIER":
      return { cle: "etatRecu", fait: true };
    case "ACCEPTEE":
      return { cle: "etatAccepte", fait: true };
    case "A_REMPLACER":
      return { cle: "etatARemplacer", fait: false };
    default:
      return { cle: "etatAFournir", fait: false };
  }
}

export function CollecteClientView({
  token,
  cabinet,
  dossier,
  locale,
  pieces,
}: {
  token: string;
  cabinet: string;
  dossier: string;
  locale: Locale;
  pieces: Piece[];
}) {
  const t = useTranslations("collecte");
  const { formatCalendarDate } = useFormatteurs();
  const router = useRouter();

  // La racine du document pose `lang` d'après le témoin de session, que ce visiteur
  // n'a pas : une page anglaise restait annoncée comme française. Un lecteur d'écran
  // la prononce alors avec une voix française, et c'est précisément cette personne,
  // seule devant son téléphone, qui peut le moins se le permettre. On corrige donc
  // l'attribut ici, seul endroit qui connaisse la langue réellement servie.
  useEffect(() => {
    const racine = document.documentElement;
    const avant = racine.lang;
    racine.lang = locale;
    return () => {
      racine.lang = avant;
    };
  }, [locale]);
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
        setErreurs((e) => ({ ...e, [pieceId]: data.error ?? t("depotEchoue") }));
      } else {
        router.refresh();
      }
    } catch {
      setErreurs((e) => ({ ...e, [pieceId]: t("depotEchoueReseau") }));
    } finally {
      setEnCours(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="space-y-1">
        <p className="text-[12px] uppercase tracking-[0.06em] text-si-muted">{cabinet}</p>
        <h1 className="font-serif text-[24px] text-si-ink">{t("titre")}</h1>
        <p className="text-[13px] text-si-muted">{dossier}</p>
      </header>

      <p className="mt-4 text-[14px] leading-relaxed text-si-ink">
        {restantes.length === 0
          ? t("toutRecu")
          : restantes.length === 1
            ? t("resteUn")
            : t("restePlusieurs", { n: restantes.length })}
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
                  {t(etat.cle)}
                </span>
              </div>

              {p.raison ? (
                <p className="mt-1 text-[13px] leading-relaxed text-si-muted">{p.raison}</p>
              ) : null}

              {p.echeance ? (
                <p className="mt-1 text-[12px] tabular-nums text-si-muted">
                  {t("avantLe", { date: formatCalendarDate(p.echeance, locale) })}
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
                    {enCours === p.id ? t("envoiEnCours") : t("choisirFichier")}
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
                  <p className="mt-1.5 text-[12px] text-si-muted">{t("formatsAcceptes")}</p>
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

      <p className="mt-8 text-[12px] leading-relaxed text-si-muted">{t("lienPersonnel")}</p>
    </main>
  );
}
