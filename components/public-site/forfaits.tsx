"use client";

/**
 * Les forfaits SAFE, une seule fois pour tout le site public.
 *
 * ── Refonte du 2026-09-03 ────────────────────────────────────────────────────
 * Trois jeux de règles concurrents cohabitaient ici (`reglesForfaits`,
 * `reglesForfaitsPar`, `reglesPricingGrid`), dont deux n'étaient plus appelées.
 * PS-091 interdit les coquilles concurrentes : il n'en reste qu'une.
 *
 * La composition vient de la logique d'ElevenLabs, mesurée sur leur page :
 *
 *   1. un CUBE tarifaire, qui ne porte que la décision (catégorie, nom, prix) ;
 *   2. le bouton, DIRECTEMENT SOUS le cube, jamais dedans ;
 *   3. les détails, sous le bouton, hors du cube.
 *
 * Rien d'autre ne leur est emprunté. Ni la teinte, ni la fonte, ni les rayons,
 * ni les icônes : tout vient des jetons SAFE.
 *
 * Pourquoi le cube est séparé du reste. La carte d'un seul tenant obligeait à
 * choisir entre deux maux : égaliser les hauteurs et ouvrir un vide au milieu
 * de la colonne courte, ou les laisser libres et désaligner les deux boutons.
 * En trois pièces, seul le cube s'égalise ; les boutons tombent donc au même
 * niveau et les listes commencent à la même ligne, quelle que soit leur
 * longueur.
 *
 * Les prix viennent de `lib/tarification.ts`, jamais d'une chaîne écrite ici.
 * Le palier Cabinet vaut 149,99 $ et non 149 $ : c'est ce que Stripe facture
 * réellement, et un prix arrondi sur la vitrine deviendrait un écart dès la
 * première facture (PS-012).
 */

import React from "react";
import { Rocket, Users, DoorOpen, Download, Eye } from "lucide-react";
import { TARIFICATION, prixFr } from "@/lib/tarification";

/* ── Ce que chaque forfait contient ───────────────────────────────────────────
   Cinq lignes chacun, toutes vérifiées dans le produit avant d'être écrites :
   les rôles et les accès partagés vivent dans `lib/auth/permissions.ts`
   (`avocat`, `assistante`, `comptabilite`, `admin_cabinet`), le fidéicommis et
   ses rapprochements dans le module de comptabilité. Rien n'est promis ici qui
   ne soit à l'écran. */
const COMPRIS_SOLO: readonly string[] = [
  "Clients et dossiers",
  "Temps et fiches de temps",
  "Facturation et paiements",
  "Fidéicommis et rapprochements",
  "Mise en route comprise",
];

const EN_PLUS_CABINET: readonly string[] = [
  "Accès pour l'adjointe et l'équipe",
  "Travail partagé sur les dossiers",
  "Rôles et permissions",
  "Accès partagé à la facturation",
  "Mise en route de l'équipe comprise",
];

/** Un forfait, tel qu'il se lit à l'écran. */
type Forfait = {
  readonly cle: "solo" | "cabinet";
  readonly categorie: string;
  readonly nom: string;
  /** Le prix mensuel affiché, selon la période choisie. */
  readonly parMois: number;
  /** Ce qui est réellement porté à la facture sur douze mois. */
  readonly parAn: number;
  readonly recommande: boolean;
  readonly action: string;
  readonly entete: string;
  readonly detail: readonly string[];
};

/* ── Le cube ──────────────────────────────────────────────────────────────────
   Il ne porte QUE ce qui sert à décider : la catégorie, le nom, le prix, la
   mention de facturation. Pas le bouton, pas les détails, pas d'illustration.

   Le nom est en haut, le prix en bas : c'est le pousseur `.cube-vide` qui
   creuse entre les deux, et c'est lui qui permet aux deux cubes de tenir la
   même hauteur sans qu'on ait à la fixer en pixels.

   `safe-zoom` est la classe de sélection du produit (globals.css, décision CEO
   du 2026-08-11) : partout où une surface se choisit, elle se soulève. On ne
   réécrit pas son mouvement ici, on l'emprunte. */
function Cube({ f, annuel }: { f: Forfait; annuel: boolean }) {
  return (
    <div className={`cube safe-zoom${f.recommande ? " cube-recommande" : ""}`}>
      <p className="cube-categorie">{f.categorie}</p>
      {f.recommande ? (
        <p className="cube-marque">
          <span className="cube-coche" aria-hidden="true" />
          Recommandé
        </p>
      ) : null}
      <p className="cube-nom">{f.nom}</p>

      <div className="cube-vide" />

      {/* La période change, pas la place du prix : le nombre est remplacé par
          React (la clé le force), donc son fondu rejoue, mais l'unité et la
          mention gardent leur ligne. */}
      <p className="cube-prix">
        <span className="prix-nombre" key={`${f.cle}-${annuel}`}>
          {prixFr(f.parMois)}
        </span>
        <span className="prix-unite">$ / mois</span>
      </p>
      <p className="cube-mention">
        {annuel
          ? `${prixFr(f.parAn)} $ facturés annuellement`
          : "Facturation mensuelle, résiliable en tout temps"}
      </p>
    </div>
  );
}

