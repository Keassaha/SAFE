"use client";

import { useState } from "react";
import { Check, AlertTriangle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { enregistrerEntree } from "@/app/(app)/clients/entree/actions";
import type { ContexteEntree } from "@/lib/services/entree-client/contexte-entree";

/**
 * Entrée d'un client déjà servi par le cabinet.
 *
 * Reprend la maquette validée le 14 septembre 2026 : sept questions
 * numérotées, des cases qui portent leur date et leur auteur, un panneau
 * d'état à droite, une seule décision en bas.
 *
 * Deux règles tenues partout dans ce fichier :
 *
 *   - **aucun champ n'est obligatoire.** Le navigateur ne refuse rien. Seul le
 *     service refuse, et seulement un client sans nom ou un dossier sans
 *     intitulé. Un cabinet qui entre trente clients un soir abandonne au
 *     troisième refus ;
 *   - **une case cochée est une déclaration**, datée et signée au nom de qui
 *     la coche. Le libellé à droite de chaque date le dit.
 */

interface Props {
  contexte: ContexteEntree;
  /** Nom de l'utilisateur, affiché à côté de chaque déclaration. */
  nomUtilisateur: string;
  /** Message d'erreur remonté par l'action, le cas échéant. */
  erreur?: string | null;
  /** Le client précédent vient d'être enregistré. */
  clientPrecedentEnregistre?: boolean;
}

const devise = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });

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

const champClass =
  "h-9 w-full rounded-md border border-si-line bg-si-canvas px-2.5 text-[13px] text-si-ink outline-none transition-colors focus:border-si-border-strong focus:bg-si-surface";

function Champ({
  libelle,
  name,
  defaultValue,
  largeur = "flex-1 min-w-0",
  mono,
  placeholder,
}: {
  libelle: string;
  name: string;
  defaultValue?: string;
  largeur?: string;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={`block ${largeur}`}>
      <span className="mb-1 block text-[12px] text-si-muted">{libelle}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`${champClass} ${mono ? "font-mono tabular-nums" : ""}`}
      />
    </label>
  );
}

