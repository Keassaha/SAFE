"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { registreChampClass } from "@/components/ui/registre";

const SEARCH_PARAM = "q";
const DEBOUNCE_MS = 400;

export function ClientSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("clients");
  const defaultValue = searchParams.get(SEARCH_PARAM) ?? "";
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySearch = useCallback(
    (q: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (q.trim()) next.set(SEARCH_PARAM, q.trim());
      else next.delete(SEARCH_PARAM);
      next.delete("page");
      startTransition(() => {
        router.push(`/clients?${next.toString()}`);
      });
    },
    [searchParams, router]
  );

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const currentParam = searchParams.get(SEARCH_PARAM) ?? "";
      if (value.trim() !== currentParam) applySearch(value);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, searchParams, applySearch]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    applySearch(value);
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0 flex-1">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-si-muted"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className={`w-full pl-9 pr-4 placeholder:text-si-muted ${registreChampClass}`}
          aria-label={t("searchLabel")}
        />
        {isPending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-si-muted">
            …
          </span>
        )}
      </div>
    </form>
  );
}
