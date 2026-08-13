"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { registreChampClass } from "@/components/ui/registre";

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
      className="relative min-w-0 flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        apply(value);
      }}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-si-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => apply(value)}
        placeholder={t("searchPlaceholder")}
        className={`w-full pl-9 pr-4 placeholder:text-si-muted ${registreChampClass}`}
        aria-label={t("searchLabel")}
      />
    </form>
  );
}
