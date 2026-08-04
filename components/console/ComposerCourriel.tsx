"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GABARITS } from "@/lib/crm/gabarits";
import { apercuCourriel, envoyerCourriel } from "@/app/(app)/console/courriel/actions";

/**
 * Composer un courriel depuis la fiche d'un cabinet.
 *
 * Le parcours impose l'aperçu : on choisit un contact et un gabarit, on relit
 * le message rendu avec les vraies variables, on corrige si besoin, puis on
 * envoie. Le bouton d'envoi n'existe pas tant que rien n'a été relu.
 */

export type ContactCourriel = {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  doNotContact: boolean;
  emailStatut: string;
};

type Etape = "choix" | "relecture";

export function ComposerCourriel({
  leadId,
  contacts,
}: {
  leadId: string;
  contacts: ContactCourriel[];
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState<Etape>("choix");
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const joignables = contacts.filter(
    (c) => c.email && !c.doNotContact && c.emailStatut !== "INVALIDE" && c.emailStatut !== "BOUNCE",
  );

  const [contactId, setContactId] = useState(joignables[0]?.id ?? "");
  const [gabaritId, setGabaritId] = useState(GABARITS[0]!.id);
  const [sujet, setSujet] = useState("");
  const [corps, setCorps] = useState("");
  const [destinataire, setDestinataire] = useState("");

  const gabaritChoisi = GABARITS.find((g) => g.id === gabaritId);

  function reinitialiser() {
    setEtape("choix");
    setSujet("");
    setCorps("");
    setDestinataire("");
    setErreur(null);
  }

  function previsualiser() {
    setErreur(null);
    startTransition(async () => {
      const res = await apercuCourriel({ contactId, gabaritId });
      if (res.ok) {
        setSujet(res.sujet);
        setCorps(res.corps);
        setDestinataire(`${res.destinataireNom} <${res.destinataire}>`);
        setEtape("relecture");
      } else {
        setErreur(res.error);
      }
    });
  }

  function envoyer() {
    setErreur(null);
    startTransition(async () => {
      const res = await envoyerCourriel({
        contactId,
        leadId,
        gabaritId,
        sujetPersonnalise: sujet,
        corpsPersonnalise: corps,
      });
      if (res.ok) {
        setSucces(`Envoyé : « ${res.sujet} »`);
        setOuvert(false);
        reinitialiser();
        router.refresh();
      } else {
        setErreur(res.error);
      }
    });
  }

  if (!ouvert) {
    return (
      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSucces(null);
            setOuvert(true);
          }}
          disabled={joignables.length === 0}
        >
          Écrire un courriel
        </Button>
        {joignables.length === 0 && (
          <p className="mt-2 text-xs text-si-muted">
            Aucun contact joignable : il faut une adresse valide et un contact qui ne s&apos;est
            pas désabonné.
          </p>
        )}
        {succes && <p className="mt-2 text-xs text-si-verified">{succes}</p>}
      </div>
    );
  }

  const champ =
    "w-full rounded-md border border-si-line px-3 py-2 text-sm focus:border-si-verified focus:outline-none focus:ring-1 focus:ring-si-verified/20";

  return (
    <div className="rounded-lg border border-si-line bg-si-canvas px-4 py-4">
      {etape === "choix" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-si-muted">Destinataire</span>
              <select
                className={champ}
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
              >
                {joignables.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom} · {c.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-si-muted">Gabarit</span>
              <select
                className={champ}
                value={gabaritId}
                onChange={(e) => setGabaritId(e.target.value)}
              >
                {GABARITS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {gabaritChoisi && (
            <p className="mt-2 text-xs leading-5 text-si-muted">{gabaritChoisi.usage}</p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={previsualiser} disabled={isPending || !contactId}>
              Prévisualiser
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOuvert(false)} disabled={isPending}>
              Annuler
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-si-muted">
            À <span className="font-medium text-si-ink">{destinataire}</span>
          </p>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-si-muted">Objet</span>
            <input className={champ} value={sujet} onChange={(e) => setSujet(e.target.value)} />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-si-muted">Message</span>
            <textarea
              className={`${champ} min-h-[220px] font-sans leading-6`}
              value={corps}
              onChange={(e) => setCorps(e.target.value)}
            />
          </label>

          <p className="mt-2 text-xs leading-5 text-si-muted">
            L&apos;identification de SAFE Inc. et le lien de désabonnement sont ajoutés
            automatiquement en bas du message.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={envoyer} disabled={isPending || !sujet.trim() || !corps.trim()}>
              {isPending ? "Envoi..." : "Envoyer"}
            </Button>
            <Button variant="secondary" size="sm" onClick={reinitialiser} disabled={isPending}>
              Revenir au choix
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setOuvert(false); reinitialiser(); }} disabled={isPending}>
              Annuler
            </Button>
          </div>
        </>
      )}

      {erreur && <p className="mt-3 text-sm text-[#B84A3E]">{erreur}</p>}
    </div>
  );
}
