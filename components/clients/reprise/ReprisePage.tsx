"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, FileWarning, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  construireLotReprise,
  type FactureRepriseSaisie,
  type StatutPaiementReprise,
} from "@/lib/services/reprise-historique/construire-lot";
import type { MatchFacturePassee } from "@/lib/services/reprise-historique/matcher";
import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";

/**
 * Reprise de l'historique de facturation.
 *
 * Priorité 2 du chantier « un cabinet arrive avec sa clientèle » — reproduit
 * la maquette validée le 14 septembre 2026
 * (docs/journal/captures/2026-09-14_reprise-historique_proposition.png).
 *
 * Règle tenue partout ici : RIEN n'est écrit en base tant que « Verser au
 * dossier de chaque client » n'a pas été cliqué. Tout ce qui précède
 * (upload, extraction, rapprochement, choix du statut) vit en mémoire du
 * navigateur.
 */

const ACCEPTED = "image/png,image/jpeg,image/gif,image/webp,application/pdf";
const devise = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });
const heureFmt = (h: number) => `${h.toFixed(2).replace(/\.00$/, "")} h`;

type StatutEntree = "analyse" | "erreur" | "doublon" | "en_cours";

interface EntreeFacture {
  id: string;
  file: File;
  statut: StatutEntree;
  erreur?: string;
  duplicateImporteLe?: string;
  fichierNom: string;
  hash?: string;
  mimeType?: string;
  extraction?: PastInvoiceExtraction;
  match?: MatchFacturePassee;
  statutPaiement: StatutPaiementReprise | null;
  datePaiement: string;
  montantPaye: string;
  /** Correction manuelle si l'IA n'a pas pu lire la date d'émission. */
  dateEmissionCorrigee: string;
  expanded: boolean;
}

function idUnique(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `f${Date.now()}${Math.random().toString(36).slice(2)}`;
}

function versSaisie(e: EntreeFacture): FactureRepriseSaisie | null {
  if (e.statut !== "analyse" || !e.extraction || !e.match) return null;
  const dateEmission = e.extraction.dateEmission ?? (e.dateEmissionCorrigee || null);
  return {
    id: e.id,
    fichierNom: e.fichierNom,
    extraction: { ...e.extraction, dateEmission },
    match: e.match,
    statutPaiement: e.statutPaiement,
    datePaiement: e.datePaiement || null,
  };
}

function labelDatePaiement(statut: StatutPaiementReprise | null): string {
  if (statut === "partielle") return "Reçu le";
  return "Payée le";
}

