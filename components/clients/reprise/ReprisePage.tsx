"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, FileWarning, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CorrectionsReprise } from "@/components/clients/reprise/CorrectionsReprise";
import {
  construireLotReprise,
  type FactureRepriseSaisie,
  type StatutPaiementReprise,
} from "@/lib/services/reprise-historique/construire-lot";
import { controlerFacture, versable, type ControleFacture } from "@/lib/services/reprise-historique/controles";
import { ressemblancesClient, type MatchFacturePassee } from "@/lib/services/reprise-historique/matcher";
import { cleCroisement } from "@/lib/clients/croisement-conflits";
import type { PastInvoiceExtraction, PastInvoiceLigneExtraction } from "@/lib/ai/extract-past-invoice";

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
  /** Absent pour une facture tapée sans aucun scan. */
  file?: File;
  statut: StatutEntree;
  erreur?: string;
  duplicateImporteLe?: string;
  fichierNom: string;
  hash?: string;
  mimeType?: string;
  /** CE QUE LA LECTURE A PRODUIT. Jamais modifié : c'est la pièce à conviction. */
  extraction?: PastInvoiceExtraction;
  match?: MatchFacturePassee;
  /**
   * CE QUE L'HUMAIN A REPRIS PAR-DESSUS. Tenu à part de la lecture pour qu'on
   * puisse toujours dire, devant une inspection, ce que la machine a lu et ce
   * qu'un humain a déclaré. Le versement fusionne les deux, dans cet ordre.
   */
  corrections: CorrectionsLecture;
  statutPaiement: StatutPaiementReprise | null;
  datePaiement: string;
  montantPaye: string;
  /** Client existant choisi à la main parmi les ressemblances proposées. */
  clientChoisi?: { clientId: string; nom: string };
  /** Facture tapée sans aucune pièce jointe. */
  sansPiece?: boolean;
  /** La lecture n'a rien donné : la carte est vide, à remplir à la main. */
  lectureEchouee?: boolean;
  raisonLecture?: string;
  expanded: boolean;
}

/** Les champs de la lecture qu'un humain peut reprendre à la main. */
type CorrectionsLecture = Partial<
  Pick<
    PastInvoiceExtraction,
    "numeroFacture" | "clientNom" | "dossierIntitule" | "dateEmission" | "montantTotal" | "tps" | "tvq" | "lignes"
  >
>;

/** Noms français des champs corrigés, pour la trace laissée au versement. */
const NOM_DU_CHAMP: Record<keyof CorrectionsLecture, string> = {
  numeroFacture: "le numéro de facture",
  clientNom: "le nom du client",
  dossierIntitule: "l'intitulé du dossier",
  dateEmission: "la date d'émission",
  montantTotal: "le montant total",
  tps: "la TPS",
  tvq: "la TVQ",
  lignes: "le détail des lignes",
};

/** Une lecture qui n'a rien donné : la carte s'affiche, tous les champs à remplir. */
function extractionVide(): PastInvoiceExtraction {
  return {
    numeroFacture: null,
    clientNom: null,
    dossierIntitule: null,
    dateEmission: null,
    montantTotal: null,
    tps: null,
    tvq: null,
    lignes: [],
    confianceOcr: "basse",
    champsIllisibles: [],
  };
}

function matchVide(): MatchFacturePassee {
  return {
    client: { statut: "nouveau", clientId: null, clientNom: "" },
    dossier: { statut: "nouveau", dossierId: null, dossierIntitule: "" },
  };
}

function idUnique(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `f${Date.now()}${Math.random().toString(36).slice(2)}`;
}

/** Les corrections réellement posées, dans l'ordre des champs de la carte. */
function champsCorriges(c: CorrectionsLecture): string[] {
  return (Object.keys(NOM_DU_CHAMP) as (keyof CorrectionsLecture)[])
    .filter((k) => c[k] !== undefined)
    .map((k) => NOM_DU_CHAMP[k]);
}

