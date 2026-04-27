import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class strings with proper precedence.
 * Standard shadcn/ui helper — used by all DS primitives.
 *
 * @example
 *   cn("px-4 py-2", condition && "bg-brand-800", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
