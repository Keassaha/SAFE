import Link from "next/link";
import { Check } from "lucide-react";
import { DossierEtatCard } from "@/components/dossiers/DossierEtatCard";
import type { MissingItem, PreparationStatus } from "@/lib/dossiers/preparation-status";
import type { DossierResume } from "@/lib/dossiers/dossier-resume";

/**
 * Contrôle visuel du bloc « État du dossier ».
 *
 * Cinq premiers traitements refusés par le CEO le 2026-09-05 : tous
 * gardaient la même idée, un panneau d'avertissement qui liste des manques.
 * Ce tour change de direction, pas de décoration. Aucune information
 * supprimée : les cinq manquants, leur verbe, l'état et la prochaine action
 * sont présents dans chacune des trois pistes.
 *
 * Route hors navigation, sans base de données.
 */
export const dynamic = "force-dynamic";

const MANQUANTS: MissingItem[] = [
  {
    kind: "assistant",
    severity: "critical",
    label: "Aucune assistante juridique assignée",
    nextAction: "Assigner une assistante au dossier",
  },
  { kind: "mandate", severity: "critical", label: "Mandat absent", nextAction: "Créer le mandat" },
  {
    kind: "identity",
    severity: "critical",
    label: "Identité du client non vérifiée",
    nextAction: "Vérifier l'identité du client",
  },
  {
    kind: "billing_mode",
    severity: "critical",
    label: "Mode de facturation non défini",
    nextAction: "Définir le mode de facturation",
  },
  {
    kind: "cartable_section",
    severity: "warning",
    label: "1 section(s) cartable obligatoire(s) vide(s)",
    nextAction: "Compléter le cartable",
  },
];

const STATUS: PreparationStatus = {
  state: "incomplet",
  missingItems: MANQUANTS,
  nextAction: "Assigner une assistante au dossier",
  readyToBill: false,
};

const RESUME = {
  summary: "",
  lastActivity: null,
  nextAction: "Assigner une assistante au dossier",
  nearestDeadline: null,
} as unknown as DossierResume;

/* ═════════════════════════ Direction F ═════════════════════════
   « Le dossier tient lui-même la liste. »

   Le panneau d'état disparaît. Ce qui manque n'est pas un avertissement à
   côté du dossier : c'est une case vide DANS le dossier. On ne montre donc
   plus deux cartes qui parlent du même objet, mais une seule fiche où les
   lignes remplies se lisent normalement et les lignes vides portent leur
   verbe, à la place de la valeur.

   Rien n'est perdu : les cinq manquants sont là, avec leur action, et l'état
   global se lit au compte des lignes vides. */
