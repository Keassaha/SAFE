"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { updateProrataVehicule } from "@/app/(app)/parametres/cabinet/actions";
import type { ProrataVehiculeAnnee } from "@/lib/cabinet-config";

/**
 * Part d'usage d'affaires du véhicule.
 *
 * Spec : SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §6, arbitrage CEO n° 1.
 *
 * LA FAIBLESSE EST ÉCRITE, PAS CACHÉE
 *
 * L'arbitrage CEO exige que la conséquence soit dite à l'écran : un prorata saisi se
 * défend moins bien qu'un prorata calculé sur un registre kilométrique. Taire ce
 * point donnerait au cabinet une confiance que le chiffre ne mérite pas, et c'est
 * exactement ce qui se paie en vérification.
 *
 * PAR EXERCICE
 *
 * L'usage varie d'une année à l'autre. Une valeur unique appliquée à tout
 * l'historique produirait une déduction fausse sur des exercices déjà déclarés.
 */
export function ProrataVehiculeCard({
  anneeCourante,
  entrees,
  canWrite = true,
}: {
  anneeCourante: number;
  entrees: ProrataVehiculeAnnee[];
  canWrite?: boolean;
}) {
  const t = useTranslations("settingsUi");
  const router = useRouter();
  const existante = entrees.find((e) => e.annee === anneeCourante);
  const [annee, setAnnee] = useState(String(anneeCourante));
  const [pourcentage, setPourcentage] = useState(
    existante ? String(Math.round(existante.prorata * 100)) : "",
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, startTransition] = useTransition();

  const n = Number.parseInt(pourcentage, 10);
  const valide = Number.isFinite(n) && n >= 0 && n <= 100;

  const champ =
    "w-full rounded-md border-[0.5px] border-si-line bg-si-surface px-3 py-2 text-[14px] tabular-nums text-si-ink outline-none focus:border-si-verified focus:shadow-focus";

  function enregistrer() {
    setErreur(null);
    startTransition(async () => {
      const r = await updateProrataVehicule({
        annee: Number.parseInt(annee, 10),
        pourcentage: n,
      });
      if (!r.success) setErreur(r.error);
      else router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-si-line bg-si-surface p-5">
      <h3 className="text-[15px] font-medium text-si-ink">{t("prorataVehiculeTitre")}</h3>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-si-muted">
        {t("prorataVehiculeIntro")}
      </p>

      {/* La conséquence assumée, à l'écran et non en note de bas de page. */}
      <p className="mt-2 max-w-2xl rounded-md border border-si-line bg-si-canvas px-3 py-2.5 text-[13px] leading-relaxed text-si-ink">
        {t("prorataVehiculeAvertissement")}
      </p>

      {canWrite ? (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-28">
            <label className="mb-[6px] block text-[12px] font-medium text-si-ink" htmlFor="prorata-annee">
              {t("prorataAnnee")}
            </label>
            <input
              id="prorata-annee"
              inputMode="numeric"
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className={champ}
            />
          </div>
          <div className="w-32">
            <label className="mb-[6px] block text-[12px] font-medium text-si-ink" htmlFor="prorata-pct">
              {t("prorataPourcentage")}
            </label>
            <input
              id="prorata-pct"
              inputMode="numeric"
              value={pourcentage}
              onChange={(e) => setPourcentage(e.target.value)}
              placeholder="60"
              className={champ}
            />
          </div>
          <Button type="button" variant="primary" disabled={enCours || !valide} onClick={enregistrer}>
            {t("enregistrer")}
          </Button>
        </div>
      ) : null}

      {erreur ? (
        <p className="mt-2 text-[13px] text-si-danger-ink" role="alert">
          {erreur}
        </p>
      ) : null}

      {entrees.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {entrees.map((e) => (
            <li key={e.annee} className="text-[13px] text-si-muted">
              <span className="tabular-nums text-si-ink">
                {e.annee} · {Math.round(e.prorata * 100)} %
              </span>{" "}
              {t("prorataDeclareLe", { date: e.saisiLe })}
              {e.saisiPar ? ` ${t("prorataPar", { nom: e.saisiPar })}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[13px] text-si-muted">{t("prorataAucun")}</p>
      )}
    </section>
  );
}
