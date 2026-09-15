"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Check, AlertTriangle } from "lucide-react";

/**
 * Maquette — entrée d'un client existant dans SAFE.
 *
 * Ce n'est pas le formulaire « nouveau client » actuel, qui demande onze champs
 * de coordonnées et rien d'autre. C'est le processus d'entrée d'un cabinet qui
 * a déjà une clientèle : ce que l'avocat SAIT, ce qu'il a DÉJÀ FAIT, et ce qui
 * reste ouvert.
 *
 * Doctrine reprise de la transmission des factures : une case cochée enregistre
 * une DÉCLARATION de l'avocat, horodatée et signée, pas une preuve détenue par
 * SAFE. Les deux sont recevables, elles ne se confondent jamais.
 *
 * Données fictives. Route de contrôle visuel, non branchée à la navigation.
 */
export const dynamic = "force-dynamic";

/* ── Pièces d'interface ─────────────────────────────────────────────────── */

function Section({
  numero,
  titre,
  aide,
  children,
}: {
  numero: string;
  titre: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-si-line bg-si-surface p-5">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-[12px] text-si-subtle">{numero}</span>
        <div>
          <h2 className="text-[15px] font-medium text-si-ink">{titre}</h2>
          {aide && <p className="mt-0.5 text-[13px] text-si-muted">{aide}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Champ({
  libelle,
  valeur,
  largeur = "w-full shrink",
  mono,
}: {
  libelle: string;
  valeur: string;
  largeur?: string;
  mono?: boolean;
}) {
  return (
    <label className={`block shrink-0 ${largeur}`}>
      <span className="mb-1 block text-[12px] text-si-muted">{libelle}</span>
      <input
        type="text"
        defaultValue={valeur}
        className={`h-9 w-full rounded-md border border-si-line bg-si-canvas px-2.5 text-[13px] text-si-ink ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      />
    </label>
  );
}

/** Case à cocher qui porte sa date et son auteur. Cochée = déclarée. */
function CaseDeclaree({
  libelle,
  coche,
  date,
  auteur = "Me Dadié",
}: {
  libelle: string;
  coche: boolean;
  date?: string;
  auteur?: string;
}) {
  const [actif, setActif] = useState(coche);
  return (
    <div className="flex items-center gap-3 border-b border-si-line2 py-2.5 last:border-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={actif}
        onClick={() => setActif((v) => !v)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          actif ? "border-si-verified bg-si-verified text-si-surface" : "border-si-border-strong bg-si-surface"
        }`}
      >
        {actif && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <span className={`flex-1 text-[13px] ${actif ? "text-si-ink" : "text-si-muted"}`}>{libelle}</span>
      {actif ? (
        <>
          <input
            type="text"
            defaultValue={date}
            className="h-8 w-[112px] rounded-md border border-si-line bg-si-canvas px-2 text-center font-mono text-[12px] tabular-nums text-si-ink"
          />
          <span className="w-[92px] text-right text-[12px] text-si-subtle">{auteur}</span>
        </>
      ) : (
        <span className="w-[212px] text-right text-[12px] text-si-subtle">non déclaré</span>
      )}
    </div>
  );
}

function Bascule({ options, actif }: { options: string[]; actif: string }) {
  const [choix, setChoix] = useState(actif);
  return (
    <div className="inline-flex rounded-lg border border-si-line bg-si-surface2 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={o === choix}
          onClick={() => setChoix(o)}
          className={`min-h-8 rounded-[6px] px-3 text-[13px] font-medium transition-all ${
            o === choix
              ? "bg-si-surface text-si-ink shadow-[0_1px_2px_rgba(22,24,23,0.10)]"
              : "text-si-muted hover:text-si-ink"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ── Écran ──────────────────────────────────────────────────────────────── */

export default function ApercuEntreeClient() {
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[1180px] px-6 pb-6 pt-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            variant="dashboard"
            title="Entrée d'un client"
            description="Ce que vous savez, ce que vous avez déjà fait, ce qui reste ouvert. Données fictives."
          />
          <div className="flex items-center gap-3 pb-4">
            <span className="font-mono text-[12px] text-si-muted">client 7 sur 30</span>
            <Button variant="secondary">Mettre de côté</Button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_306px] gap-5">
          {/* ── Colonne des questions ─────────────────────────────────── */}
          <div className="space-y-4">
            <Section
              numero="01"
              titre="Qui est le client"
              aide="Le nom tel qu'il figure sur le mandat. C'est lui qui servira à la recherche de conflits."
            >
              <div className="mb-3 flex items-center gap-3">
                <Bascule options={["Personne", "Entreprise"]} actif="Personne" />
                <span className="text-[13px] text-si-muted">·</span>
                <Bascule options={["Dossier en cours", "Dossier terminé"]} actif="Dossier en cours" />
              </div>
              <div className="flex gap-3">
                <Champ libelle="Prénom" valeur="Marielle" />
                <Champ libelle="Nom" valeur="Aubin" />
                <Champ libelle="Occupation" valeur="Infirmière" />
              </div>
              <div className="mt-3 flex gap-3">
                <Champ libelle="Courriel" valeur="m.aubin@courriel.ca" />
                <Champ libelle="Téléphone" valeur="819 555-0142" />
                <Champ libelle="Langue" valeur="Français" largeur="w-[180px]" />
              </div>
            </Section>

            <Section
              numero="02"
              titre="Le mandat"
              aide="Envoyé, signé et versé au dossier sont trois choses différentes. Un mandat envoyé et jamais signé se verra ici."
            >
              <CaseDeclaree libelle="Mandat envoyé au client" coche date="2026-02-11" />
              <CaseDeclaree libelle="Mandat signé par le client" coche date="2026-02-19" />
              <CaseDeclaree libelle="Copie signée versée au dossier" coche={false} />
              <div className="mt-3 flex gap-3">
                <Champ libelle="Objet du mandat" valeur="Contestation d'un congédiement" />
                <Champ libelle="Taux horaire convenu" valeur="275,00 $" largeur="w-[160px]" mono />
              </div>
            </Section>

            <Section
              numero="03"
              titre="Conflits d'intérêts"
              aide="SAFE cherche dans les clients et les parties déjà entrés. Plus vous en entrez, plus la recherche vaut."
            >
              <CaseDeclaree libelle="Vérification faite avant d'accepter le mandat" coche date="2026-02-10" />
              <div className="mt-3 rounded-lg border border-si-line bg-si-canvas px-3 py-2.5">
                <div className="flex items-center gap-2 text-[13px] text-si-body">
                  <Check className="h-4 w-4 text-si-verified" />
                  Aucune correspondance parmi les 6 clients et 4 parties déjà entrés.
                </div>
                <p className="mt-1 text-[12px] text-si-subtle">
                  Une nouvelle recherche sera proposée quand les 30 clients seront entrés.
                </p>
              </div>
            </Section>

            <Section
              numero="04"
              titre="Identité du client"
              aide="Obligation du Barreau lorsque des fonds ont circulé. La pièce peut rester dans votre classeur, il suffit de dire où."
            >
              <div className="mb-3">
                <Bascule options={["Vérifiée", "Exemptée", "Reste à faire"]} actif="Vérifiée" />
              </div>
              <div className="flex gap-3">
                <Champ libelle="Vérifiée le" valeur="2026-02-11" largeur="w-[150px]" mono />
                <Champ libelle="Pièce vue" valeur="Permis de conduire" />
                <Champ libelle="Où la copie est conservée" valeur="Classeur 2, chemise Aubin" />
              </div>
            </Section>

            <Section
              numero="05"
              titre="Argent détenu pour ce client"
              aide="Ce que vous détenez en fidéicommis aujourd'hui, à la date de votre dernier relevé."
            >
              <div className="mb-3">
                <Bascule options={["Je détiens des fonds", "Aucun fonds détenu"]} actif="Je détiens des fonds" />
              </div>
              <div className="flex gap-3">
                <Champ libelle="Solde détenu" valeur="1 500,00 $" largeur="w-[150px]" mono />
                <Champ libelle="Arrêté au" valeur="2026-08-31" largeur="w-[150px]" mono />
                <Champ libelle="Reçu à titre de" valeur="Provision sur honoraires" />
              </div>
            </Section>

            <Section
              numero="06"
              titre="Dates qui courent"
              aide="Sans elles, SAFE afficherait un calme qui n'existe pas."
            >
              <div className="flex items-center gap-3 border-b border-si-line2 py-2.5">
                <span className="w-[112px] font-mono text-[13px] tabular-nums text-si-ink">2026-10-03</span>
                <span className="flex-1 text-[13px] text-si-ink">Audience, Palais de justice de Gatineau</span>
                <StatusBadge label="dans 19 jours" variant="warning" />
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <span className="w-[112px] font-mono text-[13px] tabular-nums text-si-ink">2027-01-14</span>
                <span className="flex-1 text-[13px] text-si-ink">Prescription de la réclamation</span>
                <StatusBadge label="dans 4 mois" variant="neutral" />
              </div>
              <button type="button" className="mt-3 text-[13px] text-si-body underline underline-offset-4 hover:text-si-ink">
                Ajouter une date
              </button>
            </Section>

            <Section
              numero="07"
              titre="Qui d'autre est dans l'affaire"
              aide="La partie adverse n'est jamais une fiche client. Son nom sert à la recherche de conflits, rien d'autre."
            >
              <div className="flex items-center gap-3 border-b border-si-line2 py-2.5">
                <span className="w-[124px] text-[12px] text-si-muted">Partie adverse</span>
                <span className="flex-1 text-[13px] text-si-ink">Entrepôts Chaudière inc.</span>
                <span className="text-[12px] text-si-subtle">nom seul, aucune fiche créée</span>
              </div>
              <button type="button" className="mt-3 text-[13px] text-si-body underline underline-offset-4 hover:text-si-ink">
                Ajouter une partie
              </button>
            </Section>
          </div>

          {/* ── Colonne d'état ────────────────────────────────────────── */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-si-line bg-si-surface p-4">
              <h3 className="text-[13px] font-medium text-si-ink">Ce qui reste ouvert</h3>
              <p className="mt-1 text-[12px] text-si-muted">
                Rien ne bloque l'enregistrement. Ce qui manque restera visible sur la fiche.
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex gap-2 text-[13px] text-si-amber-ink">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Copie signée du mandat non versée
                </li>
                <li className="flex gap-2 text-[13px] text-si-muted">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-si-verified" />
                  Conflits, identité, consentement
                </li>
                <li className="flex gap-2 text-[13px] text-si-muted">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-si-verified" />
                  2 dates portées au calendrier
                </li>
              </ul>
            </div>

            {/* Le contrôle que personne ne demande et qui sauve le cabinet. */}
            <div className="rounded-xl border border-si-line bg-si-surface p-4">
              <h3 className="text-[13px] font-medium text-si-ink">Fidéicommis, en cours de saisie</h3>
              <dl className="mt-3 space-y-2">
                <div className="flex items-baseline justify-between">
                  <dt className="text-[12px] text-si-muted">Déclaré sur 7 clients</dt>
                  <dd className="font-mono text-[13px] tabular-nums text-si-ink">9 250,00 $</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-[12px] text-si-muted">Relevé bancaire du 31 août</dt>
                  <dd className="font-mono text-[13px] tabular-nums text-si-ink">11 400,00 $</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-si-line2 pt-2">
                  <dt className="text-[12px] font-medium text-si-amber-ink">Pas encore attribué</dt>
                  <dd className="font-mono text-[13px] tabular-nums text-si-amber-ink">2 150,00 $</dd>
                </div>
              </dl>
              <p className="mt-2.5 text-[12px] text-si-muted">
                L'écart se referme à mesure que vous entrez les clients. S'il reste à la fin, il y a un client oublié ou
                une somme à expliquer.
              </p>
            </div>

            <div className="rounded-xl border border-si-line bg-si-surface p-4">
              <h3 className="text-[13px] font-medium text-si-ink">Les 30 clients</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-[22px] tabular-nums text-si-ink">6</span>
                <span className="text-[13px] text-si-muted">entrés, 24 à venir</span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-si-line2">
                <div className="h-full w-[20%] rounded-full bg-si-verified" />
              </div>
              <p className="mt-2.5 text-[12px] text-si-muted">
                Vous pouvez arrêter à tout moment. SAFE rouvrira ici.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="barre-decision sticky bottom-0 border-t border-si-line bg-si-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-3">
          <p className="text-[13px] text-si-muted">
            Marielle Aubin, 1 dossier en cours, 2 dates, 1 500,00 $ en fidéicommis.{" "}
            <span className="text-si-body">Une chose reste ouverte, elle ne bloque rien.</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary">Enregistrer et fermer</Button>
            <Button variant="primary">Enregistrer et passer au suivant</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
