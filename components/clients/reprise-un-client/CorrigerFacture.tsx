"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { JournalCorrectionMotive } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { MOTIF_KEY, MOTIF_ORDER, TEXTE_MIN } from "@/components/comptabilite/MotifAnnulationModal";
import { lireNombre, MODES_PAIEMENT, type ModePaiementSaisie } from "@/lib/services/reprise-un-client/saisie";
import type { FactureRepriseDetail } from "@/lib/services/reprise-historique/facture-reprise-detail";
import { formats } from "./EcranFacture";
import { ApercuPiece } from "./ApercuPiece";
import { BarreDecision, Champ, Choix, Erreur, Section, champ, champRepris, racine, titre } from "./ui";

/**
 * Corriger UNE facture reprise (maquette « d » validée le 2026-10-01).
 *
 * L'écran vit là où vit la facture : sur sa page en Facturation, et à la fin
 * d'un client qu'on vient de reprendre. Il n'y a plus de liste à part.
 *
 * Ce qu'on change se voit en ambre, puis se relit en « avant → après » juste
 * au-dessus du motif : la personne sait ce qu'elle signe. Rien n'est réécrit,
 * l'écriture d'origine est contrepassée puis réinscrite corrigée.
 */

type Statut = FactureRepriseDetail["statutPaiement"];
type Nature = "honoraire" | "debours";

interface Brouillon {
  total: string;
  dateEmission: string;
  statut: Statut;
  datePaiement: string;
  montantRecu: string;
  mode: ModePaiementSaisie | "";
  natures: Record<string, Nature>;
  motif: JournalCorrectionMotive;
  precision: string;
}

/** Un montant éditable, sans séparateur de milliers pour qu'il se relise tel quel. */
function enTexte(montant: number, locale: string): string {
  const s = montant.toFixed(2);
  return locale === "en" ? s : s.replace(".", ",");
}

function depuis(f: FactureRepriseDetail, locale: string): Brouillon {
  return {
    total: enTexte(f.montantTotal, locale),
    dateEmission: f.dateEmission,
    statut: f.statutPaiement,
    datePaiement: f.datePaiement ?? "",
    montantRecu: f.statutPaiement === "partielle" ? enTexte(f.montantPaye, locale) : "",
    mode: f.modePaiement ?? "",
    natures: Object.fromEntries(f.lignes.map((l) => [l.id, l.nature])),
    motif: "ERREUR_SAISIE",
    precision: "",
  };
}

const ecart = (a: number | null, b: number) => a === null || Math.abs(a - b) >= 0.005;

