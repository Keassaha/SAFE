"use client";

import { Header } from "@/components/layout/Header";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TimerProvider } from "@/lib/contexts/TimerContext";

/**
 * Aperçu du châssis applicatif, hors authentification.
 *
 * La barre supérieure ne vit que derrière une session, ce qui la rendait
 * invisible à la vérification. Elle prend ici des données factices, sur le
 * fond réel du canvas, pour qu'on puisse juger la surface flottante, le verre
 * et l'indicateur glissant sans se connecter.
 *
 * Route publique, temporaire.
 */
export default function ApercuChassis() {
  return (
    <QueryProvider>
      <TimerProvider>
        <div className="safe-atmosphere flex h-[100dvh] flex-col font-sans">
          <Header
            user={{ name: "Me Camille Roy", email: "camille.demo@safecabinet.ca" }}
            cabinetId="apercu"
            billingMode="horaire"
            role="avocat"
            trustStatus={null}
          />
          <main className="flex-1 overflow-y-auto px-3 py-6 sm:px-5 md:px-8">
            <div className="mx-auto w-full max-w-[1440px]">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">
                Aperçu du châssis
              </p>
              <h1 className="mt-2 font-serif text-[32px] leading-tight text-si-ink">
                La barre passe au-dessus du travail
              </h1>
              <p className="mt-3 max-w-[65ch] text-[14px] leading-relaxed text-si-body">
                Survolez les entrées de la barre : une seule pastille se déplace, elle ne
                s&apos;allume pas entrée par entrée. Faites défiler la page : le contenu
                passe sous le verre.
              </p>

              {/* De la matière à faire passer sous le verre, pour juger la
                  translucidité autrement que sur un aplat vide. */}
              <div className="mt-10 space-y-4">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-si-line bg-si-surface px-6 py-5"
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <span className="text-[14px] font-medium text-si-ink">
                        Dossier 2026-{String(100 + i).padStart(4, "0")}
                      </span>
                      <span className="font-mono text-[13px] tabular-nums text-si-ink">
                        {(12450.5 * (i + 1)).toLocaleString("fr-CA", {
                          style: "currency",
                          currency: "CAD",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-si-muted">
                      Me Sophie Roy · dernière activité il y a {i + 1} h
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </TimerProvider>
    </QueryProvider>
  );
}