export function ReprisePage() {
  const [entrees, setEntrees] = useState<EntreeFacture[]>([]);
  const [versement, setVersement] = useState<
    { phase: "idle" } | { phase: "en_cours" } | { phase: "termine"; resultats: { id: string; ok: boolean; erreur?: string }[] }
  >({ phase: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saisies = useMemo(() => entrees.map(versSaisie).filter((s): s is FactureRepriseSaisie => s !== null), [entrees]);
  const lot = useMemo(() => construireLotReprise(saisies), [saisies]);

  async function ajouterFichiers(files: FileList) {
    const nouvelles: EntreeFacture[] = Array.from(files).map((file) => ({
      id: idUnique(),
      file,
      statut: "en_cours",
      fichierNom: file.name,
      statutPaiement: null,
      datePaiement: "",
      montantPaye: "",
      dateEmissionCorrigee: "",
      expanded: false,
    }));
    setEntrees((prev) => [...prev, ...nouvelles]);

    for (const entree of nouvelles) {
      const fd = new FormData();
      fd.append("file", entree.file);
      try {
        const res = await fetch("/api/clients/entree/reprise/analyser", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setEntrees((prev) =>
            prev.map((e) => (e.id === entree.id ? { ...e, statut: "erreur", erreur: data.error ?? "Erreur inconnue" } : e)),
          );
          continue;
        }
        if (data.alreadyImported) {
          setEntrees((prev) =>
            prev.map((e) =>
              e.id === entree.id
                ? { ...e, statut: "doublon", duplicateImporteLe: data.duplicate?.importeLe }
                : e,
            ),
          );
          continue;
        }
        setEntrees((prev) =>
          prev.map((e) =>
            e.id === entree.id
              ? {
                  ...e,
                  statut: "analyse",
                  hash: data.hash,
                  mimeType: data.mimeType,
                  extraction: data.extraction,
                  match: data.match,
                }
              : e,
          ),
        );
      } catch {
        setEntrees((prev) =>
          prev.map((e) => (e.id === entree.id ? { ...e, statut: "erreur", erreur: "Échec de l'envoi." } : e)),
        );
      }
    }
  }

  function mettreAJour(id: string, patch: Partial<EntreeFacture>) {
    setEntrees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  const parId = new Map(entrees.map((e) => [e.id, e]));
  const pretesAVerser = lot.groupes.flatMap((g) => g.factures).length + lot.dateInconnue.filter((f) => f.extraction.dateEmission || parId.get(f.id)?.dateEmissionCorrigee).length;
  const toutesChoisies = saisies.length > 0 && saisies.every((s) => s.statutPaiement !== null);
  const encaissements = saisies.filter((s) => s.statutPaiement === "payee" || s.statutPaiement === "partielle").length;

  async function verser() {
    setVersement({ phase: "en_cours" });
    const fd = new FormData();
    const lotEnvoye = saisies.map((s) => {
      const entree = parId.get(s.id);
      return {
        ...s,
        hash: entree?.hash,
        mimeType: entree?.mimeType,
        montantPaye: entree?.montantPaye ? Number(entree.montantPaye.replace(",", ".")) : null,
      };
    });
    fd.append("lot", JSON.stringify(lotEnvoye));
    for (const s of saisies) {
      const entree = parId.get(s.id);
      if (entree) fd.append(`file_${s.id}`, entree.file);
    }
    try {
      const res = await fetch("/api/clients/entree/reprise/verser", { method: "POST", body: fd });
      const data = await res.json();
      setVersement({ phase: "termine", resultats: data.resultats ?? [] });
    } catch {
      setVersement({ phase: "termine", resultats: saisies.map((s) => ({ id: s.id, ok: false, erreur: "Échec de l'envoi." })) });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-[560px] text-[13px] text-si-muted">
          {entrees.length === 0
            ? "Déposez d'anciennes factures en vrac, en n'importe quel ordre. SAFE en ressort le client, le dossier, les heures et les dates, rangées ici de la plus ancienne à la plus récente."
            : `${entrees.length} facture${entrees.length > 1 ? "s" : ""} lue${entrees.length > 1 ? "s" : ""}, déposée${entrees.length > 1 ? "s" : ""} en vrac, rangée${entrees.length > 1 ? "s" : ""} ici de la plus ancienne à la plus récente.`}
        </p>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={(ev) => {
              if (ev.target.files?.length) ajouterFichiers(ev.target.files);
              ev.target.value = "";
            }}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 inline-block h-4 w-4" aria-hidden />
            Ajouter des fichiers
          </Button>
        </div>
      </div>

      {entrees.length > 0 && (
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-si-line bg-si-surface p-5 sm:grid-cols-5">
          <Stat libelle="Période couverte" valeur={periodeLabel(lot.synthese.periodeDebut, lot.synthese.periodeFin)} />
          <Stat
            libelle="Clients"
            valeur={`${lot.synthese.nombreClients}${lot.synthese.nombreClientsACreer > 0 ? `, dont ${lot.synthese.nombreClientsACreer} à créer` : ""}`}
          />
          <Stat libelle="Heures reprises" valeur={heureFmt(lot.synthese.heuresReprises)} />
          <Stat libelle="Total facturé" valeur={devise.format(lot.synthese.totalFacture)} />
          <Stat
            libelle="Reste dû"
            valeur={devise.format(lot.synthese.resteDu)}
            accent={lot.synthese.resteDu > 0 ? "danger" : undefined}
          />
        </div>
      )}

      {entrees.filter((e) => e.statut === "erreur" || e.statut === "doublon").map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded-lg border border-si-danger/30 bg-si-danger/[0.06] px-4 py-2.5 text-[13px] text-si-danger-ink">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-medium">{e.fichierNom}</span>
          <span>
            {e.statut === "doublon"
              ? `déjà déposée le ${e.duplicateImporteLe ?? "?"} — non reprise en double.`
              : e.erreur}
          </span>
        </div>
      ))}

      {lot.dateInconnue.length > 0 && (
        <div className="rounded-xl border border-si-amber/30 bg-si-amber/[0.05] p-4">
          <p className="mb-3 text-[13px] font-medium text-si-amber-ink">
            Date d&apos;émission illisible — à corriger pour ranger ces factures dans la chronologie
          </p>
          <div className="space-y-2">
            {lot.dateInconnue.map((s) => (
              <div key={s.id} className="flex items-center gap-3 text-[13px]">
                <span className="min-w-0 flex-1 truncate text-si-ink">{s.fichierNom}</span>
                <input
                  type="date"
                  className="h-8 rounded-md border border-si-line bg-si-surface px-2 text-[13px]"
                  onChange={(ev) => mettreAJour(s.id, { dateEmissionCorrigee: ev.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {lot.groupes.map((groupe) => (
        <div key={groupe.cle}>
          <div className="mb-2 flex items-center justify-between border-b border-si-line pb-1.5">
            <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-si-muted">{groupe.libelle}</h2>
            {groupe.factures.length === 0 && (
              <span className="text-[12px] text-si-amber-ink">Aucune facture déposée pour ce mois</span>
            )}
          </div>
          <div className="space-y-3">
            {groupe.factures.map((facture) => {
              const entree = parId.get(facture.id);
              if (!entree) return null;
              return (
                <CarteFacture
                  key={facture.id}
                  facture={facture}
                  entree={entree}
                  onChange={(patch) => mettreAJour(facture.id, patch)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {entrees.length > 0 && (
        <div className="sticky bottom-0 -mx-6 flex items-center justify-between border-t border-si-line bg-si-surface/95 px-6 py-3 backdrop-blur">
          <p className="text-[13px] text-si-muted">
            À écrire : {saisies.length} facture{saisies.length > 1 ? "s" : ""}, {heureFmt(lot.synthese.heuresReprises)}{" "}
            déjà facturées, {lot.synthese.nombreClients} client{lot.synthese.nombreClients > 1 ? "s" : ""},{" "}
            {encaissements} encaissement{encaissements > 1 ? "s" : ""}. Rien n&apos;est enregistré avant ce bouton.
          </p>
          <Button
            variant="primary"
            disabled={!toutesChoisies || versement.phase === "en_cours"}
            loading={versement.phase === "en_cours"}
            onClick={verser}
          >
            Verser au dossier de chaque client
          </Button>
        </div>
      )}

      {versement.phase === "termine" && (
        <div className="space-y-1.5 rounded-xl border border-si-line bg-si-surface p-4">
          {versement.resultats.map((r) => {
            const entree = parId.get(r.id);
            return (
              <p key={r.id} className={`text-[13px] ${r.ok ? "text-si-verified" : "text-si-danger-ink"}`}>
                {entree?.fichierNom} — {r.ok ? "versée." : r.erreur}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ libelle, valeur, accent }: { libelle: string; valeur: string; accent?: "danger" }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-[0.04em] text-si-muted">{libelle}</p>
      <p className={`mt-1 text-[15px] font-medium ${accent === "danger" ? "text-si-danger-ink" : "text-si-ink"}`}>
        {valeur}
      </p>
    </div>
  );
}

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function periodeLabel(debut: string | null, fin: string | null): string {
  if (!debut || !fin) return "—";
  const fmt = (cle: string) => {
    const [annee, mois] = cle.split("-");
    return `${MOIS_COURTS[Number(mois) - 1]} ${annee}`;
  };
  return debut === fin ? fmt(debut) : `${fmt(debut)} → ${fmt(fin)}`;
}

function SelecteurStatut({
  valeur,
  onChange,
}: {
  valeur: StatutPaiementReprise | null;
  onChange: (v: StatutPaiementReprise) => void;
}) {
  const options: { cle: StatutPaiementReprise; libelle: string }[] = [
    { cle: "payee", libelle: "Payée" },
    { cle: "partielle", libelle: "Partielle" },
    { cle: "impayee", libelle: "Impayée" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-si-line bg-si-surface2 p-0.5">
      {options.map((o) => (
        <button
          key={o.cle}
          type="button"
          aria-pressed={o.cle === valeur}
          onClick={() => onChange(o.cle)}
          className={`min-h-8 rounded-[6px] px-3 text-[13px] font-medium transition-all ${
            o.cle === valeur
              ? o.cle === "impayee"
                ? "bg-si-danger/12 text-si-danger-ink"
                : "bg-si-surface text-si-ink shadow-[0_1px_2px_rgba(22,24,23,0.10)]"
              : "text-si-muted hover:text-si-ink"
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

function CarteFacture({
  facture,
  entree,
  onChange,
}: {
  facture: FactureRepriseSaisie;
  entree: EntreeFacture;
  onChange: (patch: Partial<EntreeFacture>) => void;
}) {
  const { extraction, match } = facture;
  const nombreHeures = extraction.lignes.reduce((s, l) => s + (l.heures ?? 0), 0);

  return (
    <div className="rounded-xl border border-si-line bg-si-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[12px] text-si-subtle">
            {extraction.dateEmission ?? "date à confirmer"}
            {extraction.numeroFacture ? ` · ${extraction.numeroFacture}` : ""}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <h3 className="text-[14px] font-medium text-si-ink">{match.client.clientNom}</h3>
            <StatusBadge
              label={match.client.statut === "nouveau" ? "Nouveau client" : "fiche existante"}
              variant={match.client.statut === "nouveau" ? "warning" : "neutral"}
            />
          </div>
          <p className="text-[13px] text-si-muted">{match.dossier.dossierIntitule}</p>
          <button
            type="button"
            onClick={() => onChange({ expanded: !entree.expanded })}
            className="mt-1.5 flex items-center gap-1 text-[13px] text-si-muted hover:text-si-ink"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${entree.expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
            {nombreHeures > 0 ? `${heureFmt(nombreHeures)} de travail, ` : ""}
            {extraction.lignes.length} prestation{extraction.lignes.length > 1 ? "s" : ""} · {facture.fichierNom}
          </button>
        </div>

        <div className="shrink-0 text-right">
          <p className="mb-2 text-[15px] font-medium text-si-ink">
            {extraction.montantTotal !== null ? devise.format(extraction.montantTotal) : "montant illisible"}
          </p>
          <SelecteurStatut
            valeur={facture.statutPaiement}
            onChange={(v) => onChange({ statutPaiement: v })}
          />
          {(facture.statutPaiement === "payee" || facture.statutPaiement === "partielle") && (
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <span className="text-[12px] text-si-muted">{labelDatePaiement(facture.statutPaiement)}</span>
              <input
                type="date"
                value={entree.datePaiement}
                onChange={(ev) => onChange({ datePaiement: ev.target.value })}
                className="h-8 rounded-md border border-si-line bg-si-canvas px-2 text-[13px]"
              />
            </div>
          )}
          {facture.statutPaiement === "partielle" && (
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <span className="text-[12px] text-si-muted">Montant reçu</span>
              <input
                type="text"
                inputMode="decimal"
                value={entree.montantPaye}
                onChange={(ev) => onChange({ montantPaye: ev.target.value })}
                placeholder="0,00 $"
                className="h-8 w-24 rounded-md border border-si-line bg-si-canvas px-2 text-right text-[13px]"
              />
            </div>
          )}
          {facture.statutPaiement === "impayee" && (
            <p className="mt-2 text-[12px] font-medium text-si-danger-ink">Reste dû au cabinet</p>
          )}
        </div>
      </div>

      {entree.expanded && (
        <div className="mt-3 border-t border-si-line pt-3">
          <p className="mb-2 text-[12px] text-si-muted">
            Les heures reprises sont rangées par date de travail et marquées facturées : elles ne
            repartiront pas en facturation. Les débours rejoignent la fiche de débours du dossier.
          </p>
          <div className="space-y-1">
            {extraction.lignes.map((ligne, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <span className="text-si-subtle">{ligne.date ?? "—"}</span>
                <span className="flex-1 px-3 text-si-ink">
                  {ligne.description}
                  {ligne.nature === "debours" && (
                    <span className="ml-2 text-[12px] text-si-muted">débours</span>
                  )}
                </span>
                {ligne.heures !== null && <span className="text-si-muted">{heureFmt(ligne.heures)}</span>}
                <span className="ml-3 w-20 text-right text-si-ink">
                  {ligne.montant !== null ? devise.format(ligne.montant) : "?"}
                </span>
              </div>
            ))}
          </div>
          {extraction.champsIllisibles.length > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-[13px] text-si-amber-ink">
              <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Champs illisibles sur cette facture, à vérifier : {extraction.champsIllisibles.join(", ")}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
