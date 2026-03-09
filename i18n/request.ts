import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export default getRequestConfig(async () => {
  const store = await cookies();
  const localeCookie = store.get("NEXT_LOCALE")?.value;
  const locale: Locale =
    localeCookie === "en" || localeCookie === "fr" ? localeCookie : defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: "America/Toronto",
  };
});
