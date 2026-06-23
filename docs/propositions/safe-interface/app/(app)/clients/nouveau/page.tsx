import { Card, CardTitle, CardSubtitle, Badge } from "@/components/ui/core";
import {
  Field,
  Input,
  Select,
  Textarea,
  SegmentedControl,
} from "@/components/ui/form";
import { PageHead } from "@/components/shell/page-head";
import { ActionBar } from "@/components/shell/action-bar";
import { nextClientId } from "@/lib/data";

export default function NouveauClientPage() {
  return (
    <div className="px-9 pt-7 pb-[110px]">
      <PageHead
        trail="Clients"
        current="Nouveau client"
        title="Nouveau client"
        idLabel="Numéro attribué"
        idValue={nextClientId}
      />

      <div className="grid grid-cols-[1.5fr_1fr] gap-5 items-start">
        {/* Colonne principale */}
        <div>
          <Card className="px-[26px] py-6 mb-5">
            <CardTitle>Identité</CardTitle>
            <CardSubtitle>Type de client et renseignements de base</CardSubtitle>
            <div className="mb-5">
              <SegmentedControl options={["Particulier", "Entreprise"]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom" required>
                <Input placeholder="Marc" />
              </Field>
              <Field label="Nom" required>
                <Input placeholder="Lavoie" />
              </Field>
              <Field label="Date de naissance">
                <Input placeholder="JJ / MM / AAAA" />
              </Field>
              <Field label="Langue de correspondance">
                <Select>
                  <option>Français</option>
                  <option>Anglais</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="px-[26px] py-6 mb-5">
            <CardTitle>Coordonnées</CardTitle>
            <CardSubtitle>Pour la facturation et les communications</CardSubtitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Courriel" required>
                <Input placeholder="marc.lavoie@courriel.ca" />
              </Field>
              <Field label="Téléphone">
                <Input placeholder="819 555 0142" />
              </Field>
              <Field label="Adresse" full>
                <Input placeholder="142 rue Notre-Dame" />
              </Field>
              <Field label="Ville">
                <Input placeholder="Gatineau" />
              </Field>
              <Field label="Code postal">
                <Input placeholder="J8X 1A4" />
              </Field>
            </div>
          </Card>

          <Card className="px-[26px] py-6">
            <CardTitle>Note interne</CardTitle>
            <CardSubtitle>Visible par votre cabinet uniquement</CardSubtitle>
            <Field label="" full>
              <Textarea placeholder="Référé par Me Tremblay. Premier rendez-vous fixé au 26 juin." />
            </Field>
          </Card>
        </div>

        {/* Colonne laterale */}
        <aside>
          <Card className="px-6 py-[22px] mb-5">
            <div className="flex items-center gap-[9px] mb-3.5">
              <span className="font-serif text-lg">Conflits d'intérêts</span>
              <span className="ml-auto">
                <Badge tone="ok">vérifié</Badge>
              </span>
            </div>
            <p className="text-[12.5px] text-muted leading-relaxed my-3">
              Recherche dans tous vos dossiers actifs et fermés avant l'ouverture
              du mandat.
            </p>
            <div className="flex gap-2 mt-1">
              <input
                defaultValue="Marc Lavoie"
                readOnly
                className="flex-1 font-sans text-[13px] border border-line rounded-[9px] px-3 py-2.5 outline-none focus:border-verified focus:ring-2 focus:ring-verified/15"
              />
              <button className="font-sans text-[13px] border-none bg-forest text-surface rounded-[9px] px-4 cursor-pointer">
                Vérifier
              </button>
            </div>
            <div className="flex items-center gap-[11px] bg-verified/10 rounded-xl px-3.5 py-3 mt-3.5">
              <div className="w-[26px] h-[26px] rounded-lg bg-verified text-white grid place-items-center text-sm shrink-0">
                ✓
              </div>
              <div>
                <div className="text-[13px] font-medium text-verified">
                  Aucun conflit détecté
                </div>
                <div className="text-[11.5px] text-muted">
                  0 correspondance sur 214 dossiers
                </div>
              </div>
            </div>
          </Card>

          <Card className="px-6 py-[22px]">
            <div className="flex items-center gap-[9px] mb-3.5">
              <span className="font-serif text-lg">Identification du client</span>
              <span className="ml-auto">
                <Badge tone="warn">à compléter</Badge>
              </span>
            </div>
            <p className="text-[12.5px] text-muted leading-relaxed my-3">
              Obligation du Barreau. Joignez une pièce d'identité valide pour
              vérifier l'identité.
            </p>
            <div className="border border-dashed border-ink/20 rounded-xl p-4 text-center text-[12.5px] text-muted cursor-pointer">
              <b className="text-verified font-medium">Téléverser une pièce</b> ou
              glisser un fichier ici
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2.5 text-[12.5px] py-[9px] border-t border-line2">
                <div className="w-[22px] h-[22px] rounded-md bg-canvas grid place-items-center text-[11px] text-muted">
                  ID
                </div>
                Permis de conduire
                <span className="ml-auto text-verified text-[13px]">✓</span>
              </div>
              <div className="flex items-center gap-2.5 text-[12.5px] py-[9px] border-t border-line2">
                <div className="w-[22px] h-[22px] rounded-md bg-canvas grid place-items-center text-[11px] text-muted">
                  PJ
                </div>
                Justificatif d'adresse
                <span className="ml-auto text-muted">requis</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <ActionBar
        note="Le client pourra être rattaché à un dossier dès sa création."
        confirmLabel="Créer le client"
      />
    </div>
  );
}