function DirectionF() {
  const rempli = [
    ["Domaine de pratique", "droit famille"],
    ["Client", "Ateliers Beauport inc."],
    ["Ouvert le", "9 août 2026"],
    ["Avocat responsable", "Me Camille Roy"],
  ];
  const vide = [
    ["Assistante juridique", "Assigner une assistante"],
    ["Mandat", "Créer le mandat"],
    ["Identité du client", "Vérifier l'identité"],
    ["Mode de facturation", "Définir le mode"],
    ["Cartable", "Compléter la section manquante"],
  ];
  return (
    <div className="rounded-2xl border border-si-line bg-si-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-medium text-si-ink">Le dossier</h2>
        <span className="text-[13px] text-si-muted">
          4 lignes remplies, 5 encore vides
        </span>
      </div>

      <dl className="mt-3">
        {rempli.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-6 border-t border-si-line/70 py-2.5"
          >
            <dt className="shrink-0 text-[14px] text-si-muted">{k}</dt>
            <dd className="min-w-0 text-right text-[14px] text-si-ink">{v}</dd>
          </div>
        ))}
        {vide.map(([k, verbe]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-6 border-t border-si-line/70 py-2.5"
          >
            <dt className="shrink-0 text-[14px] text-si-ink">{k}</dt>
            <dd className="min-w-0 text-right">
              <Link
                href="#"
                className="text-[14px] font-medium text-si-ink-strong underline decoration-si-line underline-offset-4"
              >
                {verbe}
              </Link>
            </dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-si-line/70" />
      <p className="mt-3 text-[13px] text-si-muted">
        Le dossier sera complet quand ces cinq lignes seront remplies.
      </p>
    </div>
  );
}

/* ═════════════════════════ Direction G ═════════════════════════
   « Une phrase, dite comme une adjointe la dirait. »

   Aucune liste, aucune pastille, aucun encadré : un paragraphe court où
   chaque chose à faire est un lien dans la phrase. C'est la forme la plus
   éloignée du panneau d'avertissement, et la plus proche de ce qu'une
   collègue écrirait sur un post-it.

   L'information reste entière : cinq actions, leur ordre, et la conséquence
   (« avant d'envoyer une facture »). */
function DirectionG() {
  const Lien = ({ children }: { children: React.ReactNode }) => (
    <Link
      href="#"
      className="font-medium text-si-ink-strong underline decoration-si-line underline-offset-[3px]"
    >
      {children}
    </Link>
  );
  return (
    <div className="rounded-2xl border border-si-line bg-si-surface p-5">
      <p className="text-[16px] leading-[1.75] text-si-ink">
        Ce dossier est ouvert depuis 27 jours et personne n&apos;y a encore touché. Avant de
        pouvoir facturer, il faut <Lien>assigner une assistante</Lien>,{" "}
        <Lien>créer le mandat</Lien>, <Lien>vérifier l&apos;identité du client</Lien> et{" "}
        <Lien>définir le mode de facturation</Lien>. Il restera ensuite{" "}
        <Lien>une section du cartable à remplir</Lien>, moins pressante.
      </p>
      <p className="mt-4 border-t border-si-line/70 pt-3 text-[13px] text-si-muted">
        Commencez par l&apos;assistante : c&apos;est elle qui fera le reste.
      </p>
    </div>
  );
}

/* ═════════════════════════ Direction H ═════════════════════════
   « Le bordereau d'ouverture. »

   Référence au monde du cabinet, pas au monde du logiciel : la feuille de
   constitution qu'une adjointe coche à l'ouverture d'un dossier. Deux
   colonnes, des points de conduite, un crochet à l'encre pour ce qui est
   fait, une ligne à remplir pour ce qui ne l'est pas.

   Le crochet et le vide portent le sens ; la couleur ne sert plus à rien,
   donc elle disparaît. Ce qui est fait reste visible, ce qui manque se
   signe d'un clic. */
function DirectionH() {
  const lignes: Array<[string, string | null]> = [
    ["Conflit d'intérêts vérifié", "Me Camille Roy, 9 août"],
    ["Client rattaché", "Ateliers Beauport inc."],
    ["Avocat responsable désigné", "Me Camille Roy"],
    ["Assistante juridique assignée", null],
    ["Mandat au dossier", null],
    ["Identité du client vérifiée", null],
    ["Mode de facturation arrêté", null],
    ["Cartable obligatoire complété", null],
  ];
  return (
    <div className="rounded-2xl border border-si-line bg-si-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-si-line pb-3">
        <h2 className="text-[15px] font-medium text-si-ink">Constitution du dossier</h2>
        <span className="text-[13px] tabular-nums text-si-muted">3 de 8</span>
      </div>

      <ul className="mt-1">
        {lignes.map(([libelle, valeur]) => (
          <li key={libelle} className="flex items-baseline gap-3 py-[9px]">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center self-center">
              {valeur ? (
                <Check className="h-3.5 w-3.5 text-si-ink" aria-hidden />
              ) : (
                <span className="h-3.5 w-3.5 rounded-[3px] border border-si-line-ink/35" aria-hidden />
              )}
            </span>
            <span
              className={`shrink-0 text-[14px] ${valeur ? "text-si-muted" : "text-si-ink"}`}
            >
              {libelle}
            </span>
            <span
              aria-hidden
              className="min-w-6 flex-1 translate-y-[-3px] border-b border-dotted border-si-line-ink/30"
            />
            {valeur ? (
              <span className="shrink-0 text-[13px] text-si-muted">{valeur}</span>
            ) : (
              <Link
                href="#"
                className="shrink-0 text-[13px] font-medium text-si-ink-strong underline decoration-si-line underline-offset-4"
              >
                à faire
              </Link>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-2 border-t border-si-line pt-3 text-[13px] text-si-muted">
        Cinq lignes à signer avant que le dossier puisse être facturé. Commencez par
        l&apos;assistante.
      </p>
    </div>
  );
}

function Colonne({
  titre,
  note,
  children,
}: {
  titre: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-[420px] max-w-[560px] flex-1">
      <p className="mb-1 text-[13px] font-medium text-si-ink">{titre}</p>
      <p className="mb-3 text-[12px] leading-relaxed text-si-muted">{note}</p>
      {children}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-si-canvas p-8">
      <h1 className="mb-1 text-[17px] font-medium text-si-ink">
        État du dossier — trois directions, pas trois habillages
      </h1>
      <p className="mb-6 text-[13px] text-si-muted">
        Mêmes données que la capture du 2026-09-05 (dossier 2026-086). Les cinq manquants et
        leur action sont présents partout.
      </p>
      <div className="flex flex-wrap gap-6">
        <Colonne titre="Actuel" note="Pour mémoire.">
          <DossierEtatCard resume={RESUME} status={STATUS} nextActionHref="#" />
        </Colonne>
        <Colonne
          titre="F — le dossier tient lui-même la liste"
          note="Le panneau d'état disparaît. Un manque n'est plus un avertissement à côté du dossier, c'est une ligne vide dedans."
        >
          <DirectionF />
        </Colonne>
        <Colonne
          titre="G — une phrase, comme une collègue l'écrirait"
          note="Aucune liste. Un paragraphe où chaque chose à faire est un lien, et la conséquence est dite."
        >
          <DirectionG />
        </Colonne>
        <Colonne
          titre="H — le bordereau d'ouverture"
          note="La feuille de constitution du cabinet : crochet pour ce qui est fait, ligne à remplir pour ce qui manque."
        >
          <DirectionH />
        </Colonne>
      </div>
    </main>
  );
}
