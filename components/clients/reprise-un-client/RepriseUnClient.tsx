"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import {
  calculer,
  controler,
  depuisExtraction,
  enregistrable,
  lireNombre,
  resteDu,
  versExtraction,
  type FactureSaisie,
} from "@/lib/services/reprise-un-client/saisie";
import type { RecapitulatifMandat } from "@/lib/services/reprise-un-client/recapitulatif";
import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";
import { Carte, Ligne, nouvelId } from "./pieces";
import { EtapeClient, nomSaisi } from "./EtapeClient";
import { EtapeMandat, mandatVide, sectionsVides } from "./EtapeMandat";
import { EtapeFactures, champsCorriges, factureVide } from "./EtapeFactures";
import { EtapeTerminer } from "./EtapeTerminer";
import type {
  ChoixClient,
  ChoixMandat,
  ContexteRepriseUnClient,
  EntreeFacture,
  Etape,
  EtatConflits,
  Ids,
  SectionsSaisies,
} from "./types";

/**
 * « Reprendre un client » : un client à la fois, ses factures une par une.
 *
 * Spec : docs/product/SPEC_REPRISE_UN_CLIENT_A_LA_FOIS.md (validée le
 * 2026-09-30, maquettes dans la même journée).
 *
 * Ce composant ne réécrit aucune règle métier. Il tient l'état des quatre
 * étapes et parle à trois routes :
 *   - `reprise-un-client/contexte` et `/preparer` (le client et son mandat) ;
 *   - `entree/reprise/analyser`, qui lit un PDF, déjà éprouvée par le dépôt en lot ;
 *   - `entree/reprise/verser`, qui écrit UNE facture à la fois, avec ses quatre
 *     barrières anti-doublon.
 */

const CONFLITS_INITIAUX: EtatConflits = { phase: "attente", nombre: 0, details: [], pour: "" };

