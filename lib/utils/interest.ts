/**
 * Calcule les intérêts sur une facture en retard.
 * @param montantRestant Solde dû
 * @param tauxAnnuel Taux d'intérêt annuel (ex: 0.12 pour 12%)
 * @param dateEcheance Date d'échéance de la facture
 * @param dateLimiteInterets Date jusqu'à laquelle les intérêts s'appliquent (optionnel)
 */
export function calculateInterest(
  montantRestant: number,
  tauxAnnuel: number,
  dateEcheance: Date,
  dateLimiteInterets?: Date | null
): number {
  const now = dateLimiteInterets ?? new Date();
  if (now <= dateEcheance) return 0;
  const joursEnRetard = Math.floor(
    (now.getTime() - dateEcheance.getTime()) / (1000 * 60 * 60 * 24)
  );
  const tauxJournalier = tauxAnnuel / 365;
  return Math.round(montantRestant * tauxJournalier * joursEnRetard * 100) / 100;
}
