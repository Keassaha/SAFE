/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and escapes dangerous characters.
 */
export function sanitizeInput(str: string): string {
  if (typeof str !== "string") return str;
  return str
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Recursively sanitize all string values in an object.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeInput(item)
          : item && typeof item === "object"
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      );
    } else if (value && typeof value === "object" && !(value instanceof Date)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      );
    }
  }
  return result;
}
