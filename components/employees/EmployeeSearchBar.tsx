"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

const DEBOUNCE_MS = 300;

export function EmployeeSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("employees");
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  const apply = useCallback(
    (q: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (q.trim()) {
        next.set("q", q.trim());
        next.delete("page");
      } else {
        next.delete("q");
        next.delete("page");
      }
      router.push(`/employees?${next.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        apply(value);
      }}
    >
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => apply(value)}
        placeholder={t("searchPlaceholder")}
        className="w-full min-w-[200px] max-w-xs pl-9 pr-3 py-2 rounded-lg border border-neutral-border bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        aria-label={t("searchLabel")}
      />
    </form>
  );
}
