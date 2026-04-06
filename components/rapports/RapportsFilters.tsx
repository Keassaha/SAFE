"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

interface RapportsFiltersProps {
  clients: { id: string; label: string }[];
  avocats: { id: string; label: string }[];
  defaultDateDebut: string;
  defaultDateFin: string;
  defaultClientId: string;
  defaultUserId: string;
  defaultStatut: string;
}

export function RapportsFilters({
  clients,
  avocats,
  defaultDateDebut,
  defaultDateFin,
  defaultClientId,
  defaultUserId,
  defaultStatut,
}: RapportsFiltersProps) {
  const t = useTranslations("rapports");
  const tc = useTranslations("common");
  const ti = useTranslations("invoiceStatut");
  const router = useRouter();

  const STATUT_OPTIONS = [
    { value: "", label: tc("all") },
    { value: "brouillon", label: ti("brouillon") },
    { value: "envoyee", label: ti("envoyee") },
    { value: "partiellement_payee", label: ti("partiellement_payee") },
    { value: "payee", label: ti("payee") },
    { value: "en_retard", label: ti("en_retard") },
  ];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dateDebut = (form.elements.namedItem("dateDebut") as HTMLInputElement).value;
    const dateFin = (form.elements.namedItem("dateFin") as HTMLInputElement).value;
    const clientId = (form.elements.namedItem("clientId") as HTMLSelectElement).value;
    const userId = (form.elements.namedItem("userId") as HTMLSelectElement).value;
    const statut = (form.elements.namedItem("statut") as HTMLSelectElement).value;
    const params = new URLSearchParams();
    if (dateDebut) params.set("dateDebut", dateDebut);
    if (dateFin) params.set("dateFin", dateFin);
    if (clientId) params.set("clientId", clientId);
    if (userId) params.set("userId", userId);
    if (statut) params.set("statut", statut);
    router.push(`/rapports?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      <div>
        <label htmlFor="rapports-dateDebut" className="block text-sm font-medium safe-text-secondary mb-1">
          {tc("from")}
        </label>
        <input
          id="rapports-dateDebut"
          name="dateDebut"
          type="date"
          defaultValue={defaultDateDebut}
          className="w-40 h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/80 safe-text-title focus:ring-2 focus:ring-primary-500/30 outline-none"
        />
      </div>
      <div>
        <label htmlFor="rapports-dateFin" className="block text-sm font-medium safe-text-secondary mb-1">
          {tc("to")}
        </label>
        <input
          id="rapports-dateFin"
          name="dateFin"
          type="date"
          defaultValue={defaultDateFin}
          className="w-40 h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/80 safe-text-title focus:ring-2 focus:ring-primary-500/30 outline-none"
        />
      </div>
      <div>
        <label htmlFor="rapports-clientId" className="block text-sm font-medium safe-text-secondary mb-1">
          {tc("client")}
        </label>
        <select
          id="rapports-clientId"
          name="clientId"
          className="w-48 min-w-0 h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/80 safe-text-title focus:ring-2 focus:ring-primary-500/30 outline-none"
          defaultValue={defaultClientId}
        >
          <option value="">{tc("all")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="rapports-userId" className="block text-sm font-medium safe-text-secondary mb-1">
          {t("lawyer")}
        </label>
        <select
          id="rapports-userId"
          name="userId"
          className="w-48 min-w-0 h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/80 safe-text-title focus:ring-2 focus:ring-primary-500/30 outline-none"
          defaultValue={defaultUserId}
        >
          <option value="">{tc("all")}</option>
          {avocats.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="rapports-statut" className="block text-sm font-medium safe-text-secondary mb-1">
          {t("invoiceStatus")}
        </label>
        <select
          id="rapports-statut"
          name="statut"
          className="w-44 min-w-0 h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/80 safe-text-title focus:ring-2 focus:ring-primary-500/30 outline-none"
          defaultValue={defaultStatut}
        >
          {STATUT_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">{t("apply")}</Button>
    </form>
  );
}