function versSaisie(e: EntreeFacture): FactureRepriseSaisie | null {
  if (e.statut !== "analyse" || !e.extraction || !e.match) return null;

  // La lecture d'abord, les corrections par-dessus. `undefined` ne recouvre
  // rien : seul un champ réellement repris à la main écrase ce qui a été lu.
  const extraction: PastInvoiceExtraction = { ...e.extraction };
  for (const [cle, valeur] of Object.entries(e.corrections)) {
    if (valeur !== undefined) (extraction as unknown as Record<string, unknown>)[cle] = valeur;
  }

  // Un client choisi à la main dans les ressemblances l'emporte sur tout le
  // reste : c'est une fiche existante désignée, pas un nom à interpréter.
  const nomCorrige = e.corrections.clientNom?.trim();
  const match = e.clientChoisi
    ? {
        ...e.match,
        client: {
          statut: "existant" as const,
          clientId: e.clientChoisi.clientId,
          clientNom: e.clientChoisi.nom,
        },
      }
    : nomCorrige
      ? { ...e.match, client: { ...e.match.client, clientNom: nomCorrige } }
      : e.match;

  return {
    id: e.id,
    fichierNom: e.fichierNom,
    extraction,
    match,
    statutPaiement: e.statutPaiement,
    datePaiement: e.datePaiement || null,
    champsCorriges: champsCorriges(e.corrections),
    sansPiece: e.sansPiece,
  };
}

function labelDatePaiement(statut: StatutPaiementReprise | null): string {
  if (statut === "partielle") return "Reçu le";
  return "Payée le";
}

