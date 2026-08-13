/**
 * Laboratoire d'accent — choix de la couleur d'action.
 *
 * Le canevas Ardoise est froid. Le vert forêt y sonne comme une pièce
 * rapportée, ce que le CEO a vu tout de suite. Cette page met les candidats
 * dans le contexte où la décision se prend vraiment : un bouton d'action au
 * repos et au survol, un lien, une ligne sélectionnée, une bande d'en-tête.
 *
 * Aucune valeur n'est ici en dur pour la production : ce sont des candidats.
 * Le retenu ira dans `lib/ds/palettes.ts`, et lui seul.
 *
 * Route publique, temporaire. À retirer une fois l'accent tranché.
 */
export const dynamic = "force-static";

type Candidat = {
  id: string;
  nom: string;
  famille: "vert" | "bleu" | "pétrole";
  intention: string;
  /** Couleur d'action au repos. */
  action: string;
  /** Couleur au survol. Plus claire, jamais plus vive. */
  survol: string;
  /** Teinte de sélection de ligne, l'action à très faible opacité. */
  tint: string;
};

const CANDIDATS: Candidat[] = [
  {
    id: "bleu-nuit",
    nom: "Bleu nuit",
    famille: "bleu",
    intention: "Presque l'encre. L'action se distingue par la surface pleine, pas par la teinte.",
    action: "#12283F",
    survol: "#1C3A56",
    tint: "rgba(18, 40, 63, 0.07)",
  },
  {
    id: "bleu-encre",
    nom: "Bleu encre",
    famille: "bleu",
    intention: "Le bleu le plus sobre qui se lise encore comme une couleur, pas comme du noir.",
    action: "#16304C",
    survol: "#204263",
    tint: "rgba(22, 48, 76, 0.07)",
  },
  {
    id: "bleu-ardoise",
    nom: "Bleu ardoise",
    famille: "bleu",
    intention: "Prolonge la température du canevas. L'accent semble né de la page.",
    action: "#1C3A5A",
    survol: "#264C72",
    tint: "rgba(28, 58, 90, 0.07)",
  },
  {
    id: "bleu-acier",
    nom: "Bleu acier",
    famille: "bleu",
    intention: "Un cran plus présent. Le bouton se repère de loin sans crier.",
    action: "#21456B",
    survol: "#2C5885",
    tint: "rgba(33, 69, 107, 0.07)",
  },
  {
    id: "petrole",
    nom: "Pétrole",
    famille: "pétrole",
    intention: "Entre les deux familles. Garde une trace du vert dans une lecture froide.",
    action: "#10404A",
    survol: "#175360",
    tint: "rgba(16, 64, 74, 0.07)",
  },
];

function Bloc({ c }: { c: Candidat }) {
  return (
    <section className="border-b border-si-line py-8 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[16px] font-medium text-si-ink">{c.nom}</h2>
        <span className="text-[11px] uppercase tracking-[0.08em] text-si-subtle">{c.famille}</span>
        <span className="font-mono text-[12px] text-si-muted">
          {c.action} · survol {c.survol}
        </span>
      </div>
      <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-si-muted">{c.intention}</p>

      <div className="mt-5 flex flex-wrap items-start gap-8">
        {/* Action principale : repos, survol figé, et un exemplaire réellement survolable. */}
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-si-subtle">
            Action principale
          </p>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-11 items-center justify-center rounded-md px-6 text-[14px] font-medium text-white"
              style={{ background: c.action }}
            >
              Se connecter
            </span>
            <span
              className="inline-flex h-11 items-center justify-center rounded-md px-6 text-[14px] font-medium text-white"
              style={{ background: c.survol }}
            >
              Se connecter
            </span>
            {/* Survol réel, en CSS pur : la page reste un composant serveur. */}
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--repos)] px-6 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[var(--survol)]"
              style={{ "--repos": c.action, "--survol": c.survol } as React.CSSProperties}
            >
              Survolez-moi
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-si-subtle">repos · survol · essai</p>
        </div>

        {/* Action secondaire et lien : l'accent doit tenir aussi en texte. */}
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-si-subtle">
            Texte et bordure
          </p>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-11 items-center justify-center rounded-md border px-5 text-[14px] font-medium"
              style={{ borderColor: c.action, color: c.action }}
            >
              Exporter
            </span>
            <a
              href="#"
              className="text-[14px] underline underline-offset-4"
              style={{ color: c.action }}
            >
              Oublié ?
            </a>
          </div>
        </div>
      </div>

      {/* Registre : l'accent en sélection de ligne et en en-tête plein. */}
      <div className="mt-6 overflow-hidden rounded-lg border border-si-line bg-si-surface">
        <div
          className="flex items-center justify-between px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] text-white"
          style={{ background: c.action }}
        >
          <span>Bande pleine</span>
          <span className="font-mono">128 450,75 $</span>
        </div>
        <div className="divide-y divide-si-line2">
          <div className="flex items-center justify-between px-4 py-2.5 text-[13px]">
            <span className="text-si-ink">Groupe immobilier Northfield</span>
            <span className="font-mono tabular-nums text-si-ink">1 284 300,50 $</span>
          </div>
          <div
            className="flex items-center justify-between px-4 py-2.5 text-[13px]"
            style={{ background: c.tint, boxShadow: `inset 2px 0 0 ${c.action}` }}
          >
            <span className="text-si-ink">Ligne sélectionnée</span>
            <span className="font-mono tabular-nums text-si-ink">12 450,00 $</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-[13px]">
            <span className="text-si-ink">Lafleur, Amélie</span>
            <span className="font-mono tabular-nums text-si-ink">3 890,25 $</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LaboratoireAccent() {
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-si-line pb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">
            Aperçu design
          </p>
          <h1 className="mt-1 font-serif text-[32px] leading-tight text-si-ink">
            Couleur d&apos;action
          </h1>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-relaxed text-si-muted">
            Le vert est écarté, y compris assombri : il ne tient pas sur un canevas froid. Cinq bleus, dans le contexte où
            la décision se prend : bouton au repos et au survol, texte, bordure, bande pleine,
            ligne sélectionnée. Les couleurs de statut ne changent pas : validé, échéance et
            erreur gardent leur grammaire.
          </p>
        </header>

        {CANDIDATS.map((c) => (
          <Bloc key={c.id} c={c} />
        ))}

        <footer className="border-t border-si-line py-6 text-[13px] leading-relaxed text-si-muted">
          Bleu ardoise est installé dans le produit. Cette page sert à l&apos;ajuster. Le retenu vit dans <code className="font-mono">lib/ds/palettes.ts</code>,
          et tout ce qui utilise <code className="font-mono">si-forest</code> suivra sans qu&apos;un
          seul écran soit touché.
        </footer>
      </div>
    </div>
  );
}
