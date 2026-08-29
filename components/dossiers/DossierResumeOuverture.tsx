/**
 * SAFE — Le résumé d'ouverture du dossier.
 *
 * Demande CEO du 2026-08-27 : « je veux que la vue d'ensemble donne une sorte
 * de résumé du dossier, comme un résumé des infos de l'ouverture ».
 *
 * ── Ce que ça comble ─────────────────────────────────────────────────────────
 * La fiche n'affichait NULLE PART ce qu'est le dossier. On y lisait son état,
 * ses manquants, ses documents, mais jamais son identité : quand il s'est
 * ouvert, sous quel domaine de pratique, devant quel tribunal, qui le porte.
 * Il fallait aller au formulaire d'édition pour le savoir.
 *
 * ── Le domaine de pratique, enfin visible ────────────────────────────────────
 * `lib/dossiers/cartable-templates/index.ts` fait dépendre NEUF structures de
 * cartable du domaine de pratique. C'est l'argument central du produit, et rien
 * ne le disait à l'écran. Il ouvre donc ce résumé.
 *
 * Composant serveur : il n'affiche que des données, sans interaction.
 */

import type { ReactNode } from "react";

interface Props {
  domaine: string | null;
  sousType: string | null;
  dateOuverture: Date;
  statut: string;
  client: string;
  responsable: string | null;
  adjointe: string | null;
  tribunal: string | null;
  district: string | null;
  reference: string | null;
  locale: string;
}

function Ligne({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-si-line/60 py-2 last:border-b-0">
      <dt className="shrink-0 text-sm text-si-muted">{libelle}</dt>
      <dd className="min-w-0 text-right text-sm text-si-ink">{children}</dd>
    </div>
  );
}

export function DossierResumeOuverture({
  domaine,
  sousType,
  dateOuverture,
  statut,
  client,
  responsable,
  adjointe,
  tribunal,
  district,
  reference,
  locale,
}: Props) {
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateOuverture);

  /* Le nombre de jours depuis l'ouverture. Une date seule oblige a compter de
     tete ; un dossier ouvert « il y a 17 jours » se situe tout de suite. */
  const jours = Math.max(
    0,
    Math.floor((Date.now() - dateOuverture.getTime()) / 86_400_000),
  );

  return (
    <div className="rounded-2xl border border-si-line bg-si-surface p-4">
      <h2 className="mb-3 text-sm font-medium text-si-ink">Le dossier</h2>
      <dl>
        {domaine ? (
          <Ligne libelle="Domaine de pratique">
            {domaine}
            {sousType ? <span className="text-si-muted"> · {sousType}</span> : null}
          </Ligne>
        ) : null}
        <Ligne libelle="Client">{client}</Ligne>
        <Ligne libelle="Ouvert le">
          {date}
          <span className="text-si-muted">
            {" "}
            · il y a {jours} jour{jours > 1 ? "s" : ""}
          </span>
        </Ligne>
        <Ligne libelle="Statut">{statut}</Ligne>
        {responsable ? <Ligne libelle="Avocat responsable">{responsable}</Ligne> : null}
        {adjointe ? <Ligne libelle="Adjointe">{adjointe}</Ligne> : null}
        {tribunal ? (
          <Ligne libelle="Tribunal">
            {tribunal}
            {district ? <span className="text-si-muted"> · district de {district}</span> : null}
          </Ligne>
        ) : null}
        {reference ? <Ligne libelle="Référence">{reference}</Ligne> : null}
      </dl>
    </div>
  );
}
