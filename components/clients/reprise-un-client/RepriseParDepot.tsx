"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { cleCroisement } from "@/lib/clients/croisement-conflits";
import { intitulesSeRecoupent } from "@/lib/services/reprise-historique/matcher";
import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";
import type { ContexteRepriseUnClient } from "@/lib/services/reprise-un-client/contexte";
import type { RecapitulatifMandat } from "@/lib/services/reprise-un-client/recapitulatif";
import {
  clientDuDepot,
  comparerCoordonnee,
  ouvrirEnCorrection,
  reconnaitreClient,
  reconnaitreMandat,
} from "@/lib/services/reprise-un-client/depot";
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
import { champsCorriges, factureVide, nouvelId } from "./facture-outils";
import { Correction, Paiement, Releve, formats, intituleFacture } from "./EcranFacture";
import {
  ChoixMandat,
  EcranNouveauClient,
  EtatClient,
  type ClientChoisi,
  type EtatConflits,
  type MandatChoisi,
} from "./EcranClient";
import { EcranFin } from "./EcranFin";
import { Alerte, BarreDecision, Erreur, Lien, Section, racine, titre } from "./ui";
import type { EntreeFacture, Ids } from "./types";

/**
 * « Reprendre un client », version 4 (maquettes validées le 2026-10-01).
 *
 * Tout commence par un dépôt, et un dépôt ne concerne qu'un client. Le premier
 * réflexe est de lire qui il est : s'il est déjà au cabinet, il est reconnu.
 * Puis chaque facture, présentée en relevé quand la lecture est sûre, en
 * correction quand elle a hésité. À la fin, ce qui reste à compléter sur la
 * fiche est nommé (identité, fidéicommis).
 *
 * Aucune règle métier ici : `depot.ts` et `saisie.ts` décident, les routes
 * existantes écrivent (lecture, préparation du client, versement).
 */

type Phase = "depart" | "lecture" | "client" | "facture" | "fin";

const FORMES_JURIDIQUES = /\b(inc|ltée|ltee|ltd|limitée|limited|corp|corporation|s\.?e\.?n\.?c\.?r?\.?l?|llp|cie|enr)\b\.?/i;
const CONFLITS_INITIAUX: EtatConflits = { phase: "attente", nombre: 0, pour: "" };

function identitePourCreation(nom: string) {
  const n = nom.trim();
  if (FORMES_JURIDIQUES.test(n) || !n.includes(" ")) {
    return { typeClient: "personne_morale" as const, raisonSociale: n };
  }
  const mots = n.split(/\s+/);
  return { typeClient: "personne_physique" as const, prenom: mots.slice(0, -1).join(" "), nom: mots[mots.length - 1] };
}

