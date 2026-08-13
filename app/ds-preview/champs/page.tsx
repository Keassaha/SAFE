import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * Spécimen : lisibilité des surfaces et des champs.
 *
 * Réponse au constat du CEO : « les différents fonds sont mêlés aux différents
 * formulaires et les champs cliquables ». Ce n'était pas une impression. La
 * bordure d'un champ atteignait 1,32 de rapport de contraste sur sa propre
 * carte, quand WCAG 1.4.11 en exige 3,00 pour qu'un bord de composant soit
 * perceptible.
 *
 * La colonne de gauche rejoue les anciennes valeurs en dur. La droite emploie
 * les primitives réelles. Route publique, temporaire.
 */
export const dynamic = "force-static";

/* Anciennes valeurs, figées ici pour la comparaison. Ne rien y puiser. */
const AVANT = {
  canvas: "#F1F2F4",
  surface: "#FFFFFF",
  champFond: "#FFFFFF",
  champBord: "rgba(26,26,26,0.11)",
  libelle: "#65686B",
};

function Etiquette({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">{children}</p>
  );
}

function Marche({ nom, valeur, role }: { nom: string; valeur: string; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-10 w-10 shrink-0 rounded-md border border-si-line"
        style={{ background: valeur }}
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-si-ink">{nom}</span>
        <span className="block font-mono text-[11px] text-si-muted">{valeur}</span>
      </span>
      <span className="ml-auto text-right text-[12px] text-si-muted">{role}</span>
    </div>
  );
}

