"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  terminerActionCle,
  reporterActionCle,
  planifierActionCle,
} from "@/app/(app)/console/actions-cles";

/**
 * Tour de contrôle — une seule action mise en avant, le reste en retrait.
 *
 * Le parti pris : l'écran ne demande jamais « par quoi voulez-vous commencer ».
 * Il répond. La file d'attente reste visible pour la confiance (on voit qu'il
 * n'y a pas de trou), mais elle est volontairement discrète : la lire est
 * facultatif, agir sur la première ne l'est pas.
 */

export type ActionCleVue = {
  cle: string;
  source: string;
  leadId: string | null;
  titre: string;
  cible: string;
  pourquoi: string;
  href: string;
  retardJours: number;
};

const SOURCE_LABELS: Record<string, string> = {
  TACHE: "Planifiée par vous",
  SUPPORT: "Client en attente",
  ACTIVATION: "Activation",
  ESSAI: "Fin d'essai",
  AUDIT: "Suite d'audit",
  REFROIDISSEMENT: "Relance",
  PREMIER_CONTACT: "Premier contact",
};

const REPORTS = [
  { jours: 1, label: "Demain" },
  { jours: 3, label: "Dans 3 jours" },
  { jours: 7, label: "La semaine prochaine" },
];

function tonRetard(retardJours: number, source: string) {
  if (source === "SUPPORT" || retardJours >= 7) {
    return { texte: "text-[#B84A3E]", puce: "bg-[#B84A3E]" };
  }
  if (retardJours >= 2) {
    return { texte: "text-si-amber-ink", puce: "bg-si-amber" };
  }
  return { texte: "text-si-verified", puce: "bg-si-verified" };
}

export function TourDeControle({ actions }: { actions: ActionCleVue[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [reportOuvert, setReportOuvert] = useState(false);
  const [planifOuverte, setPlanifOuverte] = useState(false);

  const principale = actions[0] ?? null;
  const suite = actions.slice(1);

  function agir(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setErreur(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setReportOuvert(false);
        setPlanifOuverte(false);
        router.refresh();
      } else {
        setErreur(res.error);
      }
    });
  }

  function soumettrePlanification(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    agir(() => planifierActionCle(formData));
  }

  const ton = principale ? tonRetard(principale.retardJours, principale.source) : null;
  const estSupport = principale?.source === "SUPPORT";

  return (
    <section className="overflow-hidden rounded-2xl border border-si-line bg-si-surface">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── L'action ─────────────────────────────────────────────── */}
        <div className="px-6 py-6 lg:px-8 lg:py-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-si-muted">
            Prochaine action clé
          </p>

          {principale && ton ? (
            <>
              <h2 className="mt-3 font-serif text-[30px] leading-[1.15] tracking-tight text-si-ink lg:text-[34px]">
                {principale.titre}
              </h2>
              <p className="mt-1.5 text-[15px] font-medium text-si-ink">{principale.cible}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ton.texte}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${ton.puce}`} />
                  {SOURCE_LABELS[principale.source] ?? principale.source}
                </span>
                <p className="text-sm leading-6 text-si-muted">{principale.pourquoi}</p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Link href={principale.href}>
                  <Button variant="primary">
                    {estSupport ? "Ouvrir le billet" : "Ouvrir la fiche"}
                  </Button>
                </Link>

                {!estSupport && (
                  <>
                    <Button
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => agir(() => terminerActionCle(principale.cle))}
                    >
                      C&apos;est fait
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => setReportOuvert((v) => !v)}
                      aria-expanded={reportOuvert}
                    >
                      Reporter
                    </Button>
                  </>
                )}
              </div>

              {reportOuvert && !estSupport && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-si-line bg-si-canvas px-3 py-2.5">
                  <span className="text-xs text-si-muted">Revenir sur ce dossier :</span>
                  {REPORTS.map((r) => (
                    <Button
                      key={r.jours}
                      variant="soft"
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        agir(() => reporterActionCle(principale.cle, r.jours, principale.titre))
                      }
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="mt-3 font-serif text-[30px] leading-[1.15] tracking-tight text-si-ink">
                Rien ne réclame votre attention
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-si-muted">
                Aucun client en attente, aucune relance en retard, aucun audit sans suite. Si vous
                voulez tout de même avancer quelque chose, posez-le ici.
              </p>
            </>
          )}

          {/* Reprendre la main sur le moteur. Déclencheur persistant, jamais au survol. */}
          <div className="mt-5 border-t border-si-line pt-4">
            <button
              type="button"
              onClick={() => setPlanifOuverte((v) => !v)}
              aria-expanded={planifOuverte}
              className="text-xs font-medium text-si-muted underline decoration-si-line underline-offset-4 transition hover:text-si-ink"
            >
              {planifOuverte ? "Annuler" : "Décider moi-même de la prochaine action"}
            </button>

            {planifOuverte && (
              <form onSubmit={soumettrePlanification} className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_auto]">
                <input
                  name="titre"
                  required
                  minLength={3}
                  placeholder="Ex. Appeler Me Tremblay pour la place fondatrice"
                  className="w-full rounded-md border border-si-line px-3 py-2 text-sm focus:border-si-verified focus:outline-none focus:ring-1 focus:ring-si-verified/20"
                />
                <input
                  name="dateEcheance"
                  type="date"
                  className="w-full rounded-md border border-si-line px-3 py-2 text-sm focus:border-si-verified focus:outline-none focus:ring-1 focus:ring-si-verified/20"
                />
                <input type="hidden" name="leadId" value={principale?.leadId ?? ""} />
                <input type="hidden" name="priorite" value="HAUTE" />
                <Button type="submit" variant="primary" disabled={isPending}>
                  Poser l&apos;action
                </Button>
              </form>
            )}
          </div>

          {erreur && <p className="mt-3 text-sm text-[#B84A3E]">{erreur}</p>}
        </div>

        {/* ── La file ──────────────────────────────────────────────── */}
        <aside className="border-t border-si-line bg-si-canvas px-6 py-5 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-si-muted">
            Ensuite
          </p>
          {suite.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-si-muted">
              La file est vide.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {suite.map((a) => {
                const t = tonRetard(a.retardJours, a.source);
                return (
                  <li key={a.cle}>
                    <Link href={a.href} className="group block">
                      <span className="flex items-start gap-2">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.puce}`} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-si-ink group-hover:text-si-verified">
                            {a.cible}
                          </span>
                          <span className="block truncate text-xs text-si-muted">{a.titre}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}
