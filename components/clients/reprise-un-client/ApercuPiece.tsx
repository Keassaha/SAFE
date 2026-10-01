"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Lien } from "./ui";

/**
 * La pièce déposée, affichée à côté de ce que SAFE en a lu (version intégrée,
 * validée le 2026-10-01). C'est le papier qui fait foi : la personne compare
 * d'un regard au lieu d'aller rouvrir le fichier.
 *
 * Tout se passe dans le navigateur. Une image s'affiche telle quelle ; un PDF
 * voit sa première page dessinée par pdf.js. La pièce ne quitte jamais le poste.
 *
 * pdf.js tourne ici sur le fil principal : son module « worker » est chargé
 * comme un module ordinaire (`globalThis.pdfjsWorker`). Pour UNE page, c'est
 * imperceptible, et ça évite de servir un fichier worker à part, dont le
 * chemin diffère entre le serveur de développement et le build.
 */

type PdfJs = typeof import("pdfjs-dist");
let pdfjsCharge: Promise<PdfJs> | null = null;

function chargerPdfJs(): Promise<PdfJs> {
  if (!pdfjsCharge) {
    pdfjsCharge = (async () => {
      const pdfjs = await import("pdfjs-dist");
      const g = globalThis as { pdfjsWorker?: unknown };
      if (!g.pdfjsWorker) g.pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.min.mjs");
      return pdfjs;
    })();
  }
  return pdfjsCharge;
}

export function ApercuPiece({ fichier }: { fichier: File }) {
  const t = useTranslations("repriseUnClient.depot");
  const [url, setUrl] = useState<string | null>(null);
  const [etat, setEtat] = useState<"chargement" | "pret" | "erreur">("chargement");
  const canvas = useRef<HTMLCanvasElement>(null);
  const estPdf = fichier.type === "application/pdf";

  useEffect(() => {
    const u = URL.createObjectURL(fichier);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [fichier]);

  useEffect(() => {
    if (!estPdf || !canvas.current) return;
    let annule = false;
    setEtat("chargement");
    (async () => {
      try {
        const pdfjs = await chargerPdfJs();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()) }).promise;
        const page = await doc.getPage(1);
        if (annule || !canvas.current) return;
        // Assez de définition pour qu'un clic d'agrandissement reste net.
        const largeurCible = 720 * (window.devicePixelRatio || 1);
        const base = page.getViewport({ scale: 1 });
        const vue = page.getViewport({ scale: largeurCible / base.width });
        const c = canvas.current;
        c.width = Math.floor(vue.width);
        c.height = Math.floor(vue.height);
        await page.render({ canvas: c, viewport: vue }).promise;
        if (!annule) setEtat("pret");
        void doc.destroy();
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();
    return () => {
      annule = true;
    };
  }, [fichier, estPdf]);

  const ouvrir = () => url && window.open(url, "_blank", "noopener");

  return (
    <div>
      <button
        type="button"
        onClick={ouvrir}
        aria-label={t("ouvrirPiece", { nom: fichier.name })}
        className="block w-full cursor-zoom-in overflow-hidden rounded border border-si-line bg-si-surface shadow-[0_1px_3px_rgba(22,24,23,0.06)]"
      >
        {estPdf ? (
          <>
            <canvas ref={canvas} className={`block h-auto w-full ${etat === "pret" ? "" : "hidden"}`} />
            {etat !== "pret" && (
              <div className="grid aspect-[8.5/11] place-items-center text-si-muted">
                {etat === "erreur" ? t("apercuImpossible") : "…"}
              </div>
            )}
          </>
        ) : (
          url && (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local d'un fichier du poste (URL blob), hors optimisation d'images
            <img src={url} alt={fichier.name} className="block h-auto w-full" />
          )
        )}
      </button>
      <div className="mt-2.5 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-si-muted">{fichier.name}</span>
        <Lien onClick={ouvrir}>{t("ouvrir")}</Lien>
      </div>
    </div>
  );
}
