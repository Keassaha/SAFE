"use client";

/**
 * SAFE — La barre de l'application, pour les fenêtres de produit de la vitrine.
 *
 * ── Pourquoi ce fichier existe ───────────────────────────────────────────────
 * Elle était recopiée à la main dans CHACUNE des trois fenêtres de
 * `ExperienceCinema`. Trois copies, donc trois occasions de dériver, et elles
 * avaient toutes dérivé de la même façon : aucune icône devant les menus, le
 * raccourci ⌘K posé à côté du champ au lieu d'y vivre, aucun commutateur de
 * langue, une pastille rouge nue en guise de cloche, et l'initiale du compte
 * écrite « C » là où `Header.tsx` prend la première lettre du nom, donc « M ».
 *
 * Le CEO a demandé le 2026-08-29 pourquoi la vitrine peinait à ressembler au
 * produit. C'est une des deux réponses : ce qui est recopié dérive, et rien ne
 * casse quand ça arrive. Une seule barre, un seul endroit à corriger.
 *
 * ── Ce qu'elle recopie, et d'où ─────────────────────────────────────────────
 * `components/layout/Header.tsx`, dans l'ordre exact de ses trois groupes :
 *
 *   marque · filet · cabinet │ navigation CENTRÉE │ recherche · langue ·
 *   alertes · chrono · compte
 *
 * Les six icônes de menu sont celles que `Header.tsx` importe (LayoutDashboard,
 * Sunrise, Briefcase, Wallet, Wrench, Settings), pas des approximations
 * redessinées : une bibliothèque partagée vaut mieux qu'un dixième glyphe à
 * surveiller.
 *
 * Le nom du cabinet est « Me Roy » et non « Me Camille Roy » : `nomCompact()`
 * garde le premier mot et le dernier. L'initiale suit `(user.name)[0]`.
 *
 * ── Pourquoi elle est figée ─────────────────────────────────────────────────
 * Ces fenêtres illustrent UN écran. Un menu qui s'ouvrirait sur rien décevrait
 * plus qu'il ne montrerait, d'où `aria-hidden` : un lecteur d'écran n'a rien à
 * y faire. La fenêtre du hero, elle, se navigue vraiment et porte donc sa
 * propre barre dans `HeroLiveApp`.
 */

import {
  LayoutDashboard,
  Sunrise,
  Briefcase,
  Wallet,
  Wrench,
  Settings,
  Search,
  Bell,
  Clock,
} from "lucide-react";
import { SafeMark } from "@/components/branding/SafeLogo";

/** Le groupe de menu allumé, celui qui contient l'écran affiché. */
export type MenuActif = "pratique" | "finances" | "outils" | "parametres";

const MENUS: { id: MenuActif | "dash" | "aujourdhui"; label: string; Icone: React.ComponentType<{ className?: string }>; tiroir?: boolean }[] = [
  { id: "dash", label: "Tableau de bord", Icone: LayoutDashboard },
  { id: "aujourdhui", label: "Aujourd’hui", Icone: Sunrise },
  { id: "pratique", label: "Pratique", Icone: Briefcase, tiroir: true },
  { id: "finances", label: "Finances", Icone: Wallet, tiroir: true },
  { id: "outils", label: "Outils", Icone: Wrench, tiroir: true },
  { id: "parametres", label: "Paramètres", Icone: Settings },
];

export function BarreAppVitrine({ actif }: { actif: MenuActif }) {
  return (
    <div className="barre-app" aria-hidden>
      <span className="mk">
        <SafeMark size={15} />
        SAFE
      </span>
      <span className="sep" />
      <span className="cab">Me Roy</span>

      <nav>
        {MENUS.map(({ id, label, Icone, tiroir }) => (
          /* Le libelle est enveloppe pour pouvoir DISPARAITRE quand la fenetre
             est etroite, exactement comme Header.tsx le fait sous 1280 px :
             l'icone porte alors seule. Sans cette enveloppe, la barre d'une
             fenetre reduite peignait ses menus par-dessus la marque et la
             recherche. */
          <span key={id} className={id === actif ? "on" : undefined}>
            <Icone className="mi" />
            <span className="lb">{label}</span>
            {tiroir ? <b className="cv" /> : null}
          </span>
        ))}
      </nav>

      <span className="ecart" />

      {/* Le raccourci vit DANS le champ, comme dans l'application. Posé à côté,
          il se lisait comme un second bouton. */}
      <span className="ch">
        <Search className="li" />
        <span className="ph">Rechercher clients, dossiers, factures…</span>
        <span className="cl">⌘K</span>
      </span>
      <span className="lang">
        <span className="on">FR</span>
        <span>EN</span>
      </span>
      <span className="cloche">
        <Bell className="li" />
        <i>2</i>
      </span>
      <span className="tps">
        <Clock className="li" />
        Temps
      </span>
      <span className="av">M</span>
    </div>
  );
}
