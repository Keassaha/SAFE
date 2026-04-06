"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <form onSubmit={handleSubmit} className="flex-1 min-w-0 max-w-md">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-muted pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full h-10 pl-9 pr-4 rounded-safe-sm border border-neutral-border bg-white text-neutral-text-primary placeholder:text-neutral-muted focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all text-sm"
          aria-label={t("searchLabel")}
        />
        {isPending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-muted">
            …
          </span>
        )}
      </div>
    </form>
  );
}
