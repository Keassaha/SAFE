/**
 * Merge class names (strings), filtering undefined/null.
 * Use for conditional or variant-based className in components.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
