"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, Plus } from "lucide-react";
import s from "../../../v2.module.css";
import { Drawer } from "../../../_components/Drawer";
import { moneyFR } from "../../../_components/primitives";

/**
 * Drawer « Ajouter du temps » — la seule mutation de la préversion v2.
 * POST /api/temps (validation, calcul du montant et journal d'audit côté
 * serveur), puis router.refresh() : le bandeau financier se met à jour
 * avec les vraies données. Rien de simulé.
 */
export function TimeEntryDrawer({
  dossierId,
  numeroDossier,
  intitule,
  clientName,
  userId,
  defaultTaux,
  variant = "primary",
}: {
  dossierId: string;
  numeroDossier: string;
  intitule: string;
  clientName: string;
  /** Utilisateur courant — requis par timeEntryCreateSchema (POST /api/temps). */
  userId: string;
  defaultTaux: number | null;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [taux, setTaux] = useState(defaultTaux ?? 0);
  const [facturable, setFacturable] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const estimate = facturable ? (minutes / 60) * taux : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/temps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId,
          userId,
          // Midi local : évite le glissement de jour quand la date (YYYY-MM-DD)
          // serait interprétée comme minuit UTC (affichée la veille au Québec).
          date: `${String(form.get("date") ?? today)}T12:00:00`,
          dureeMinutes: minutes,
          description: String(form.get("description") ?? ""),
          facturable,
          tauxHoraire: taux,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? `Erreur ${res.status}`);
      }
      setOpen(false);
      setToast(
        `${(minutes / 60).toLocaleString("fr-CA", { maximumFractionDigits: 2 })} h ajoutée${minutes >= 120 ? "s" : ""} au dossier.`,
      );
      window.setTimeout(() => setToast(null), 3200);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={variant === "primary" ? s.primaryButton : s.secondaryButton}
        onClick={() => setOpen(true)}
      >
        <Plus size={16} />
        Ajouter du temps
      </button>

      {open ? (
        <Drawer
          title="Ajouter du temps"
          context={numeroDossier}
          onClose={() => setOpen(false)}
        >
          <form className={s.form} onSubmit={handleSubmit}>
            <div className={s.formContext}>
              <span className={s.formContextIcon}>
                <BriefcaseBusiness size={18} />
              </span>
              <span>
                <strong>{intitule}</strong>
                <small>
                  {numeroDossier} · {clientName}
                </small>
              </span>
              <CheckCircle2 size={18} />
            </div>

            <label>
              Description
              <textarea
                name="description"
                rows={3}
                required
                placeholder="Travail effectué sur le dossier…"
              />
            </label>

            <div className={s.formGrid}>
              <label>
                Date
                <input type="date" name="date" defaultValue={today} required />
              </label>
              <label>
                Durée (minutes)
                <input
                  type="number"
                  name="dureeMinutes"
                  min={1}
                  max={1440}
                  step={1}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  required
                />
              </label>
            </div>

            <div className={s.formGrid}>
              <label>
                Taux
                <div className={s.inputSuffix}>
                  <input
                    type="number"
                    name="tauxHoraire"
                    min={0}
                    step={5}
                    value={taux}
                    onChange={(e) => setTaux(Number(e.target.value))}
                    required
                  />
                  <span>$/h</span>
                </div>
              </label>
            </div>

            <label className={s.checkRow}>
              <input
                type="checkbox"
                checked={facturable}
                onChange={(e) => setFacturable(e.target.checked)}
              />
              <span>
                <strong>Facturable</strong>
                <small>
                  Cette entrée pourra être ajoutée à la prochaine facture du
                  dossier.
                </small>
              </span>
            </label>

            {error ? <p className={s.formError}>{error}</p> : null}

            <div className={s.formFooter}>
              <span>
                Montant estimé <strong>{moneyFR.format(estimate)}</strong>
              </span>
              <button
                type="submit"
                className={s.primaryButton}
                disabled={saving}
              >
                {saving ? "Enregistrement…" : "Enregistrer le temps"}
              </button>
            </div>
          </form>
        </Drawer>
      ) : null}

      {toast ? (
        <div className={s.toast} role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      ) : null}
    </>
  );
}
