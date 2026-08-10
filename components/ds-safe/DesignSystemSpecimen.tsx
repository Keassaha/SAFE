"use client";

import { useState, type ReactNode } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Figure, MetricTile } from "@/components/ui/Figure";

function SpecimenLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 font-mono text-xs uppercase tracking-caps text-si-muted">{children}</div>;
}

export function DesignSystemSpecimen() {
  const [pressed, setPressed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section aria-labelledby="specimen-title" className="mt-10 space-y-5 border-t border-si-line pt-8">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-caps text-si-verified">Spécimen canonique</p>
        <h2 id="specimen-title" className="mt-2 font-serif text-3xl text-si-ink">
          Contrôles et états de l’interface
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-si-muted">
          Utilisez Tab pour vérifier le focus, puis activez les contrôles. Chaque état demeure lisible sans dépendre uniquement de la couleur.
        </p>
      </div>

      <Card>
        <CardHeader title="Niveaux d’action" />
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div>
            <SpecimenLabel>Les quatre rôles autorisés</SpecimenLabel>
            <div className="flex flex-wrap gap-3">
              <Button><Plus className="h-4 w-4" aria-hidden />Action principale</Button>
              <Button variant="secondary">Action secondaire</Button>
              <Button variant="ghost">Action tertiaire</Button>
              <Button variant="destructive">Action destructive</Button>
            </div>
          </div>
          <div>
            <SpecimenLabel>Matrice d’état</SpecimenLabel>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary">Repos</Button>
              <Button variant="secondary" className="ring-2 ring-si-verified ring-offset-2">Focus</Button>
              <Button variant="secondary" aria-pressed={pressed} onClick={() => setPressed((value) => !value)}>
                {pressed ? <Check className="h-4 w-4" aria-hidden /> : null}
                Pressé
              </Button>
              <Button loading loadingLabel="Enregistrement" />
              <Button disabled disabledReason="Un dossier doit d’abord être sélectionné">Indisponible</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Chiffres" />
        <CardContent className="space-y-5">
          <p className="max-w-3xl text-sm leading-relaxed text-si-muted">
            Tout chiffre affiché comme donnée passe par la même primitive. Mono tabulaire, pour que
            deux montants empilés s’alignent et se comparent d’un coup d’œil. Trois tailles
            seulement, une par rôle.
          </p>
          <div className="grid grid-cols-2 divide-x divide-y divide-si-line border-y border-si-line sm:grid-cols-4 sm:divide-y-0">
            <MetricTile label="Facturables" value="1" hint="130,00 $" className="px-4 py-3" />
            <MetricTile label="Reste à recevoir" value="247,50 $" hint="1 facture" teinte="attention" className="px-4 py-3" />
            <MetricTile label="Encaissé ce mois" value="1 234 567,89 $" hint="12 paiements" className="px-4 py-3" />
            <MetricTile label="Écart de rapprochement" value="0,00 $" hint="Équilibré" teinte="confirme" className="px-4 py-3" />
          </div>
          <div className="flex flex-wrap items-baseline gap-6">
            <span><SpecimenLabel>Principale</SpecimenLabel><Figure>31 350,00 $</Figure></span>
            <span><SpecimenLabel>Secondaire</SpecimenLabel><Figure taille="secondaire">-1 250,00 $</Figure></span>
            <span><SpecimenLabel>Mention</SpecimenLabel><Figure taille="mention" teinte="discret">2026-07</Figure></span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Champs et validation" />
        <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Client" placeholder="Rechercher un client" hint="Nom ou raison sociale" />
          <Input label="Courriel" defaultValue="cabinet@exemple.ca" status="success" hint="Adresse vérifiée" />
          <Input label="Provision" defaultValue="750,00 $" status="warning" hint="Sous le montant recommandé" />
          <Input label="Numéro de dossier" defaultValue="2026-" error="Le numéro est incomplet" />
          <Input label="Champ désactivé" defaultValue="Attribué automatiquement" disabled />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Statuts et superposition" />
        <CardContent className="flex flex-wrap items-center gap-3">
          <StatusBadge label="Conforme" variant="success" />
          <StatusBadge label="À vérifier" variant="warning" />
          <StatusBadge label="Information" variant="info" />
          <StatusBadge label="Neutre" variant="neutral" />
          <StatusBadge label="Erreur" variant="error" />
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Ouvrir la modale</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Système de profondeur, trois plans" />
        <CardContent className="space-y-5">
          <p className="max-w-3xl text-sm leading-relaxed text-si-muted">
            Les surfaces structurelles et le contenu restent mats. Le verre est réservé à ce qui
            flotte, recouvre du travail qui continue d’exister derrière, ou réclame momentanément
            l’attention. Le niveau focus est le plus opaque des trois : il porte des montants et des
            décisions, la lisibilité prime sur la matière.
          </p>

          {/* Le fond atmosphérique du canvas est indispensable à la démonstration :
              flouter un aplat parfaitement uni ne produirait aucune information. */}
          <div className="safe-atmosphere relative overflow-hidden rounded-lg border border-si-line p-5">
            <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-6 gap-2 p-5 font-mono text-xs text-si-ink/25">
              {Array.from({ length: 30 }, (_, index) => (
                <span key={index}>2026-{String(index + 1).padStart(3, "0")}</span>
              ))}
            </div>
            <div className="relative grid gap-4 md:grid-cols-3">
              <div className="safe-glass-subtle rounded-lg border p-4">
                <SpecimenLabel>Subtle</SpecimenLabel>
                <p className="text-sm text-si-ink">Barre collante, contrôle secondaire superposé.</p>
                <p className="mt-2 font-mono text-xs text-si-muted">0,72 · flou 14 px · sans ombre</p>
              </div>
              <div className="safe-glass-elevated rounded-lg border p-4">
                <SpecimenLabel>Elevated</SpecimenLabel>
                <p className="text-sm text-si-ink">Menu, popover, tiroir, barre d’action flottante.</p>
                <p className="mt-2 font-mono text-xs text-si-muted">0,84 · flou 24 px · ombre diffuse</p>
              </div>
              <div className="safe-glass-focus rounded-lg border p-4">
                <SpecimenLabel>Focus</SpecimenLabel>
                <p className="text-sm text-si-ink">Approbation, envoi, décision irréversible.</p>
                <p className="mt-2 font-mono text-xs text-si-muted">0,95 · flou 30 px · un seul à l’écran</p>
              </div>
            </div>
          </div>

          <div>
            <SpecimenLabel>Boutons posés sur une surface flottante</SpecimenLabel>
            <div className="safe-atmosphere relative overflow-hidden rounded-lg border border-si-line p-5">
              <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-5 gap-2 p-5 font-mono text-xs text-si-ink/20">
                {Array.from({ length: 20 }, (_, index) => (
                  <span key={index}>{(1250.4 * (index + 1)).toFixed(2)} $</span>
                ))}
              </div>
              <div className="safe-glass-elevated relative flex flex-wrap items-center gap-3 rounded-lg border p-4">
                <Button variant="glass">Aperçu</Button>
                <Button variant="glass">
                  <Plus className="h-4 w-4" aria-hidden />
                  Ajouter
                </Button>
                <Button variant="glass" disabled disabledReason="Sélectionnez d’abord une période">
                  Indisponible
                </Button>
                <Button>Certifier</Button>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-si-muted">
              La variante vitrée n’est employée que sur une surface réellement superposée. L’action
              qui engage, ici « Certifier », reste pleine et mate : une décision ne se lit pas à
              travers une vitre.
            </p>
          </div>

          <p className="text-xs leading-relaxed text-si-muted">
            Sans prise en charge du flou, ou lorsque la transparence réduite est demandée, les trois
            niveaux deviennent des surfaces pleines et la hiérarchie tient sur l’ombre et le filet.
          </p>
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Créer une note">
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-si-muted">
            Le focus est contenu dans la fenêtre et revient au déclencheur à la fermeture.
          </p>
          <Input label="Titre de la note" placeholder="Objet précis et actionnable" autoFocus />
          <div className="flex justify-end gap-3 border-t border-si-line pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={() => setModalOpen(false)}>Créer la note</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
