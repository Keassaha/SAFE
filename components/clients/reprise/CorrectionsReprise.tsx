"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MotifAnnulationModal } from "@/components/comptabilite/MotifAnnulationModal";
import type { JournalCorrectionMotive } from "@prisma/client";

/**
 * L'espace de correction des exercices précédents.
 *
 * C'est le seul endroit de SAFE où l'on corrige une écriture née d'un module
 * métier. Deux choses le rendent tenable, et l'écran les dit :
 * la correction ne touche QUE des pièces reprises d'un exercice précédent,
 * et elle ne réécrit rien — elle contrepasse, puis réinscrit la version
 * corrigée, avec son motif.
 */

const devise = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });

type StatutPaiement = "payee" | "partielle" | "impayee";

interface FactureReprise {
  id: string;
  numero: string;
  clientNom: string;
  dateEmission: string;
  montantTotal: number;
  montantPaye: number;
  statutPaiement: StatutPaiement;
  datePaiement: string | null;
}

interface Brouillon {
  montantTotal: string;
  dateEmission: string;
  statutPaiement: StatutPaiement;
  montantPaye: string;
  datePaiement: string;
}

const LIBELLE_STATUT: Record<StatutPaiement, string> = {
  payee: "Payée",
  partielle: "Partielle",
  impayee: "Impayée",
};

function brouillonDe(f: FactureReprise): Brouillon {
  return {
    montantTotal: String(f.montantTotal),
    dateEmission: f.dateEmission,
    statutPaiement: f.statutPaiement,
    montantPaye: String(f.montantPaye),
    datePaiement: f.datePaiement ?? "",
  };
}

const champClass =
  "h-8 rounded-md border border-si-line bg-si-canvas px-2 text-[13px] text-si-ink outline-none focus:border-si-border-strong";

