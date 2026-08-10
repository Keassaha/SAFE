import Link from "next/link";
import { ArrowRight, CircleDollarSign, Clock3, Receipt, WalletCards } from "lucide-react";
import type { DossierFinancialSummary } from "@/lib/dossiers/financial-summary";
import s from "../../../v2.module.css";
import { hoursLabel, moneyFR } from "../../../_components/primitives";

/**
 * Bandeau « contexte financier » — 4 tuiles réelles, chacune navigue vers
 * l'onglet correspondant (?tab=). En mode forfait, la valeur du temps non
 * facturé est indicative : on n'affiche que les heures.
 */
export function FinancialStrip({
  dossierId,
  summary,
}: {
  dossierId: string;
  summary: DossierFinancialSummary;
}) {
  const base = `/v2/dossiers/${dossierId}`;
  const isForfait = summary.modeFacturation === "forfait";

  return (
    <section className={s.contextStrip} aria-label="Contexte financier du dossier">
      <Link href={`${base}?tab=time`} scroll={false}>
        <span className={s.contextIcon}>
          <Clock3 size={16} />
        </span>
        <span>
          <small>Temps non facturé</small>
          <strong>{hoursLabel(summary.unbilledMinutes)}</strong>
        </span>
        <ArrowRight size={15} />
      </Link>
      <Link href={`${base}?tab=billing`} scroll={false}>
        <span className={s.contextIcon}>
          <Receipt size={16} />
        </span>
        <span>
          <small>Montant facturable</small>
          <strong>
            {isForfait ? "Forfait" : moneyFR.format(summary.billableAmount)}
          </strong>
        </span>
        <ArrowRight size={15} />
      </Link>
      <Link href={`${base}?tab=billing`} scroll={false}>
        <span className={s.contextIcon}>
          <CircleDollarSign size={16} />
        </span>
        <span>
          <small>Solde à recevoir</small>
          <strong>
            {summary.issuedInvoiceCount === 0
              ? "Aucune facture"
              : moneyFR.format(summary.receivableBalance)}
          </strong>
        </span>
        <ArrowRight size={15} />
      </Link>
      <Link href={`${base}?tab=trust`} scroll={false}>
        <span className={s.contextIcon}>
          <WalletCards size={16} />
        </span>
        <span>
          <small>Fidéicommis</small>
          <strong>{moneyFR.format(summary.trustBalance)}</strong>
        </span>
        <ArrowRight size={15} />
      </Link>
    </section>
  );
}
