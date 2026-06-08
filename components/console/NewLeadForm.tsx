"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLead } from "@/app/(app)/console/leads/actions";

const PROVINCES = ["QC", "ON", "NB", "MB", "BC", "AB", "AUTRE"];
const TAILLES = [
  { v: "SOLO", l: "Solo" },
  { v: "DEUX_CINQ", l: "2-5 avocats" },
  { v: "SIX_DIX", l: "6-10 avocats" },
  { v: "ONZE_VINGT", l: "11-20 avocats" },
  { v: "VINGT_UN_CINQUANTE", l: "21-50 avocats" },
  { v: "PLUS_CINQUANTE", l: "50+ avocats" },
];
const SOURCES = [
  { v: "LINKEDIN_DM_WARM", l: "LinkedIn DM tiède" },
  { v: "LINKEDIN_DM_COLD", l: "LinkedIn DM froid" },
  { v: "LINKEDIN_POST", l: "LinkedIn post" },
  { v: "SEO_ORGANIC", l: "SEO organique" },
  { v: "SEO_LOCAL_BUSINESS", l: "SEO local" },
  { v: "REFERRAL", l: "Référence" },
  { v: "AUDIT_GRATUIT", l: "Audit gratuit" },
  { v: "EMAIL", l: "Email" },
  { v: "FACEBOOK_GROUP", l: "Groupe Facebook" },
  { v: "RECRUITMENT_AGENCY", l: "Agence de recrutement" },
  { v: "OFFLINE", l: "Hors ligne" },
];
const DOMAINES = [
  "droit_famille",
  "immobilier",
  "immigration",
  "droit_affaires",
  "litige_civil",
  "criminel",
  "travail",
  "fiscal",
];
const DOMAINE_LABELS: Record<string, string> = {
  droit_famille: "Droit familial",
  immobilier: "Immobilier",
  immigration: "Immigration",
  droit_affaires: "Droit des affaires",
  litige_civil: "Litige civil",
  criminel: "Droit criminel",
  travail: "Droit du travail",
  fiscal: "Fiscal",
};

const labelCls = "block text-xs font-medium text-zinc-600 mb-1";
const inputCls =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export function NewLeadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createLead(formData);
      if (result.ok) {
        router.push(`/console/leads/${result.leadId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* Identité */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Identité
        </h2>
        <div>
          <label className={labelCls}>Nom du cabinet *</label>
          <input
            name="raisonSociale"
            required
            className={inputCls}
            placeholder="Cabinet Exemple Avocats"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Province *</label>
            <select name="province" required className={inputCls} defaultValue="QC">
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Ville</label>
            <input name="ville" className={inputCls} placeholder="Montréal" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Site web</label>
            <input name="siteWeb" className={inputCls} placeholder="https://…" />
          </div>
          <div>
            <label className={labelCls}>LinkedIn</label>
            <input
              name="linkedinUrl"
              className={inputCls}
              placeholder="https://linkedin.com/…"
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Langue</label>
          <select name="langue" className={inputCls} defaultValue="FR">
            <option value="FR">Français</option>
            <option value="EN">Anglais</option>
            <option value="BILINGUE">Bilingue</option>
          </select>
        </div>
      </section>

      {/* Caractéristiques */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Caractéristiques du cabinet
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Taille *</label>
            <select name="tailleCabinet" required className={inputCls} defaultValue="SOLO">
              {TAILLES.map((t) => (
                <option key={t.v} value={t.v}>
                  {t.l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Avocats estimés</label>
            <input
              name="nbAvocatsEstime"
              type="number"
              min="0"
              className={inputCls}
              placeholder="1"
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Domaines de pratique</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DOMAINES.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" name="domainesPratique" value={d} />
                {DOMAINE_LABELS[d]}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Mode de facturation</label>
            <select name="modeFacturation" className={inputCls} defaultValue="">
              <option value="">— Inconnu —</option>
              <option value="HORAIRE">Horaire</option>
              <option value="FORFAIT">Forfait</option>
              <option value="MIXTE">Mixte</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Logiciel actuel</label>
            <input
              name="logicielActuel"
              className={inputCls}
              placeholder="Excel, Clio, Juris Concept…"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="aTrustAccounting" />
          Gère un compte en fidéicommis
        </label>
      </section>

      {/* Acquisition */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Acquisition
        </h2>
        <div>
          <label className={labelCls}>Source du lead *</label>
          <select name="sourceLead" required className={inputCls} defaultValue="LINKEDIN_DM_WARM">
            {SOURCES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Notes privées</label>
          <textarea
            name="notesPrivees"
            rows={3}
            className={inputCls}
            placeholder="Contexte, première impression, prochaine action…"
          />
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-zinc-200 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "Création…" : "Créer le cabinet"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/console/leads")}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
