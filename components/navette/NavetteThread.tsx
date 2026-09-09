"use client";

/**
 * SAFE — Notes internes d'un dossier.
 *
 * ── Ce que ça remplace ───────────────────────────────────────────────────────
 * Un fil unique où trois choses de natures différentes portaient la même
 * présentation : une discussion, un journal d'évènements et un circuit
 * d'approbation. Les décisions y étaient GLOBALES au dossier : « Approuver »
 * n'approuvait rien de nommé, et « Renvoyer » fermait au passage toutes les
 * demandes ouvertes, y compris celles qui n'avaient rien à voir.
 *
 * ── Le principe ──────────────────────────────────────────────────────────────
 * Une décision vise une demande, et une seule. Les boutons ne viennent donc
 * plus du rôle de la personne, ils viennent de la demande qu'elle regarde. Un
 * avocat qui n'a rien à trancher ne voit aucun bouton de décision, ce qui est
 * l'information juste : il n'y a rien à trancher.
 *
 * ── Trois formes visuelles, jamais confondues ────────────────────────────────
 *   1. la demande ouverte, encadrée, avec UNE action pleine ;
 *   2. le message humain, à plat, sans fond de couleur ;
 *   3. l'évènement terminé, une ligne compacte, atténuée.
 *
 * ── Pas de carte ─────────────────────────────────────────────────────────────
 * La fiche à onglets fournit déjà la surface et le titre. Une carte de plus
 * ferait une carte dans une carte, ce que le référentiel interdit.
 */

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check, CornerUpLeft, Loader2, MoreHorizontal, Plus, Send, X } from "lucide-react";
import type { NavetteMessageType } from "@prisma/client";
import { tMicro } from "@/lib/motion";
import { useSafeMotion } from "@/lib/motion";
import { canSendNavetteType } from "@/lib/navette/navette-permissions";
import {
  repartirNotes,
  actionsPour,
  typeDeNote,
  revueDejaEnAttente,
  variantesEntree as variantesDeMouvement,
  type SerializedNavetteRow,
} from "@/lib/navette/notes-internes-vue";
import {
  sendNavetteMessageAction,
  sendBackAction,
  approveMatterAction,
  markReadyForReviewAction,
  resolveNavetteAction,
  type NavetteEcho,
} from "@/app/(app)/navette/actions";

export type { SerializedNavetteRow };

interface Props {
  dossierId: string;
  rows: SerializedNavetteRow[];
  currentUserId: string;
  currentUserRole: string;
  locale?: "fr" | "en";
}

/** Modes du compositeur. Un seul champ, plusieurs intentions nommées. */
type ComposerMode =
  | { kind: "note" }
  | { kind: "question" }
  | { kind: "review" }
  | { kind: "reply"; parentId: string; parentAuthor: string };

const TYPES_MESSAGE: NavetteMessageType[] = ["question", "info", "reply"];

/* ───────────────────────── Temps ─────────────────────────
 * Horodatage relatif tant qu'il aide (A13), heure exacte ensuite, et la date
 * complète toujours disponible en infobulle. Un dossier opposable ne peut pas
 * se contenter de « il y a 3 j ». */
function useHorloge(locale: "fr" | "en") {
  const bcp = locale === "en" ? "en-CA" : "fr-CA";
  return useMemo(() => {
    const heure = new Intl.DateTimeFormat(bcp, { hour: "2-digit", minute: "2-digit" });
    const jour = new Intl.DateTimeFormat(bcp, { day: "numeric", month: "long" });
    const jourEtHeure = new Intl.DateTimeFormat(bcp, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const complet = new Intl.DateTimeFormat(bcp, { dateStyle: "long", timeStyle: "short" });
    return { heure, jour, jourEtHeure, complet };
  }, [bcp]);
}

function memeJour(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/* ── Indicateur de chargement retardé (seuil de Doherty, 400 ms) ──
 * En dessous, l'opération est perçue comme immédiate : afficher un tourniquet
 * ne rassure pas, il clignote. */
function useAttenteVisible(actif: boolean) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!actif) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, [actif]);
  return visible;
}

