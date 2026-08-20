"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Bell } from "lucide-react";
import type { TrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";

/**
 * Centre d'obligations.
 *
 * Remplace le bandeau rouge pleine largeur qui occupait le haut de chaque écran.
 * Une obligation réglementaire ne disparaît pas pour autant : elle cesse
 * simplement de crier sur toute la largeur, à chaque page, pendant des semaines.
 *
 * Un outil de travail qui vit en état d'alerte permanent finit par n'alerter
 * plus de rien. Ici, la gravité tient dans une pastille ; le détail et l'action
 * s'ouvrent quand la personne le décide.
 *
 * La liste est conçue pour accueillir d'autres sources. Elle n'en porte qu'une
 * aujourd'hui : le rapprochement du compte en fidéicommis.
 */

type Gravite = "critique" | "attention";

type Obligation = {
  id: string;
  gravite: Gravite;
  titre: string;
  detail: string;
  echeance: string | null;
  href: string;
  action: string;
};

/**
 * Vue minimale de l'abonnement, sérialisable pour un composant client.
 * `echeance` est une chaîne ISO : une `Date` ne traverse pas la frontière RSC.
 */
export interface AbonnementAlerte {
  actif: boolean;
  /** `no_active_subscription`, `acces_expire`, `past_due`, `canceled`, `unpaid`… */
  motif: string | null;
  echeance: string | null;
}

export interface AlertCenterProps {
  status: TrustReconciliationStatus | null;
  /** Pilote la réglementation citée, jamais la langue de l'interface. */
  province?: string | null;
  /**
   * État de l'abonnement. Quand il n'est pas actif, il devient une obligation
   * de plus dans cette liste, au lieu de fermer l'application entière.
   */
  abonnement?: AbonnementAlerte | null;
}

export function AlertCenter({ status, province, abonnement }: AlertCenterProps) {
  const t = useTranslations("alertCenter");
  const ta = useTranslations("abonnementAlerte");
  const tb = useTranslations("trustBanner");
  const locale = useLocale();
  const [ouvert, setOuvert] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const auClic = (e: MouseEvent) => {
      if (zoneRef.current && !zoneRef.current.contains(e.target as Node)) setOuvert(false);
    };
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [ouvert]);

  const obligations: Obligation[] = [];

  if (status?.isOverdue) {
    const juridiction = (province ?? "").toUpperCase() === "QC" ? "qc" : "on";
    const etat = status.hasNeverReconciled ? "never" : "overdue";
    obligations.push({
      id: "trust-reconciliation",
      // Jamais rapproché : rien ne prouve l'intégrité du compte. C'est le seul
      // cas où la gravité maximale est justifiée.
      gravite: status.hasNeverReconciled ? "critique" : "attention",
      titre: tb(`${juridiction}.${etat}.headline`, { days: status.daysOverdue }),
      detail: tb(`${juridiction}.${etat}.detail`, {
        expected: status.expectedPeriode,
        last: status.lastCertifiedPeriode ?? tb("never"),
      }),
      echeance: status.expectedPeriode ?? null,
      href: "/comptes/rapprochement",
      action: tb("cta"),
    });
  }

  /* L'abonnement n'est PAS une obligation réglementaire : c'est une créance
     commerciale. Sa gravité reste donc « attention », jamais « critique », et
     elle passe après le fidéicommis, qui engage la responsabilité professionnelle
     de l'avocate. Un rappel de facturation ne doit pas crier plus fort qu'un
     compte en fidéicommis non rapproché. */
  if (abonnement && !abonnement.actif) {
    const motif = abonnement.motif ?? "no_active_subscription";
    const connu = ["past_due", "unpaid", "canceled", "acces_expire"].includes(motif);
    obligations.push({
      id: "abonnement",
      gravite: "attention",
      titre: ta(connu ? `${motif}.titre` : "aucun.titre"),
      detail: ta(connu ? `${motif}.detail` : "aucun.detail"),
      echeance: abonnement.echeance,
      href: "/parametres/abonnement",
      action: ta("cta"),
    });
  }

  const total = obligations.length;
  const critique = obligations.some((o) => o.gravite === "critique");

  return (
    <div className="relative" ref={zoneRef}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={total > 0 ? t("triggerWithCount", { count: total }) : t("triggerEmpty")}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-[7px] text-si-muted transition-colors hover:bg-si-canvas hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        {total > 0 ? (
          // Le compte est un chiffre, pas une pastille muette : il se lit,
          // il s'annonce, et il ne repose pas sur la seule couleur.
          <span
            className={`absolute -right-0.5 -top-0.5 inline-flex min-w-[17px] justify-center rounded-full px-1 font-mono text-[10px] font-medium leading-[17px] tabular-nums text-white ${
              critique ? "bg-status-error" : "bg-si-amber"
            }`}
          >
            {total}
          </span>
        ) : null}
      </button>

      {ouvert ? (
        // Plan 3, niveau elevated : le panneau se déploie par-dessus le travail,
        // qui reste perceptible derrière lui.
        <div
          role="dialog"
          aria-label={t("title")}
          /* Plan 3, opaque et élevé, pas vitré.

             Ce panneau vit à l'intérieur de l'en-tête, qui porte déjà un verre
             subtle. Un ancêtre avec `backdrop-filter` devient racine
             d'arrière-plan : le flou d'un descendant n'échantillonne alors plus
             la page. Le panneau vitré ne floutait donc rien, et le contenu de
             la page restait net derrière son texte, illisible.

             La table de décision de la doctrine tranche de toute façon dans le
             même sens : le travail derrière une obligation réglementaire n'a pas
             besoin de rester perceptible. Ombre et filet, pas de flou.

             Ancré au déclencheur sur grand écran ; au viewport sur téléphone,
             où un panneau de 24 rem aligné à droite sortait de l'écran. */
          className="safe-elevated-opaque fixed inset-x-4 top-16 z-40 rounded-lg border sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96"
        >
          <div className="border-b border-si-line px-4 py-3">
            <p className="text-sm font-medium text-si-ink">{t("title")}</p>
            <p className="mt-0.5 text-xs text-si-muted">
              {total > 0 ? t("subtitle", { count: total }) : t("empty")}
            </p>
          </div>

          {total > 0 ? (
            <ul className="divide-y divide-si-line">
              {obligations.map((o) => (
                <li key={o.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-caps ${
                        o.gravite === "critique"
                          ? "bg-status-error-bg text-status-error"
                          : "bg-si-amber/10 text-si-amber-ink"
                      }`}
                    >
                      {t(`severity.${o.gravite}`)}
                    </span>
                    <p className="min-w-0 text-sm font-medium leading-snug text-si-ink">{o.titre}</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-si-muted">{o.detail}</p>
                  {o.echeance ? (
                    <p className="mt-1.5 font-mono text-xs tabular-nums text-si-muted">
                      {t("period", { period: o.echeance })}
                    </p>
                  ) : null}
                  <Link
                    href={o.href}
                    hrefLang={locale}
                    onClick={() => setOuvert(false)}
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-si-verified transition-colors hover:text-si-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
                  >
                    {o.action}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