export function ReprisePage() {
  const [vue, setVue] = useState<"deposer" | "corriger">("deposer");
  const [entrees, setEntrees] = useState<EntreeFacture[]>([]);
  const [versement, setVersement] = useState<
    { phase: "idle" } | { phase: "en_cours" } | { phase: "termine"; resultats: { id: string; ok: boolean; erreur?: string }[] }
  >({ phase: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clientsDuCabinet, setClientsDuCabinet] = useState<{ id: string; nom: string }[]>([]);

  useEffect(() => {
    fetch("/api/clients/entree/reprise/analyser")
      .then((r) => (r.ok ? r.json() : { clients: [] }))
      .then((d) => setClientsDuCabinet(d.clients ?? []))
      .catch(() => setClientsDuCabinet([]));
  }, []);

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
      corrections: {},
      expanded: false,
    }));
    setEntrees((prev) => [...prev, ...nouvelles]);

    for (const entree of nouvelles) {
      if (!entree.file) continue;
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
                  // Lecture muette : la carte s'ouvre vide, dépliée, plutôt que
                  // de sortir la pièce du lot.
                  lectureEchouee: Boolean(data.lectureEchouee),
                  raisonLecture: data.raisonLecture,
                  extraction: data.extraction ?? extractionVide(),
                  match: data.match ?? matchVide(),
                  expanded: data.lectureEchouee ? true : e.expanded,
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

  /**
   * Une facture dont le cabinet n'a aucun scan (décision CEO 2026-09-21). Elle
   * entre dans le lot comme les autres, à ceci près qu'elle est marquée « sans
   * pièce » : sa carte le dit, et la facture versée le porte. L'anti-doublon par
   * empreinte ne peut pas jouer sur elle, c'est la règle numéro + client qui tient.
   */
  function ajouterSansPiece() {
    setEntrees((prev) => [
      ...prev,
      {
        id: idUnique(),
        statut: "analyse",
        fichierNom: "Saisie sans pièce",
        sansPiece: true,
        extraction: extractionVide(),
        match: matchVide(),
        corrections: {},
        statutPaiement: null,
        datePaiement: "",
        montantPaye: "",
        expanded: true,
      },
    ]);
  }

  /** Pose une correction par-dessus la lecture, sans jamais toucher à celle-ci. */
  function corriger(id: string, patch: CorrectionsLecture) {
    setEntrees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, corrections: { ...e.corrections, ...patch } } : e)),
    );
  }

  const parId = new Map(entrees.map((e) => [e.id, e]));

  // Ce qui empêche de verser se dit AVANT le clic, carte par carte : le service
  // refuserait de toute façon, mais après l'attente et le lot à moitié écrit.
  const empreintesDuLot = entrees.map((e) => ({ id: e.id, hash: e.hash }));
  const numerosDuLot = saisies.map((s) => ({ id: s.id, numero: s.extraction.numeroFacture }));
  const controles = new Map<string, ControleFacture>(
    saisies.map((s) => {
      const entree = parId.get(s.id);
      return [
        s.id,
        controlerFacture(s, {
          empreintesDuLot,
          numerosDuLot,
          montantPaye: entree?.montantPaye ? Number(entree.montantPaye.replace(",", ".")) : null,
        }),
      ];
    }),
  );
  // Une coquille entre DEUX factures du même dépôt : « Bélivau » et
  // « Béliveau » sont l'un et l'autre inconnus de la base, donc le
  // rapprochement serveur ne les voit pas se ressembler. Sans ça, le versement
  // ouvre deux fiches pour le même client.
  //
  // La suggestion ne va QUE vers l'orthographe la plus fréquente du dépôt.
  // Mesuré sur un dépôt de huit factures : sans cette règle, les trois
  // factures correctes proposaient chacune d'adopter la coquille, et une seule
  // proposait de la corriger. Trois invitations à se tromper contre une.
  // Quand les deux graphies sont à égalité, on ne sait pas laquelle est la
  // bonne : on propose dans les deux sens.
  const nouveaux = saisies.filter((s) => s.match.client.statut === "nouveau");
  const compteParCle = new Map<string, number>();
  const nomParCle = new Map<string, string>();
  for (const s of nouveaux) {
    const cle = cleCroisement(s.match.client.clientNom);
    compteParCle.set(cle, (compteParCle.get(cle) ?? 0) + 1);
    nomParCle.set(cle, s.match.client.clientNom);
  }
  const tousLesNoms = Array.from(nomParCle.entries()).map(([cle, nom]) => ({ id: cle, nom, dossiers: [] }));
  const ressemblancesDansLeLot = new Map<string, string[]>(
    nouveaux.map((s) => {
      const maCle = cleCroisement(s.match.client.clientNom);
      const monCompte = compteParCle.get(maCle) ?? 0;
      return [
        s.id,
        ressemblancesClient(s.match.client.clientNom, tousLesNoms)
          .filter((r) => (compteParCle.get(r.clientId) ?? 0) >= monCompte)
          .map((r) => r.nom),
      ];
    }),
  );

  const toutesVersables = saisies.length > 0 && saisies.every((s) => versable(controles.get(s.id)!));
  const nombreBloquees = saisies.filter((s) => !versable(controles.get(s.id)!)).length;
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
      if (entree?.file) fd.append(`file_${s.id}`, entree.file);
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
      <div className="inline-flex rounded-lg border border-si-line bg-si-surface2 p-0.5">
        {([
          { cle: "deposer", libelle: "Déposer des factures" },
          { cle: "corriger", libelle: "Corriger une écriture" },
        ] as const).map((o) => (
          <button
            key={o.cle}
            type="button"
            aria-pressed={vue === o.cle}
            onClick={() => setVue(o.cle)}
            className={`min-h-8 rounded-[6px] px-3 text-[13px] font-medium transition-all ${
              vue === o.cle
                ? "bg-si-surface text-si-ink shadow-[0_1px_2px_rgba(22,24,23,0.10)]"
                : "text-si-muted hover:text-si-ink"
            }`}
          >
            {o.libelle}
          </button>
        ))}
      </div>

      {vue === "corriger" && <CorrectionsReprise />}

      <div className={vue === "deposer" ? "space-y-5" : "hidden"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 text-[15px] font-medium text-si-ink">Reprise d&apos;un exercice précédent</h2>
          <p className="max-w-[560px] text-[13px] text-si-muted">
          {entrees.length === 0
            ? "Déposez d'anciennes factures en vrac, en n'importe quel ordre. SAFE en ressort le client, le dossier, les heures et les dates, rangées ici de la plus ancienne à la plus récente."
            : `${entrees.length} facture${entrees.length > 1 ? "s" : ""} lue${entrees.length > 1 ? "s" : ""}, déposée${entrees.length > 1 ? "s" : ""} en vrac, rangée${entrees.length > 1 ? "s" : ""} ici de la plus ancienne à la plus récente.`}
          </p>
        </div>
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
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 inline-block h-4 w-4" aria-hidden />
              Ajouter des fichiers
            </Button>
            <button
              type="button"
              onClick={ajouterSansPiece}
              className="text-[13px] text-si-muted underline hover:text-si-ink"
            >
              Saisir une facture sans pièce
            </button>
          </div>
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
            Date d&apos;émission illisible — datez ces factures pour les ranger dans la chronologie
          </p>
          <div className="space-y-3">
            {lot.dateInconnue.map((s) => {
              const entree = parId.get(s.id);
              if (!entree) return null;
              return (
                <CarteFacture
                  key={s.id}
                  facture={s}
                  entree={entree}
                  controle={controles.get(s.id)}
                  clientsDuCabinet={clientsDuCabinet}
                  ressemblancesDuLot={ressemblancesDansLeLot.get(s.id) ?? []}
                  // La carte entière dès le début : tout ce qui cloche se voit
                  // d'un coup, au lieu d'apparaître une fois la date remplie.
                  onCorriger={(patch) => corriger(s.id, patch)}
                  onChange={(patch) => mettreAJour(s.id, patch)}
                />
              );
            })}
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
                  controle={controles.get(facture.id)}
                  clientsDuCabinet={clientsDuCabinet}
                  ressemblancesDuLot={ressemblancesDansLeLot.get(facture.id) ?? []}
                  onCorriger={(patch) => corriger(facture.id, patch)}
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
            {nombreBloquees > 0 && (
              <span className="ml-1 font-medium text-si-danger-ink">
                {nombreBloquees === 1
                  ? "Une facture demande une correction avant d'être versée."
                  : `${nombreBloquees} factures demandent une correction avant d'être versées.`}
              </span>
            )}
          </p>
          <Button
            variant="primary"
            // Un second clic reverserait le lot entier. Le bouton reste éteint
            // une fois le versement terminé : ce qui est passé est passé, ce
            // qui a échoué se redépose, il ne se re-verse pas d'ici.
            disabled={
              !toutesVersables ||
              versement.phase === "en_cours" ||
              versement.phase === "termine"
            }
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
  controle,
  clientsDuCabinet,
  ressemblancesDuLot,
  onCorriger,
  onChange,
}: {
  facture: FactureRepriseSaisie;
  entree: EntreeFacture;
  controle?: ControleFacture;
  clientsDuCabinet: { id: string; nom: string }[];
  /** Noms d'autres factures du MÊME dépôt qui ressemblent à celui-ci. */
  ressemblancesDuLot: string[];
  /** Pose une correction par-dessus la lecture. */
  onCorriger: (patch: CorrectionsLecture) => void;
  onChange: (patch: Partial<EntreeFacture>) => void;
}) {
  const { extraction, match } = facture;
  const nombreHeures = extraction.lignes.reduce((s, l) => s + (l.heures ?? 0), 0);
  const bloquee = (controle?.bloquants.length ?? 0) > 0;

  return (
    <div
      className={`rounded-xl border bg-si-surface p-4 ${
        bloquee ? "border-si-danger/40" : "border-si-line"
      }`}
    >
      {/* Une carte qui ne vient pas d'une lecture réussie le dit d'entrée : le
          cabinet doit savoir que ces chiffres sont les siens, pas ceux de SAFE. */}
      {(entree.lectureEchouee || entree.sansPiece) && (
        <div className="mb-3 flex items-start gap-1.5 rounded-lg border border-si-amber/40 bg-si-amber/[0.06] px-3 py-2 text-[13px] text-si-amber-ink">
          <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {entree.sansPiece
              ? "Facture saisie sans pièce justificative. Elle sera versée avec cette mention."
              : (entree.raisonLecture ?? "SAFE n'a rien pu lire sur cette pièce.")}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {!entree.extraction?.dateEmission ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-si-amber-ink">date à saisir</span>
              <input
                type="date"
                value={entree.corrections.dateEmission ?? ""}
                onChange={(ev) => onCorriger({ dateEmission: ev.target.value || null })}
                className="h-7 rounded-md border border-si-line bg-si-surface px-2 text-[12px]"
              />
              {extraction.numeroFacture && (
                <span className="font-mono text-[12px] text-si-subtle">· {extraction.numeroFacture}</span>
              )}
            </div>
          ) : (
            <p className="font-mono text-[12px] text-si-subtle">
              {extraction.dateEmission}
              {extraction.numeroFacture ? ` · ${extraction.numeroFacture}` : ""}
            </p>
          )}
          <div className="mt-0.5 flex items-center gap-2">
            <h3 className="text-[14px] font-medium text-si-ink">{match.client.clientNom}</h3>
            <StatusBadge
              label={match.client.statut === "nouveau" ? "Nouveau client" : "fiche existante"}
              variant={match.client.statut === "nouveau" ? "warning" : "neutral"}
            />
          </div>
          <p className="text-[13px] text-si-muted">{match.dossier.dossierIntitule}</p>

          {/* Une coquille dans le nom lu ouvrirait une seconde fiche pour la
              même personne. On propose le rapprochement, l'humain tranche. */}
          {match.client.statut === "nouveau" && (match.client.ressemblances?.length ?? 0) > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px]">
              <span className="text-si-amber-ink">Ressemble à un client déjà au dossier :</span>
              {match.client.ressemblances!.map((r) => (
                <button
                  key={r.clientId}
                  type="button"
                  onClick={() => onChange({ clientChoisi: { clientId: r.clientId, nom: r.nom } })}
                  className="rounded-md border border-si-line bg-si-surface2 px-2 py-0.5 font-medium text-si-ink hover:bg-si-line2"
                >
                  {r.nom}
                </button>
              ))}
            </div>
          )}

          {/* Coquille entre deux factures du MÊME dépôt, toutes deux inconnues
              de la base. Sans ça, verser ouvrirait deux fiches. */}
          {match.client.statut === "nouveau" && ressemblancesDuLot.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px]">
              <span className="text-si-amber-ink">Ressemble à un autre nom de ce dépôt :</span>
              {ressemblancesDuLot.map((nom) => (
                <button
                  key={nom}
                  type="button"
                  onClick={() => onCorriger({ clientNom: nom })}
                  className="rounded-md border border-si-line bg-si-surface2 px-2 py-0.5 font-medium text-si-ink hover:bg-si-line2"
                >
                  Renommer celle-ci en « {nom} »
                </button>
              ))}
            </div>
          )}
          {entree.clientChoisi && (
            <p className="mt-1.5 text-[13px] text-si-muted">
              Rattachée à {entree.clientChoisi.nom}.{" "}
              <button
                type="button"
                onClick={() => onChange({ clientChoisi: undefined })}
                className="underline hover:text-si-ink"
              >
                Annuler
              </button>
            </p>
          )}

          {/* Quand la lecture n'a pas su nommer le client, l'écran le demande.
              Sans ce champ il disait « corrigez-le » sans offrir le moyen. */}
          {!entree.clientChoisi && match.client.statut === "nouveau" && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-si-muted">
                {entree.extraction?.clientNom ? "Client à créer :" : "Qui est le client ?"}
              </span>
              <input
                list={`clients-${facture.id}`}
                value={entree.corrections.clientNom ?? entree.extraction?.clientNom ?? ""}
                placeholder="Nom du client"
                onChange={(ev) => {
                  const valeur = ev.target.value;
                  const existant = clientsDuCabinet.find((c) => c.nom === valeur);
                  onCorriger({ clientNom: valeur });
                  if (existant) onChange({ clientChoisi: { clientId: existant.id, nom: existant.nom } });
                }}
                className="h-8 w-56 rounded-md border border-si-line bg-si-canvas px-2 text-[13px]"
              />
              <datalist id={`clients-${facture.id}`}>
                {clientsDuCabinet.map((c) => (
                  <option key={c.id} value={c.nom} />
                ))}
              </datalist>
            </div>
          )}

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

      {/* Ce qui empêche de verser, et ce qui mérite un coup d'œil. Dit ici,
          avant le bouton, plutôt qu'en erreur une fois le lot parti. */}
      {controle && (controle.bloquants.length > 0 || controle.avertissements.length > 0) && (
        <div className="mt-3 space-y-1 border-t border-si-line pt-3">
          {controle.bloquants.map((raison, i) => (
            <p key={`b${i}`} className="flex items-start gap-1.5 text-[13px] text-si-danger-ink">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {raison}
            </p>
          ))}
          {controle.avertissements.map((raison, i) => (
            <p key={`a${i}`} className="flex items-start gap-1.5 text-[13px] text-si-amber-ink">
              <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {raison}
            </p>
          ))}
        </div>
      )}

      {entree.expanded && (
        <div className="mt-3 space-y-4 border-t border-si-line pt-3">
          {/* ── Ce que la lecture a produit, et qu'on peut reprendre ──────────
              Tant que ces champs étaient en lecture seule, SAFE disait « à
              vérifier sur la facture » sans donner le moyen de lever le doute.
              La lecture d'origine reste intacte dessous : ce qu'on tape ici
              est un calque, tracé au versement. */}
          <div>
            <p className="mb-2 text-[12px] text-si-muted">
              Ce que SAFE a lu sur la pièce. Corrigez ce qui ne correspond pas au papier :
              c&apos;est le papier qui fait foi.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <ChampTexte
                libelle="Numéro de facture"
                valeur={extraction.numeroFacture ?? ""}
                corrige={entree.corrections.numeroFacture !== undefined}
                onChange={(v) => onCorriger({ numeroFacture: v.trim() || null })}
              />
              <ChampTexte
                libelle="Dossier"
                valeur={extraction.dossierIntitule ?? ""}
                corrige={entree.corrections.dossierIntitule !== undefined}
                className="sm:col-span-2"
                onChange={(v) => onCorriger({ dossierIntitule: v.trim() || null })}
              />
              <ChampMontant
                libelle="Total de la facture"
                valeur={extraction.montantTotal}
                corrige={entree.corrections.montantTotal !== undefined}
                onChange={(v) => onCorriger({ montantTotal: v })}
              />
              <ChampMontant
                libelle="TPS"
                valeur={extraction.tps}
                corrige={entree.corrections.tps !== undefined}
                onChange={(v) => onCorriger({ tps: v })}
              />
              <ChampMontant
                libelle="TVQ"
                valeur={extraction.tvq}
                corrige={entree.corrections.tvq !== undefined}
                onChange={(v) => onCorriger({ tvq: v })}
              />
            </div>
          </div>

          {/* ── Le détail ───────────────────────────────────────────────────── */}
          <div>
            <p className="mb-2 text-[12px] text-si-muted">
              Les heures reprises sont rangées par date de travail et marquées facturées : elles ne
              repartiront pas en facturation. Les débours rejoignent la fiche de débours du dossier.
            </p>
            <div className="space-y-1.5">
              {extraction.lignes.map((ligne, i) => (
                <LigneCorrigeable
                  key={i}
                  ligne={ligne}
                  onChange={(patch) =>
                    onCorriger({
                      lignes: extraction.lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)),
                    })
                  }
                  onRetirer={() =>
                    onCorriger({ lignes: extraction.lignes.filter((_, j) => j !== i) })
                  }
                />
              ))}
              {extraction.lignes.length === 0 && (
                <p className="text-[13px] text-si-muted">Aucune ligne lue sur cette pièce.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                onCorriger({
                  lignes: [
                    ...extraction.lignes,
                    { description: "", date: null, montant: null, heures: null, tauxHoraire: null, nature: "honoraire" },
                  ],
                })
              }
              className="mt-2 text-[13px] text-si-muted underline hover:text-si-ink"
            >
              Ajouter une ligne
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Les champs de correction ─────────────────────────────────────────────
   Un champ repris à la main se voit : le liseré ambre dit « ce chiffre vient
   de vous, pas de la lecture ». Sans ce signe, on ne saurait plus, en
   relisant la carte, ce qui a été lu et ce qui a été déclaré. */

const CHAMP =
  "h-8 w-full rounded-md border bg-si-canvas px-2 text-[13px] text-si-ink placeholder:text-si-subtle";

function ChampTexte({
  libelle,
  valeur,
  corrige,
  className = "",
  onChange,
}: {
  libelle: string;
  valeur: string;
  corrige: boolean;
  className?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[12px] text-si-muted">{libelle}</span>
      <input
        type="text"
        value={valeur}
        placeholder="Non lu"
        onChange={(ev) => onChange(ev.target.value)}
        className={`${CHAMP} ${corrige ? "border-si-amber/60" : "border-si-line"}`}
      />
    </label>
  );
}

function ChampMontant({
  libelle,
  valeur,
  corrige,
  onChange,
}: {
  libelle: string;
  valeur: number | null;
  corrige: boolean;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-si-muted">{libelle}</span>
      <input
        type="text"
        inputMode="decimal"
        value={valeur === null ? "" : String(valeur)}
        placeholder="Non lu"
        onChange={(ev) => onChange(versNombre(ev.target.value))}
        className={`${CHAMP} text-right tabular-nums ${corrige ? "border-si-amber/60" : "border-si-line"}`}
      />
    </label>
  );
}

/**
 * Un montant tapé à la main. La virgule décimale est la norme au Québec, et
 * les espaces des milliers se collent au copier-coller : on accepte les deux
 * plutôt que de renvoyer l'utilisateur à sa saisie.
 */
function versNombre(saisi: string): number | null {
  const propre = saisi.replace(/[\s $]/g, "").replace(",", ".");
  if (propre === "") return null;
  const n = Number(propre);
  return Number.isFinite(n) ? n : null;
}

function LigneCorrigeable({
  ligne,
  onChange,
  onRetirer,
}: {
  ligne: PastInvoiceLigneExtraction;
  onChange: (patch: Partial<PastInvoiceLigneExtraction>) => void;
  onRetirer: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={ligne.date ?? ""}
        onChange={(ev) => onChange({ date: ev.target.value || null })}
        className={`${CHAMP} w-[130px] border-si-line`}
      />
      <input
        type="text"
        value={ligne.description}
        placeholder="Description"
        onChange={(ev) => onChange({ description: ev.target.value })}
        className={`${CHAMP} flex-1 border-si-line`}
      />
      <input
        type="text"
        inputMode="decimal"
        value={ligne.heures === null ? "" : String(ligne.heures)}
        placeholder="h"
        onChange={(ev) => onChange({ heures: versNombre(ev.target.value) })}
        className={`${CHAMP} w-[64px] border-si-line text-right tabular-nums`}
      />
      <input
        type="text"
        inputMode="decimal"
        value={ligne.montant === null ? "" : String(ligne.montant)}
        placeholder="Montant"
        onChange={(ev) => onChange({ montant: versNombre(ev.target.value) })}
        className={`${CHAMP} w-[90px] border-si-line text-right tabular-nums`}
      />
      {/* Honoraire ou débours : ce choix décide si la ligne devient une heure
          facturée ou un débours du dossier. Il se corrige ici. */}
      <select
        value={ligne.nature}
        onChange={(ev) => onChange({ nature: ev.target.value as PastInvoiceLigneExtraction["nature"] })}
        className={`${CHAMP} w-[104px] border-si-line`}
      >
        <option value="honoraire">Honoraire</option>
        <option value="debours">Débours</option>
      </select>
      <button
        type="button"
        onClick={onRetirer}
        aria-label="Retirer cette ligne"
        className="px-1 text-[16px] leading-none text-si-subtle hover:text-si-danger-ink"
      >
        ×
      </button>
    </div>
  );
}
