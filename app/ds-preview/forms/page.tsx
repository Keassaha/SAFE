"use client";

// Route JETABLE — démo de direction : en-tête forêt récurrent + formulaire
// (polices cohérentes, focus vert au clic). À supprimer après validation.
import { Card, CardTitle, CardSubtitle, Badge } from "@/components/ds-safe/core";
import { PageHero, HeroButtonPrimary, HeroButtonGhost } from "@/components/ds-safe/page-hero";
import { Field, Input, Select, Textarea, AmountInput, SegmentedControl } from "@/components/ds-safe/form";

export default function FormsPreviewPage() {
  return (
    <div className="min-h-screen bg-canvas p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Signature forêt récurrente */}
        <PageHero
          trail="Dossiers / Nouveau dossier"
          title="Nouveau dossier"
          subtitle="Ouvrez un dossier et rattachez-le à un client. Le numéro est attribué automatiquement."
          meta={
            <div className="text-right font-mono text-[12px] text-si-surface/70">
              Numéro attribué
              <br />
              <span className="text-si-surface">2026-0152</span>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr] items-start">
          {/* Colonne principale : le formulaire */}
          <div className="space-y-5">
            <Card className="px-[26px] py-6">
              <CardTitle>Identité du dossier</CardTitle>
              <CardSubtitle>Type de mandat et intitulé</CardSubtitle>
              <div className="mb-5">
                <SegmentedControl options={["Droit de la famille", "Litige civil", "Corporatif"]} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Intitulé du dossier" required full>
                  <Input placeholder="Tremblay c. Boulangerie du Coin" />
                </Field>
                <Field label="Client" required>
                  <Select>
                    <option>Tremblay, Marie</option>
                    <option>Boulangerie du Coin inc.</option>
                  </Select>
                </Field>
                <Field label="Avocat responsable">
                  <Select>
                    <option>Me Aaliyah Dérisier</option>
                  </Select>
                </Field>
                <Field label="Date d'ouverture">
                  <Input placeholder="JJ / MM / AAAA" />
                </Field>
                <Field label="Provision (fidéicommis)">
                  <AmountInput placeholder="2 500,00" />
                </Field>
              </div>
            </Card>

            <Card className="px-[26px] py-6">
              <CardTitle>Note interne</CardTitle>
              <CardSubtitle>Visible par votre cabinet uniquement</CardSubtitle>
              <Field full>
                <Textarea placeholder="Référé par Me Tremblay. Premier rendez-vous fixé au 26 juin." />
              </Field>
            </Card>
          </div>

          {/* Colonne latérale : carte forêt (la même signature) */}
          <aside className="space-y-5">
            <div className="relative overflow-hidden rounded-2xl bg-si-forest text-si-surface px-6 py-[22px]">
              <div aria-hidden className="absolute -left-12 -bottom-16 w-48 h-48 glow-verified" />
              <span className="relative z-10 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider bg-si-verified/25 text-[#9FE3C2] px-2.5 py-[5px] rounded-full mb-3.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5FCF9C]" />
                Fidéicommis
              </span>
              <div className="relative z-10 text-xs opacity-75">Provision à recevoir</div>
              <div className="relative z-10 font-mono text-[28px] mt-1 mb-0.5">2 500,00 $</div>
              <div className="relative z-10 text-[11.5px] opacity-[0.66]">Déposée au compte en fidéicommis du client</div>
            </div>

            <Card className="px-6 py-[22px]">
              <div className="flex items-center gap-[9px] mb-3.5">
                <span className="font-serif text-lg text-si-ink">Conflits d&apos;intérêts</span>
                <span className="ml-auto"><Badge tone="ok">vérifié</Badge></span>
              </div>
              <p className="text-[12.5px] text-si-muted leading-relaxed">
                Recherche dans tous vos dossiers actifs et fermés avant l&apos;ouverture du mandat.
              </p>
            </Card>
          </aside>
        </div>

        {/* Barre d'action */}
        <div className="flex items-center gap-3 rounded-2xl border border-si-line bg-si-surface px-6 py-4">
          <div className="text-xs text-si-muted">Le dossier pourra être modifié après sa création.</div>
          <div className="ml-auto flex items-center gap-3">
            <button className="rounded-lg border border-si-line px-4 py-2 text-sm font-medium text-si-muted hover:bg-si-canvas">
              Annuler
            </button>
            <button className="rounded-lg bg-si-forest px-4 py-2 text-sm font-medium text-si-surface hover:bg-si-forest-soft">
              Créer le dossier
            </button>
          </div>
        </div>

        {/* Aperçu d'un en-tête forêt avec actions (variante pour pages liste) */}
        <PageHero
          trail="Pratique"
          title="Dossiers"
          subtitle="Variante en-tête de page liste, avec actions claires sur le forêt."
          actions={
            <>
              <HeroButtonGhost>Exporter CSV</HeroButtonGhost>
              <HeroButtonPrimary>Nouveau dossier</HeroButtonPrimary>
            </>
          }
        />
      </div>
    </div>
  );
}