/**
 * Les deux forfaits réguliers, et le sélecteur de période qui les commande.
 *
 * L'état vit ici et non dans la page : la période ne concerne que ces deux
 * colonnes, et une page qui la porterait la ferait descendre à travers trois
 * niveaux de composants pour rien.
 */
export function CartesTarifs({ action }: { action: string }) {
  const [annuel, setAnnuel] = React.useState(false);
  const p = TARIFICATION.paliers;

  /* Le prix mensuel affiché est déjà le prix annualisé quand la période est
     annuelle : `prixAnnuel` porte le montant PAR MOIS de cette formule, et le
     total facturé s'en déduit par douze. */
  const forfaits: readonly Forfait[] = [
    {
      cle: "solo",
      categorie: "Pratique individuelle",
      nom: "Solo",
      parMois: annuel ? p.solo.prixAnnuel : p.solo.prix,
      parAn: p.solo.prixAnnuel * 12,
      recommande: false,
      action: "Choisir Solo",
      entete: "Inclus dans Solo",
      detail: COMPRIS_SOLO,
    },
    {
      cle: "cabinet",
      categorie: "Travail en équipe",
      nom: "Cabinet",
      parMois: annuel ? p.cabinet.prixAnnuel : p.cabinet.prix,
      parAn: p.cabinet.prixAnnuel * 12,
      recommande: true,
      action: "Choisir Cabinet",
      entete: "Tout ce qui est dans Solo, plus",
      detail: EN_PLUS_CABINET,
    },
  ];

  return (
    <div className="tarifs">
      {/* ── Le sélecteur de période ────────────────────────────────────────
          Deux boutons dans un rail, et un pouce qui glisse de l'un à l'autre.
          `aria-pressed` porte l'état : la position du pouce est un renfort
          visuel, jamais la seule information (PS-052). */}
      <div className="periode" role="group" aria-label="Période de facturation">
        <span className={`periode-pouce${annuel ? " a-droite" : ""}`} aria-hidden="true" />
        <button
          type="button"
          className="periode-choix"
          aria-pressed={!annuel}
          onClick={() => setAnnuel(false)}
        >
          Mensuel
        </button>
        <button
          type="button"
          className="periode-choix"
          aria-pressed={annuel}
          onClick={() => setAnnuel(true)}
        >
          Annuel <span className="periode-gain">2 mois offerts</span>
        </button>
      </div>

      {/* ── Les deux colonnes ──────────────────────────────────────────────── */}
      <div className="colonnes">
        {forfaits.map((f) => (
          <div className="colonne" key={f.cle}>
            <Cube f={f} annuel={annuel} />

            <a
              className={`tarif-action${f.recommande ? " pleine" : ""}`}
              href={action}
              aria-label={`${f.action}, ${prixFr(f.parMois)} dollars par mois`}
            >
              {f.action}
            </a>

            <div className="tarif-detail">
              <p className="detail-entete">{f.entete}</p>
              <ul className="detail-liste">
                {f.detail.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <p className="tarifs-note">
        La mise en route est comprise. Le rattrapage comptable, lorsqu&apos;il est nécessaire, est
        évalué séparément.
      </p>
    </div>
  );
}

/* ── Ce que le cabinet fondateur obtient ──────────────────────────────────────
   Cinq engagements, dans l'ordre où ils comptent : ce qui arrive au premier
   jour, puis ce qui revient chaque mois, puis les trois garanties qui rendent
   la décision réversible.

   L'atelier est MENSUEL depuis le 2026-09-03. Il était hebdomadaire, et le CEO
   l'a repris : une réunion par semaine imposée à un cabinet qui facture à
   l'heure n'est pas un avantage, c'est une charge, et l'annoncer comme un
   cadeau se retourne à la première semaine chargée.

   Chaque ligne porte un symbole, un rang et deux textes. Le symbole ne dit rien
   que le texte ne dise déjà : il sert de point d'ancrage à l'œil qui parcourt
   la colonne, jamais de porteur d'information (PS-052). */
const AVANTAGES_FONDATEURS = [
  [
    Rocket,
    "Mise en route complète",
    "Paramétrage, reprise de vos dossiers actifs et de vos soldes de fidéicommis, formation de votre adjointe.",
  ],
  [
    Users,
    "Un atelier par mois",
    "Une rencontre mensuelle avec les autres cabinets fondateurs, et vos questions traitées là.",
  ],
  [
    DoorOpen,
    "Sortie libre",
    "Aucun engagement de durée. Dans les soixante premiers jours, les mois payés vous sont remboursés si SAFE ne vous apporte rien.",
  ],
  [
    Download,
    "Portabilité des données",
    "Vos données restent les vôtres et s'exportent quand vous le voulez.",
  ],
  [
    Eye,
    "Transparence totale",
    "Avant de signer, vous recevez par écrit la liste de ce que SAFE ne fait pas encore.",
  ],
] as const;

/**
 * La carte des fondateurs : les prix, les engagements, le geste.
 *
 * ── Renversement assumé du 2026-09-03 ────────────────────────────────────────
 * Cette section refusait explicitement le vert. Le commentaire de
 * `PricingPage.tsx` disait : « Son emphase vient du socle, pas d'un panneau
 * vert sombre : sur une page qui tient sur un seul canevas, une boîte de
 * couleur se lit comme une publicité rapportée. »
 *
 * Le CEO a tranché l'inverse, en montrant la carte du parcours de l'accueil.
 * L'argument tient toujours pour une boîte de couleur POSÉE au milieu d'une
 * page de prose ; il ne tient pas ici, parce que cette carte n'est pas un
 * encart, c'est le point d'arrivée de la page.
 *
 * ── Fusion des deux cartes, même jour ────────────────────────────────────────
 * Le tableau des prix vivait dans une carte blanche, juste au-dessus. Deux
 * cartes de même largeur empilées à trente pixels l'une de l'autre, c'était
 * deux objets pour une seule offre : on lisait le prix, puis on repartait à
 * zéro pour lire ce qu'il achète. Le CEO a demandé de n'en faire qu'une.
 *
 * L'ordre à l'intérieur est celui de la décision : ce que ça coûte, ce que ça
 * donne, puis le geste. Le compteur de places, qui concluait la carte blanche,
 * a disparu au passage : il disait déjà mot pour mot ce que dit le pied.
 *
 * La matière vient de `matiere-verte.ts`, la même qu'à l'accueil, jamais une
 * recopie.
 */
export function CarteFondateurs({ action }: { action: string }) {
  const f = TARIFICATION.fondateurs;
  return (
    <div className="carte-fondateurs">
      {/* Le repère de la marque en filigrane a été RETIRÉ à la fusion du
          2026-09-03. Il vivait dans le vide du haut à droite ; ce vide est
          maintenant occupé par la colonne « Tarif régulier » et ses deux
          montants barrés, et la marque passait derrière eux. Vérifié à
          l'écran : elle formait un bloc pâle sur les chiffres.

          Un filigrane se pose dans un vide ou ne se pose pas. Cette carte n'en
          a plus, donc il s'en va. La carte du parcours de l'accueil, elle, garde
          le sien : son haut à droite est resté libre. */}

      {/* Quatre prix qui se croisent avec deux paliers et trois périodes, c'est
          un tableau, pas une phrase. Il porte la colonne du prix régulier :
          sans elle, on lit une remise sans savoir sur quoi. */}
      <div className="cf-prix">
        <table className="fb-table">
          <thead>
            <tr>
              <th scope="col">Forfait</th>
              <th scope="col">Les {f.dureeMois} premiers mois</th>
              <th scope="col">Ensuite, gelé à</th>
              <th scope="col">Tarif régulier</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Solo</th>
              <td>{f.premiereAnneeSolo} $</td>
              <td>{f.apresSolo} $</td>
              <td className="reg">{prixFr(TARIFICATION.paliers.solo.prix)} $</td>
            </tr>
            <tr>
              <th scope="row">Cabinet</th>
              <td>{f.premiereAnneeCabinet} $</td>
              <td>{f.apresCabinet} $</td>
              <td className="reg">{prixFr(TARIFICATION.paliers.cabinet.prix)} $</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="cf-temps">
        {AVANTAGES_FONDATEURS.map(([Symbole, nom, ligne], i) => (
          <div className="l" key={nom}>
            <span className="pastille" aria-hidden>
              <Symbole className="ic" />
            </span>
            <span className="rang" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="n">{nom}</p>
            <p className="d">{ligne}</p>
          </div>
        ))}
      </div>

      {/* Le geste est DANS la carte, à la fin de ce qu'elle promet. Posé
          dessous, il flotterait sous une phrase. */}
      <div className="cf-pied">
        <p>
          Il reste {f.placesTotal - f.placesPrises} places sur {f.placesTotal}. La suivante se
          décide après l&apos;évaluation, pas avant.
        </p>
        <div className="cf-actes">
          <a className="cf-btn" href={action}>
            Vérifier s&apos;il reste une place
          </a>
        </div>
      </div>
    </div>
  );
}