function Bascule<T extends string>({
  name,
  options,
  valeur,
  onChange,
}: {
  name: string;
  options: { cle: T; libelle: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-si-line bg-si-surface2 p-0.5">
      <input type="hidden" name={name} value={valeur} />
      {options.map((o) => (
        <button
          key={o.cle}
          type="button"
          aria-pressed={o.cle === valeur}
          onClick={() => onChange(o.cle)}
          className={`min-h-8 rounded-[6px] px-3 text-[13px] font-medium transition-all ${
            o.cle === valeur
              ? "bg-si-surface text-si-ink shadow-[0_1px_2px_rgba(22,24,23,0.10)]"
              : "text-si-muted hover:text-si-ink"
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

/**
 * Case à cocher qui porte sa date et son auteur.
 *
 * La date n'est envoyée que si la case est cochée : le champ est démonté
 * sinon. Une date laissée dans le formulaire par une case décochée
 * enregistrerait une déclaration que personne n'a faite.
 */
function CaseDeclaree({
  name,
  libelle,
  auteur,
  dateParDefaut,
}: {
  name: string;
  libelle: string;
  auteur: string;
  dateParDefaut?: string;
}) {
  const [coche, setCoche] = useState(false);
  return (
    <div className="flex items-center gap-3 border-b border-si-line2 py-2.5 last:border-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={coche}
        aria-label={libelle}
        onClick={() => setCoche((v) => !v)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          coche ? "border-si-verified bg-si-verified text-si-surface" : "border-si-border-strong bg-si-surface"
        }`}
      >
        {coche && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <span className={`flex-1 text-[13px] ${coche ? "text-si-ink" : "text-si-muted"}`}>{libelle}</span>
      {coche ? (
        <>
          <input
            type="date"
            name={name}
            defaultValue={dateParDefaut}
            className="h-8 w-[136px] rounded-md border border-si-line bg-si-canvas px-2 text-center font-mono text-[12px] tabular-nums text-si-ink"
          />
          <span className="w-[112px] truncate text-right text-[12px] text-si-subtle">{auteur}</span>
        </>
      ) : (
        <span className="w-[256px] text-right text-[12px] text-si-subtle">non déclaré</span>
      )}
    </div>
  );
}

/** Lignes ajoutables : échéances, parties. Une liste vide n'affiche aucune ligne vide. */
function LignesAjoutables({
  lignes,
  onAjouter,
  onRetirer,
  libelleAjout,
  children,
}: {
  lignes: number[];
  onAjouter: () => void;
  onRetirer: (id: number) => void;
  libelleAjout: string;
  children: (id: number) => React.ReactNode;
}) {
  return (
    <>
      {lignes.map((id) => (
        <div key={id} className="flex items-end gap-3 border-b border-si-line2 py-2.5 last:border-0">
          {children(id)}
          <button
            type="button"
            onClick={() => onRetirer(id)}
            aria-label="Retirer cette ligne"
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-si-muted transition-colors hover:bg-si-line2 hover:text-si-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAjouter}
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-si-body underline underline-offset-4 hover:text-si-ink"
      >
        <Plus className="h-3.5 w-3.5" />
        {libelleAjout}
      </button>
    </>
  );
}

/* ── Écran ──────────────────────────────────────────────────────────────── */

const MESSAGES_ERREUR: Record<string, string> = {
  NOM_MANQUANT: "Ce client n'a ni nom ni raison sociale. Rien n'a été enregistré.",
  INTITULE_MANQUANT: "Le dossier n'a pas d'intitulé. Rien n'a été enregistré.",
  MONTANT_INVALIDE:
    "Le solde détenu doit être un montant positif. Pour ne rien détenir, choisissez « Aucun fonds détenu ».",
  CLIENT_INTROUVABLE: "Cette fiche n'appartient pas à votre cabinet.",
  droits: "Votre rôle ne permet pas de créer un client.",
};

export function FormulaireEntreeClient({
  contexte,
  nomUtilisateur,
  erreur,
  clientPrecedentEnregistre,
}: Props) {
  const [typeClient, setTypeClient] = useState<"personne_physique" | "personne_morale">("personne_physique");
  const [dossierEtat, setDossierEtat] = useState<"en_cours" | "termine">("en_cours");
  const [identiteEtat, setIdentiteEtat] = useState<"VERIFIEE" | "EXEMPTEE" | "A_FAIRE">("VERIFIEE");
  const [detientFonds, setDetientFonds] = useState<"oui" | "non">("non");
  const [echeances, setEcheances] = useState<number[]>([]);
  const [parties, setParties] = useState<number[]>([]);
  const [prochainId, setProchainId] = useState(1);

  const ajouter = (set: React.Dispatch<React.SetStateAction<number[]>>) => () => {
    set((l) => [...l, prochainId]);
    setProchainId((n) => n + 1);
  };

  const { progression, fideicommis, recherche } = contexte;

  return (
    <form action={enregistrerEntree} className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_306px]">
      <input type="hidden" name="intention" value="enregistrer" id="intention" />

      {/* ── Colonne des questions ───────────────────────────────────────── */}
      <div className="space-y-4">
        {erreur && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-si-danger/30 bg-si-danger/[0.06] px-4 py-3 text-[13px] text-si-danger-ink"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {MESSAGES_ERREUR[erreur] ?? "L'enregistrement n'a pas abouti. Rien n'a été écrit."}
          </div>
        )}
        {clientPrecedentEnregistre && !erreur && (
          <div className="flex items-center gap-2 rounded-xl border border-si-verified/25 bg-si-verified/[0.08] px-4 py-3 text-[13px] text-si-verified">
            <Check className="h-4 w-4 shrink-0" />
            Client enregistré. Cette fiche est vierge, vous pouvez enchaîner.
          </div>
        )}

        <Section
          numero="01"
          titre="Qui est le client"
          aide="Le nom tel qu'il figure sur le mandat. C'est lui qui servira à la recherche de conflits."
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Bascule
              name="typeClient"
              valeur={typeClient}
              onChange={setTypeClient}
              options={[
                { cle: "personne_physique", libelle: "Personne" },
                { cle: "personne_morale", libelle: "Entreprise" },
              ]}
            />
            <span className="text-[13px] text-si-subtle">·</span>
            <Bascule
              name="dossierEtat"
              valeur={dossierEtat}
              onChange={setDossierEtat}
              options={[
                { cle: "en_cours", libelle: "Dossier en cours" },
                { cle: "termine", libelle: "Dossier terminé" },
              ]}
            />
          </div>
          {typeClient === "personne_physique" ? (
            <div className="flex gap-3">
              <Champ libelle="Prénom" name="prenom" />
              <Champ libelle="Nom" name="nom" />
              <Champ libelle="Occupation" name="occupation" />
            </div>
          ) : (
            <div className="flex gap-3">
              <Champ libelle="Raison sociale" name="raisonSociale" />
              <Champ libelle="Nature des activités" name="natureActivites" />
            </div>
          )}
          <div className="mt-3 flex gap-3">
            <Champ libelle="Courriel" name="email" />
            <Champ libelle="Téléphone" name="telephone" />
            <Champ libelle="Langue" name="langue" largeur="w-[180px] shrink-0" placeholder="Français" />
          </div>
        </Section>

        <Section
          numero="02"
          titre="Le mandat"
          aide="Envoyé, signé et versé au dossier sont trois choses différentes. Un mandat envoyé et jamais signé se verra ici."
        >
          <CaseDeclaree name="mandatEnvoyeAt" libelle="Mandat envoyé au client" auteur={nomUtilisateur} />
          <CaseDeclaree name="mandatSigneAt" libelle="Mandat signé par le client" auteur={nomUtilisateur} />
          <CaseDeclaree name="mandatVerseAt" libelle="Copie signée versée au dossier" auteur={nomUtilisateur} />
          <div className="mt-3 flex gap-3">
            <Champ libelle="Objet du mandat" name="objetDuMandat" />
            <Champ libelle="Taux horaire convenu" name="tauxHoraire" largeur="w-[180px] shrink-0" mono placeholder="275,00 $" />
          </div>
          <div className="mt-3">
            <Champ libelle="Intitulé du dossier" name="dossierIntitule" />
          </div>
        </Section>

        <Section
          numero="03"
          titre="Conflits d'intérêts"
          aide="SAFE cherche dans les clients et les parties déjà entrés. Plus vous en entrez, plus la recherche vaut."
        >
          <CaseDeclaree
            name="conflitsVerifieAt"
            libelle="Vérification faite avant d'accepter le mandat"
            auteur={nomUtilisateur}
          />
          <div className="mt-3 rounded-lg border border-si-line bg-si-canvas px-3 py-2.5">
            <p className="text-[13px] text-si-body">
              La recherche portera sur {recherche.clients} client{recherche.clients > 1 ? "s" : ""} et{" "}
              {recherche.parties} partie{recherche.parties > 1 ? "s" : ""} déjà au dossier.
            </p>
            <p className="mt-1 text-[12px] text-si-subtle">
              Vos premiers clients n&apos;ont pas encore été comparés aux derniers.{" "}
              <a
                href="/clients/entree/conflits"
                target="_blank"
                rel="noreferrer"
                className="text-si-body underline underline-offset-4 hover:text-si-ink"
              >
                Comparer tout le monde maintenant
              </a>
              , dans un nouvel onglet, sans perdre cette saisie.
            </p>
          </div>
          <div className="mt-3">
            <Champ libelle="Notes (facultatif)" name="conflitsNotes" />
          </div>
        </Section>

        <Section
          numero="04"
          titre="Identité du client"
          aide="Obligation du Barreau lorsque des fonds ont circulé. La pièce peut rester dans votre classeur, il suffit de dire où."
        >
          <div className="mb-3">
            <Bascule
              name="identiteEtat"
              valeur={identiteEtat}
              onChange={setIdentiteEtat}
              options={[
                { cle: "VERIFIEE", libelle: "Vérifiée" },
                { cle: "EXEMPTEE", libelle: "Exemptée" },
                { cle: "A_FAIRE", libelle: "Reste à faire" },
              ]}
            />
          </div>
          {identiteEtat === "VERIFIEE" && (
            <div className="flex gap-3">
              <label className="block w-[170px] shrink-0">
                <span className="mb-1 block text-[12px] text-si-muted">Vérifiée le</span>
                <input type="date" name="identiteFaiteLe" className={`${champClass} font-mono tabular-nums`} />
              </label>
              <Champ libelle="Pièce vue" name="identitePiece" placeholder="Permis de conduire" />
              <Champ
                libelle="Où la copie est conservée"
                name="identiteOuConservee"
                placeholder="Classeur 2, chemise du client"
              />
            </div>
          )}
          {identiteEtat === "EXEMPTEE" && (
            <Champ
              libelle="Motif de l'exemption"
              name="identiteMotifExemption"
              placeholder="Client déjà vérifié par un autre avocat du cabinet"
            />
          )}
          {identiteEtat === "A_FAIRE" && (
            <p className="text-[13px] text-si-muted">
              Rien n&apos;est bloqué. Si vous détenez des fonds pour ce client, ce point remontera en tête de sa fiche.
            </p>
          )}
        </Section>

        <Section
          numero="05"
          titre="Argent détenu pour ce client"
          aide="Ce que vous détenez en fidéicommis aujourd'hui, à la date de votre dernier relevé."
        >
          <div className="mb-3">
            <Bascule
              name="detientFonds"
              valeur={detientFonds}
              onChange={setDetientFonds}
              options={[
                { cle: "non", libelle: "Aucun fonds détenu" },
                { cle: "oui", libelle: "Je détiens des fonds" },
              ]}
            />
          </div>
          {detientFonds === "oui" && (
            <div className="flex gap-3">
              <Champ libelle="Solde détenu" name="fondsMontant" largeur="w-[160px] shrink-0" mono placeholder="1 500,00 $" />
              <label className="block w-[170px] shrink-0">
                <span className="mb-1 block text-[12px] text-si-muted">Arrêté au</span>
                <input type="date" name="fondsArreteAu" className={`${champClass} font-mono tabular-nums`} />
              </label>
              <Champ libelle="Reçu à titre de" name="fondsTitre" placeholder="Provision sur honoraires" />
            </div>
          )}
        </Section>

        <Section numero="06" titre="Dates qui courent" aide="Sans elles, SAFE afficherait un calme qui n'existe pas.">
          <LignesAjoutables
            lignes={echeances}
            onAjouter={ajouter(setEcheances)}
            onRetirer={(id) => setEcheances((l) => l.filter((x) => x !== id))}
            libelleAjout="Ajouter une date"
          >
            {() => (
              <>
                <label className="block w-[170px] shrink-0">
                  <span className="mb-1 block text-[12px] text-si-muted">Date</span>
                  <input type="date" name="echeanceDate" className={`${champClass} font-mono tabular-nums`} />
                </label>
                <label className="block flex-1 min-w-0">
                  <span className="mb-1 block text-[12px] text-si-muted">Ce qui se passe ce jour-là</span>
                  <input
                    type="text"
                    name="echeanceLibelle"
                    placeholder="Audience, prescription, délai de réponse"
                    className={champClass}
                  />
                </label>
              </>
            )}
          </LignesAjoutables>
          {dossierEtat === "en_cours" && echeances.length === 0 && (
            <label className="mt-3 flex items-center gap-2 text-[13px] text-si-body">
              <input type="checkbox" name="aucuneDate" className="h-4 w-4 rounded border-si-line" />
              Aucune date ne court sur ce dossier, je le confirme
            </label>
          )}
        </Section>

        <Section
          numero="07"
          titre="Qui d'autre est dans l'affaire"
          aide="La partie adverse n'est jamais une fiche client. Son nom sert à la recherche de conflits, rien d'autre."
        >
          <LignesAjoutables
            lignes={parties}
            onAjouter={ajouter(setParties)}
            onRetirer={(id) => setParties((l) => l.filter((x) => x !== id))}
            libelleAjout="Ajouter une partie"
          >
            {() => (
              <>
                <label className="block w-[170px] shrink-0">
                  <span className="mb-1 block text-[12px] text-si-muted">Rôle</span>
                  <select name="partieRole" className={champClass} defaultValue="partie_adverse">
                    <option value="partie_adverse">Partie adverse</option>
                    <option value="tiers">Tiers</option>
                  </select>
                </label>
                <label className="block flex-1 min-w-0">
                  <span className="mb-1 block text-[12px] text-si-muted">Nom</span>
                  <input type="text" name="partieNom" className={champClass} />
                </label>
              </>
            )}
          </LignesAjoutables>
        </Section>
      </div>

      {/* ── Colonne d'état ──────────────────────────────────────────────── */}
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl border border-si-line bg-si-surface p-4">
          <h3 className="text-[13px] font-medium text-si-ink">Fidéicommis, en cours de saisie</h3>
          <dl className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[12px] text-si-muted">
                Déclaré sur {fideicommis.clientsAvecFonds} client{fideicommis.clientsAvecFonds > 1 ? "s" : ""}
              </dt>
              <dd className="font-mono text-[13px] tabular-nums text-si-ink">
                {devise.format(fideicommis.totalDeclare)}
              </dd>
            </div>
            {fideicommis.soldeReleve !== null ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[12px] text-si-muted">Relevé bancaire {fideicommis.periodeReleve}</dt>
                  <dd className="font-mono text-[13px] tabular-nums text-si-ink">
                    {devise.format(fideicommis.soldeReleve)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-si-line2 pt-2">
                  <dt
                    className={`text-[12px] font-medium ${
                      fideicommis.statut === "equilibre"
                        ? "text-si-verified"
                        : fideicommis.statut === "trop_attribue"
                          ? "text-si-danger-ink"
                          : "text-si-amber-ink"
                    }`}
                  >
                    {fideicommis.statut === "equilibre"
                      ? "Tout est attribué"
                      : fideicommis.statut === "trop_attribue"
                        ? "Attribué au-delà du relevé"
                        : "Pas encore attribué"}
                  </dt>
                  <dd
                    className={`font-mono text-[13px] tabular-nums ${
                      fideicommis.statut === "equilibre"
                        ? "text-si-verified"
                        : fideicommis.statut === "trop_attribue"
                          ? "text-si-danger-ink"
                          : "text-si-amber-ink"
                    }`}
                  >
                    {devise.format(Math.abs(fideicommis.ecart ?? 0))}
                  </dd>
                </div>
                <p className="pt-1 text-[12px] text-si-muted">
                  {fideicommis.statut === "trop_attribue"
                    ? "Vos clients totalisent plus que votre compte. Une somme est attribuée deux fois, ou le relevé n'est plus à jour."
                    : "L'écart se referme à mesure que vous entrez les clients. S'il reste à la fin, il y a un client oublié ou une somme à expliquer."}
                </p>
              </>
            ) : (
              <p className="pt-1 text-[12px] text-si-muted">
                Aucun rapprochement bancaire saisi. SAFE additionne ce que vous déclarez, sans pouvoir le comparer à
                votre compte.
              </p>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-si-line bg-si-surface p-4">
          <h3 className="text-[13px] font-medium text-si-ink">Avancement</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[22px] tabular-nums text-si-ink">{progression.entres}</span>
            <span className="text-[13px] text-si-muted">
              {progression.restants !== null
                ? `entré${progression.entres > 1 ? "s" : ""}, ${progression.restants} à venir`
                : `client${progression.entres > 1 ? "s" : ""} entré${progression.entres > 1 ? "s" : ""}`}
            </span>
          </div>
          {progression.pourcentage !== null && (
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-si-line2">
              <div
                className="h-full rounded-full bg-si-verified transition-all"
                style={{ width: `${progression.pourcentage}%` }}
              />
            </div>
          )}
          {progression.misDeCote > 0 && (
            <p className="mt-2.5 text-[12px] text-si-amber-ink">
              {progression.misDeCote} fiche{progression.misDeCote > 1 ? "s" : ""} mise
              {progression.misDeCote > 1 ? "s" : ""} de côté, à reprendre
            </p>
          )}
          <p className="mt-2.5 text-[12px] text-si-muted">Vous pouvez arrêter à tout moment. SAFE rouvrira ici.</p>
        </div>
      </aside>

      {/* ── Décision ────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-6 border-t border-si-line bg-si-surface/95 px-6 py-3 backdrop-blur lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-si-muted">
            Aucun champ n&apos;est obligatoire. <span className="text-si-body">Ce qui manque restera visible sur la fiche.</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="secondary"
              onClick={() => {
                const champ = document.getElementById("intention") as HTMLInputElement | null;
                if (champ) champ.value = "mettre_de_cote";
              }}
            >
              Mettre de côté
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={() => {
                const champ = document.getElementById("intention") as HTMLInputElement | null;
                if (champ) champ.value = "enregistrer";
              }}
            >
              Enregistrer et passer au suivant
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
