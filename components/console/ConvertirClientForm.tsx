"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { convertirClient } from "@/app/(app)/console/clients/[id]/convertir/actions";

/**
 * Formulaire de conversion. Tout est prérempli depuis le lead : la conversion
 * ne doit pas être une ressaisie, seulement une vérification.
 *
 * L'écran dit explicitement ce qui va être créé avant de le créer. Une action
 * qui touche neuf tables mérite d'annoncer sa portée.
 */

export type PlanOption = { key: string; label: string; prix: string };

export function ConvertirClientForm({
  leadId,
  defauts,
  plans,
  nbTachesOuvertes,
}: {
  leadId: string;
  defauts: {
    cabinetNom: string;
    cabinetEmail: string;
    cabinetTelephone: string;
    cabinetAdresse: string;
    adminEmail: string;
  };
  plans: PlanOption[];
  nbTachesOuvertes: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const champ =
    "w-full rounded-md border border-si-line px-3 py-2 text-sm focus:border-si-verified focus:outline-none focus:ring-1 focus:ring-si-verified/20";

  function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("leadId", leadId);
    setErreur(null);
    startTransition(async () => {
      const res = await convertirClient(formData);
      if (res.ok) {
        router.push(`/console/clients/${leadId}`);
        router.refresh();
      } else {
        setErreur(res.error);
      }
    });
  }

  return (
    <form onSubmit={soumettre} className="space-y-6">
      <section className="rounded-xl border border-si-line bg-si-surface px-6 py-5">
        <h2 className="font-serif text-lg text-si-ink">Le cabinet</h2>
        <p className="mt-1 text-xs text-si-muted">
          Prérempli depuis la fiche. Corrigez ce qui doit l&apos;être, c&apos;est ce qui
          apparaîtra sur les factures.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-si-muted">Nom légal</span>
            <input name="cabinetNom" required minLength={2} defaultValue={defauts.cabinetNom} className={champ} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-si-muted">Courriel du cabinet</span>
            <input name="cabinetEmail" type="email" defaultValue={defauts.cabinetEmail} className={champ} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-si-muted">Téléphone</span>
            <input name="cabinetTelephone" defaultValue={defauts.cabinetTelephone} className={champ} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-si-muted">Adresse</span>
            <input name="cabinetAdresse" defaultValue={defauts.cabinetAdresse} className={champ} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-si-muted">Forfait</span>
            <select name="plan" className={champ} defaultValue={plans[0]?.key}>
              {plans.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label} · {p.prix}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-si-muted">
              Fin d&apos;exercice (MM-JJ)
            </span>
            <input name="fiscalYearEnd" placeholder="12-31" pattern="\d{2}-\d{2}" className={champ} />
            <span className="mt-1 block text-[11px] leading-4 text-si-muted">
              Sans elle, aucune durée de conservation légale n&apos;est calculable. Peut être
              renseignée plus tard.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-si-line bg-si-surface px-6 py-5">
        <h2 className="font-serif text-lg text-si-ink">L&apos;accès administrateur</h2>
        <p className="mt-1 text-xs leading-5 text-si-muted">
          Une invitation sera préparée, <span className="font-medium text-si-ink">pas envoyée</span>.
          Vous l&apos;enverrez depuis la fiche quand la configuration sera prête.
        </p>
        <label className="mt-4 block sm:max-w-sm">
          <span className="mb-1 block text-xs font-medium text-si-muted">Courriel</span>
          <input name="adminEmail" type="email" required defaultValue={defauts.adminEmail} className={champ} />
        </label>
      </section>

      <section className="rounded-xl border border-si-line bg-si-canvas px-6 py-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-si-muted">
          Ce qui sera créé
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm text-si-ink">
          <li>Le cabinet client, rattaché définitivement à cette fiche</li>
          <li>Une invitation d&apos;administrateur en attente</li>
          <li>La liste d&apos;activation</li>
          <li>Les tâches d&apos;intégration, échelonnées sur 45 jours</li>
          {nbTachesOuvertes > 0 && (
            <li>
              Les {nbTachesOuvertes} tâche{nbTachesOuvertes > 1 ? "s" : ""} de prospection encore
              ouverte{nbTachesOuvertes > 1 ? "s" : ""} seront annulées, sans être supprimées
            </li>
          )}
        </ul>
        <p className="mt-3 text-xs leading-5 text-si-muted">
          Tout est écrit en une seule transaction. Si quelque chose échoue, rien n&apos;est créé.
          L&apos;historique de prospection reste consultable après la conversion.
        </p>
      </section>

      {erreur && <p className="text-sm text-[#B84A3E]">{erreur}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Conversion..." : "Convertir en client"}
        </Button>
        <Link href={`/console/clients/${leadId}`}>
          <Button type="button" variant="ghost">
            Annuler
          </Button>
        </Link>
      </div>
    </form>
  );
}
