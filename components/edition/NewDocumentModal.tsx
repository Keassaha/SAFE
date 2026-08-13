"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ds-safe/form";

/**
 * Création d'un document depuis l'accueil de l'atelier.
 *
 * Il n'existait aucun chemin : depuis `/edition`, il fallait deviner qu'on
 * crée un document en ouvrant d'abord un dossier, puis en trouvant un popover
 * dans son en-tête. Trois gestes et un changement de page pour l'action
 * première de l'écran, qui n'avait donc pas de bouton du tout.
 *
 * Le dossier est demandé ici plutôt que déduit : un document appartient
 * toujours à un dossier, et le choisir après coup coûte un déplacement.
 */

export interface DossierChoix {
  id: string;
  intitule: string;
  clientId: string;
  clientNom: string | null;
  numeroDossier: string | null;
}

const TYPES: { value: string; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "lettre", label: "Lettre" },
  { value: "contrat", label: "Contrat" },
  { value: "procedure", label: "Procédure" },
  { value: "requete", label: "Requête" },
  { value: "autre", label: "Autre" },
];

interface Props {
  dossiers: DossierChoix[];
  /** Libellé du déclencheur. L'en-tête et l'état vide n'appellent pas pareil. */
  label?: string;
  variant?: "primary" | "secondary";
}

export function NewDocumentModal({
  dossiers,
  label = "Nouveau document",
  variant = "primary",
}: Props) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [dossierId, setDossierId] = useState(dossiers[0]?.id ?? "");
  const [titre, setTitre] = useState("");
  const [type, setType] = useState("note");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const aucunDossier = dossiers.length === 0;

  function libelleDossier(d: DossierChoix): string {
    const appoint = d.clientNom ?? d.numeroDossier;
    return appoint ? `${d.intitule} — ${appoint}` : d.intitule;
  }

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    const dossier = dossiers.find((d) => d.id === dossierId);
    if (!dossier || !titre.trim() || enCours) return;

    setEnCours(true);
    setErreur(null);
    try {
      const res = await fetch("/api/edition/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId: dossier.id,
          clientId: dossier.clientId,
          titre: titre.trim(),
          type,
        }),
      });
      if (!res.ok) {
        setErreur("Le document n'a pas pu être créé. Réessayez.");
        return;
      }
      const doc = await res.json();
      // On entre directement dans l'éditeur : créer un document sans y écrire
      // n'a aucun sens, et revenir à la liste obligerait à le rouvrir.
      router.push(routes.editionDocument(dossier.id, doc.id));
    } catch {
      setErreur("Le document n'a pas pu être créé. Réessayez.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setOuvert(true)}>
        <FilePlus2 className="mr-2 inline-block h-4 w-4" aria-hidden />
        {label}
      </Button>

      <Modal open={ouvert} onClose={() => setOuvert(false)} title="Nouveau document">
        {aucunDossier ? (
          <div className="space-y-4">
            <p className="text-[14px] text-si-body">
              Un document appartient toujours à un dossier, et le cabinet n&apos;en a aucun
              d&apos;ouvert. Créez d&apos;abord le dossier, le document suivra.
            </p>
            <Link href={routes.dossierNouveau()}>
              <Button type="button">Créer un dossier</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={creer}>
            <Field label="Dossier" required>
              <Select
                value={dossierId}
                onChange={(e) => setDossierId(e.target.value)}
                aria-label="Dossier du document"
              >
                {dossiers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {libelleDossier(d)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Titre" required>
              <Input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Mise en demeure, projet de contrat…"
                maxLength={255}
                autoFocus
                aria-label="Titre du document"
              />
            </Field>

            <Field label="Type">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                aria-label="Type de document"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>

            {erreur && (
              <p role="alert" className="mb-4 text-[13px] text-si-danger-ink">
                {erreur}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOuvert(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                loading={enCours}
                loadingLabel="Création…"
                disabled={!titre.trim() || !dossierId}
                disabledReason="Un titre et un dossier sont requis"
              >
                Créer et rédiger
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