export function NavetteThread({ dossierId, rows, currentUserId, currentUserRole, locale = "fr" }: Props) {
  const t = useTranslations("navetteUi");
  const { reduceMotion } = useSafeMotion();
  const horloge = useHorloge(locale);

  const [pending, startTransition] = useTransition();
  const attente = useAttenteVisible(pending);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [mode, setMode] = useState<ComposerMode>({ kind: "note" });
  const [texte, setTexte] = useState("");
  const [ajouts, setAjouts] = useState<SerializedNavetteRow[]>([]);
  const [tranches, setTranches] = useState<string[]>([]);
  const [correctionPour, setCorrectionPour] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [historiqueEtendu, setHistoriqueEtendu] = useState(false);
  const champ = useRef<HTMLTextAreaElement>(null);

  const cleBrouillon = `safe:notes-internes:${dossierId}`;

  /* Brouillon : une note perdue est une note qu'on ne réécrit pas. Elle
     survit à un changement d'onglet, à une navigation et à un rechargement. */
  useEffect(() => {
    try {
      const garde = window.localStorage.getItem(cleBrouillon);
      if (garde) setTexte(garde);
    } catch {
      /* stockage indisponible : le champ reste vide, rien de cassé. */
    }
  }, [cleBrouillon]);

  useEffect(() => {
    try {
      if (texte.trim()) window.localStorage.setItem(cleBrouillon, texte);
      else window.localStorage.removeItem(cleBrouillon);
    } catch {
      /* idem */
    }
  }, [texte, cleBrouillon]);

  /* Les ajouts locaux disparaissent dès que le serveur les renvoie : sans ça,
     la note s'afficherait deux fois après la revalidation. */
  useEffect(() => {
    setAjouts((prec) => prec.filter((a) => !rows.some((r) => r.id === a.id)));
  }, [rows]);

  const toutes = useMemo(() => {
    const vues = new Set(rows.map((r) => r.id));
    return [...rows, ...ajouts.filter((a) => !vues.has(a.id))];
  }, [rows, ajouts]);

  /* ── Répartition en trois zones ────────────────────────────────────────────
     Chaque entrée tombe dans UNE zone et une seule, dans cet ordre :
       1. elle attend une action de MA part → « À traiter » ;
       2. c'est du texte écrit par quelqu'un → « Échanges » ;
       3. sinon → historique.
     Les garde-fous employés ici sont exactement ceux du serveur : l'écran ne
     propose jamais un bouton que l'action refuserait. */
  const { aTraiter, echanges, historique } = useMemo(
    () => repartirNotes({ rows: toutes, userId: currentUserId, role: currentUserRole, dejaTranchees: tranches }),
    [toutes, tranches, currentUserId, currentUserRole],
  );

  const revueEnAttente = revueDejaEnAttente(toutes, tranches);
  const peutSoumettre = canSendNavetteType(currentUserRole, "ready_for_review") && !revueEnAttente;
  const peutEcrire = canSendNavetteType(currentUserRole, "info");

  function lancer(action: () => Promise<{ ok: boolean; error?: string }>, apres?: () => void) {
    setErreur(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setErreur(res.error ?? t("genericError"));
      else apres?.();
    });
  }

  function envoyer() {
    const corps = texte.trim();
    if (!corps) return;
    if (mode.kind === "review") {
      lancer(
        () => markReadyForReviewAction({ dossierId, note: corps }),
        () => {
          setTexte("");
          setMode({ kind: "note" });
          annoncer(t("reviewSubmitted"));
        },
      );
      return;
    }
    const type = typeDeNote(mode.kind);
    setErreur(null);
    startTransition(async () => {
      const res = await sendNavetteMessageAction({
        dossierId,
        type: type as "question" | "info" | "reply",
        body: corps,
        parentId: mode.kind === "reply" ? mode.parentId : null,
      });
      if (!res.ok) {
        setErreur(res.error);
        return;
      }
      absorber(res.message);
      setTexte("");
      setMode({ kind: "note" });
      annoncer(t("noteAdded"));
    });
  }

  /** La note écrite apparaît sur place, sans que l'écran se recompose. */
  function absorber(echo: NavetteEcho) {
    setAjouts((prec) => [
      ...prec,
      { ...echo, authorId: currentUserId, recipientName: echo.recipientName ?? null },
    ]);
  }

  function annoncer(phrase: string) {
    setConfirmation(phrase);
    setTimeout(() => setConfirmation(null), 4000);
  }

  function repondreA(r: SerializedNavetteRow) {
    setMode({ kind: "reply", parentId: r.id, parentAuthor: r.authorName ?? t("someone") });
    setMenuOuvert(false);
    requestAnimationFrame(() => champ.current?.focus());
  }

  function basculerMode(k: "note" | "question" | "review") {
    setMode({ kind: k });
    setMenuOuvert(false);
    requestAnimationFrame(() => champ.current?.focus());
  }

  /* ── Rendu du temps ───────────────────────────────────────────────────── */
  const maintenant = Date.now();
  function quand(iso: string) {
    const d = new Date(iso);
    const minutes = Math.round((maintenant - d.getTime()) / 60000);
    if (minutes < 1) return t("justNow");
    if (minutes < 60) return t("minutesAgo", { n: minutes });
    return horloge.heure.format(d);
  }
  function titreDate(iso: string) {
    return horloge.complet.format(new Date(iso));
  }
  /* Une ligne d'historique porte l'heure seule tant qu'elle est du jour, et
     la date dès qu'elle ne l'est plus. Sans ça, « 21 h 56 » a l'air d'avoir
     eu lieu ce soir alors que c'était la semaine dernière. */
  function marque(iso: string) {
    const d = new Date(iso);
    return memeJour(d, new Date()) ? horloge.heure.format(d) : horloge.jourEtHeure.format(d);
  }

  function etiquetteJour(iso: string) {
    const d = new Date(iso);
    const auj = new Date();
    if (memeJour(d, auj)) return t("today");
    const hier = new Date(auj);
    hier.setDate(auj.getDate() - 1);
    if (memeJour(d, hier)) return t("yesterday");
    return horloge.jour.format(d);
  }

  /* L'objet d'une demande, tel que les DONNÉES permettent de le nommer.
     Le modèle ne rattache aujourd'hui une demande de révision à aucun
     document ni à aucune facture : on écrit donc « Révision du dossier
     demandée », et surtout pas un titre de lettre inventé. */
  const OBJET_TYPE: Partial<Record<NavetteMessageType, string>> = {
    ready_for_review: "objectReadyForReview",
    sent_back: "objectSentBack",
    question: "objectQuestion",
    document_ready: "objectDocumentReady",
    invoice_ready: "objectInvoiceReady",
    acte_urgent: "objectActeUrgent",
  };

  const CLE_TYPE: Record<NavetteMessageType, string> = {
    sent_back: "eventSentBack",
    question: "eventQuestion",
    approved: "eventApproved",
    ready_for_review: "eventReadyForReview",
    info: "eventInfo",
    reply: "eventReply",
    document_ready: "eventDocumentReady",
    invoice_ready: "eventInvoiceReady",
    acte_urgent: "eventActeUrgent",
  };

  const variantesEntree = variantesDeMouvement(reduceMotion);

  const vide = toutes.length === 0;

  return (
    <section aria-label={t("sectionLabel")} className="max-w-3xl">
      {/* Bandeau : ce que ce fil est, et le menu des intentions moins courantes. */}
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-[65ch] text-sm text-si-muted">{t("scopeNote")}</p>
        {peutEcrire ? (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOuvert((o) => !o)}
              aria-expanded={menuOuvert}
              aria-haspopup="menu"
              className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-md border border-si-line bg-si-surface text-si-muted transition-colors hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
              <span className="sr-only">{t("addMenu")}</span>
            </button>
            {menuOuvert ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-64 rounded-md border border-si-line bg-si-surface py-1 shadow-md shadow-si-line"
              >
                <button role="menuitem" type="button" onClick={() => basculerMode("note")} className="flex w-full min-h-tap items-center px-3 text-left text-sm text-si-ink hover:bg-si-canvas focus-visible:outline-none focus-visible:bg-si-canvas">
                  {t("addNoteLabel")}
                </button>
                <button role="menuitem" type="button" onClick={() => basculerMode("question")} className="flex w-full min-h-tap items-center px-3 text-left text-sm text-si-ink hover:bg-si-canvas focus-visible:outline-none focus-visible:bg-si-canvas">
                  {t("askQuestion")}
                </button>
                {peutSoumettre ? (
                  <button role="menuitem" type="button" onClick={() => basculerMode("review")} className="flex w-full min-h-tap items-center px-3 text-left text-sm text-si-ink hover:bg-si-canvas focus-visible:outline-none focus-visible:bg-si-canvas">
                    {t("submitReview")}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── 1. À traiter ─────────────────────────────────────────────────── */}
      {aTraiter.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xs font-medium uppercase tracking-wide text-si-muted">{t("toDo")}</h3>
          <div className="mt-2 space-y-3">
            {aTraiter.map((entree) => {
              const { row, peutDecider } = entree;
              const actions = actionsPour(entree);
              return (
              <article
                key={row.id}
                className="rounded-md border border-si-border-strong/60 bg-si-surface p-4"
              >
                <h4 className="text-sm font-medium text-si-ink">{t(OBJET_TYPE[row.type] ?? "objectGeneric")}</h4>
                {/* Même forme que la ligne d'auteur d'un message : le nom nu,
                    puis l'heure. Une préposition devant un nom propre force à
                    gérer l'élision (« de Aaliyah » contre « d'Aaliyah »), et une
                    élision fausse se remarque dans un cabinet. */}
                <p className="mt-0.5 text-sm">
                  <span className="font-medium text-si-ink">{row.authorName ?? t("someone")}</span>
                  <span className="text-si-muted">
                    {" · "}
                    <time dateTime={row.createdAt} title={titreDate(row.createdAt)}>
                      {quand(row.createdAt)}
                    </time>
                  </span>
                </p>
                {row.recipientName ? (
                  <p className="text-sm text-si-muted">{t("forWhom", { name: row.recipientName })}</p>
                ) : null}
                {row.dueDate ? (
                  <p className="mt-1 text-sm font-medium text-si-amber-ink">
                    {t("due")} {horloge.complet.format(new Date(row.dueDate))}
                  </p>
                ) : null}
                {row.body ? <p className="mt-2 max-w-[65ch] whitespace-pre-wrap text-sm text-si-ink">{row.body}</p> : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {peutDecider ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          lancer(
                            () => approveMatterAction({ requestId: row.id }),
                            () => {
                              setTranches((p) => [...p, row.id]);
                              annoncer(t("approved"));
                            },
                          )
                        }
                        className="inline-flex min-h-tap items-center gap-2 rounded-md safe-action-degrade px-4 text-sm font-medium text-si-surface transition-colors disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
                      >
                        {attente ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                        {t("approve")}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setCorrectionPour(correctionPour === row.id ? null : row.id);
                          setMotif("");
                        }}
                        aria-expanded={correctionPour === row.id}
                        className="inline-flex min-h-tap items-center gap-2 rounded-md border border-si-line bg-si-surface px-4 text-sm font-medium text-si-ink transition-colors hover:bg-si-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
                      >
                        <CornerUpLeft className="h-4 w-4" aria-hidden />
                        {t("requestCorrection")}
                      </button>
                    </>
                  ) : null}
                  {actions.includes("mark_addressed") ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        lancer(
                          () => resolveNavetteAction(row.id),
                          () => {
                            setTranches((p) => [...p, row.id]);
                            annoncer(t("markedAddressed"));
                          },
                        )
                      }
                      className="inline-flex min-h-tap items-center gap-2 rounded-md safe-action-degrade px-4 text-sm font-medium text-si-surface transition-colors disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
                    >
                      {attente ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                      {t("markAddressed")}
                    </button>
                  ) : null}
                  {actions.includes("reply") ? (
                    <button
                      type="button"
                      onClick={() => repondreA(row)}
                      className="inline-flex min-h-tap items-center rounded-md px-3 text-sm font-medium text-si-muted transition-colors hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
                    >
                      {t("replyLabel")}
                    </button>
                  ) : null}
                </div>

                {/* Le champ de correction s'ouvre SOUS la demande, qui reste
                    visible : on écrit le motif en regardant ce qu'on renvoie. */}
                <AnimatePresence initial={false}>
                  {correctionPour === row.id ? (
                    <motion.div {...variantesEntree} transition={tMicro} className="overflow-hidden">
                      <div className="mt-3 border-t border-si-line pt-3">
                        <label htmlFor={`motif-${row.id}`} className="block text-sm font-medium text-si-ink">
                          {t("correctionLabel")}
                        </label>
                        <textarea
                          id={`motif-${row.id}`}
                          value={motif}
                          onChange={(e) => setMotif(e.target.value)}
                          rows={3}
                          placeholder={t("correctionPlaceholder")}
                          className="min-h-tap mt-1 w-full rounded-md border border-si-line bg-si-canvas px-3 py-2 text-sm text-si-ink outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={pending || !motif.trim()}
                            onClick={() =>
                              lancer(
                                () => sendBackAction({ requestId: row.id, reason: motif.trim() }),
                                () => {
                                  setCorrectionPour(null);
                                  setMotif("");
                                  setTranches((p) => [...p, row.id]);
                                  annoncer(t("correctionSent"));
                                },
                              )
                            }
                            className="inline-flex min-h-tap items-center gap-2 rounded-md safe-action-degrade px-4 text-sm font-medium text-si-surface disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
                          >
                            {attente ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
                            {t("sendCorrection")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCorrectionPour(null)}
                            className="inline-flex min-h-tap items-center rounded-md px-3 text-sm font-medium text-si-muted hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── 2. Échanges ──────────────────────────────────────────────────── */}
      {echanges.length > 0 ? (
        <div className="mt-7">
          <h3 className="text-xs font-medium uppercase tracking-wide text-si-muted">{t("exchanges")}</h3>
          <ul className="mt-2">
            <AnimatePresence initial={false}>
              {echanges.map((r, i) => {
                const jourPrecedent = i > 0 ? etiquetteJour(echanges[i - 1].createdAt) : null;
                const jour = etiquetteJour(r.createdAt);
                const parent = r.parentId
                  ? (toutes.find((x) => x.id === r.parentId)?.authorName ?? null)
                  : null;
                return (
                  <motion.li key={r.id} {...variantesEntree} transition={tMicro} className="overflow-hidden">
                    {jour !== jourPrecedent ? (
                      <p className="mt-4 text-xs font-medium text-si-muted first:mt-0">{jour}</p>
                    ) : null}
                    <div className="border-t border-si-line2 py-3">
                      <p className="text-sm">
                        <span className="font-medium text-si-ink">{r.authorName ?? t("someone")}</span>
                        <span className="text-si-muted">
                          {" · "}
                          <time dateTime={r.createdAt} title={titreDate(r.createdAt)}>{quand(r.createdAt)}</time>
                          {r.type === "question" ? ` · ${t("typeQuestion")}` : null}
                          {r.confidentiel ? ` · ${t("confidential")}` : null}
                        </span>
                      </p>
                      {parent ? (
                        <p className="mt-0.5 text-sm text-si-muted">{t("replyingTo", { name: parent })}</p>
                      ) : null}
                      {r.body ? <p className="mt-1 max-w-[65ch] whitespace-pre-wrap text-sm text-si-ink">{r.body}</p> : null}
                      <button
                        type="button"
                        onClick={() => repondreA(r)}
                        className="mt-1 inline-flex min-h-tap items-center rounded-md pr-3 text-sm font-medium text-si-muted transition-colors hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
                      >
                        {t("replyLabel")}
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      ) : null}

      {/* ── 3. Historique ────────────────────────────────────────────────── */}
      {historique.length > 0 ? (
        <div className="mt-7">
          <h3 className="text-xs font-medium uppercase tracking-wide text-si-muted">{t("history")}</h3>
          <ul className="mt-2 space-y-1.5">
            {(historiqueEtendu ? historique : historique.slice(0, 6)).map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <time
                  dateTime={r.createdAt}
                  title={titreDate(r.createdAt)}
                  className="shrink-0 tabular-nums text-si-muted"
                >
                  {marque(r.createdAt)}
                </time>
                <span className="text-si-body">
                  {t(CLE_TYPE[r.type], { author: r.authorName ?? t("someone") })}
                </span>
                {!r.resolvedAt && !tranches.includes(r.id) ? (
                  <span className="text-si-muted">· {t("statusPending")}</span>
                ) : null}
                {r.body ? <span className="min-w-0 flex-1 truncate text-si-muted">· {r.body}</span> : null}
              </li>
            ))}
          </ul>
          {historique.length > 6 ? (
            <button
              type="button"
              onClick={() => setHistoriqueEtendu((v) => !v)}
              className="mt-2 inline-flex min-h-tap items-center rounded-md pr-3 text-sm font-medium text-si-muted transition-colors hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
            >
              {historiqueEtendu ? t("showLessHistory") : t("showAllHistory", { count: historique.length })}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* ── État vide ────────────────────────────────────────────────────── */}
      {vide ? <p className="mt-6 max-w-[65ch] text-sm text-si-body">{t("empty")}</p> : null}

      {/* ── 4. Compositeur ───────────────────────────────────────────────── */}
      {peutEcrire ? (
        <div className="mt-7 border-t border-si-line pt-5">
          <label htmlFor="note-interne" className="block text-sm font-medium text-si-ink">
            {mode.kind === "question"
              ? t("addQuestionLabel")
              : mode.kind === "review"
                ? t("submitReviewLabel")
                : mode.kind === "reply"
                  ? t("replyingTo", { name: mode.parentAuthor })
                  : t("addNoteLabel")}
          </label>
          {mode.kind !== "note" ? (
            <button
              type="button"
              onClick={() => setMode({ kind: "note" })}
              className="min-h-tap mt-1 inline-flex items-center gap-1 text-sm text-si-muted hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              {t("backToNote")}
            </button>
          ) : null}
          <textarea
            id="note-interne"
            ref={champ}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                envoyer();
              }
            }}
            rows={3}
            placeholder={
              mode.kind === "question"
                ? t("addQuestionPlaceholder")
                : mode.kind === "review"
                  ? t("submitReviewPlaceholder")
                  : t("addNotePlaceholder")
            }
            aria-describedby="note-interne-aide"
            className="min-h-tap mt-2 w-full rounded-md border border-si-line bg-si-canvas px-3 py-2 text-sm text-si-ink outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p id="note-interne-aide" className="text-sm text-si-muted">
              {mode.kind === "review" ? t("optionalNote") : t("sendShortcut")}
            </p>
            <button
              type="button"
              disabled={pending || !texte.trim()}
              onClick={envoyer}
              className="inline-flex min-h-tap items-center gap-2 rounded-md safe-action-degrade px-4 text-sm font-medium text-si-surface transition-colors disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified focus-visible:ring-offset-2 focus-visible:ring-offset-si-surface"
            >
              {attente ? (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : mode.kind === "review" ? (
                <Send className="h-4 w-4" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
              {mode.kind === "review" ? t("submitReview") : t("send")}
            </button>
          </div>
          <p role="status" aria-live="polite" className="mt-1 min-h-5 text-sm text-si-verified">
            {confirmation}
          </p>
          {erreur ? (
            <p role="alert" className="text-sm font-medium text-si-danger-ink">
              {erreur}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
