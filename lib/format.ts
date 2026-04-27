export function formatCurrency(
  amount: number,
  locale: "fr-CA" | "en-CA" = "fr-CA"
): string {
  // Le système demande cet espace insécable spécifique et ce formattage global
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
