"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useLocale, useTranslations } from "next-intl";

interface ClientSummaryCardsProps {
  totalClients: number;
  activeClients: number;
  activeCasesCount: number;
  unbilledAmount: number;
}

/**
 * Barre de synthèse du registre clients.
 *
 * Ce n'était pas une barre : c'étaient quatre cartes à icône qui se soulevaient
 * au survol et entraient en cascade. Elles poussaient la liste sous la ligne de
 * flottaison alors que la liste EST la page (refonte §9.1). Les quatre mesures
 * sont conservées, leur poids visuel ne l'est pas : plus de cadre, plus
 * d'icône, plus de mouvement. La respiration vient de l'espace et d'un filet.
 */
export function ClientSummaryCards({
  activeClients,
  activeCasesCount,
  unbilledAmount,
}: ClientSummaryCardsProps) {
  const t = useTranslations("clients");
  const { formatCurrency } = useFormatteurs();
  const locale = useLocale();

  /* ── Refonte du 2026-10-01 (déc. CEO, image validée) ───────────────────────
     Quatre mesures en capitales deviennent une ligne d'état, comme sur
     Dossiers et au tableau de bord. Le total et son « 100 % » répétaient les
     clients actifs : ils ne s'affichent plus (la prop `totalClients` reste
     acceptée pour ne pas casser l'appelant). */
  const gras = (chunks: React.ReactNode) => <b className="font-medium text-si-ink">{chunks}</b>;
  const mentions: React.ReactNode[] = [
    t.rich("etatActifs", { count: activeClients, b: gras }),
    t.rich("etatDossiers", { count: activeCasesCount, b: gras }),
    t.rich("etatHonoraires", { montant: formatCurrency(unbilledAmount, "CAD", locale), b: gras }),
  ];

  /* « sm:!-mt-3 » : même raison que sur Dossiers, la page empile ses blocs en
     `space-y-6`, plus spécifique qu'une marge simple. */
  return (
    <p className="-mt-2 sm:!-mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-si-body">
      {mentions.map((m, i) => (
        <span key={i} className="inline-flex items-center gap-3.5">
          {i > 0 && (
            <span aria-hidden className="text-si-subtle">
              ·
            </span>
          )}
          <span>{m}</span>
        </span>
      ))}
    </p>
  );
}