export default function SpecimenChamps() {
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <header className="max-w-[65ch]">
          <Etiquette>Spécimen</Etiquette>
          <h1 className="mt-2 font-serif text-[34px] leading-[1.15] text-si-ink">
            Surfaces et champs
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-si-body">
            Un champ de saisie doit se voir sans qu&apos;on le cherche. Voici la même
            composition avec l&apos;ancienne échelle de surfaces, puis avec la nouvelle.
          </p>
        </header>

        {/* ── L'échelle, énoncée ─────────────────────────────────────────── */}
        <section className="mt-14">
          <Etiquette>Trois marches, trois rôles</Etiquette>
          <div className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Marche nom="Page" valeur="#EBEDEF" role="le fond sur lequel tout repose" />
            <Marche nom="Carte" valeur="#FFFFFF" role="un objet posé sur la page" />
            <Marche nom="Creux" valeur="#F4F5F7" role="un endroit où l’on écrit" />
            <Marche nom="Filet" valeur="#D6D9DD" role="sépare sans peser" />
            <Marche nom="Bord de contrôle" valeur="#888E94" role="3,31:1 sur carte · 3,03:1 sur creux" />
            <Marche nom="Encre" valeur="#1A1A1A" role="texte et action" />
          </div>
        </section>

        {/* ── La comparaison ─────────────────────────────────────────────── */}
        <section className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* AVANT */}
          <div>
            <Etiquette>Avant</Etiquette>
            <p className="mt-2 text-[13px] leading-relaxed text-si-muted">
              Page, carte et champ tenaient dans 1,12 de rapport. La bordure du champ
              plafonnait à 1,32.
            </p>
            <div
              className="mt-5 rounded-xl p-7"
              style={{ background: AVANT.canvas }}
            >
              <div className="rounded-xl p-6" style={{ background: AVANT.surface }}>
                <p className="text-[15px] font-medium" style={{ color: "#1A1A1A" }}>
                  Nouveau client
                </p>
                <div className="mt-5 space-y-4">
                  {["Raison sociale", "Courriel", "Téléphone"].map((l) => (
                    <div key={l}>
                      <label
                        className="mb-1.5 block text-xs font-medium"
                        style={{ color: AVANT.libelle }}
                      >
                        {l}
                      </label>
                      <div
                        className="h-11 rounded-md border px-3 text-sm leading-[44px]"
                        style={{
                          background: AVANT.champFond,
                          borderColor: AVANT.champBord,
                          color: "#8C8F93",
                        }}
                      >
                        Saisissez une valeur
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* APRÈS */}
          <div>
            <Etiquette>Après</Etiquette>
            <p className="mt-2 text-[13px] leading-relaxed text-si-muted">
              La carte se détache de la page, le champ se creuse dans la carte, et sa
              bordure passe le seuil de perceptibilité.
            </p>
            <div className="mt-5 rounded-xl bg-si-canvas p-7">
              <div className="rounded-xl border border-si-line bg-si-surface p-6">
                <p className="text-[15px] font-medium text-si-ink">Nouveau client</p>
                {/* 24 px entre les champs : on respire sans se disperser. */}
                <div className="mt-6 space-y-6">
                  <Input label="Raison sociale" placeholder="Saisissez une valeur" />
                  <Input label="Courriel" type="email" placeholder="nom@cabinet.ca" />
                  <Input label="Téléphone" placeholder="514 555-0100" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── La matrice d'états ─────────────────────────────────────────── */}
        <section className="mt-16">
          <Etiquette>Chaque état se distingue</Etiquette>
          <p className="mt-2 max-w-[65ch] text-[13px] leading-relaxed text-si-muted">
            Survolez et tabulez. Aucun état ne repose sur la seule couleur : le focus
            ajoute un anneau et blanchit le fond, l&apos;erreur ajoute un message.
          </p>
          <div className="mt-6 rounded-xl border border-si-line bg-si-surface p-7">
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Repos" placeholder="Vide" />
              <Input label="Rempli" defaultValue="Cabinet Tremblay et Associés" />
              <Input label="Avec indication" placeholder="0,00" hint="Montant en dollars canadiens" />
              <Input label="Erreur" defaultValue="nom@" error="Ce courriel est incomplet." />
              <Input label="Désactivé" defaultValue="Attribué automatiquement" disabled />
              <div className="flex items-end">
                <Button type="button" className="w-full">
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── La respiration ─────────────────────────────────────────────── */}
        <section className="mt-16">
          <Etiquette>L&apos;espace dit ce qui va ensemble</Etiquette>
          <div className="mt-6 rounded-xl border border-si-line bg-si-surface p-8">
            <div className="max-w-[62ch]">
              <p className="text-[15px] font-medium text-si-ink">Identité du client</p>
              {/* 8 px : le titre et sa description forment un seul bloc. */}
              <p className="mt-2 text-[13px] leading-relaxed text-si-muted">
                Ce que le cabinet doit pouvoir retrouver en cherchant une personne.
              </p>
            </div>
            <div className="mt-6 grid max-w-[62ch] gap-6 sm:grid-cols-2">
              <Input label="Prénom" placeholder="Sophie" />
              <Input label="Nom" placeholder="Tremblay" />
            </div>

            {/* 48 px : une autre section commence. L'écart fait la coupure,
                pas un filet de plus. */}
            <div className="mt-12 max-w-[62ch]">
              <p className="text-[15px] font-medium text-si-ink">Coordonnées</p>
              <p className="mt-2 text-[13px] leading-relaxed text-si-muted">
                Utilisées pour la transmission des factures et des documents.
              </p>
            </div>
            <div className="mt-6 grid max-w-[62ch] gap-6 sm:grid-cols-2">
              <Input label="Courriel" type="email" placeholder="nom@cabinet.ca" />
              <Input label="Téléphone" placeholder="514 555-0100" />
            </div>
          </div>
        </section>

        <footer className="mt-16 max-w-[65ch] border-t border-si-line pt-6 text-[13px] leading-relaxed text-si-muted">
          Si l&apos;écart entre la page, la carte et le champ vous convient, il se
          propage à tous les écrans : il vit dans{" "}
          <code className="font-mono">lib/ds/palettes.ts</code> et dans la primitive{" "}
          <code className="font-mono">Input</code>, pas dans les pages.
        </footer>
      </div>
    </div>
  );
}
