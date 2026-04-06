"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/i18n/request";

const LOCALE_COOKIE = "NEXT_LOCALE";

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocaleCookie(newLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1 rounded-safe-sm border border-neutral-200 bg-white p-0.5">
      <button
        type="button"
        onClick={() => switchTo("fr")}
        className={`rounded-safe-sm px-3 py-1.5 text-sm font-medium transition-colors ${
          locale === "fr"
            ? "bg-primary-100 text-primary-800"
            : "text-[var(--safe-text-secondary)] hover:bg-neutral-100"
        }`}
        aria-pressed={locale === "fr"}
        aria-label={t("french")}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={`rounded-safe-sm px-3 py-1.5 text-sm font-medium transition-colors ${
          locale === "en"
            ? "bg-primary-100 text-primary-800"
            : "text-[var(--safe-text-secondary)] hover:bg-neutral-100"
        }`}
        aria-pressed={locale === "en"}
        aria-label={t("english")}
      >
        EN
      </button>
      {isPending && (
        <span className="sr-only">{t("loading")}</span>
      )}
    </div>
  );
}
