"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createContact } from "@/app/(app)/console/leads/[id]/contact-actions";

const ROLES = [
  { v: "AVOCAT_PROPRIETAIRE", l: "Avocat propriétaire" },
  { v: "AVOCAT_ASSOCIE", l: "Avocat associé" },
  { v: "ADJOINT_JURIDIQUE", l: "Adjoint juridique" },
  { v: "COMPTABLE_INTERNE", l: "Comptable interne" },
  { v: "MANAGER_CABINET", l: "Manager cabinet" },
  { v: "PARTENAIRE_STRATEGIQUE", l: "Partenaire stratégique" },
];

const inputCls =
  "w-full rounded-md border border-si-line px-3 py-2 text-sm focus:border-si-verified focus:outline-none focus:ring-1 focus:ring-si-verified/20";

export function AddContactForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("leadId", leadId);
    setError(null);
    startTransition(async () => {
      const result = await createContact(formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-si-line px-3 py-1.5 text-xs font-medium text-si-muted hover:border-si-verified/50 hover:text-si-verified"
      >
        + Ajouter un contact
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-3 rounded-md border border-si-line bg-si-canvas/60 p-4"
    >
      {error && (
        <div className="rounded border border-[#B84A3E]/30 bg-[#B84A3E]/10 px-3 py-1.5 text-xs text-[#B84A3E]">
          ⚠️ {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-si-muted">Prénom *</label>
          <input name="prenom" required className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-si-muted">Nom *</label>
          <input name="nom" required className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-si-muted">Rôle *</label>
          <select name="roleCrm" required className={inputCls} defaultValue="ADJOINT_JURIDIQUE">
            {ROLES.map((r) => (
              <option key={r.v} value={r.v}>
                {r.l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-si-muted">Titre</label>
          <input name="titre" className={inputCls} placeholder="Ex: Adjointe principale" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-si-muted">Courriel</label>
          <input name="email" type="email" className={inputCls} placeholder="prenom@cabinet.ca" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-si-muted">Statut courriel</label>
          <select name="emailStatut" className={inputCls} defaultValue="NON_VERIFIE">
            <option value="NON_VERIFIE">Non vérifié</option>
            <option value="VALIDE">Valide</option>
            <option value="INVALIDE">Invalide</option>
            <option value="BOUNCE">Bounce</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-si-muted">LinkedIn</label>
          <input name="linkedinUrl" className={inputCls} placeholder="https://linkedin.com/in/…" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-si-muted">Téléphone</label>
          <input name="telephone" className={inputCls} placeholder="514-555-0000" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-si-ink">
          <input type="checkbox" name="estDecideur" /> Décideur
        </label>
        <label className="flex items-center gap-2 text-sm text-si-ink">
          <input type="checkbox" name="estChampionInterne" /> Champion interne (bottom-up)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-si-verified px-3 py-1.5 text-sm font-medium text-si-surface hover:bg-si-forest-soft disabled:opacity-50"
        >
          {isPending ? "Ajout…" : "Ajouter le contact"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-si-line px-3 py-1.5 text-sm text-si-ink hover:bg-si-canvas/60"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
