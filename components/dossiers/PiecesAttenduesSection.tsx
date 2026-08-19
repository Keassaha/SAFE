"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { formatCalendarDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import {
  registreHeadRowClass,
  registreHeadCellClass,
  registreRowClass,
  registreCellClass,
  registreCellMutedClass,
  RegistrePlainHeader,
} from "@/components/ui/registre";
import {
  creerPiecesAttenduesDivorce,
  enregistrerDateDossier,
  genererLienCollecte,
  revoquerLienCollecte,
  deciderPieceAttendue,
} from "@/app/(app)/dossiers/actions";

/**
 * Les pièces attendues d'un dossier, et les délais qui les commandent.
 *
 * Spec : docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
 *
 * UNE INTENTION : voir ce qui manque, et pour quand.
 *
 * ORDRE DE LECTURE. Le délai le plus grave d'abord, parce que tous les délais ne se
 * valent pas : rater l'article 26 retarde, rater l'article 413 rend la demande
 * indécidable. Puis les dates à saisir, sans lesquelles rien ne se calcule. Puis la
 * liste.
 *
 * CE QUE CET ÉCRAN NE DIT JAMAIS. « Vous êtes dans les délais. » Le calcul est en
 * jours calendaires et les règles de computation du Code n'ont pas été vérifiées :
 * les dates sont un repère à confirmer, pas un calcul opposable.
 */

export type DelaiAffiche = {
  code: string;
  libelle: string;
  reference: string;
  consequence: "demande_indecidable" | "manquement_procedural";
  etat: "date_source_manquante" | "a_venir" | "echu";
  echeance: string | null;
  joursRestants: number | null;
};

export type PieceAffichee = {
  id: string;
  libelle: string;
  raison: string | null;
  fournisseur: string;
  obligation: string;
  etat: string;
  referenceLegale: string | null;
  echeance: string | null;
};

const LIBELLE_DATE: Record<string, string> = {
  dateSignification: "Signification de la demande",
  datePresentation: "Présentation de la demande",
  dateInstruction: "Instruction",
  dateProtocole: "Protocole de l'instance",
  dateCommunicationPatrimoine: "Communication du formulaire de patrimoine",
};

const LIBELLE_ETAT: Record<string, string> = {
  A_DEMANDER: "À demander",
  DEMANDEE: "Demandée",
  RECUE: "Reçue",
  A_VERIFIER: "À vérifier",
  ACCEPTEE: "Acceptée",
  A_REMPLACER: "À remplacer",
  ECARTEE: "Écartée",
  PRODUITE: "Produite",
};

