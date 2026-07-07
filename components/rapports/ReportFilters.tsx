"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Client, User } from "@prisma/client";
import { useTranslations } from "next-intl";
import { clientDisplayName } from "@/lib/clients/normalize-name";

export function ReportFilters({
  clients,
  users,
  currentYear,
  currentClientId,
  currentUserId,
}: {
  clients: Client[];
  users: User[];
  currentYear: number;
  currentClientId: string;
  currentUserId: string;
}) {
  const t = useTranslations("reportsUi");
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const year = (form.elements.namedItem("annee") as HTMLInputElement).value;
    const clientId = (form.elements.namedItem("clientId") as HTMLSelectElement).value;
    const userId = (form.elements.namedItem("userId") as HTMLSelectElement).value;
    const params = new URLSearchParams();
    if (year) params.set("annee", year);
    if (clientId) params.set("clientId", clientId);
    if (userId) params.set("userId", userId);
    router.push(`/rapports?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-sm font-medium text-si-muted mb-1">
          {t("year")}
        </label>
        <input
          name="annee"
          type="number"
          defaultValue={currentYear}
          min="2020"
          max={new Date().getFullYear() + 1}
          className="w-28 h-10 px-3 rounded-lg border border-si-line bg-si-surface/80 text-si-ink focus:ring-2 focus:ring-si-verified/25 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-si-muted mb-1">
          {t("client")}
        </label>
        <select
          name="clientId"
          className="w-48 h-10 px-3 rounded-lg border border-si-line bg-si-surface/80 text-si-ink focus:ring-2 focus:ring-si-verified/25 outline-none"
          defaultValue={currentClientId}
        >
          <option value="">{t("all")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {clientDisplayName(c)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-si-muted mb-1">
          {t("lawyer")}
        </label>
        <select
          name="userId"
          className="w-48 h-10 px-3 rounded-lg border border-si-line bg-si-surface/80 text-si-ink focus:ring-2 focus:ring-si-verified/25 outline-none"
          defaultValue={currentUserId}
        >
          <option value="">{t("all")}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nom}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">{t("apply")}</Button>
    </form>
  );
}
