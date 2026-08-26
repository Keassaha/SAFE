"use client";

/**
 * La page de rencontre, servie sur /demo et sur /contact.
 *
 * Elle portait trois sections : le déroulement de la rencontre en quatre
 * temps, le formulaire, puis quatre gages numérotés. Décision CEO du
 * 2026-08-25 : « on n'a pas besoin d'argumentation. » Quelqu'un qui arrive ici
 * a déjà décidé de parler ; lui vendre encore la rencontre le retarde.
 *
 * Il reste l'ouverture, quatre champs et une phrase qui rassure.
 *
 * Le formulaire ne se contentait pas d'être long : il ne partait nulle part.
 * Son `onSubmit` appelait `preventDefault()` et s'arrêtait là, alors que
 * `app/api/contact/route.ts` existe et fonctionne. Une demande écrite ici
 * n'atteignait personne. Il poste maintenant.
 */

import React from "react";
import { PageShell, GREEN, INK, LINE } from "./shared";
import { Ouverture, Recit, Tete } from "./recit";

/* La raison est une liste fermée, et chaque entrée renvoie à quelque chose qui
   existe : le programme des fondateurs (lib/tarification.ts), le moteur de
   conformité, la reprise des dossiers réels. « Autre chose » garde la porte
   ouverte à ce que la liste n'a pas prévu. */
const RAISONS = [
  "Voir SAFE sur mes propres dossiers",
  "Une question sur le fidéicommis ou la conformité",
  "Le programme des fondateurs",
  "Autre chose",
] as const;

const CHAMPS = [
  { cle: "nom", label: "Nom", type: "text", auto: "name", exemple: "Votre nom" },
  { cle: "courriel", label: "Courriel", type: "email", auto: "email", exemple: "vous@votrecabinet.ca" },
  { cle: "telephone", label: "Téléphone", type: "tel", auto: "tel", exemple: "(514) 000-0000" },
] as const;

type Etat = "repos" | "envoi" | "envoye" | "erreur";

export default function DemoPage() {
  const [etat, setEtat] = React.useState<Etat>("repos");
  const [erreur, setErreur] = React.useState("");

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (etat === "envoi") return;
    const donnees = new FormData(e.currentTarget);
    setEtat("envoi");
    setErreur("");
    try {
      const reponse = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: donnees.get("nom"),
          email: donnees.get("courriel"),
          phone: donnees.get("telephone"),
          /* La route attend un « message » : la raison en tient lieu. */
          message: donnees.get("raison"),
        }),
      });
      if (!reponse.ok) {
        const corps = await reponse.json().catch(() => ({}));
        throw new Error(corps.error ?? "Envoi impossible.");
      }
      setEtat("envoye");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
      setEtat("erreur");
    }
  }

  return (
    <PageShell>
      <Ouverture
        titre="Parler à quelqu'un"
        dire={[
          "Dites-nous qui vous êtes et ce qui vous amène.",
          "Nous revenons vers vous dans la journée ouvrable.",
        ]}
      />

      <Recit id="rencontre" socle>
        <Tete
          titre="Vos coordonnées"
          dire={[
            "Une personne vous répond, pas un système.",
            "Vos coordonnées servent à cette réponse et à rien d'autre : elles ne sont ni vendues, ni partagées, ni versées à une liste d'envoi.",
          ]}
        />

        {etat === "envoye" ? (
          <p className="recu" role="status">
            C'est reçu. Vous aurez une réponse à l'adresse que vous venez
            d'écrire, dans la journée ouvrable.
          </p>
        ) : (
          <form className="formulaire" onSubmit={envoyer}>
            {CHAMPS.map((c) => (
              <label key={c.cle}>
                <span>{c.label}</span>
                <input
                  name={c.cle}
                  type={c.type}
                  autoComplete={c.auto}
                  required
                  placeholder={c.exemple}
                  className="safe-zoom champ"
                />
              </label>
            ))}
            <label className="raison">
              <span>La raison</span>
              <select name="raison" required defaultValue="" className="safe-zoom champ">
                <option value="" disabled>
                  Choisissez
                </option>
                {RAISONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="envoi">
              <button type="submit" className="btn" disabled={etat === "envoi"}>
                {etat === "envoi" ? "Envoi…" : "Envoyer"}
              </button>
              {etat === "erreur" ? (
                <p className="echec" role="alert">
                  {erreur} Vous pouvez aussi écrire à{" "}
                  <a href="mailto:jeremie@safecabinet.ca">jeremie@safecabinet.ca</a>.
                </p>
              ) : null}
            </div>
          </form>
        )}
      </Recit>

      {/* Le formulaire est le seul objet de saisie du site public : ses règles
          vivent avec lui, pas dans le vocabulaire partagé. Trois coordonnées
          sur une rangée, la raison sur la suivante, le bouton en dessous. Il
          s'empile au pouce. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .safe-vitrine .formulaire {
          margin-top: clamp(40px, 6vh, 72px);
          max-width: 760px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: end;
          gap: 20px clamp(20px, 2.4vw, 32px);
        }
        .safe-vitrine .formulaire label { display: block; min-width: 0; }
        .safe-vitrine .formulaire .raison,
        .safe-vitrine .formulaire .envoi { grid-column: 1 / -1; }
        .safe-vitrine .formulaire label span {
          display: block;
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 500;
          color: ${INK};
        }
        .safe-vitrine .champ {
          margin-top: 7px;
          height: 44px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid ${LINE};
          background: var(--si-surface);
          padding: 0 14px;
          font-family: var(--sans);
          font-size: 14px;
          color: ${INK};
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        /* La flèche du navigateur est grise et ne suit pas la palette. Elle est
           retirée, et redessinée en encre. */
        .safe-vitrine select.champ {
          appearance: none;
          padding-right: 40px;
          background-image: linear-gradient(45deg, transparent 50%, ${INK} 50%),
                            linear-gradient(135deg, ${INK} 50%, transparent 50%);
          background-size: 5px 5px, 5px 5px;
          background-position: calc(100% - 20px) 20px, calc(100% - 15px) 20px;
          background-repeat: no-repeat;
        }
        .safe-vitrine .champ:focus {
          border-color: ${GREEN};
          box-shadow: 0 0 0 3px rgb(var(--si-ink-strong-rgb) / 0.12);
        }
        .safe-vitrine .envoi {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .safe-vitrine .echec {
          margin: 0;
          font-family: var(--sans);
          font-size: 13px;
          color: var(--si-amber-ink);
        }
        .safe-vitrine .echec a { color: inherit; text-decoration: underline; }
        .safe-vitrine .recu {
          margin-top: clamp(40px, 6vh, 72px);
          max-width: 46ch;
          font-family: var(--sans);
          font-size: var(--t-explique);
          line-height: 1.5;
          color: ${INK};
        }
        @media (max-width: 860px) {
          .safe-vitrine .formulaire { margin-top: 32px; grid-template-columns: 1fr; }
          .safe-vitrine .formulaire .btn { justify-content: center; width: 100%; }
        }
      `,
        }}
      />
    </PageShell>
  );
}