export function PiecesAttenduesSection({
  dossierId,
  delais,
  pieces,
  dates,
  lien,
  canWrite = true,
}: {
  dossierId: string;
  delais: DelaiAffiche[];
  pieces: PieceAffichee[];
  dates: Record<string, string | null>;
  /** Lien de collecte en cours, s'il en existe un de valide. */
  lien: { url: string; expireLe: string } | null;
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, startTransition] = useTransition();
  const [lienAffiche, setLienAffiche] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  /** Pièce dont on est en train d'écrire le motif de remplacement. */
  const [refus, setRefus] = useState<string | null>(null);
  const [motif, setMotif] = useState("");

  // Le plus grave d'abord, pas le plus proche : un délai dans 20 jours qui coûte
  // l'audience prime sur un manquement dans 3 jours.
  const graves = delais.filter(
    (d) => d.etat === "a_venir" && d.consequence === "demande_indecidable",
  );
  const echus = delais.filter((d) => d.etat === "echu");
  const aSaisir = Object.entries(dates).filter(([, v]) => !v);

  const manquantes = pieces.filter((p) => p.etat === "A_DEMANDER" || p.etat === "DEMANDEE");

  function creer() {
    setErreur(null);
    startTransition(async () => {
      const r = await creerPiecesAttenduesDivorce(dossierId);
      if (!r.success) setErreur(r.error);
      else router.refresh();
    });
  }

  function creerLien() {
    setErreur(null);
    startTransition(async () => {
      const r = await genererLienCollecte(dossierId);
      if (!r.success) setErreur(r.error);
      else {
        // L'origine ne se connaît qu'au navigateur : l'action rend un chemin.
        setLienAffiche(`${window.location.origin}${r.url}`);
        router.refresh();
      }
    });
  }

  function revoquer() {
    setErreur(null);
    startTransition(async () => {
      const r = await revoquerLienCollecte(dossierId);
      if (!r.success) setErreur(r.error);
      else {
        setLienAffiche(null);
        router.refresh();
      }
    });
  }

  async function copier(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Le presse-papiers peut être refusé : le lien reste sélectionnable à l'écran.
      setErreur("Copie impossible. Sélectionnez le lien ci-dessus.");
    }
  }

  function decider(pieceId: string, decision: "accepter" | "remplacer" | "ecarter") {
    setErreur(null);
    startTransition(async () => {
      const r = await deciderPieceAttendue(pieceId, decision, decision === "remplacer" ? motif : null);
      if (!r.success) setErreur(r.error);
      else {
        setRefus(null);
        setMotif("");
        router.refresh();
      }
    });
  }

  function saisirDate(champ: string, valeur: string) {
    setErreur(null);
    startTransition(async () => {
      const r = await enregistrerDateDossier(dossierId, champ as never, valeur || null);
      if (!r.success) setErreur(r.error);
      else router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-serif text-[19px] text-si-ink">Pièces attendues</h2>
        {pieces.length > 0 ? (
          <p className="text-[13px] text-si-muted">
            {manquantes.length} sur {pieces.length} encore à recevoir
          </p>
        ) : null}
      </div>

      {/* Ce qui peut coûter l'audience, en tête. */}
      {graves.length > 0 || echus.length > 0 ? (
        <ul className="space-y-2">
          {[...graves, ...echus].map((d) => (
            <li
              key={d.code}
              className="rounded-md border border-si-line bg-si-canvas px-3.5 py-2.5"
            >
              <p className="flex items-start gap-1.5 text-[13px] leading-relaxed text-si-ink">
                {d.consequence === "demande_indecidable" ? (
                  <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-si-amber-ink"
                    aria-hidden
                  />
                ) : null}
                <span>{d.libelle}</span>
              </p>
              <p className="mt-1 text-[12px] tabular-nums text-si-muted">
                {d.echeance ? formatCalendarDate(d.echeance) : "—"}
                {d.etat === "echu"
                  ? " · échéance passée"
                  : d.joursRestants != null
                    ? ` · dans ${d.joursRestants} jour(s)`
                    : ""}
                {" · "}
                {d.reference}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Sans ces dates, rien ne se calcule. On le dit une fois, pas six. */}
      {aSaisir.length > 0 && canWrite ? (
        <div className="rounded-md border border-si-line bg-si-surface px-4 py-3.5">
          <p className="text-[13px] text-si-ink">
            {aSaisir.length} date(s) à saisir pour que les échéances se calculent.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {aSaisir.map(([champ]) => (
              <div key={champ}>
                <label
                  className="mb-[6px] block text-[12px] font-medium text-si-ink"
                  htmlFor={`date-${champ}`}
                >
                  {LIBELLE_DATE[champ] ?? champ}
                </label>
                <input
                  id={`date-${champ}`}
                  type="date"
                  disabled={enCours}
                  onChange={(e) => saisirDate(champ, e.target.value)}
                  className="w-full rounded-md border-[0.5px] border-si-line bg-si-surface px-3 py-2 text-[14px] text-si-ink outline-none focus:border-si-verified focus:shadow-focus"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Le lien que le client reçoit. Sans ce bouton, tout ce qui précède reste
          une liste que personne d'autre ne voit. */}
      {canWrite && pieces.length > 0 ? (
        <div className="rounded-md border border-si-line bg-si-surface px-4 py-3.5">
          {lien || lienAffiche ? (
            <>
              <p className="text-[13px] text-si-ink">
                Votre client peut déposer ses documents avec ce lien.
              </p>
              <p className="mt-2 break-all rounded-md border border-si-line bg-si-canvas px-3 py-2 text-[12px] text-si-ink">
                {lienAffiche ?? `${lien!.url}`}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={enCours}
                  onClick={() => copier(lienAffiche ?? lien!.url)}
                >
                  {copie ? "Copié" : "Copier le lien"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={enCours}
                  onClick={revoquer}
                >
                  Couper l&apos;accès
                </Button>
                {lien ? (
                  <span className="text-[12px] text-si-muted">
                    Expire le {formatCalendarDate(lien.expireLe)}
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-si-muted">
                Votre client ne peut rien déposer tant qu&apos;il n&apos;a pas de lien.
                Il n&apos;aura pas de compte à créer.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="mt-3"
                disabled={enCours}
                onClick={creerLien}
              >
                Créer le lien de dépôt
              </Button>
            </>
          )}
        </div>
      ) : null}

      {erreur ? (
        <p className="text-[13px] text-si-danger-ink" role="alert">
          {erreur}
        </p>
      ) : null}

      {pieces.length === 0 ? (
        <div className="rounded-lg border border-si-line bg-si-surface px-5 py-6">
          <p className="text-[13px] leading-relaxed text-si-muted">
            Aucune pièce attendue sur ce dossier. SAFE peut créer la liste réglementaire
            du divorce au Québec, avec les articles qui la commandent, puis vous
            l&apos;ajustez.
          </p>
          {canWrite ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              disabled={enCours}
              onClick={creer}
            >
              Créer la liste
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-si-line bg-si-surface">
          <table className="w-full border-collapse">
            <thead>
              <tr className={registreHeadRowClass}>
                {/* Colonne porteuse large, métadonnées comprimées. */}
                <th className={`${registreHeadCellClass} w-[45%]`}>
                  <RegistrePlainHeader label="Pièce" />
                </th>
                <th className={registreHeadCellClass}>
                  <RegistrePlainHeader label="Fournie par" />
                </th>
                <th className={registreHeadCellClass}>
                  <RegistrePlainHeader label="État" />
                </th>
                <th className={registreHeadCellClass}>
                  <RegistrePlainHeader label="Échéance" align="right" />
                </th>
                <th className={registreHeadCellClass}>
                  <span className="sr-only">Décision</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((p) => (
                <tr key={p.id} className={registreRowClass}>
                  <td className={registreCellClass}>
                    {p.libelle}
                    {p.raison ? (
                      <span className="mt-0.5 block text-[12px] text-si-muted">{p.raison}</span>
                    ) : null}
                  </td>
                  <td className={registreCellMutedClass}>
                    {p.fournisseur === "PARTIE_ADVERSE" ? "Partie adverse" : "Client"}
                  </td>
                  <td className={registreCellMutedClass}>{LIBELLE_ETAT[p.etat] ?? p.etat}</td>
                  <td className="px-3 py-2.5 text-right align-middle text-[13px] tabular-nums text-si-ink">
                    {/* Trois cas, et ils ne veulent pas dire la même chose :
                        une date calculée, un délai légal dont la date de départ
                        n'est pas encore saisie, et une pièce d'appui qui n'a
                        aucun délai. Afficher « — » pour les trois laisserait
                        croire qu'une pièce à délai légal n'en a pas. */}
                    {p.echeance ? (
                      formatCalendarDate(p.echeance)
                    ) : p.referenceLegale ? (
                      <span className="text-si-amber-ink">à calculer</span>
                    ) : (
                      "—"
                    )}
                    {p.referenceLegale ? (
                      <span className="mt-0.5 block text-[12px] text-si-muted">
                        {p.referenceLegale}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-right">
                    {/* Trois gestes, et seulement sur une pièce déposée : une pièce
                        jamais reçue n'a rien à juger. « Accepter » est une décision
                        humaine, jamais un contrôle automatique. */}
                    {canWrite && (p.etat === "RECUE" || p.etat === "A_VERIFIER") ? (
                      refus === p.id ? (
                        <div className="space-y-2 text-left">
                          <textarea
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            rows={2}
                            autoFocus
                            placeholder="Ce que votre client doit corriger"
                            className="w-full rounded-md border-[0.5px] border-si-line bg-si-surface px-3 py-2 text-[13px] text-si-ink outline-none focus:border-si-verified focus:shadow-focus"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={enCours}
                              onClick={() => {
                                setRefus(null);
                                setMotif("");
                              }}
                            >
                              Renoncer
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={enCours || motif.trim().length < 10}
                              onClick={() => decider(p.id, "remplacer")}
                            >
                              Envoyer la demande
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={enCours}
                            onClick={() => decider(p.id, "accepter")}
                          >
                            Accepter
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={enCours}
                            onClick={() => {
                              setMotif("");
                              setRefus(p.id);
                            }}
                          >
                            À remplacer
                          </Button>
                        </div>
                      )
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[12px] leading-relaxed text-si-muted">
        Ces dates sont un repère calculé en jours calendaires. Les règles de computation
        des délais du Code de procédure civile ne sont pas appliquées : vérifiez toujours
        l&apos;échéance réelle avant de vous y fier.
      </p>
    </section>
  );
}