export function CorrectionsReprise() {
  const [factures, setFactures] = useState<FactureReprise[] | null>(null);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const [motifOuvert, setMotifOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const res = await fetch("/api/clients/entree/reprise/corriger");
    if (!res.ok) {
      setFactures([]);
      return;
    }
    const data = await res.json();
    setFactures(data.factures ?? []);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  function ouvrir(f: FactureReprise) {
    setSucces(null);
    setErreur(null);
    if (ouverte === f.id) {
      setOuverte(null);
      setBrouillon(null);
      return;
    }
    setOuverte(f.id);
    setBrouillon(brouillonDe(f));
  }

  async function corriger(motifCode: JournalCorrectionMotive, motifTexte: string | null) {
    if (!ouverte || !brouillon) return;
    setEnCours(true);
    setErreur(null);
    try {
      const res = await fetch("/api/clients/entree/reprise/corriger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: ouverte,
          motifCode,
          motifTexte,
          corrections: {
            montantTotal: Number(brouillon.montantTotal.replace(",", ".")),
            dateEmission: brouillon.dateEmission,
            statutPaiement: brouillon.statutPaiement,
            montantPaye:
              brouillon.statutPaiement === "partielle"
                ? Number(brouillon.montantPaye.replace(",", "."))
                : undefined,
            datePaiement: brouillon.statutPaiement === "impayee" ? null : brouillon.datePaiement || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error ?? "La correction a échoué.");
        return;
      }
      setMotifOuvert(false);
      setOuverte(null);
      setBrouillon(null);
      setSucces(
        data.corrige
          ? `Corrigé : ${(data.raisons ?? []).join(" ; ")}. La contrepassation et sa raison sont au registre des corrections.`
          : "Rien n'avait changé : aucune écriture passée.",
      );
      await charger();
    } catch {
      setErreur("La correction n'a pas pu être envoyée.");
    } finally {
      setEnCours(false);
    }
  }

  if (factures === null) {
    return <p className="text-[13px] text-si-muted">Lecture des factures reprises…</p>;
  }

  if (factures.length === 0) {
    return (
      <p className="text-[13px] text-si-muted">
        Aucune facture reprise pour l&apos;instant. Les corrections deviennent possibles une fois un
        exercice précédent versé.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-si-muted">
        Ici, et seulement ici, une écriture d&apos;un exercice repris se corrige. Rien n&apos;est réécrit :
        l&apos;écriture d&apos;origine est contrepassée, la version corrigée est réinscrite, et la raison
        que vous donnez reste au registre des corrections.
      </p>

      {succes && (
        <div className="flex items-start gap-2 rounded-lg border border-si-verified/30 bg-si-verified/[0.06] px-4 py-2.5 text-[13px] text-si-verified">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {succes}
        </div>
      )}

      {factures.map((f) => (
        <div key={f.id} className="rounded-xl border border-si-line bg-si-surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[12px] text-si-subtle">
                {f.dateEmission} · {f.numero}
              </p>
              <h3 className="mt-0.5 text-[14px] font-medium text-si-ink">{f.clientNom}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-medium text-si-ink">{devise.format(f.montantTotal)}</span>
              <StatusBadge
                label={LIBELLE_STATUT[f.statutPaiement]}
                variant={
                  f.statutPaiement === "payee"
                    ? "success"
                    : f.statutPaiement === "partielle"
                      ? "warning"
                      : "error"
                }
              />
              <Button variant="secondary" size="sm" onClick={() => ouvrir(f)}>
                {ouverte === f.id ? "Fermer" : "Corriger"}
              </Button>
            </div>
          </div>

          {ouverte === f.id && brouillon && (
            <div className="mt-3 space-y-3 border-t border-si-line pt-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="mb-1 block text-[12px] text-si-muted">Montant total</span>
                  <input
                    className={`${champClass} w-28 text-right`}
                    inputMode="decimal"
                    value={brouillon.montantTotal}
                    onChange={(e) => setBrouillon({ ...brouillon, montantTotal: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] text-si-muted">Date d&apos;émission</span>
                  <input
                    type="date"
                    className={champClass}
                    value={brouillon.dateEmission}
                    onChange={(e) => setBrouillon({ ...brouillon, dateEmission: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] text-si-muted">Statut</span>
                  <select
                    className={champClass}
                    value={brouillon.statutPaiement}
                    onChange={(e) =>
                      setBrouillon({ ...brouillon, statutPaiement: e.target.value as StatutPaiement })
                    }
                  >
                    <option value="payee">Payée</option>
                    <option value="partielle">Partielle</option>
                    <option value="impayee">Impayée</option>
                  </select>
                </label>
                {brouillon.statutPaiement === "partielle" && (
                  <label className="block">
                    <span className="mb-1 block text-[12px] text-si-muted">Montant reçu</span>
                    <input
                      className={`${champClass} w-28 text-right`}
                      inputMode="decimal"
                      value={brouillon.montantPaye}
                      onChange={(e) => setBrouillon({ ...brouillon, montantPaye: e.target.value })}
                    />
                  </label>
                )}
                {brouillon.statutPaiement !== "impayee" && (
                  <label className="block">
                    <span className="mb-1 block text-[12px] text-si-muted">Reçu le</span>
                    <input
                      type="date"
                      className={champClass}
                      value={brouillon.datePaiement}
                      onChange={(e) => setBrouillon({ ...brouillon, datePaiement: e.target.value })}
                    />
                  </label>
                )}
              </div>

              {erreur && (
                <div className="flex items-start gap-2 rounded-lg border border-si-danger/30 bg-si-danger/[0.06] px-3 py-2 text-[13px] text-si-danger-ink">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {erreur}
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setMotifOuvert(true)}>
                  Corriger, avec motif
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      <MotifAnnulationModal
        open={motifOuvert}
        onClose={() => setMotifOuvert(false)}
        onConfirm={corriger}
        title="Pourquoi cette correction ?"
        intro="La raison reste attachée à l'écriture de correction. L'écriture d'origine, elle, ne bouge pas."
        cible={
          ouverte
            ? (factures.find((f) => f.id === ouverte)?.numero ?? undefined)
            : undefined
        }
        submitting={enCours}
        error={erreur}
      />
    </div>
  );
}
