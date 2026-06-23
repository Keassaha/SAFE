import { Card, CardTitle, CardSubtitle } from "@/components/ui/core";
import {
  Field,
  Input,
  Select,
  Textarea,
  AmountInput,
  SegmentedControl,
} from "@/components/ui/form";
import { PageHead } from "@/components/shell/page-head";
import { ActionBar } from "@/components/shell/action-bar";
import { PRACTICE_AREAS, LAWYERS, nextDossierId } from "@/lib/data";

export default function NouveauDossierPage() {
  return (
    <div className="px-9 pt-7 pb-[110px]">
      <PageHead
        trail="Dossiers"
        current="Nouveau dossier"
        title="Nouveau dossier"
        idLabel="Numéro attribué"
        idValue={nextDossierId}
      />

      <div className="grid grid-cols-[1.5fr_1fr] gap-5 items-start">
        {/* Colonne principale */}
        <div>
          <Card className="px-[26px] py-6 mb-5">
            <CardTitle>Renseignements du dossier</CardTitle>
            <CardSubtitle>Client, domaine de droit et objet du mandat</CardSubtitle>

            <Field label="Client" required full>
              <div className="flex items-center gap-3 bg-canvas border border-line rounded-xl px-3.5 py-3">
                <div className="w-[34px] h-[34px] rounded-full bg-forest text-white grid place-items-center font-serif text-base shrink-0">
                  L
                </div>
                <div>
                  <div className="text-sm font-medium">Marc Lavoie</div>
                  <div className="text-xs text-muted">CLI-2026-038 · Gatineau</div>
                </div>
                <div className="ml-auto text-[12.5px] text-verified font-medium cursor-pointer">
                  Changer
                </div>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Domaine de droit" required>
                <Select defaultValue="Droit immobilier">
                  {PRACTICE_AREAS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Avocat responsable">
                <Select>
                  {LAWYERS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Objet du mandat" required full>
                <Textarea placeholder="Litige relatif à un contrat de construction résidentielle, réclamation pour vices cachés." />
              </Field>
              <Field label="Date d'ouverture">
                <Input defaultValue="22 / 06 / 2026" />
              </Field>
              <Field label="Partie adverse">
                <Input placeholder="Constructions Rivard inc." />
              </Field>
            </div>
          </Card>

          <Card className="px-[26px] py-6">
            <CardTitle>Facturation et fidéicommis</CardTitle>
            <CardSubtitle>
              Mode de facturation et provision déposée pour le client
            </CardSubtitle>

            <Field label="Mode de facturation" full>
              <SegmentedControl
                options={["Taux horaire", "Forfait", "Provision"]}
                fill
              />
            </Field>

            <div className="grid grid-cols-2 gap-4 mt-1">
              <Field label="Taux horaire">
                <AmountInput defaultValue="285,00" />
              </Field>
              <Field label="Provision à déposer en fidéicommis">
                <AmountInput defaultValue="5 000,00" />
              </Field>
            </div>
          </Card>
        </div>

        {/* Colonne laterale */}
        <aside>
          <Card className="px-6 py-[22px] mb-5">
            <CardTitle className="mb-4">Récapitulatif</CardTitle>
            {[
              ["Numéro de dossier", nextDossierId, true],
              ["Client", "Marc Lavoie", false],
              ["Domaine", "Droit immobilier", false],
              ["Facturation", "285,00 $ / h", false],
              ["Provision", "5 000,00 $", true],
            ].map(([k, v, mono], i) => (
              <div
                key={k as string}
                className={
                  "flex justify-between items-baseline py-2.5" +
                  (i > 0 ? " border-t border-line2" : "")
                }
              >
                <span className="text-[12.5px] text-muted">{k}</span>
                <span
                  className={
                    "text-[13.5px] text-right " +
                    (mono ? "font-mono" : "font-medium")
                  }
                >
                  {v}
                </span>
              </div>
            ))}
          </Card>

          <div className="relative overflow-hidden bg-forest text-surface rounded-2xl px-6 py-[22px]">
            <div className="absolute -right-[50px] -bottom-[70px] w-[200px] h-[200px] glow-verified" />
            <span className="relative z-10 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider bg-verified/25 text-[#9FE3C2] px-2.5 py-[5px] rounded-full mb-3.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5FCF9C]" />
              Conforme B-1 r.5
            </span>
            <div className="relative z-10 text-xs opacity-75">
              La provision sera déposée dans
            </div>
            <div className="relative z-10 font-mono text-[26px] mt-1 mb-2">
              le compte en fidéicommis
            </div>
            <p className="relative z-10 text-[11.5px] opacity-[0.68] leading-relaxed">
              Le montant est rattaché automatiquement au dossier et apparaîtra
              dans le prochain rapprochement mensuel. Aucune écriture manuelle
              requise.
            </p>
          </div>
        </aside>
      </div>

      <ActionBar
        note="À la création, un Employé Virtuel préparera l'écriture de dépôt en fidéicommis."
        confirmLabel="Ouvrir le dossier"
      />
    </div>
  );
}