export function CorrigerFacture({
  invoiceId,
  retour,
  onCorrigee,
}: {
  invoiceId: string;
  /** Le lien ou le bouton qui ramène d'où l'on vient. */
  retour?: ReactNode;
  onCorrigee?: () => void;
}) {
  const t = useTranslations("repriseUnClient.correction");
  const tf = useTranslations("repriseUnClient.factures");
  const tm = useTranslations("accountingUi");
  const locale = useLocale();
  const f = formats(locale);

  const [facture, setFacture] = useState<FactureRepriseDetail | null>(null);
  const [b, setB] = useState<Brouillon | null>(null);
  const [piece, setPiece] = useState<File | null>(null);
  const [etat, setEtat] = useState<"chargement" | "pret" | "introuvable">("chargement");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [corrigee, setCorrigee] = useState(false);

  const charger = useCallback(async () => {
    const res = await fetch(`/api/clients/entree/reprise/corriger?invoiceId=${encodeURIComponent(invoiceId)}`);
    if (!res.ok) {
      setEtat("introuvable");
      return null;
    }
    const data = (await res.json()) as { facture: FactureRepriseDetail };
    setFacture(data.facture);
    setB(depuis(data.facture, locale));
    setEtat("pret");
    return data.facture;
  }, [invoiceId, locale]);

  useEffect(() => {
    let annule = false;
    void (async () => {
      const fa = await charger();
      if (!fa?.piece || annule) return;
      // La pièce reste derrière le contrôle d'accès des documents.
      const res = await fetch(`/api/documents/${fa.piece.id}/download`);
      if (!res.ok || annule) return;
      const blob = await res.blob();
      if (!annule) setPiece(new File([blob], fa.piece.nom, { type: fa.piece.mimeType || blob.type }));
    })();
    return () => {
      annule = true;
    };
    // La pièce ne change pas d'une correction à l'autre : un seul chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const maj = (patch: Partial<Brouillon>) => {
    setCorrigee(false);
    setErreur(null);
    setB((x) => (x ? { ...x, ...patch } : x));
  };

  const statutMot = (s: Statut) => t(s === "payee" ? "statutPayee" : s === "partielle" ? "statutPartielle" : "statutImpayee");
  const natureMot = (n: Nature) => t(n === "debours" ? "natureDebours" : "natureHonoraire");

  // Ce qui sera corrigé, dans les mots de l'écran.
  const changements = useMemo(() => {
    if (!facture || !b) return [];
    const liste: { quoi: string; avant: string; apres: string }[] = [];
    const total = lireNombre(b.total);
    if (ecart(total, facture.montantTotal)) {
      liste.push({ quoi: t("total"), avant: f.devise.format(facture.montantTotal), apres: total === null ? "?" : f.devise.format(total) });
    }
    if (b.dateEmission !== facture.dateEmission) {
      liste.push({ quoi: t("dateEmission"), avant: f.jourLong(facture.dateEmission), apres: b.dateEmission ? f.jourLong(b.dateEmission) : "?" });
    }
    const avecDate = (s: Statut) =>
      s !== "impayee" && b.datePaiement ? t("statutLe", { statut: statutMot(s), date: f.jourLong(b.datePaiement) }) : statutMot(s);
    if (b.statut !== facture.statutPaiement) {
      liste.push({ quoi: t("paiement"), avant: statutMot(facture.statutPaiement), apres: avecDate(b.statut) });
    } else if (b.statut !== "impayee") {
      if (b.datePaiement !== (facture.datePaiement ?? "")) {
        liste.push({
          quoi: t("recuLe"),
          avant: facture.datePaiement ? f.jourLong(facture.datePaiement) : "?",
          apres: b.datePaiement ? f.jourLong(b.datePaiement) : "?",
        });
      }
      const recu = lireNombre(b.montantRecu);
      if (b.statut === "partielle" && ecart(recu, facture.montantPaye)) {
        liste.push({ quoi: t("montantRecu"), avant: f.devise.format(facture.montantPaye), apres: recu === null ? "?" : f.devise.format(recu) });
      }
      if (facture.modePaiement && b.mode && b.mode !== facture.modePaiement) {
        liste.push({ quoi: t("mode"), avant: tf(`modes.${facture.modePaiement}`), apres: tf(`modes.${b.mode}`) });
      }
    }
    for (const l of facture.lignes) {
      const n = b.natures[l.id];
      if (n && n !== l.nature) liste.push({ quoi: l.description, avant: natureMot(l.nature), apres: natureMot(n) });
    }
    return liste;
    // statutMot et natureMot ne dépendent que de `t`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facture, b, t, tf, f]);

  if (etat === "chargement") return <p className={`${racine} p-7 text-si-muted`}>{t("chargement")}</p>;
  if (etat === "introuvable" || !facture || !b) {
    return (
      <div className={`${racine} p-7`}>
        <p className="text-si-muted">{t("introuvable")}</p>
        {retour && <div className="mt-3">{retour}</div>}
      </div>
    );
  }

  const total = lireNombre(b.total);
  const recu = lireNombre(b.montantRecu);
  const nouveauPaiement = facture.statutPaiement === "impayee" && b.statut !== "impayee";
  const precisionRequise = b.motif === "AUTRE";

  // Ce qui empêche d'envoyer, dans l'ordre où la personne le rencontre.
  const blocage: string | null =
    total === null || total <= 0
      ? t("bloqueTotal")
      : !b.dateEmission
        ? t("bloqueDate")
        : b.statut !== "impayee" && !b.datePaiement
          ? t("bloqueDatePaiement")
          : b.statut === "partielle" && (recu === null || recu <= 0 || recu >= total)
            ? t("bloqueMontantRecu")
            : nouveauPaiement && !b.mode
              ? t("bloqueMode")
              : precisionRequise && b.precision.trim().length < TEXTE_MIN
                ? t("bloquePrecision", { min: TEXTE_MIN })
                : null;

  const corriger = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      const res = await fetch("/api/clients/entree/reprise/corriger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: facture.id,
          motifCode: b.motif,
          motifTexte: b.precision.trim() || null,
          corrections: {
            montantTotal: total,
            dateEmission: b.dateEmission,
            statutPaiement: b.statut,
            ...(b.statut === "partielle" ? { montantPaye: recu } : {}),
            datePaiement: b.statut === "impayee" ? null : b.datePaiement,
            ...(b.statut !== "impayee" && b.mode ? { modePaiement: b.mode } : {}),
            lignes: facture.lignes
              .filter((l) => b.natures[l.id] && b.natures[l.id] !== l.nature)
              .map((l) => ({ invoiceLineId: l.id, nature: b.natures[l.id] })),
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("erreur"));
      await charger();
      setCorrigee(true);
      onCorrigee?.();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("erreur"));
    } finally {
      setEnCours(false);
    }
  };

  const derniere = facture.corrections[facture.corrections.length - 1];
  const historique = derniere
    ? `${t("corrigeeFois", { n: facture.corrections.length, date: f.jourLong(derniere.date) })}${
        derniere.auteur ? t("parAuteur", { auteur: derniere.auteur }) : ""
      }`
    : t("jamaisCorrigee");

  const n = changements.length;

  return (
    <div data-section="corriger-facture" className={racine}>
      <div className={piece ? "grid lg:grid-cols-[minmax(0,1fr)_380px]" : ""}>
        <div className={`min-w-0 px-7 py-6 ${piece ? "" : "max-w-[820px]"}`}>
          <Section premiere>
            <h2 className={titre}>{facture.clientNom}</h2>
            <p className="mt-1 text-si-muted">
              {t("entete", { numero: facture.numero, date: f.jourLong(facture.dateEmission), reprise: f.jourLong(facture.repriseLe) })}
              {" · "}
              {historique}
            </p>
            {corrigee && <p className="mt-3 text-si-verified">{t("corrigee")}</p>}
          </Section>

          <Section>
            <div className="text-si-muted">{t("laFacture")}</div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Champ libelle={t("total")}>
                <input
                  inputMode="decimal"
                  className={`${champ} text-right ${ecart(total, facture.montantTotal) ? champRepris : ""}`}
                  value={b.total}
                  onChange={(e) => maj({ total: e.target.value })}
                />
              </Champ>
              <Champ libelle={t("dateEmission")}>
                <input
                  type="date"
                  className={`${champ} ${b.dateEmission !== facture.dateEmission ? champRepris : ""}`}
                  value={b.dateEmission}
                  onChange={(e) => maj({ dateEmission: e.target.value })}
                />
              </Champ>
            </div>
            {facture.lignes.length > 0 && (
              <div className="mt-4 border-t border-si-line2">
                {facture.lignes.map((l) => {
                  const nature = b.natures[l.id] ?? l.nature;
                  return (
                    <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto_150px] items-center gap-4 border-b border-si-line2 py-2">
                      <span className="min-w-0 truncate">{l.description}</span>
                      <span className="text-right">{f.nombre.format(l.montant)}</span>
                      <select
                        aria-label={t("natureDe", { ligne: l.description })}
                        className={`${champ} ${nature !== l.nature ? champRepris : ""}`}
                        value={nature}
                        onChange={(e) => maj({ natures: { ...b.natures, [l.id]: e.target.value as Nature } })}
                      >
                        <option value="honoraire">{t("honoraire")}</option>
                        <option value="debours">{t("debours")}</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          <Section>
            <div className="mb-3 text-si-muted">{t("lePaiement")}</div>
            <Choix
              etiquette={t("lePaiement")}
              valeur={b.statut}
              onChange={(v) => maj({ statut: v })}
              options={[
                { cle: "payee", libelle: tf("payee") },
                { cle: "partielle", libelle: tf("partielle") },
                { cle: "impayee", libelle: tf("impayee") },
              ]}
            />
            {b.statut !== "impayee" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-[1.3fr_1fr_1fr]">
                <Champ libelle={t("recuLe")}>
                  <input
                    type="date"
                    className={`${champ} ${b.datePaiement !== (facture.datePaiement ?? "") ? champRepris : ""}`}
                    value={b.datePaiement}
                    onChange={(e) => maj({ datePaiement: e.target.value })}
                  />
                </Champ>
                {b.statut === "partielle" ? (
                  <Champ libelle={t("montantRecu")}>
                    <input
                      inputMode="decimal"
                      className={`${champ} text-right ${facture.statutPaiement !== "partielle" || ecart(recu, facture.montantPaye) ? champRepris : ""}`}
                      value={b.montantRecu}
                      onChange={(e) => maj({ montantRecu: e.target.value })}
                    />
                  </Champ>
                ) : (
                  <div className="hidden sm:block" />
                )}
                <Champ libelle={t("par")}>
                  <select
                    className={`${champ} ${b.mode !== (facture.modePaiement ?? "") ? champRepris : ""}`}
                    value={b.mode}
                    onChange={(e) => maj({ mode: e.target.value as ModePaiementSaisie | "" })}
                  >
                    <option value="">{tf("choisirMode")}</option>
                    {MODES_PAIEMENT.map((m) => (
                      <option key={m} value={m}>{tf(`modes.${m}`)}</option>
                    ))}
                  </select>
                </Champ>
              </div>
            )}
          </Section>

          {n > 0 && (
            <Section>
              <div className="text-si-muted">{t("ceQuiSera")}</div>
              <ul className="mt-2">
                {changements.map((c) => (
                  <li key={c.quoi} className="flex flex-wrap items-baseline gap-x-2.5 border-b border-si-line2 py-2 last:border-b-0">
                    <span>{c.quoi}</span>
                    <span className="text-si-muted line-through decoration-si-muted/60">{c.avant}</span>
                    <span>→ {c.apres}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {n > 0 && (
            <Section>
              <div className="text-si-muted">{t("pourquoi")}</div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Champ libelle={t("motif")}>
                  <select className={champ} value={b.motif} onChange={(e) => maj({ motif: e.target.value as JournalCorrectionMotive })}>
                    {MOTIF_ORDER.map((m) => (
                      <option key={m} value={m}>{tm(MOTIF_KEY[m])}</option>
                    ))}
                  </select>
                </Champ>
              </div>
              <textarea
                aria-label={t("precision")}
                rows={2}
                className="mt-3 block w-full rounded-md border border-si-line bg-si-surface px-3 py-2 text-[14px] text-si-ink outline-none transition-colors placeholder:text-si-subtle focus:border-si-border-strong"
                placeholder={precisionRequise ? t("precisionRequise", { min: TEXTE_MIN }) : t("precisionFacultative")}
                value={b.precision}
                onChange={(e) => maj({ precision: e.target.value })}
              />
              <p className="mt-2 text-si-muted">{t("conserve")}</p>
              {erreur && <Erreur>{erreur}</Erreur>}
            </Section>
          )}
        </div>

        {piece && (
          <aside className="border-t border-si-line2 bg-si-canvas/60 p-6 lg:border-l lg:border-t-0">
            <div className="lg:sticky lg:top-6">
              <ApercuPiece fichier={piece} />
            </div>
          </aside>
        )}
      </div>

      <BarreDecision
        etat={
          n === 0 ? (
            t("aucunChangement")
          ) : blocage ? (
            <span className="text-si-amber-ink">{blocage}</span>
          ) : (
            t("etat", { n })
          )
        }
      >
        {retour}
        <Button
          variant="primary"
          className="!text-[14px]"
          disabled={n === 0 || blocage !== null}
          loading={enCours}
          loadingLabel={t("enCours")}
          onClick={() => void corriger()}
        >
          {t("corriger")}
        </Button>
      </BarreDecision>
    </div>
  );
}