function copie<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function RepriseParDepot() {
  const t = useTranslations("repriseUnClient.depot");
  const tf = useTranslations("repriseUnClient.factures");
  const locale = useLocale();
  const f = useMemo(() => formats(locale), [locale]);
  const inputFichiers = useRef<HTMLInputElement>(null);
  const depotSuivantEstAjout = useRef(false);

  const [contexte, setContexte] = useState<ContexteRepriseUnClient | null>(null);
  const [erreurContexte, setErreurContexte] = useState(false);
  const [phase, setPhase] = useState<Phase>("depart");
  const [nbEnLecture, setNbEnLecture] = useState(0);

  const [entrees, setEntrees] = useState<EntreeFacture[]>([]);
  const [client, setClient] = useState<ClientChoisi | null>(null);
  const [coordLues, setCoordLues] = useState<{ adresse: string | null; courriel: string | null; telephone: string | null }>({ adresse: null, courriel: null, telephone: null });
  const [ficheMaj, setFicheMaj] = useState<Set<string>>(new Set());
  const [conflits, setConflits] = useState<EtatConflits>(CONFLITS_INITIAUX);
  const [declaration, setDeclaration] = useState(false);
  const [mandat, setMandat] = useState<MandatChoisi | null>(null);

  const [ids, setIds] = useState<Ids | null>(null);
  const [enCorrection, setEnCorrection] = useState<Record<string, boolean>>({});
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
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
  const avocats = contexte?.avocats ?? [];
  const clientNom = client?.nom.trim() ?? "";
  const mandatIntitule = mandat ? mandat.intitule.trim() : "";
  const tauxMandat =
    mandat?.mode === "existant" ? mandat.taux : mandat ? lireNombre(mandat.taux) ?? contexte?.tauxDefaut ?? null : null;

  const retenues = entrees.filter((e) => !e.ecarteeNom && !e.ecarteeMandat && e.statut !== "deja_reprise");
  const autreMandat = entrees.filter((e) => e.ecarteeMandat && e.statut === "a_verifier");
  const aVerifier = retenues.filter((e) => e.statut === "a_verifier");
  const ecartees = entrees.filter((e) => e.ecarteeNom);
  const dejaReprises = entrees.filter((e) => e.statut === "deja_reprise");
  const courante = aVerifier[0] ?? null;
  const rang = courante ? retenues.findIndex((e) => e.id === courante.id) + 1 : 0;
  const controleCourante = courante ? controler(courante.saisie, champsTaxe) : null;

  /* ── Relevé ou correction : décidé UNE fois, à l'ouverture de la facture ─ */
  useEffect(() => {
    if (!courante || !controleCourante || enCorrection[courante.id] !== undefined) return;
    const ouvrir = ouvrirEnCorrection({
      lectureEchouee: courante.lectureEchouee,
      saisieALaMain: courante.source === "main",
      extraction: courante.extraction ?? null,
      controle: controleCourante,
    });
    setEnCorrection((m) => ({ ...m, [courante.id]: ouvrir }));
  }, [courante, controleCourante, enCorrection]);

  /* ── Conflits : vérifiés pour un nouveau client, dès qu'il a un nom ──── */
  useEffect(() => {
    if (client?.mode !== "nouveau" || clientNom.length < 3 || conflits.pour === clientNom) return;
    const minuterie = setTimeout(async () => {
      setConflits({ phase: "verification", nombre: 0, pour: clientNom });
      try {
        const res = await fetch("/api/clients/conflict-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...identitePourCreation(clientNom), email: client.coordonnees.courriel }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { matches?: unknown[] };
        setConflits({ phase: "fait", nombre: data.matches?.length ?? 0, pour: clientNom });
      } catch {
        setConflits({ phase: "erreur", nombre: 0, pour: clientNom });
      }
    }, 500);
    return () => clearTimeout(minuterie);
  }, [client, clientNom, conflits.pour]);

  /* ── Lire un fichier ─────────────────────────────────────────────────── */
  const lire = async (fichier: File): Promise<EntreeFacture> => {
    const base: EntreeFacture = {
      id: nouvelId(),
      source: "pdf",
      statut: "a_verifier",
      fichier,
      fichierNom: fichier.name,
      saisie: factureVide(champsTaxe.length, contexte?.tauxDefaut ?? null),
    };
    try {
      const fd = new FormData();
      fd.append("file", fichier);
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
      if (data.alreadyImported) return { ...base, statut: "deja_reprise", dejaRepriseLe: data.duplicate?.importeLe };
      if (!res.ok) {
        // Fichier refusé (format, taille) : il ne peut pas être conservé ; la
        // facture reste à saisir à la main, et on dit pourquoi.
        return { ...base, source: "main", fichier: undefined, lectureEchouee: true, raisonLecture: data.error, extraction: null };
      }
      if (data.lectureEchouee || !data.extraction) {
        return { ...base, hash: data.hash, mimeType: data.mimeType, lectureEchouee: true, raisonLecture: data.raisonLecture, extraction: null };
      }
      const saisie = depuisExtraction(data.extraction, champsTaxe, contexte?.tauxDefaut ?? null, nouvelId);
      return { ...base, hash: data.hash, mimeType: data.mimeType, saisie, lu: copie(saisie), extraction: data.extraction, clientLu: data.extraction.clientNom };
    } catch {
      return { ...base, source: "main", fichier: undefined, lectureEchouee: true, extraction: null };
    }
  };

  /**
   * Un dépôt, un mandat. Une facture du bon client dont l'objet ne recoupe pas
   * le mandat retenu est mise de côté, nommée, et reprise ensuite avec son
   * propre mandat. La ranger d'office dans le mandat courant serait une erreur
   * silencieuse : un client a souvent plusieurs dossiers.
   */
  const marquerAutreMandat = (liste: EntreeFacture[], intituleMandat: string): EntreeFacture[] =>
    liste.map((e) => {
      const objet = e.extraction?.dossierIntitule?.trim();
      if (e.ecarteeNom || !objet || !intituleMandat.trim() || intitulesSeRecoupent(objet, intituleMandat)) return e;
      return { ...e, ecarteeMandat: objet };
    });

  /* ── Déposer : le premier dépôt décide du client ─────────────────────── */
  const deposer = async (fichiers: File[]) => {
    if (!contexte || fichiers.length === 0) return;
    const ajout = depotSuivantEstAjout.current;
    depotSuivantEstAjout.current = false;
    setErreur(null);
    if (!ajout) setPhase("lecture");
    setNbEnLecture(fichiers.length);

    const lues: EntreeFacture[] = [];
    for (const fichier of fichiers) lues.push(await lire(fichier));
    setNbEnLecture(0);

    if (ajout && client) {
      // Une facture ajoutée qui porte un autre nom est écartée, comme au premier dépôt.
      const cle = cleCroisement(clientNom);
      const marquees = lues.map((e) =>
        e.extraction?.clientNom && cleCroisement(e.extraction.clientNom) !== cle ? { ...e, ecarteeNom: e.extraction.clientNom } : e,
      );
      setEntrees((prev) => [...prev, ...marquerAutreMandat(marquees, mandatIntitule)]);
      return;
    }

    const candidates = lues.filter((e) => e.statut !== "deja_reprise");
    const depot = clientDuDepot(candidates.map((e) => ({ id: e.id, extraction: e.extraction ?? null })));
    const ecarteesIds = new Map(depot.ecartees.map((e) => [e.id, e.nomLu]));
    const marquees = lues.map((e) => (ecarteesIds.has(e.id) ? { ...e, ecarteeNom: ecarteesIds.get(e.id) } : e));
    setEntrees(marquees);
    setCoordLues({ adresse: depot.adresse, courriel: depot.courriel, telephone: depot.telephone });

    if (candidates.length === 0) {
      setPhase("depart"); // tout était déjà repris : la liste le dit au départ
      return;
    }

    const reconnu = reconnaitreClient(depot.nom, contexte.clients);
    const mandatNouveau = (intitule: string | null): MandatChoisi => ({
      mode: "nouveau",
      intitule: intitule ?? "",
      taux: contexte.tauxDefaut !== null ? String(contexte.tauxDefaut).replace(".", ",") : "",
      avocatId: contexte.avocats.length === 1 ? contexte.avocats[0].id : "",
    });

    if (reconnu.statut === "connu") {
      const c = reconnu.client;
      setClient({
        mode: "connu",
        id: c.id,
        nom: c.nom,
        adresse: c.adresse ?? null,
        courriel: c.courriel ?? null,
        telephone: c.telephone ?? null,
        identiteVerifiee: Boolean(c.identiteVerifiee),
        mandats: c.mandats,
      });
      const m = reconnaitreMandat(depot.mandat, c.mandats);
      setEntrees(marquerAutreMandat(marquees, m?.intitule ?? depot.mandat ?? ""));
      if (m) {
        setMandat({ mode: "existant", id: m.id, intitule: m.intitule, taux: m.tauxHoraire });
        setPhase("facture");
      } else {
        setMandat(depot.mandat ? mandatNouveau(depot.mandat) : null);
        setPhase("client");
      }
      return;
    }

    setClient({
      mode: "nouveau",
      nom: depot.nom ?? "",
      coordonnees: { adresse: depot.adresse ?? "", telephone: depot.telephone ?? "", courriel: depot.courriel ?? "" },
      proches: reconnu.proches,
    });
    setEntrees(marquerAutreMandat(marquees, depot.mandat ?? ""));
    setMandat(mandatNouveau(depot.mandat));
    setPhase("client");
  };

  /* ── Reprendre aussitôt les factures d'un autre mandat du même client ── */
  const continuerAutreMandat = async () => {
    if (!ids || !contexte) return;
    const restantes = autreMandat.map((e) => ({ ...e, ecarteeMandat: undefined }));
    const objet = autreMandat[0]?.ecarteeMandat ?? "";
    const res = await fetch("/api/clients/reprise-un-client/contexte", { cache: "no-store" });
    const frais = res.ok ? ((await res.json()) as ContexteRepriseUnClient) : contexte;
    setContexte(frais);
    const c = frais.clients.find((x) => x.id === ids.clientId);
    if (!c) return;
    setClient({
      mode: "connu",
      id: c.id,
      nom: c.nom,
      adresse: c.adresse ?? null,
      courriel: c.courriel ?? null,
      telephone: c.telephone ?? null,
      identiteVerifiee: Boolean(c.identiteVerifiee),
      mandats: c.mandats,
    });
    const m = reconnaitreMandat(objet, c.mandats);
    setEntrees(marquerAutreMandat(restantes, m?.intitule ?? objet));
    setMandat(
      m
        ? { mode: "existant", id: m.id, intitule: m.intitule, taux: m.tauxHoraire }
        : {
            mode: "nouveau",
            intitule: objet,
            taux: frais.tauxDefaut !== null ? String(frais.tauxDefaut).replace(".", ",") : "",
            avocatId: frais.avocats.length === 1 ? frais.avocats[0].id : "",
          },
    );
    setIds(null);
    setRecap(null);
    setConfirmation(null);
    setEnCorrection({});
    setPhase(m ? "facture" : "client");
  };

  const choisirFichiers = (ajout: boolean) => {
    depotSuivantEstAjout.current = ajout;
    inputFichiers.current?.click();
  };

  const sansFacture = () => {
    if (!contexte) return;
    setEntrees([]);
    setClient({ mode: "nouveau", nom: "", coordonnees: { adresse: "", telephone: "", courriel: "" }, proches: [] });
    setMandat({
      mode: "nouveau",
      intitule: "",
      taux: contexte.tauxDefaut !== null ? String(contexte.tauxDefaut).replace(".", ",") : "",
      avocatId: contexte.avocats.length === 1 ? contexte.avocats[0].id : "",
    });
    setPhase("client");
  };

  /* ── « C'est lui » : le client proche était le bon ───────────────────── */
  const cestLui = (id: string) => {
    const c = contexte?.clients.find((x) => x.id === id);
    if (!c) return;
    setClient({
      mode: "connu",
      id: c.id,
      nom: c.nom,
      adresse: c.adresse ?? null,
      courriel: c.courriel ?? null,
      telephone: c.telephone ?? null,
      identiteVerifiee: Boolean(c.identiteVerifiee),
      mandats: c.mandats,
    });
    const intituleLu = mandat?.intitule || null;
    const m = reconnaitreMandat(intituleLu, c.mandats);
    setMandat(m ? { mode: "existant", id: m.id, intitule: m.intitule, taux: m.tauxHoraire } : mandat);
  };

  /* ── Mettre la fiche à jour : seulement au clic ──────────────────────── */
  const mettreFicheAJour = async (champ: "adresse" | "courriel" | "telephone", valeur: string) => {
    if (client?.mode !== "connu") return;
    const res = await fetch("/api/clients/reprise-un-client/fiche", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id, champ, valeur }),
    });
    if (res.ok) {
      setFicheMaj((s) => new Set(s).add(champ));
      setClient({ ...client, [champ]: valeur });
    }
  };

  /* ── Le client et le mandat, créés à la première facture ─────────────── */
  const obtenirIds = async (): Promise<Ids> => {
    if (ids) return ids;
    if (!client || !mandat) throw new Error(tf("erreurEnvoi"));
    const corps = {
      client:
        client.mode === "connu"
          ? { id: client.id }
          : {
              nouveau: {
                ...identitePourCreation(client.nom),
                adresse: client.coordonnees.adresse,
                telephone: client.coordonnees.telephone,
                email: client.coordonnees.courriel,
              },
            },
      mandat:
        mandat.mode === "existant"
          ? { id: mandat.id }
          : {
              nouveau: {
                intitule: mandat.intitule,
                tauxHoraire: lireNombre(mandat.taux),
                enCours: true,
                avocatResponsableId: mandat.avocatId || (avocats.length === 1 ? avocats[0].id : null),
              },
            },
      conflitsVerifies: client.mode === "nouveau" ? declaration : false,
    };
    const res = await fetch("/api/clients/reprise-un-client/preparer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    const data = (await res.json().catch(() => ({}))) as { clientId?: string; dossierId?: string; error?: string };
    if (!res.ok || !data.clientId || !data.dossierId) throw new Error(data.error || tf("erreurEnvoi"));
    const obtenus = { clientId: data.clientId, dossierId: data.dossierId };
    setIds(obtenus);
    return obtenus;
  };

  /* ── La phrase dite APRÈS l'enregistrement ───────────────────────────── */
  const phraseConfirmation = (s: FactureSaisie): string => {
    const c = calculer(s, champsTaxe);
    const lignes = s.lignes.filter((l) => l.description.trim() || l.heures || l.montant);
    const debours = lignes.filter((l) => l.nature === "debours").length;
    const forfaits = lignes.filter((l) => l.nature === "forfait").length;
    const total = c.total ?? 0;
    const encaisse = s.statutPaiement === "payee" ? total : s.statutPaiement === "partielle" ? lireNombre(s.montantRecu) ?? 0 : 0;
    const morceaux: string[] = [];
    if (c.heures > 0) morceaux.push(t("confHeures", { h: f.nombre.format(c.heures) }));
    if (forfaits > 0) morceaux.push(t("confForfaits", { n: forfaits }));
    if (debours > 0) morceaux.push(t("confDebours", { n: debours }));
    if (encaisse > 0) morceaux.push(t("confEncaissement", { montant: f.devise.format(encaisse) }));
    morceaux.push(t("confEcritures", { n: 1 + debours + (encaisse > 0 ? 1 : 0) }));
    const detail = morceaux.length > 1 ? `${morceaux.slice(0, -1).join(", ")} ${t("et")} ${morceaux[morceaux.length - 1]}` : morceaux[0];
    return t("confirmation", { facture: s.numero.trim() || t("factureVierge"), detail });
  };

  /* ── Enregistrer la facture ouverte ──────────────────────────────────── */
  const enregistrer = async () => {
    if (!courante || !controleCourante || !enregistrable(controleCourante) || enCours) return;
    setEnCours(true);
    setErreur(null);
    const e = courante;
    try {
      const obtenus = await obtenirIds();
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
      const data = (await res.json().catch(() => ({}))) as { resultats?: { ok: boolean; erreur?: string; invoiceId?: string }[]; error?: string };
      const r = data.resultats?.[0];
      if (!res.ok || !r) throw new Error(data.error || tf("erreurEnvoi"));
      if (!r.ok) {
        setEntrees((prev) => prev.map((x) => (x.id === e.id ? { ...x, erreur: r.erreur || tf("erreurEnvoi") } : x)));
        return;
      }
      setConfirmation(phraseConfirmation(s));
      const restantes = aVerifier.filter((x) => x.id !== e.id).length;
      setEntrees((prev) => prev.map((x) => (x.id === e.id ? { ...x, statut: "enregistree", invoiceId: r.invoiceId, erreur: undefined } : x)));
      if (restantes === 0) await allerFin(obtenus.dossierId);
    } catch (err) {
      setEntrees((prev) => prev.map((x) => (x.id === e.id ? { ...x, erreur: err instanceof Error ? err.message : tf("erreurEnvoi") } : x)));
    } finally {
      setEnCours(false);
    }
  };

  const passer = () => {
    if (!courante) return;
    setEntrees((prev) => [...prev.filter((x) => x.id !== courante.id), courante]);
  };

  /* ── La fin ──────────────────────────────────────────────────────────── */
  const chargerRecap = async (dossierId: string) => {
    setErreurRecap(false);
    try {
      const res = await fetch(`/api/clients/reprise-un-client/recapitulatif?dossierId=${encodeURIComponent(dossierId)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setRecap((await res.json()) as RecapitulatifMandat);
    } catch {
      setErreurRecap(true);
    }
  };
  const allerFin = async (dossierId: string) => {
    setPhase("fin");
    await chargerRecap(dossierId);
  };

  const enregistrerClientSansFacture = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      const obtenus = await obtenirIds();
      await allerFin(obtenus.dossierId);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : tf("erreurEnvoi"));
    } finally {
      setEnCours(false);
    }
  };

  const clientSuivant = () => {
    setEntrees([]);
    setClient(null);
    setCoordLues({ adresse: null, courriel: null, telephone: null });
    setFicheMaj(new Set());
    setConflits(CONFLITS_INITIAUX);
    setDeclaration(false);
    setMandat(null);
    setIds(null);
    setEnCorrection({});
    setConfirmation(null);
    setErreur(null);
    setRecap(null);
    setPhase("depart");
    void chargerContexte();
  };

  /* ── Rendu ───────────────────────────────────────────────────────────── */
  if (erreurContexte) return <p className={`${racine} text-si-danger-ink`}>{tf("erreurEnvoi")}</p>;
  if (!contexte) return <p className={`${racine} text-si-muted`}>…</p>;

  const fichiersInput = (
    <input
      ref={inputFichiers}
      type="file"
      multiple
      accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
      className="hidden"
      onChange={(e) => {
        const liste = Array.from(e.target.files ?? []);
        e.target.value = "";
        void deposer(liste);
      }}
    />
  );

  /* Les remarques qui n'apparaissent que lorsqu'elles ont lieu. */
  const alertesDepot = (
    <>
      {ecartees.map((e) => (
        <Alerte key={e.id}>
          {t("ecartee", { fichier: e.fichierNom, nom: e.ecarteeNom ?? "" })}
          <Lien className="ml-2" onClick={() => setEntrees((prev) => prev.map((x) => (x.id === e.id ? { ...x, ecarteeNom: undefined } : x)))}>
            {t("rattacher")}
          </Lien>
        </Alerte>
      ))}
      {phase !== "fin" &&
        autreMandat.map((e) => (
          <Alerte key={e.id}>
            {t("autreMandat", { fichier: e.fichierNom, objet: e.ecarteeMandat ?? "" })}
            <Lien className="ml-2" onClick={() => setEntrees((prev) => prev.map((x) => (x.id === e.id ? { ...x, ecarteeMandat: undefined } : x)))}>
              {t("rattacher")}
            </Lien>
          </Alerte>
        ))}
      {dejaReprises.map((e) => (
        <Alerte key={e.id}>{t("dejaReprise", { fichier: e.fichierNom, date: e.dejaRepriseLe ? f.jourLong(e.dejaRepriseLe) : "" })}</Alerte>
      ))}
    </>
  );

  const alertesFiche =
    client?.mode === "connu" ? (
      <>
        {(["adresse", "telephone", "courriel"] as const).map((k) => {
          const lue = coordLues[k];
          const comparaison = comparerCoordonnee(lue, client[k]);
          if (!lue || (comparaison !== "differente" && comparaison !== "a_ajouter")) return null;
          if (ficheMaj.has(k)) return <Alerte key={k}>{t("ficheMiseAJour")}</Alerte>;
          const cle = comparaison === "differente"
            ? ({ adresse: "adresseDifferente", telephone: "telephoneDifferent", courriel: "courrielDifferent" } as const)[k]
            : ({ adresse: "adresseAAjouter", telephone: "telephoneAAjouter", courriel: "courrielAAjouter" } as const)[k];
          return (
            <Alerte key={k}>
              {t(cle, { valeur: lue })}
              <Lien className="ml-2" onClick={() => void mettreFicheAJour(k, lue)}>
                {comparaison === "differente" ? t("mettreAJour") : t("ajouterAFiche")}
              </Lien>
            </Alerte>
          );
        })}
      </>
    ) : null;

  return (
    <div
      data-section="reprise-par-depot"
      className={racine}
      onDragOver={(e) => phase === "depart" && e.preventDefault()}
      onDrop={(e) => {
        if (phase !== "depart") return;
        e.preventDefault();
        void deposer(Array.from(e.dataTransfer.files));
      }}
    >
      {fichiersInput}
      <div className="max-w-[760px]">
        {phase === "depart" && (
          <>
            <h2 className={titre}>{t("titre")}</h2>
            <p className="mt-1.5">{t("phrase")}</p>
            {alertesDepot}
            <div className="mt-6 flex items-center gap-5">
              <Button variant="primary" className="!text-[14px]" onClick={() => choisirFichiers(false)}>
                {t("choisir")}
              </Button>
              <Lien onClick={sansFacture}>{t("sansFacture")}</Lien>
            </div>
          </>
        )}

        {phase === "lecture" && <p className="text-si-muted">{t("lecture", { n: nbEnLecture })}</p>}

        {phase === "client" && client && mandat?.mode === "nouveau" && client.mode === "nouveau" && (
          <EcranNouveauClient
            client={client}
            onClient={(c) => setClient(c)}
            conflits={conflits}
            declaration={declaration}
            onDeclaration={setDeclaration}
            mandat={mandat}
            onMandat={setMandat}
            avocats={avocats}
            onCestLui={cestLui}
            alertes={
              <>
                {!client.nom && entrees.length > 0 && <Alerte>{t("lectureRien")}</Alerte>}
                {alertesDepot}
              </>
            }
          />
        )}

        {phase === "client" && client?.mode === "connu" && (
          <Section premiere>
            <h2 className={titre}>{client.nom}</h2>
            <p className="mt-1 text-si-muted">
              <EtatClient client={client} conflits={conflits} />
            </p>
            {alertesFiche}
            {alertesDepot}
            <ChoixMandat mandats={client.mandats} valeur={mandat} onChange={setMandat} tauxDefaut={contexte.tauxDefaut} avocats={avocats} />
          </Section>
        )}

        {phase === "facture" && client && mandat && (
          <>
            <Section premiere>
              <h2 className={titre}>{client.nom}</h2>
              <p className="mt-1 text-si-muted">
                <EtatClient client={client} conflits={conflits} />
                {" · "}
                {tauxMandat !== null ? t("mandatTaux", { intitule: mandatIntitule, taux: f.devise.format(tauxMandat) }) : mandatIntitule}
                {!ids && (
                  <>
                    {" · "}
                    <Lien onClick={() => setPhase("client")}>{t("changer")}</Lien>
                  </>
                )}
                {" · "}
                <Lien onClick={() => choisirFichiers(true)}>{t("ajouterFacture")}</Lien>
              </p>
              {confirmation && <p className="mt-3 text-si-verified">{confirmation}</p>}
              {alertesFiche}
              {alertesDepot}
            </Section>

            {courante && (
              <>
                <Section>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-si-muted">{intituleFacture(t, courante.saisie, f.jourLong)}</span>
                    <Lien onClick={() => setEnCorrection((m) => ({ ...m, [courante.id]: !m[courante.id] }))}>
                      {enCorrection[courante.id] ? t("revenirReleve") : t("corriger")}
                    </Lien>
                  </div>
                  {courante.lectureEchouee && <Alerte>{courante.raisonLecture || tf("lectureMuette")}</Alerte>}
                  {courante.erreur && <Erreur>{courante.erreur}</Erreur>}
                  {enCorrection[courante.id] ? (
                    <Correction
                      entree={courante}
                      champsTaxe={champsTaxe}
                      tauxMandat={tauxMandat}
                      onSaisie={(s) => setEntrees((prev) => prev.map((x) => (x.id === courante.id ? { ...x, saisie: s, erreur: undefined } : x)))}
                    />
                  ) : (
                    <Releve saisie={courante.saisie} champsTaxe={champsTaxe} />
                  )}
                </Section>
                <Section>
                  <Paiement
                    saisie={courante.saisie}
                    onSaisie={(s) => setEntrees((prev) => prev.map((x) => (x.id === courante.id ? { ...x, saisie: s, erreur: undefined } : x)))}
                  />
                </Section>
              </>
            )}
          </>
        )}

        {phase === "fin" &&
          (recap ? (
            <>
              <EcranFin recap={recap} onRecap={() => ids && void chargerRecap(ids.dossierId)} />
              {autreMandat.length > 0 && (
                <Section>
                  <p>
                    {t("resteAutreMandat", { n: autreMandat.length, objet: autreMandat[0].ecarteeMandat ?? "" })}
                    <Lien className="ml-2" onClick={() => void continuerAutreMandat()}>{t("lesReprendre")}</Lien>
                  </p>
                </Section>
              )}
            </>
          ) : (
            <p className="text-si-muted">{erreurRecap ? t("erreurFin") : t("chargementFin")}</p>
          ))}
      </div>

      {/* ── La barre de décision ─────────────────────────────────────────── */}
      {phase === "client" && client && (
        <BarreDecision
          etat={
            erreur ? (
              <span className="text-si-danger-ink">{erreur}</span>
            ) : entrees.length > 0 ? (
              t("aVerifier", { n: aVerifier.length })
            ) : null
          }
        >
          {entrees.length > 0 ? (
            <Button variant="primary" className="!text-[14px]" disabled={!clientNom || !mandatIntitule} onClick={() => setPhase("facture")}>
              {t("continuer")}
            </Button>
          ) : (
            <Button variant="primary" className="!text-[14px]" disabled={!clientNom || !mandatIntitule} loading={enCours} onClick={() => void enregistrerClientSansFacture()}>
              {t("enregistrerClient")}
            </Button>
          )}
        </BarreDecision>
      )}

      {phase === "facture" && courante && controleCourante && (
        <BarreDecision
          etat={
            controleCourante.bloquants.length > 0 ? (
              <span className="text-si-amber-ink">
                {tf(`bloquants.${controleCourante.bloquants[0].code}`, controleCourante.bloquants[0].valeurs ?? {})}
              </span>
            ) : (
              <>
                {t("etatFacture", { i: rang, n: retenues.length })}
                {(() => {
                  const c = calculer(courante.saisie, champsTaxe);
                  const du = resteDu(courante.saisie, c.total);
                  return du !== null && du > 0 ? ` · ${t("resteDu", { montant: f.devise.format(du) })}` : "";
                })()}
              </>
            )
          }
        >
          {aVerifier.length > 1 && <Lien onClick={passer}>{t("passer")}</Lien>}
          <Button
            variant="primary"
            className="!text-[14px]"
            disabled={!enregistrable(controleCourante)}
            loading={enCours}
            loadingLabel={t("enregistrement")}
            onClick={() => void enregistrer()}
          >
            {t("enregistrer")}
          </Button>
        </BarreDecision>
      )}

      {phase === "fin" && recap && (
        <BarreDecision etat={null}>
          <Button variant="primary" className="!text-[14px]" onClick={clientSuivant}>
            {t("clientSuivant")}
          </Button>
        </BarreDecision>
      )}
    </div>
  );
}
