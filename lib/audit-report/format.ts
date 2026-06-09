//   = espace fine insécable (séparateur de milliers québécois)
//   = espace insécable (avant le symbole $)
const NARROW = " ";
const NBSP = " ";

export function formatCAD(n: number): string {
  const rounded = Math.round(n);
  const str = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NARROW);
  return `${rounded < 0 ? "-" : ""}${str}${NBSP}$`;
}

export function formatPct(n: number): string {
  return `${Math.round(n)}${NBSP}%`;
}

export function formatJours(n: number): string {
  return `${n}${NBSP}jour${n !== 1 ? "s" : ""}`;
}

export function formatHeures(n: number): string {
  const fixed = Number.isInteger(n) ? n.toString() : n.toFixed(1);
  return `${fixed}${NBSP}h`;
}
