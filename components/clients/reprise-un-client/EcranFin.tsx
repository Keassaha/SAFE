"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { routes } from "@/lib/routes";
import { lireNombre } from "@/lib/services/reprise-un-client/saisie";
import { resteACompleter } from "@/lib/services/reprise-un-client/depot";
import type { RecapitulatifMandat } from "@/lib/services/reprise-un-client/recapitulatif";
import { formats } from "./EcranFacture";
import { Champ, Erreur, Lien, Section, champ, titre } from "./ui";

/**
 * La fin d'un client. Second correctif de la version 4 : ce que le parcours
 * allégé a laissé de côté (l'identité, le fidéicommis) revient ICI, nommé, avec
 * de quoi le compléter tout de suite. Rien ne tombe dans l'oubli.
 *
 * Les factures qu'on vient d'enregistrer y sont listées, chacune avec
 * « Corriger » : c'est le moment où une erreur de lecture se remarque.
 */
export function EcranFin({
  recap,
  onRecap,
  onCorriger,
}: {
  recap: RecapitulatifMandat;
  onRecap: () => void;
  /** Ouvre la correction d'une facture qu'on vient d'enregistrer. */
  onCorriger: (invoiceId: string) => void;
}) {
  const t = useTranslations("repriseUnClient.depot");
  const tc = useTranslations("repriseUnClient.correction");
  const locale = useLocale();
  const f = formats(locale);
  const [aucunSolde, setAucunSolde] = useState(false);
  const [formulaire, setFormulaire] = useState(false);
  const [solde, setSolde] = useState({ montant: "", arreteAu: "", recuATitreDe: "" });
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const reste = resteACompleter({
    identiteVerifiee: recap.client.identiteVerifiee,
    soldeFideicommisDeclare: recap.fideicommis !== null || aucunSolde,
  });

  const enregistrerSolde = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      const res = await fetch("/api/clients/reprise-un-client/fideicommis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId: recap.mandat.id,
          montant: lireNombre(solde.montant),
          arreteAu: solde.arreteAu,
          recuATitreDe: solde.recuATitreDe,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("erreurFin"));
      setFormulaire(false);
      onRecap();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("erreurFin"));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <Section premiere>
        <h2 className={titre}>{recap.client.nom}</h2>
        <p className="mt-1 text-si-muted">
          {recap.mandat.intitule} ·{" "}
          {t("finResume", {
            n: recap.factures.length,
            facture: f.devise.format(recap.totaux.facture),
            encaisse: f.devise.format(recap.totaux.encaisse),
            du: f.devise.format(recap.totaux.resteDu),
          })}
        </p>
        {recap.fideicommis !== null && (
          <p className="mt-1 text-si-muted">{t("soldeDeclare", { montant: f.devise.format(recap.fideicommis) })}</p>
        )}
      </Section>

      {recap.factures.length > 0 && (
        <Section>
          <div className="text-si-muted">{tc("lesFactures")}</div>
          <ul className="mt-2">
            {recap.factures.map((fa) => (
              <li key={fa.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-5 border-b border-si-line2 py-2.5 last:border-b-0">
                <span className="min-w-0 truncate">
                  {fa.numero} · {f.jourLong(fa.dateEmission)}
                </span>
                <span className="text-right">{f.devise.format(fa.total)}</span>
                <Lien onClick={() => onCorriger(fa.id)}>{tc("corrigerUne")}</Lien>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section>
        <div className="text-si-muted">{t("resteFiche")}</div>
        {reste.length === 0 && <p className="mt-2">{t("rienAFaire")}</p>}

        {reste.includes("IDENTITE") && (
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3 border-b border-si-line2 py-2.5">
            <span>{t("identite")}</span>
            <Link href={routes.clientVerificationIdentite(recap.client.id)} className="text-si-muted underline decoration-si-ink/30 underline-offset-[3px] hover:text-si-ink">
              {t("verifierIdentite")}
            </Link>
          </div>
        )}

        {reste.includes("FIDEICOMMIS") && (
          <div className="py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span>{t("fideicommisQuestion")}</span>
              {!formulaire && (
                <span className="flex gap-5">
                  <Lien onClick={() => setFormulaire(true)}>{t("declarerSolde")}</Lien>
                  <Lien onClick={() => setAucunSolde(true)}>{t("aucunSolde")}</Lien>
                </span>
              )}
            </div>
            {formulaire && (
              <div className="mt-3">
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1.6fr]">
                  <Champ libelle={t("soldeMontant")}>
                    <input inputMode="decimal" className={`${champ} text-right`} value={solde.montant} onChange={(e) => setSolde({ ...solde, montant: e.target.value })} />
                  </Champ>
                  <Champ libelle={t("soldeAu")}>
                    <input type="date" className={champ} value={solde.arreteAu} onChange={(e) => setSolde({ ...solde, arreteAu: e.target.value })} />
                  </Champ>
                  <Champ libelle={t("soldeTitre")}>
                    <input className={champ} value={solde.recuATitreDe} onChange={(e) => setSolde({ ...solde, recuATitreDe: e.target.value })} />
                  </Champ>
                </div>
                {erreur && <Erreur>{erreur}</Erreur>}
                <div className="mt-3 flex gap-5">
                  <Lien disabled={enCours || !lireNombre(solde.montant) || !solde.arreteAu} onClick={() => void enregistrerSolde()}>
                    {t("enregistrerSolde")}
                  </Lien>
                  <Lien onClick={() => setFormulaire(false)}>{t("annuler")}</Lien>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-3">
          <Link href={routes.client(recap.client.id)} className="text-si-muted underline decoration-si-ink/30 underline-offset-[3px] hover:text-si-ink">
            {t("ouvrirFiche")}
          </Link>
        </p>
      </Section>
    </>
  );
}