function copie<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function RepriseUnClient({ onCorriger }: { onCorriger?: () => void }) {
  const t = useTranslations("repriseUnClient");
  const locale = useLocale();
  const devise = useMemo(
    () => new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", { style: "currency", currency: "CAD" }),
    [locale],
  );

  const [contexte, setContexte] = useState<ContexteRepriseUnClient | null>(null);
  const [erreurContexte, setErreurContexte] = useState(false);
  const [etape, setEtape] = useState<Etape>(1);

  const [recherche, setRecherche] = useState("");
  const [client, setClient] = useState<ChoixClient | null>(null);
  const [conflits, setConflits] = useState<EtatConflits>(CONFLITS_INITIAUX);
  const [conflitsDeclares, setConflitsDeclares] = useState(false);

  const [mandat, setMandat] = useState<ChoixMandat | null>(null);
  const [sections, setSections] = useState<SectionsSaisies>(sectionsVides());

  const [ids, setIds] = useState<Ids | null>(null);
  const [entrees, setEntrees] = useState<EntreeFacture[]>([]);
  const [ouverteId, setOuverteId] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);

  const [recap, setRecap] = useState<RecapitulatifMandat | null>(null);
  const [erreurRecap, setErreurRecap] = useState(false);

  const chargerContexte = useCallback(async () => {
    setErreurContexte(false);
    try {
      const res = await fetch("/api/clients/reprise-un-client/contexte", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setContexte((await res.json()) as ContexteRepriseUnClient);
    } catch {
      setErreurContexte(true);
    }
  }, []);

  useEffect(() => {
    void chargerContexte();
  }, [chargerContexte]);

  /* ── Dérivés ─────────────────────────────────────────────────────────── */
  const champsTaxe = useMemo(() => contexte?.taxes.champs ?? [], [contexte]);
  const clientNom = client?.mode === "existant" ? client.nom : client ? nomSaisi(client.identite) : "";
  const mandatIntitule = mandat?.mode === "existant" ? mandat.intitule : mandat?.mandat.intitule.trim() ?? "";
  const tauxMandat =
    mandat?.mode === "existant"
      ? mandat.tauxHoraire
      : mandat
        ? lireNombre(mandat.mandat.tauxHoraire) ?? contexte?.tauxDefaut ?? null
        : null;

  const ouverte = entrees.find((e) => e.id === ouverteId) ?? null;
  const aVerifier = entrees.filter((e) => e.statut === "a_verifier");
  const enregistrees = entrees.filter((e) => e.statut === "enregistree");
  const controleOuverte = ouverte ? controler(ouverte.saisie, champsTaxe) : null;

  const bilanEnregistre = useMemo(() => {
    let facture = 0;
    let encaisse = 0;
    let heures = 0;
    for (const e of enregistrees) {
      const c = calculer(e.saisie, champsTaxe);
      const total = c.total ?? 0;
      const reste = resteDu(e.saisie, total) ?? total;
      facture += total;
      encaisse += total - reste;
      heures += c.heures;
    }
    const r = (n: number) => Math.round(n * 100) / 100;
    return { facture: r(facture), encaisse: r(encaisse), reste: r(facture - encaisse), heures: r(heures) };
  }, [enregistrees, champsTaxe]);

  /* ── Étapes 1 et 2 : peut-on avancer ? ───────────────────────────────── */
  const clientPret = client !== null && clientNom.length > 0;
  const mandatPret = mandat !== null && mandatIntitule.length > 0;
  const verrouille = ids !== null; // client et mandat déjà créés : on ne revient plus dessus

  /* ── Le client et le mandat, créés à la première facture ─────────────── */
  const obtenirIds = async (): Promise<Ids | null> => {
    if (ids) return ids;
    if (!client || !mandat) return null;
    const s = sections;
    const corps = {
      client: client.mode === "existant" ? { id: client.id } : { nouveau: client.identite },
      mandat:
        mandat.mode === "existant"
          ? { id: mandat.id }
          : {
              nouveau: {
                intitule: mandat.mandat.intitule,
                objetDuMandat: mandat.mandat.objetDuMandat,
                tauxHoraire: lireNombre(mandat.mandat.tauxHoraire),
                enCours: mandat.mandat.enCours,
                dateOuverture: mandat.mandat.dateOuverture || null,
                avocatResponsableId: mandat.mandat.avocatResponsableId || null,
              },
            },
      conflitsVerifies: conflitsDeclares,
      sections: {
        identite: client.mode === "nouveau" ? s.identite : undefined,
        fonds: lireNombre(s.fonds.montant)
          ? { montant: lireNombre(s.fonds.montant), arreteAu: s.fonds.arreteAu, recuATitreDe: s.fonds.recuATitreDe }
          : undefined,
        echeances: s.echeances,
        parties: s.parties,
      },
    };
    const res = await fetch("/api/clients/reprise-un-client/preparer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    const data = (await res.json().catch(() => ({}))) as { clientId?: string; dossierId?: string; error?: string };
    if (!res.ok || !data.clientId || !data.dossierId) {
      throw new Error(data.error || t("factures.erreurEnvoi"));
    }
    const obtenus = { clientId: data.clientId, dossierId: data.dossierId };
    setIds(obtenus);
    return obtenus;
  };

  /* ── Factures ────────────────────────────────────────────────────────── */
  const majEntree = (id: string, patch: Partial<EntreeFacture>) =>
    setEntrees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const ouvrirSuivante = (apres: string | null, liste: EntreeFacture[]) => {
    const candidates = liste.filter((e) => e.statut === "a_verifier" && e.id !== apres);
    setOuverteId(candidates[0]?.id ?? null);
  };

  const deposer = async (fichiers: File[]) => {
    const nouvelles: EntreeFacture[] = fichiers.map((f) => ({
      id: nouvelId(),
      source: "pdf",
      statut: "lecture",
      fichier: f,
      fichierNom: f.name,
      saisie: factureVide(champsTaxe.length, tauxMandat),
    }));
    setEntrees((prev) => [...prev, ...nouvelles]);

    for (const e of nouvelles) {
      const fd = new FormData();
      fd.append("file", e.fichier as File);
      let patch: Partial<EntreeFacture>;
      try {
        const res = await fetch("/api/clients/entree/reprise/analyser", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as {
          alreadyImported?: boolean;
          duplicate?: { importeLe?: string };
          error?: string;
          hash?: string;
          mimeType?: string;
          lectureEchouee?: boolean;
          raisonLecture?: string;
          extraction?: PastInvoiceExtraction | null;
        };
        if (data.alreadyImported) {
          patch = { statut: "deja_reprise", dejaRepriseLe: data.duplicate?.importeLe };
        } else if (!res.ok) {
          // Fichier refusé (format, taille) : il ne peut pas être conservé. La
          // facture reste à saisir à la main, et on dit pourquoi.
          patch = { statut: "a_verifier", source: "main", fichier: undefined, lectureEchouee: true, raisonLecture: data.error };
        } else if (data.lectureEchouee || !data.extraction) {
          patch = { statut: "a_verifier", hash: data.hash, mimeType: data.mimeType, lectureEchouee: true, raisonLecture: data.raisonLecture };
        } else {
          const saisie = depuisExtraction(data.extraction, champsTaxe, tauxMandat, nouvelId);
          patch = {
            statut: "a_verifier",
            hash: data.hash,
            mimeType: data.mimeType,
            saisie,
            lu: copie(saisie),
            clientLu: data.extraction.clientNom,
          };
        }
      } catch {
        patch = { statut: "a_verifier", source: "main", fichier: undefined, lectureEchouee: true };
      }
      setEntrees((prev) => {
        const suite = prev.map((x) => (x.id === e.id ? { ...x, ...patch } : x));
        setOuverteId((cur) => cur ?? (patch.statut === "a_verifier" ? e.id : null));
        return suite;
      });
    }
  };

  const taper = () => {
    const e: EntreeFacture = {
      id: nouvelId(),
      source: "main",
      statut: "a_verifier",
      fichierNom: "",
      saisie: factureVide(champsTaxe.length, tauxMandat),
    };
    setEntrees((prev) => [...prev, e]);
    setOuverteId(e.id);
  };

  const enregistrer = async () => {
    if (!ouverte || !controleOuverte || !enregistrable(controleOuverte) || enCours) return;
    setEnCours(true);
    setErreurGlobale(null);
    const e = ouverte;
    try {
      const obtenus = await obtenirIds();
      if (!obtenus) throw new Error(t("factures.erreurEnvoi"));

      const sansPiece = e.source === "main" || !e.hash || !e.fichier;
      const s = e.saisie;
      const item = {
        id: e.id,
        fichierNom: e.fichierNom || "Saisie sans pièce",
        extraction: versExtraction(s, champsTaxe, { clientNom, dossierIntitule: mandatIntitule }),
        match: {
          client: { statut: "existant", clientId: obtenus.clientId, clientNom },
          dossier: { statut: "existant", dossierId: obtenus.dossierId, dossierIntitule: mandatIntitule },
        },
        statutPaiement: s.statutPaiement,
        datePaiement: s.datePaiement || null,
        champsCorriges: champsCorriges(e),
        sansPiece,
        hash: sansPiece ? undefined : e.hash,
        mimeType: sansPiece ? undefined : e.mimeType,
        montantPaye: s.statutPaiement === "partielle" ? lireNombre(s.montantRecu) : null,
        modePaiement: s.statutPaiement === "impayee" ? null : s.modePaiement,
      };
      const fd = new FormData();
      fd.append("lot", JSON.stringify([item]));
      if (!sansPiece && e.fichier) fd.append(`file_${e.id}`, e.fichier);

      const res = await fetch("/api/clients/entree/reprise/verser", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        resultats?: { id: string; ok: boolean; erreur?: string; invoiceId?: string }[];
        error?: string;
      };
      const r = data.resultats?.[0];
      if (!res.ok || !r) throw new Error(data.error || t("factures.erreurEnvoi"));
      if (!r.ok) {
        majEntree(e.id, { erreur: r.erreur || t("factures.erreurEnvoi") });
        return;
      }
      setEntrees((prev) => {
        const suite = prev.map((x) =>
          x.id === e.id ? { ...x, statut: "enregistree" as const, invoiceId: r.invoiceId, erreur: undefined } : x,
        );
        ouvrirSuivante(e.id, suite);
        return suite;
      });
    } catch (err) {
      majEntree(e.id, { erreur: err instanceof Error ? err.message : t("factures.erreurEnvoi") });
    } finally {
      setEnCours(false);
    }
  };

  const passer = () => {
    if (!ouverte) return;
    const liste = entrees.filter((e) => e.statut === "a_verifier");
    const i = liste.findIndex((e) => e.id === ouverte.id);
    setOuverteId(liste[(i + 1) % liste.length]?.id ?? null);
  };

  /* ── Étape 4 ─────────────────────────────────────────────────────────── */
  const chargerRecap = async (dossierId: string) => {
    setRecap(null);
    setErreurRecap(false);
    try {
      const res = await fetch(`/api/clients/reprise-un-client/recapitulatif?dossierId=${encodeURIComponent(dossierId)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setRecap((await res.json()) as RecapitulatifMandat);
    } catch {
      setErreurRecap(true);
    }
  };

  const allerTerminer = async () => {
    setEtape(4);
    if (ids) await chargerRecap(ids.dossierId);
  };

  const enregistrerSansFacture = async () => {
    setEnCours(true);
    setErreurGlobale(null);
    try {
      const obtenus = await obtenirIds();
      if (obtenus) await chargerRecap(obtenus.dossierId);
    } catch (err) {
      setErreurGlobale(err instanceof Error ? err.message : t("factures.erreurEnvoi"));
    } finally {
      setEnCours(false);
    }
  };

  const recommencer = (garderClient: boolean) => {
    const clientGarde: ChoixClient | null =
      garderClient && ids ? { mode: "existant", id: ids.clientId, nom: clientNom } : null;
    setClient(clientGarde);
    setRecherche(garderClient ? recherche : "");
    setConflits(CONFLITS_INITIAUX);
    setConflitsDeclares(false);
    setMandat(null);
    setSections(sectionsVides());
    setIds(null);
    setEntrees([]);
    setOuverteId(null);
    setRecap(null);
    setErreurGlobale(null);
    setEtape(garderClient ? 2 : 1);
    void chargerContexte();
  };

  /* ── Rendu ───────────────────────────────────────────────────────────── */
  if (erreurContexte) {
    return <p className="text-[13px] text-si-danger-ink">{t("erreurChargement")}</p>;
  }
  if (!contexte) {
    return <p className="text-[13px] text-si-muted">{t("chargement")}</p>;
  }

  const identiteAFaire = client?.mode === "nouveau" && sections.identite.etat === "A_FAIRE";

  return (
    <div>
      <div>
        <h2 className="text-[20px] font-medium tracking-[-0.01em] text-si-ink">{t("titre")}</h2>
        <p className="mt-1 max-w-[660px] text-[13px] text-si-muted">{t("chapeau")}</p>
      </div>

      <Etapes
        etape={etape}
        clientNom={clientNom}
        clientNouveau={client?.mode === "nouveau"}
        mandatResume={mandatIntitule ? `${mandatIntitule}${tauxMandat !== null ? ` · ${String(tauxMandat).replace(".", ",")} $/h` : ""}` : ""}
        enregistrees={enregistrees.length}
        restantes={aVerifier.length}
        verrouille={verrouille}
        onAller={(e) => setEtape(e)}
      />

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_306px]">
        <div className="min-w-0">
          {etape === 1 && (
            <EtapeClient
              contexte={contexte}
              choix={client}
              onChoix={(c) => {
                // Le mandat ne se réinitialise que si l'on change VRAIMENT de
                // client : corriger un téléphone ne doit pas effacer le mandat
                // déjà saisi à l'étape 2.
                const memeClient =
                  (c?.mode === "nouveau" && client?.mode === "nouveau") ||
                  (c?.mode === "existant" && client?.mode === "existant" && c.id === client.id);
                setClient(c);
                if (!memeClient) {
                  setMandat(c?.mode === "nouveau" ? { mode: "nouveau", mandat: mandatVide(contexte.tauxDefaut) } : null);
                }
              }}
              recherche={recherche}
              onRecherche={setRecherche}
              conflits={conflits}
              onConflits={setConflits}
              conflitsDeclares={conflitsDeclares}
              onConflitsDeclares={setConflitsDeclares}
            />
          )}
          {etape === 2 && client && (
            <EtapeMandat contexte={contexte} client={client} choix={mandat} onChoix={setMandat} sections={sections} onSections={setSections} />
          )}
          {etape === 3 && (
            <EtapeFactures
              champsTaxe={champsTaxe}
              tauxMandat={tauxMandat}
              clientNom={clientNom}
              entrees={entrees}
              ouverteId={ouverteId}
              onOuvrir={setOuverteId}
              onSaisie={(id, saisie: FactureSaisie) => majEntree(id, { saisie, erreur: undefined })}
              onDeposer={(f) => void deposer(f)}
              onTaper={taper}
            />
          )}
          {etape === 4 &&
            (recap ? (
              <EtapeTerminer recap={recap} />
            ) : ids ? (
              <p className="text-[13px] text-si-muted">{erreurRecap ? t("terminer.erreur") : t("terminer.chargement")}</p>
            ) : (
              <Carte className="p-5">
                <p className="text-[13px] text-si-body">{clientNom} · {mandatIntitule}</p>
                <p className="mt-1 text-[13px] text-si-muted">{t("terminer.aucuneFacture")}</p>
                {erreurGlobale && <p className="mt-2 text-[13px] text-si-danger-ink">{erreurGlobale}</p>}
                <div className="mt-3">
                  <Button variant="primary" loading={enCours} onClick={() => void enregistrerSansFacture()}>
                    {t("terminer.enregistrerSansFacture")}
                  </Button>
                </div>
              </Carte>
            ))}
        </div>

        <aside className="space-y-3.5 lg:sticky lg:top-6">
          {etape === 4 && recap ? (
            <Carte className="p-4">
              <h3 className="text-[13px] font-medium text-si-ink">{t("terminer.toutEnregistre")}</h3>
              <p className="mt-0.5 text-[12px] text-si-muted">{t("terminer.aucuneOuverte")}</p>
              <div className="my-3 border-t border-si-line2" />
              <Link href={routes.client(recap.client.id)} className="block py-1 text-[13px] text-si-ink underline underline-offset-2">
                {t("terminer.ouvrirFiche")}
              </Link>
              <Link href={routes.dossier(recap.mandat.id)} className="block py-1 text-[13px] text-si-ink underline underline-offset-2">
                {t("terminer.ouvrirMandat")}
              </Link>
              {onCorriger && (
                <button type="button" onClick={onCorriger} className="block py-1 text-left text-[13px] text-si-ink underline underline-offset-2">
                  {t("terminer.corriger")}
                </button>
              )}
            </Carte>
          ) : (
            <Carte className="p-4">
              <h3 className="text-[13px] font-medium text-si-ink">{t("panneau.titre")}</h3>
              <p className="mt-0.5 text-[12px] text-si-muted">{ids ? t("panneau.dejaEnregistre") : t("panneau.rienEncore")}</p>
              <dl className="mt-3">
                <Ligne libelle={t("panneau.client")} valeur={clientNom || "—"} />
                {client && (
                  <Ligne
                    libelle={t("panneau.statut")}
                    valeur={client.mode === "nouveau" ? t("etapes.nouveau") : t("panneau.existant")}
                  />
                )}
                <Ligne libelle={t("panneau.mandat")} valeur={mandatIntitule || t("panneau.aEtape2")} />
                {tauxMandat !== null && mandatIntitule && (
                  <Ligne libelle={t("panneau.taux")} valeur={`${devise.format(tauxMandat)}/h`} mono />
                )}
              </dl>
              {etape >= 3 && (
                <>
                  <div className="my-2 border-t border-si-line2" />
                  <dl>
                    <Ligne libelle={t("panneau.facturesEnregistrees")} valeur={enregistrees.length} mono />
                    <Ligne libelle={t("panneau.heures")} valeur={`${bilanEnregistre.heures.toFixed(2).replace(".", locale === "en" ? "." : ",")} h`} mono />
                    <Ligne libelle={t("panneau.facture")} valeur={devise.format(bilanEnregistre.facture)} mono />
                    <Ligne libelle={t("panneau.encaisse")} valeur={devise.format(bilanEnregistre.encaisse)} mono />
                    <Ligne libelle={t("panneau.resteDu")} valeur={devise.format(bilanEnregistre.reste)} mono />
                  </dl>
                </>
              )}
            </Carte>
          )}
          <Carte className="p-4">
            <p className="text-[12px] leading-relaxed text-si-muted">
              {t.rich(
                etape === 4 ? "terminer.rappelCorrection" : etape === 3 ? "panneau.rappelPendant" : identiteAFaire && etape === 2 ? "panneau.rappelIdentite" : "panneau.rappelAvant",
                { b: (c) => <b className="font-medium text-si-body">{c}</b> },
              )}
            </p>
          </Carte>
        </aside>
      </div>

      {/* ── La décision, en bas ───────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-3 mt-5 border-t border-si-line bg-si-surface/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-si-muted">
            {etape === 1 &&
              (!client
                ? t("decision.choisirClient")
                : !clientPret
                  ? t("decision.nomManquant")
                  : client.mode === "nouveau"
                    ? `${t("decision.nouveauClient")} · ${conflits.phase === "fait" && conflits.nombre === 0 ? t("decision.aucunConflit") : conflits.nombre > 0 ? `${conflits.nombre} ${t("decision.conflitsAExaminer")}` : "…"}`
                    : `${t("decision.clientExistant")} · ${clientNom}`)}
            {etape === 2 &&
              (!mandat
                ? t("decision.intituleManquant")
                : !mandatPret
                  ? t("decision.intituleManquant")
                  : `${mandat.mode === "nouveau" ? t("decision.nouveauMandat") : t("decision.mandatExistant")}${tauxMandat !== null ? ` · ${devise.format(tauxMandat)}/h` : ""}`)}
            {etape === 3 && (
              <>
                {ouverte
                  ? `${ouverte.saisie.numero || t("factures.sansNumero")}${champsCorriges(ouverte).length ? ` · ${t("factures.repriseMain", { n: champsCorriges(ouverte).length })}` : ""}`
                  : t("factures.aucuneOuverte")}
                {erreurGlobale && <span className="ml-2 text-si-danger-ink">{erreurGlobale}</span>}
              </>
            )}
            {etape === 4 && recap && `${recap.client.nom} · ${t("terminer.resume", { n: recap.factures.length })}`}
          </p>

          <div className="flex flex-wrap gap-2">
            {etape === 1 && (
              <Button variant="primary" disabled={!clientPret} onClick={() => setEtape(verrouille ? 3 : 2)}>
                {t("decision.versMandat")}
              </Button>
            )}
            {etape === 2 && (
              <>
                <Button variant="secondary" onClick={() => setEtape(1)}>{t("decision.retourClient")}</Button>
                <Button variant="primary" disabled={!mandatPret} onClick={() => setEtape(3)}>{t("decision.versFactures")}</Button>
              </>
            )}
            {etape === 3 && (
              <>
                <Button variant="secondary" onClick={() => void allerTerminer()} title={aVerifier.length ? t("factures.pasEncoreEnregistrees", { n: aVerifier.length }) : undefined}>
                  {t("factures.versTerminer")}
                </Button>
                {ouverte && aVerifier.length > 1 && (
                  <Button variant="secondary" onClick={passer}>{t("factures.passer")}</Button>
                )}
                <Button
                  variant="primary"
                  disabled={!ouverte || !controleOuverte || !enregistrable(controleOuverte)}
                  loading={enCours}
                  loadingLabel={t("factures.enregistrement")}
                  onClick={() => void enregistrer()}
                >
                  {t("factures.enregistrer")}
                </Button>
              </>
            )}
            {etape === 4 && recap && (
              <>
                <Button variant="secondary" onClick={() => recommencer(true)}>{t("terminer.autreMandat")}</Button>
                <Button variant="primary" onClick={() => recommencer(false)}>{t("terminer.clientSuivant")}</Button>
              </>
            )}
          </div>
        </div>
        {etape === 3 && aVerifier.length > 0 && !ouverte && (
          <p className="mt-1 text-[12px] text-si-amber-ink">{t("factures.pasEncoreEnregistrees", { n: aVerifier.length })}</p>
        )}
      </div>
    </div>
  );
}

/* ── Les quatre étapes, toujours visibles ─────────────────────────────── */
function Etapes({
  etape,
  clientNom,
  clientNouveau,
  mandatResume,
  enregistrees,
  restantes,
  verrouille,
  onAller,
}: {
  etape: Etape;
  clientNom: string;
  clientNouveau: boolean;
  mandatResume: string;
  enregistrees: number;
  restantes: number;
  verrouille: boolean;
  onAller: (e: Etape) => void;
}) {
  const t = useTranslations("repriseUnClient.etapes");
  const items: { n: Etape; titre: string; detail: string; modifiable: boolean }[] = [
    { n: 1, titre: t("client"), detail: clientNom ? `${clientNom}${clientNouveau ? ` · ${t("nouveau")}` : ""}` : t("aDesigner"), modifiable: !verrouille },
    { n: 2, titre: t("mandat"), detail: mandatResume || t("dossierEtTaux"), modifiable: !verrouille },
    { n: 3, titre: t("factures"), detail: enregistrees + restantes > 0 ? t("facturesEtat", { enregistrees, restantes }) : t("uneParUne"), modifiable: true },
    { n: 4, titre: t("terminer"), detail: t("recap"), modifiable: false },
  ];
  return (
    <ol className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-si-line bg-si-surface lg:grid-cols-4">
      {items.map((it) => {
        const faite = it.n < etape;
        const courante = it.n === etape;
        return (
          <li
            key={it.n}
            aria-current={courante ? "step" : undefined}
            className={`flex items-start gap-2.5 border-r border-si-line2 px-4 py-3 last:border-r-0 ${
              courante ? "bg-si-canvas shadow-[inset_0_-2px_0_var(--si-ink)]" : ""
            }`}
          >
            <span
              className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
                faite ? "bg-si-verified text-white" : courante ? "bg-si-ink text-white" : "border border-si-border-strong text-si-muted"
              }`}
            >
              {faite ? <Check className="h-3 w-3" aria-hidden /> : it.n}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`text-[13px] ${faite || courante ? "font-medium text-si-ink" : "text-si-muted"}`}>
                {it.n} · {it.titre}
              </div>
              <div className="truncate text-[12px] text-si-muted">{it.detail}</div>
            </div>
            {faite && it.modifiable && (
              <button type="button" onClick={() => onAller(it.n)} className="text-[12px] text-si-muted underline underline-offset-2 hover:text-si-ink">
                {t("modifier")}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
