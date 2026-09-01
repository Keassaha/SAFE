"use client";

/**
 * Extrait navigable de SAFE, posé dans le cadre du hero.
 *
 * Remplace la capture JPEG qui s'y trouvait. Une capture vieillit en silence :
 * elle ne suit ni la palette, ni les libellés, ni les chiffres du produit.
 *
 * Le balisage est dessiné dans une boîte logique fixe de 1000x563, mise à
 * l'échelle par `transform` depuis ExperienceCinema : même espace de
 * coordonnées que le canvas d'assemblage, donc les papiers se rangent
 * exactement là où les blocs apparaissent.
 *
 * Interactivité : la barre de menu ouvre ses sous-menus et change d'écran. Le
 * câblage se fait par délégation dans ExperienceCinema (`data-ha-*`), comme la
 * maquette `#demo` plus bas dans la page.
 *
 * CHIFFRES : relevés en base sur le Cabinet Demo (Me Camille Roy), pas
 * inventés. Voir docs/journal si la donnée de démonstration change.
 *
 * ── ⚠ CE CÂBLAGE EST MANUEL, ET IL MEURT À CHAQUE SIMULATION ───────────────
 * `scripts/simuler-activite.mjs` régénère le cabinet de démonstration à partir
 * d'un tirage déterministe. Changer le script décale le tirage, donc les noms,
 * les numéros de dossier et les montants. Les chiffres ci-dessous ne suivent
 * pas : ils sont écrits à la main. Après toute relance du simulateur, ils
 * mentent en silence, et rien ne casse.
 *
 * Relevé le 2026-09-01, sur l'état du cabinet AU 31 AOÛT 2026. Cette date est
 * le dernier jour porteur de données : le simulateur s'arrête là. La fenêtre
 * l'affiche donc dans sa bande d'état, et « ce mois » veut dire août.
 *
 * Les agrégats appliquent les formules du produit, pas des formules d'ici :
 *   taux d'encaissement = paiements du mois / facturé du mois  (donc > 100 %
 *     quand on encaisse d'anciennes factures, ce qui est le cas en août) ;
 *   cash non reçu       = facturé du mois - encaissé du mois ;
 *   heures facturées    = entrées dont `statut === "facture"` ;
 *   valeur non facturée = entrées `facturable` et `statut != "facture"` ;
 *   solde de fidéicommis = somme brute de TrustTransaction.amount, les
 *     retraits y étant déjà négatifs (getGlobalTrustBalance).
 */

/* ── Menus ────────────────────────────────────────────────────────────────
   Repris de components/layout/SidebarNav.tsx pour que la vitrine montre la
   même arborescence que le produit. `screen` marque les entrées réellement
   navigables dans l'extrait ; les autres restent visibles mais inertes, et
   l'en-tête annonce que c'est un extrait. */
import { SafeMark } from "@/components/branding/SafeLogo";

/* ── Les icônes de la barre ───────────────────────────────────────────────
   L'application en pose une devant chaque menu ; la réplique n'en avait
   aucune, et la barre prenait le rythme d'un menu de site au lieu de celui du
   produit (demande CEO du 2026-08-27).

   Dessinées ici en traits de 1,5, jamais importées d'une bibliothèque : quatre
   glyphes ne justifient pas une dépendance, et ils doivent suivre la couleur
   du texte par `currentColor`. */
const ICONES: Record<string, React.ReactNode> = {
  dash: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
  aujourdhui: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12l3.5-4 3 2.5L13 4" />
      <path d="M2 14h12" />
    </svg>
  ),
  pratique: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <rect x="2" y="4.5" width="12" height="8.5" rx="1.2" />
      <path d="M2 7.5h12M6 4.5V3h4v1.5" />
    </svg>
  ),
  finances: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="10" height="12" rx="1.2" />
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" />
    </svg>
  ),
  outils: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 2.5a3.2 3.2 0 00-3 4.3L2.6 11.7a1.2 1.2 0 001.7 1.7l4.9-4.9a3.2 3.2 0 004.3-3l-2 2-1.8-.5-.5-1.8z" />
    </svg>
  ),
  parametres: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.6v1.8M8 12.6v1.8M14.4 8h-1.8M3.4 8H1.6M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3M12.5 12.5l-1.3-1.3M4.8 4.8L3.5 3.5" strokeLinecap="round" />
    </svg>
  ),
};

const MENUS: {
  id: string;
  label: string;
  screen?: string;
  groupe?: string;
  items?: { label: string; screen?: string }[];
}[] = [
  /* Le tableau de bord vient AVANT Aujourd'hui, comme dans l'application et
     comme dans lib/routes.ts. L'ordre inverse tenait ici depuis longtemps et
     faisait mentir toute maquette qui pretendait montrer le produit. */
  { id: "dash", label: "Tableau de bord", screen: "dash" },
  { id: "aujourdhui", label: "Aujourd\u2019hui", screen: "aujourdhui" },
  {
    id: "pratique",
    label: "Pratique",
    groupe: "Dossiers et clients",
    items: [
      { label: "Clients", screen: "clients" },
      { label: "Dossiers", screen: "dossiers" },
      { label: "Agenda", screen: "agenda" },
      { label: "File assistante", screen: "file-assistante" },
      { label: "Employ\u00e9s", screen: "employes" },
      { label: "Mon temps et ma paye", screen: "mes-heures" },
    ],
  },
  {
    id: "finances",
    label: "Finances",
    groupe: "Argent et conformit\u00e9",
    items: [
      { label: "Facturation", screen: "facturation" },
      { label: "Comptabilit\u00e9", screen: "comptabilite" },
      { label: "Comptes en fid\u00e9icommis", screen: "comptes" },
      { label: "Inspection", screen: "inspection" },
      { label: "Conformit\u00e9", screen: "conformite" },
      { label: "Temps", screen: "temps" },
    ],
  },
  {
    id: "outils",
    label: "Outils",
    groupe: "Production",
    items: [
      { label: "Partage du patrimoine familial", screen: "patrimoine" },
      { label: "\u00c9dition", screen: "edition" },
      { label: "Rapports", screen: "rapports" },
      { label: "Importation", screen: "import" },
    ],
  },
  { id: "parametres", label: "Param\u00e8tres", screen: "parametres" },
];

/* Créances réelles, triées par échéance (les 6 plus anciennes).
   Le nom du client suit `nomClient()` de app/(app)/facturation/page.tsx : une
   personne physique s'écrit « Nom, Prénom », jamais le patronyme seul. La
   réplique écrivait « Pelletier » là où l'écran écrit « Pelletier, Manon ». */
const CREANCES: { num: string; client: string; total: string; solde: string; ech: string; etat: "retard" | "partiel" }[] = [
  { num: "2026-032", client: "Clinique Hochelaga s.e.n.c.", total: "1 034,78 $", solde: "1 034,78 $", ech: "07/05", etat: "retard" },
  { num: "2026-003", client: "Groupe immobilier Sainte-Foy ltée", total: "2 917,50 $", solde: "1 517,10 $", ech: "18/05", etat: "partiel" },
  { num: "2026-016", client: "Tremblay, Nadia", total: "2 522,27 $", solde: "958,46 $", ech: "11/06", etat: "partiel" },
  { num: "2026-011", client: "Groupe immobilier Rosemont ltée", total: "5 935,59 $", solde: "2 789,73 $", ech: "26/06", etat: "partiel" },
  { num: "2026-002", client: "Pelletier, Manon", total: "5 533,18 $", solde: "5 533,18 $", ech: "30/06", etat: "retard" },
  { num: "2026-014", client: "Lafleur, Olivier", total: "3 240,86 $", solde: "3 240,86 $", ech: "02/07", etat: "retard" },
];

export function HeroLiveApp() {
  return (
    <div id="hero-app" role="group" aria-label="Extrait navigable de SAFE : tableau de bord du cabinet">
      {/* ── Barre de navigation ── */}
      <div className="ha-nav">
        {/* Le repère de la barre est le VRAI repère, pas une pastille verte.
            C'est là que l'ouverture du téléphone dépose le logo qu'elle vient
            d'assembler : si les deux ne sont pas le même dessin, le geste se
            termine sur un objet qui n'existe pas (retour CEO du 18 août 2026). */}
        <span className="ha-brand">
          <span className="mark" aria-hidden>
            <SafeMark size={17} />
          </span>
          SAFE
        </span>
        {/* Le libellé du cabinet est celui que la barre calcule vraiment.
            `Header.tsx` passe le nom par `nomCompact()` : premier mot + dernier
            mot, donc « Me Camille Roy » s'affiche « Me Roy ». La réplique
            écrivait le nom complet suivi du nom du cabinet, une forme que la
            barre ne produit dans aucun cas. */}
        <span className="ha-cab">Me Roy</span>

        <div className="ha-menu">
          {MENUS.map((m) => (
            <div
              key={m.id}
              className={"ha-item safe-zoom-menu" + (m.id === "dash" ? " on" : "")}
              data-ha-menu={m.id}
              {...(m.screen ? { "data-ha-screen": m.screen } : {})}
              role="button"
              tabIndex={0}
              aria-expanded={m.items ? false : undefined}
            >
              {ICONES[m.id] ? <span className="ico" aria-hidden>{ICONES[m.id]}</span> : null}
              {m.label}
              {m.items ? <i className="car" aria-hidden /> : null}
              {m.items ? (
                <div className="ha-drop">
                  <b>{m.groupe}</b>
                  {m.items.map((it) => (
                    <a
                      key={it.label}
                      className={it.screen ? "safe-zoom-menu" : "inerte"}
                      {...(it.screen ? { "data-ha-screen": it.screen } : {})}
                      role="button"
                      tabIndex={it.screen ? 0 : -1}
                      aria-disabled={it.screen ? undefined : true}
                    >
                      {it.label}
                      {it.screen ? <span aria-hidden>→</span> : null}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* La cloche et « Temps » existent dans l'application et manquaient
            ici. Le raccourci ⌘K aussi : c'est ce qui dit qu'une barre de
            recherche appartient a un logiciel et non a un site.

            L'ORDRE est celui de Header.tsx et non un ordre choisi ici :
            recherche, langue, alertes, chrono, compte. La replique plaçait la
            langue apres le chrono, ce qui separait les deux reglages
            permanents (langue, compte) par deux indicateurs vivants. */}
        <div className="ha-right">
          <span className="ha-search">
            Rechercher clients, dossiers, factures…<span className="kbd" aria-hidden>⌘K</span>
          </span>
          <span className="ha-lang"><span className="on">FR</span><span>EN</span></span>
          <span className="ha-cloche" aria-hidden>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2a4 4 0 00-4 4c0 3-1 4-1 4h10s-1-1-1-4a4 4 0 00-4-4z" />
              <path d="M6.8 12.5a1.4 1.4 0 002.4 0" />
            </svg>
            <i className="pastille">1</i>
          </span>
          <span className="ha-temps">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <circle cx="8" cy="8" r="6" />
              <path d="M8 4.6V8l2.2 1.6" />
            </svg>
            Temps
          </span>
          {/* La pastille du compte porte l'INITIALE, pas des initiales :
              `Header.tsx` fait `(user.name ?? user.email)[0]`, donc « Me
              Camille Roy » donne « M ». La replique ecrivait « CR », que la
              barre ne produit jamais. */}
          <span className="ha-avatar">M</span>
        </div>
      </div>

      <div className="ha-body">
        {/* ── Écran · Tableau de bord ──
           Reprend l'agencement RÉEL de DashboardViewSafe.tsx, section par
           section et dans le même ordre : bandeau d'action, montants à
           surveiller, flux du cabinet, performances, navette, obligations.
           Une maquette différente du produit qu'elle vend se voit (retour
           CEO du 24 août 2026). */}
        <div className="ha-screen on" data-ha-pane="dash">
          {/* Le titre de page, comme dans l'application. */}
          <p className="ha-titre">Tableau de bord</p>
          {/* Bandeau d'action, identique à BandeauAction. Le bouton est A
             DROITE sur la ligne du titre, comme dans l'application : empile
             dessous, il allongeait la carte et separait « ce qu'il y a a
             faire » de « le faire ». */}
          <div className="ha-card">
            <div className="ha-tete">
              <div>
                <p className="ha-kicker">À traiter maintenant</p>
                <p className="ha-h">Rapprochez le fidéicommis</p>
                <p className="ha-mini">Rapprochement de 2026-07 équilibré, il reste à le certifier.</p>
              </div>
              <span className="ha-act safe-zoom" data-ha-screen="comptes" role="button" tabIndex={0}>
                Rapprocher le fidéicommis
              </span>
            </div>
            <div className="ha-alertes">
              {/* Les deux alertes de BandeauAction : une puce de 6 px, le
                  message, et la flèche oblique poussée à droite. La puce est
                  ambre quand l'alerte parle de retard ou de fidéicommis, verte
                  sinon (le test est dans DashboardViewSafe). */}
              <div className="ha-bullet safe-zoom-menu" data-ha-screen="facturation" role="button" tabIndex={0}>
                <i className="warn" aria-hidden />13 facture(s) en retard
                <b aria-hidden>↗</b>
              </div>
              <div className="ha-bullet safe-zoom-menu" data-ha-screen="temps" role="button" tabIndex={0}>
                <i aria-hidden />128 337,50 $ en heures non facturées
                <b aria-hidden>↗</b>
              </div>
            </div>
          </div>

          {/* Bandeau d'état, à sa VRAIE place.
             `DashboardViewSafe.tsx` le monte en position 2, entre la carte
             d'action et les montants (« 2. L'état réglementaire, en une bande
             fine »). La réplique le posait au-dessus du titre, collé sous la
             barre de menu, et le montrait sur les quinze écrans : dans
             l'application il n'appartient qu'au tableau de bord. Il descend
             donc dans le corps, et il ne vit plus que dans ce panneau.
             Séparateurs et date en chasse fixe, comme ComplianceStrip. */}
          <div className="ha-strip">
            <span className="s"><i aria-hidden />Dossiers actifs <b>50</b></span>
            <span className="sep" aria-hidden />
            <span className="s"><i aria-hidden />Clients actifs <b>26</b></span>
            <span className="sep" aria-hidden />
            <span className="s warn"><i aria-hidden />Fidéicommis <b>À rapprocher</b></span>
            <span className="date">lundi 31 août 2026</span>
          </div>

          {/* Les montants à surveiller : fidéicommis sur deux colonnes, comme
             MontantsEssentiels (grid-cols-5, la tuile fiducie span-2). */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <p className="ha-kicker">Les montants à surveiller</p>
            <div className="ha-tiles" style={{ marginTop: 11 }}>
              <div className="ha-tile safe-zoom" style={{ gridColumn: "span 2" }} data-ha-screen="comptes" role="button" tabIndex={0} aria-label="Fidéicommis : 96 300,00 $. Ouvrir l'écran.">
                <p className="lab">Fidéicommis</p>
                <p className="sub">Sommes détenues pour vos clients</p>
                <p className="val" style={{ fontSize: 21 }}>96 300,00 $</p>
                <p className="sub" style={{ marginTop: 8 }}>6 clients avec des fonds · Rapprochement à faire</p>
              </div>
              {[
                { lab: "Créances", sub: "Reste à recevoir", val: "33 133,61 $" },
                { lab: "Encaissements", sub: "Encaissé ce mois", val: "19 373,82 $" },
                { lab: "Facturation", sub: "Facturé ce mois", val: "15 924,06 $" },
              ].map((t) => (
                <div
                  key={t.lab}
                  className="ha-tile safe-zoom"
                  data-ha-screen="facturation"
                  role="button"
                  tabIndex={0}
                  aria-label={`${t.lab} : ${t.val}. Ouvrir l'écran.`}
                >
                  <p className="lab">{t.lab}</p>
                  <p className="sub">{t.sub}</p>
                  <p className="val">{t.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Flux du cabinet ET Vos performances, CÔTE À CÔTE.
             `DashboardViewSafe.tsx` : `lg:grid-cols-[1.7fr_1fr]`. Les deux
             cartes étaient empilées en pleine largeur ici, ce qui étirait le
             diagramme sur toute la fenêtre et faisait descendre les ratios
             hors de l'écran. */}
          <div className="ha-flux-rangee">
            {/* Le diagramme est recopié de components/dashboard/CashflowChart.tsx :
               légende à gauche, bascule 6/12 mois à droite, axe des montants en
               forme courte, grille horizontale seule, colonnes groupées à
               capuchon arrondi, et le repli « Voir les chiffres » dessous.
               Facturé porte le gris de retrait (--si-border-strong), encaissé le
               vert de l'état validé (--si-verified) : l'argent réellement rentré
               est le seul qui prend une teinte. */}
            <div className="ha-card">
              <p className="ha-kicker">Flux du cabinet</p>
              <p className="ha-titre-carte">Facturé et encaissé</p>
              <p className="ha-mini" style={{ marginBottom: 10 }}>
                L&apos;écart entre les deux barres, c&apos;est l&apos;argent que vous avez gagné mais qui
                n&apos;est pas encore rentré.
              </p>
              <div className="ha-legend">
                <span className="ha-legend-i"><i aria-hidden />Facturé</span>
                <span className="ha-legend-i verified"><i aria-hidden />Encaissé</span>
                <span className="ha-fenetre">
                  <span className="on">6 mois</span>
                  <span>12 mois</span>
                </span>
              </div>
              <div className="ha-plot">
                <div className="ha-axe" aria-hidden>
                  <span>24 k$</span>
                  <span>18 k$</span>
                  <span>12 k$</span>
                  <span>6 k$</span>
                  <span>0 $</span>
                </div>
                <div className="ha-bars">
                  <span className="ha-grille" aria-hidden>
                    <i /><i /><i /><i /><i />
                  </span>
                  {/* Six mois glissants a rebours du 31 aout, donc mars a aout.
                      Hauteurs en pourcentage du plafond d'axe (24 k$) a partir
                      des montants reels : mars 0 et 0 ; avril 21 787,79 et
                      19 235,91 ; mai 16 966,02 et 7 684,65 ; juin 10 110,63 et
                      1 549,87 ; juillet 23 965,13 et 17 630,01 ; aout 15 924,06
                      et 9 519,58.

                      Mars reste VIDE, et c'est voulu : le cabinet de
                      demonstration commence en avril. Une colonne inventee
                      pour meubler serait une donnee fausse. */}
                  {[
                    { m: "mars", f: 0, e: 0 },
                    { m: "avr.", f: 91, e: 80 },
                    { m: "mai", f: 71, e: 32 },
                    { m: "juin", f: 42, e: 6 },
                    { m: "juill.", f: 100, e: 73 },
                    { m: "août", f: 66, e: 40 },
                  ].map((b) => (
                    <div className="ha-bar-grp" key={b.m}>
                      <div className="ha-bar-pair">
                        <span className="ha-bar" style={{ height: b.f + "%" }} />
                        <span className="ha-bar v" style={{ height: b.e + "%" }} />
                      </div>
                      <span className="ha-bar-lbl">{b.m}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="ha-repli">Voir les chiffres</p>
            </div>

            {/* Vos performances : les cinq lignes de Performances, aide comprise.
               Filet entre les lignes à partir de la deuxième, valeur en chasse
               fixe, et la valeur non facturée seule en encre ambre. */}
            <div className="ha-card">
              <p className="ha-kicker">Vos performances</p>
              <p className="ha-titre-carte">Ce que ça donne</p>
              <div style={{ marginTop: 3 }}>
                {[
                  /* Le taux depasse 100 % parce que la formule du produit
                     rapporte les paiements du mois au FACTURE du mois : en
                     aout, le cabinet a encaisse 19 373,82 $ pour 15 924,06 $
                     emis, le reste venant de factures plus anciennes. */
                  { k: "Taux d’encaissement", v: "122 %", a: "Part du facturé réellement rentrée." },
                  { k: "Taux de facturation", v: "0 %", a: "Part des heures travaillées qui a été facturée." },
                  { k: "Heures travaillées", v: "518 h", a: "Total saisi sur la période." },
                  { k: "Heures facturées", v: "0 h", a: "Portion portée à une facture." },
                  { k: "Valeur non facturée", v: "128 337,50 $", a: "Travail fait, pas encore porté à une facture.", amber: true },
                ].map((r, i) => (
                  <div key={r.k} className={"ha-perf" + (i > 0 ? " filet" : "")}>
                    <div className="ligne">
                      <span className="k">{r.k}</span>
                      <span className={"v" + (r.amber ? " amber" : "")}>{r.v}</span>
                    </div>
                    <p className="a">{r.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navette : ce qui attend une lecture, recopié de
             components/navette/LawyerGlance.tsx. Le compte à droite du titre,
             le numéro de dossier en pastille bordée (et non collé au type par
             un point médian), et l'invite « Ouvrir » sous chaque message. Le
             carré du type est ambre pour une question, encre pour le reste. */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <div className="ha-navette-tete">
              <p className="ha-titre-carte">Navette</p>
              <span className="ha-mini">· vous attend</span>
              <span className="compte">2</span>
            </div>
            <div style={{ marginTop: 4 }}>
              {[
                {
                  ico: "?",
                  warn: true,
                  type: "Question",
                  ref: "2026-002",
                  corps: "Confirmer la date de signature chez le notaire ?",
                  qui: "Aaliyah Côté",
                },
                {
                  ico: "▤",
                  warn: false,
                  type: "Document prêt",
                  ref: "2026-001",
                  corps: "Projet de requête en révision",
                  qui: "Aaliyah Côté",
                },
              ].map((n) => (
                <div className="ha-nav-item" key={n.ref}>
                  <span className={"ha-nav-ico" + (n.warn ? " warn" : "")} aria-hidden>{n.ico}</span>
                  <span className="txt">
                    <span className="entete">
                      <span className="type">{n.type}</span>
                      <span className="ref">{n.ref}</span>
                    </span>
                    <span className="body">{n.corps}</span>
                    <span className="who">{n.qui}</span>
                    <span className="ouvrir">Ouvrir <b aria-hidden>→</b></span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* État des obligations + lecture financière + activité récente,
             deux colonnes égales comme dans le produit. */}
          <div className="ha-cols" style={{ marginTop: 11, gridTemplateColumns: "1fr 1fr" }}>
            <div className="ha-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p className="ha-titre-carte">État des obligations</p>
                <span style={{ fontSize: 11, color: "var(--si-verified)", fontWeight: 500 }}>Générer l&apos;attestation</span>
              </div>
              <p className="ha-mini" style={{ marginBottom: 8 }}>
                Suivi automatique des exigences du Barreau et du Règlement B-1 r.5
              </p>
              <div className="ha-oblig-grid">
                {[
                  { t: "Rapprochement fidéicommis", d: "Période 2026-07", s: "À faire", warn: true },
                  { t: "Clients avec fonds en fiducie", d: "Sommes détenues en fiducie (B-1 r.5)", s: "6" },
                  { t: "Factures impayées", d: "Solde à recevoir", s: "17", warn: true },
                  { t: "Temps non facturé", d: "Entrées prêtes à facturer", s: "210", warn: true },
                ].map((o) => (
                  <div className="ha-oblig-item" key={o.t}>
                    <span className={"ha-oblig-ico" + (o.warn ? " warn" : "")} aria-hidden>{o.warn ? "!" : "✓"}</span>
                    <span className="txt">
                      <span className="t">{o.t}</span>
                      <span className="d">{o.d}</span>
                    </span>
                    <span className="s">{o.s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <div className="ha-card">
                <p className="ha-titre-carte" style={{ marginBottom: 5 }}>Lecture financière du mois</p>
                <div className="ha-kv"><span className="k">Sorties</span><span className="v">0,00 $</span></div>
                {/* Negatif : le cabinet a encaisse PLUS qu'il n'a facture en
                    aout. C'est le meme fait que le taux de 122 %, vu en
                    dollars. */}
                <div className="ha-kv"><span className="k">Cash non reçu</span><span className="v">-3 449,76 $</span></div>
              </div>
              {/* Activité récente, recopiée d'ActivityCard : « Tout voir » à
                 droite du titre, une puce verte par ligne, l'action en évidence
                 et l'entité en retrait, puis la date relative et l'auteur sur
                 une seconde ligne. C'était une liste clé/valeur, qui perdait
                 l'auteur et écrasait les deux lignes en une. */}
              <div className="ha-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p className="ha-titre-carte" style={{ marginBottom: 6 }}>Activité récente</p>
                  <span style={{ fontSize: 11, color: "var(--si-verified)", fontWeight: 500 }}>Tout voir</span>
                </div>
                {/* `formatRelativeTime` de DashboardActivityFeed : en heures
                    sous 24 h, en jours sous 7, puis la date AVEC l'heure. La
                    replique coupait l'heure et pretait tout a Me Roy, alors
                    que l'adjointe signe la premiere ligne. */}
                {[
                  { a: "update", e: "Dossier", q: "il y a 13 h", qui: "Aaliyah Côté" },
                  { a: "create", e: "TrustAccount", q: "il y a 4 j", qui: "Me Camille Roy" },
                  { a: "create", e: "Dossier", q: "14 août, 16 h 43", qui: "Me Camille Roy" },
                  { a: "create", e: "Client", q: "14 août, 16 h 33", qui: "Me Camille Roy" },
                  { a: "update", e: "Client", q: "12 août, 17 h 28", qui: "Me Camille Roy" },
                ].map((x, i) => (
                  <div className={"ha-activite" + (i > 0 ? " filet" : "")} key={x.a + x.e + x.q}>
                    <span className="pastille" aria-hidden />
                    <span className="txt">
                      <span className="quoi"><b>{x.a}</b> — {x.e}</span>
                      <span className="quand">{x.q} · {x.qui}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Écran · Facturation ── */}
        <div className="ha-screen" data-ha-pane="facturation">
          <div className="ha-card">
            <p className="ha-kicker">Facturation</p>
            <p className="ha-h">Créances · 33 133,61 $</p>
            <p className="ha-mini">
              Dix-sept factures émises et non réglées. Les six plus anciennes ci-dessous.
            </p>
            <table className="ha-tbl" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Facture</th><th>Client</th><th>Échéance</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "right" }}>Solde dû</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {CREANCES.map((f) => (
                  <tr key={f.num}>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{f.num}</td>
                    <td>{f.client}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{f.ech}</td>
                    <td className="num">{f.total}</td>
                    <td className="num">{f.solde}</td>
                    <td>
                      <span className={"ha-tag " + (f.etat === "retard" ? "late" : "part")}>
                        {f.etat === "retard" ? "En retard" : "Partielle"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Aging : c'est la lecture qui sert à prioriser les relances.
             Montants relevés en base, pas arrondis à la louche. */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <p className="ha-ptitle">Ancienneté des créances</p>
            <div className="ha-aging">
              {[
                ["Courant", "6 404,48 $", false],
                ["1 à 30 j", "6 335,12 $", false],
                ["31 à 60 j", "8 560,76 $", true],
                ["61 à 90 j", "9 281,37 $", true],
                ["90 j et plus", "2 551,88 $", true],
              ].map(([lab, val, chaud]) => (
                <div className="ag" key={lab as string}>
                  <span className="l">{lab as string}</span>
                  <span className={"m" + (chaud ? " chaud" : "")}>{val as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Écran · Clients ── */}
        <div className="ha-screen" data-ha-pane="clients">
          <div className="ha-card">
            <p className="ha-kicker">Clients</p>
            <p className="ha-h">26 clients actifs</p>
            <p className="ha-mini">Les huit qui doivent le plus, solde dû décroissant.</p>
            <table className="ha-tbl" style={{ marginTop: 9 }}>
              <thead>
                <tr>
                  <th>Client</th><th>Type</th><th>Dossiers</th>
                  <th style={{ textAlign: "right" }}>Solde dû</th><th>État</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Pelletier, Manon", "Particulier", "3", "5 533,18 $"],
                  ["Ateliers Beauport inc.", "Personne morale", "3", "4 636,37 $"],
                  ["Lafleur, Olivier", "Particulier", "3", "4 417,05 $"],
                  ["Dubois, Josée", "Particulier", "2", "2 874,38 $"],
                  ["Groupe immobilier Rosemont ltée", "Personne morale", "2", "2 789,73 $"],
                  ["Gagnon, Étienne", "Particulier", "2", "2 687,55 $"],
                  ["Groupe immobilier Sainte-Foy ltée", "Personne morale", "2", "2 472,83 $"],
                  ["Clinique Hochelaga s.e.n.c.", "Personne morale", "3", "2 398,32 $"],
                ].map(([nom, type, doss, solde]) => (
                  <tr key={nom}>
                    <td>{nom}</td>
                    <td style={{ color: "var(--si-muted)" }}>{type}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{doss}</td>
                    <td className="num">{solde}</td>
                    <td><span className="ha-tag">Actif</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Écran · Comptes en fidéicommis ── */}
        <div className="ha-screen" data-ha-pane="comptes">
          <div className="ha-card">
            <p className="ha-kicker">Comptes en fidéicommis</p>
            {/* Cet ecran disait « Aucune somme detenue en fiducie », ce qui
                etait vrai quand il a ete ecrit et ne l'est plus : le cabinet
                detient 96 300 $. La bande d'action du tableau de bord annonce
                « Rapprochement de 2026-07 equilibre, il reste a le certifier »
                et c'est bien ce que ce panneau doit montrer en s'ouvrant.

                « Cartes-clients » et non « comptes ouverts » : la table
                TrustAccount est vide, et la source de verite du solde est le
                registre append-only, comme le dit le commentaire de
                app/(app)/tableau-de-bord/page.tsx devant
                countClientsWithTrustFunds. */}
            <p className="ha-h">96 300,00 $ détenus pour six clients</p>
            <p className="ha-mini">
              Le rapprochement de juillet est équilibré : le registre, les cartes-clients et le
              solde rapproché donnent le même montant. Il reste à le certifier, et c&apos;est la
              signature qui est demandée en inspection.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Solde fiducie global</span><span className="v">96 300,00 $</span></div>
              <div className="ha-kv"><span className="k">Cartes-clients avec fonds</span><span className="v">6</span></div>
              <div className="ha-kv"><span className="k">Dernier rapprochement</span><span className="v">2026-07 · à certifier</span></div>
              <div className="ha-kv"><span className="k">Écart constaté</span><span className="v">0,00 $</span></div>
            </div>
            <span className="ha-act safe-zoom" data-ha-screen="dash" role="button" tabIndex={0}>
              Retour au tableau de bord
            </span>
          </div>

          {/* Le montant seul ne prouve rien. Ce qui se demande en inspection,
             c'est la trace du controle, et c'est elle que la seconde carte
             porte. */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <p className="ha-ptitle">Ce qui est conservé pour l&apos;inspection</p>
            <div className="ha-kv"><span className="k">Rapprochement mensuel, même à solde nul</span><span className="v">Exigé</span></div>
            <div className="ha-kv"><span className="k">Registre des sommes reçues et versées</span><span className="v">Tenu</span></div>
            <div className="ha-kv"><span className="k">Journal d&apos;administration</span><span className="v">Tenu</span></div>
            <div className="ha-kv"><span className="k">Piste d&apos;audit non modifiable</span><span className="v">Active</span></div>
          </div>
        </div>

        {/* ── Écran · Aujourd'hui ──
           L'accueil de l'adjointe : ce qui doit être traité dans la journée,
           avant d'ouvrir un dossier pour le découvrir. */}
        <div className="ha-screen" data-ha-pane="aujourdhui">
          <div className="ha-card">
            <p className="ha-kicker">Aujourd&apos;hui</p>
            <p className="ha-h">Trois choses attendent une décision</p>
            <p className="ha-mini">
              Ce qui remonte ici vient des dossiers, des factures et du fidéicommis. Rien n&apos;est
              saisi deux fois.
            </p>
            <div style={{ marginTop: 11 }}>
              {/* Le montant en face des factures en retard est le solde DE CES
                  factures (26 729,13 $), pas le total des creances : la
                  replique y posait les 38 060,20 $ de toutes les creances, ce
                  qui gonflait le retard d'un tiers. */}
              <div className="ha-kv"><span className="k">Rapprocher le fidéicommis</span><span className="v">Ce mois</span></div>
              <div className="ha-kv"><span className="k">Treize factures en retard</span><span className="v">26 729,13 $</span></div>
              <div className="ha-kv"><span className="k">Temps non facturé à porter</span><span className="v">128 337,50 $</span></div>
            </div>
            <span className="ha-act safe-zoom" data-ha-screen="facturation" role="button" tabIndex={0}>
              Ouvrir la facturation
            </span>
          </div>
          <div className="ha-cols">
            <div className="ha-card">
              <p className="ha-ptitle">Le cabinet en un coup d&apos;œil</p>
              <div className="ha-kv"><span className="k">Dossiers actifs</span><span className="v">50</span></div>
              <div className="ha-kv"><span className="k">Clients actifs</span><span className="v">26</span></div>
              <div className="ha-kv"><span className="k">Entrées de temps</span><span className="v">236</span></div>
            </div>
            <div className="ha-card">
              <p className="ha-ptitle">Ce qui a bougé</p>
              <div className="ha-kv"><span className="k">Paiement reçu · 2026-033</span><span className="v">612,60 $</span></div>
              <div className="ha-kv"><span className="k">Facture émise · 2026-033</span><span className="v">1 976,14 $</span></div>
              <div className="ha-kv"><span className="k">Retrait fidéicommis · ce mois</span><span className="v">23 700,00 $</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Dossiers ── */}
        <div className="ha-screen" data-ha-pane="dossiers">
          <div className="ha-card">
            <p className="ha-kicker">Dossiers</p>
            <p className="ha-h">56 dossiers, dont 50 actifs</p>
            <p className="ha-mini">Répartition des dossiers actifs par domaine de pratique.</p>
            <table className="ha-tbl" style={{ marginTop: 9 }}>
              <thead>
                <tr><th>Domaine</th><th>Actifs</th><th style={{ textAlign: "right" }}>Part</th></tr>
              </thead>
              <tbody>
                {[
                  ["Litige civil", "13", "26 %"],
                  ["Immobilier", "11", "22 %"],
                  ["Droit corporatif", "11", "22 %"],
                  ["Immigration", "9", "18 %"],
                  ["Droit de la famille", "6", "12 %"],
                ].map(([d, n, part]) => (
                  <tr key={d}>
                    <td>{d}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{n}</td>
                    <td className="num">{part}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ha-mini" style={{ marginTop: 9 }}>
              Six dossiers clôturés. À l&apos;ouverture, SAFE prépare une structure adaptée au
              domaine.
            </p>
          </div>
        </div>

        {/* ── Écran · Agenda ── */}
        <div className="ha-screen" data-ha-pane="agenda">
          <div className="ha-card">
            <p className="ha-kicker">Agenda</p>
            <p className="ha-h">Aucune échéance inscrite</p>
            <p className="ha-mini">
              Le calendrier du cabinet réunit les événements et les échéances des dossiers. Ce
              cabinet de démonstration n&apos;en a encore inscrit aucune : l&apos;écran montre ce
              qu&apos;il montrerait, un état vide, plutôt qu&apos;un contenu inventé.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Événements au calendrier</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Échéances de dossier</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Rappels automatiques</span><span className="v">Actifs</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · File assistante ── */}
        <div className="ha-screen" data-ha-pane="file-assistante">
          <div className="ha-card">
            <p className="ha-kicker">File assistante</p>
            <p className="ha-h">La file de travail de l&apos;adjointe</p>
            <p className="ha-mini">
              Ce que l&apos;adjointe a préparé et qui attend la lecture de l&apos;avocate : une
              facture à approuver, un dossier prêt pour révision, un document à signer.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">En attente de révision</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Prêt à envoyer</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Retourné pour correction</span><span className="v">0</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Employés ── */}
        <div className="ha-screen" data-ha-pane="employes">
          <div className="ha-card">
            <p className="ha-kicker">Employés</p>
            <p className="ha-h">Deux accès, aucune fiche de paye</p>
            <p className="ha-mini">
              Un accès donne un rôle, et le rôle décide de ce que la personne voit. La fiche
              d&apos;employé, elle, sert à la paye et n&apos;est ouverte que si le cabinet la tient
              dans SAFE.
            </p>
            <table className="ha-tbl" style={{ marginTop: 9 }}>
              <thead><tr><th>Personne</th><th>Rôle</th><th style={{ textAlign: "right" }}>Fiche de paye</th></tr></thead>
              <tbody>
                <tr><td>Me Camille Roy</td><td style={{ color: "var(--si-muted)" }}>Avocate</td><td className="num">—</td></tr>
                <tr><td>Adjointe du cabinet</td><td style={{ color: "var(--si-muted)" }}>Assistante</td><td className="num">—</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Écran · Mon temps et ma paye ── */}
        <div className="ha-screen" data-ha-pane="mes-heures">
          <div className="ha-card">
            <p className="ha-kicker">Mon temps et ma paye</p>
            <p className="ha-h">Vos heures, soumises depuis votre poste</p>
            <p className="ha-mini">
              Chaque personne saisit ses heures et les soumet pour la période. L&apos;écran
              n&apos;affiche rien tant qu&apos;aucune fiche d&apos;employé n&apos;est liée au compte.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Période en cours</span><span className="v">Août 2026</span></div>
              <div className="ha-kv"><span className="k">Heures soumises</span><span className="v">0,0 h</span></div>
              <div className="ha-kv"><span className="k">Fiche liée au compte</span><span className="v">Aucune</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Temps ── */}
        <div className="ha-screen" data-ha-pane="temps">
          <div className="ha-card">
            <p className="ha-kicker">Temps</p>
            <p className="ha-h">128 337,50 $ de temps non facturé</p>
            <p className="ha-mini">
              Deux cent dix entrées facturables attendent d&apos;être portées à une facture. Le
              temps est inscrit une fois, au moment où il se fait.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Entrées au total</span><span className="v">236</span></div>
              <div className="ha-kv"><span className="k">Dont facturables non facturées</span><span className="v">210</span></div>
              <div className="ha-kv"><span className="k">Heures consignées</span><span className="v">518,0 h</span></div>
              <div className="ha-kv"><span className="k">Heures à facturer</span><span className="v">464,0 h</span></div>
            </div>
            <span className="ha-act safe-zoom" data-ha-screen="facturation" role="button" tabIndex={0}>
              Porter à une facture
            </span>
          </div>
        </div>

        {/* ── Écran · Comptabilité ── */}
        <div className="ha-screen" data-ha-pane="comptabilite">
          <div className="ha-card">
            <p className="ha-kicker">Comptabilité</p>
            <p className="ha-h">Le journal du cabinet</p>
            <p className="ha-mini">
              Revenus, dépenses, taxes et écritures se tiennent ici. Ce cabinet de démonstration
              n&apos;a pas encore saisi de dépense ni d&apos;écriture manuelle : ses revenus
              viennent des factures.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Revenus facturés</span><span className="v">88 753,63 $</span></div>
              <div className="ha-kv"><span className="k">Encaissé</span><span className="v">55 620,02 $</span></div>
              <div className="ha-kv"><span className="k">Dépenses du cabinet</span><span className="v">0,00 $</span></div>
              <div className="ha-kv"><span className="k">Écritures manuelles</span><span className="v">0</span></div>
            </div>
            <p className="ha-mini" style={{ marginTop: 9 }}>
              L&apos;export vers un logiciel comptable externe reste disponible en tout temps.
            </p>
          </div>
        </div>

        {/* ── Écran · Inspection ── */}
        <div className="ha-screen" data-ha-pane="inspection">
          <div className="ha-card">
            <p className="ha-kicker">Inspection</p>
            <p className="ha-h">Ce qu&apos;un inspecteur demande, au même endroit</p>
            <p className="ha-mini">
              Rapport mensuel, registres, journal d&apos;administration, livre des honoraires et
              trousse. Rassemblés ici plutôt qu&apos;éparpillés dans le fidéicommis.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Rapport mensuel du fidéicommis</span><span className="v">Disponible</span></div>
              <div className="ha-kv"><span className="k">Registre des sommes reçues et versées</span><span className="v">Tenu</span></div>
              <div className="ha-kv"><span className="k">Journal d&apos;administration</span><span className="v">Tenu</span></div>
              <div className="ha-kv"><span className="k">Piste d&apos;audit non modifiable</span><span className="v">Active</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Conformité ── */}
        <div className="ha-screen" data-ha-pane="conformite">
          <div className="ha-card">
            <p className="ha-kicker">Conformité</p>
            <p className="ha-h">Ce qui est vérifié, et ce qui reste à faire</p>
            <p className="ha-mini">
              SAFE soutient la tenue, la vérification et la traçabilité. La responsabilité
              professionnelle demeure celle du cabinet.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Solde de fidéicommis négatif</span><span className="v">Aucun</span></div>
              <div className="ha-kv"><span className="k">Fonds dormant</span><span className="v">Aucun</span></div>
              <div className="ha-kv"><span className="k">Rapprochement du mois</span><span className="v">À faire</span></div>
              <div className="ha-kv"><span className="k">Numérotation des factures</span><span className="v">Sans trou</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Partage du patrimoine familial ── */}
        <div className="ha-screen" data-ha-pane="patrimoine">
          <div className="ha-card">
            <p className="ha-kicker">Outils · Partage du patrimoine familial</p>
            <p className="ha-h">La valeur à partager, article par article</p>
            <p className="ha-mini">
              Le calcul suit les articles du Code civil, avec la déduction de plus-value que les
              tableurs manquent une fois sur deux. Chaque montant renvoie à sa disposition.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Résidence familiale</span><span className="v">Incluse</span></div>
              <div className="ha-kv"><span className="k">Déduction de plus-value</span><span className="v">Calculée</span></div>
              <div className="ha-kv"><span className="k">Régime de retraite</span><span className="v">Inclus</span></div>
              <div className="ha-kv"><span className="k">Quand le droit ne tranche pas</span><span className="v">L&apos;outil s&apos;arrête</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Édition ── */}
        <div className="ha-screen" data-ha-pane="edition">
          <div className="ha-card">
            <p className="ha-kicker">Édition</p>
            {/* Le cabinet de demonstration ne porte AUCUN document : la table
                en compte zero. L'ecran annoncait « Deux documents en
                preparation », ce qui etait faux. Il montre donc son etat vide,
                comme le fait deja l'ecran Agenda. */}
            <p className="ha-h">Aucun document en préparation</p>
            <p className="ha-mini">
              Les documents se rédigent dans SAFE et restent rattachés à leur dossier, avec leur
              source et leur version. Ce cabinet de démonstration n&apos;en a encore rédigé
              aucun.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Documents en préparation</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Pièces classées au dossier</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Cartables par domaine</span><span className="v">Montés</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Rapports ── */}
        <div className="ha-screen" data-ha-pane="rapports">
          <div className="ha-card">
            <p className="ha-kicker">Rapports</p>
            <p className="ha-h">Activité, honoraires, encaissement</p>
            <p className="ha-mini">
              Sur la période choisie, et exportables. Ce sont les mêmes chiffres que les écrans,
              jamais un second calcul.
            </p>
            <div style={{ marginTop: 11 }}>
              {/* Ici la periode est TOUTE l'histoire du cabinet, pas le mois :
                  55 620,02 / 88 753,63 = 63 %. C'est pourquoi ce taux differe
                  des 122 % du tableau de bord, qui rapporte le mois au mois. */}
              <div className="ha-kv"><span className="k">Taux d&apos;encaissement</span><span className="v">63 %</span></div>
              <div className="ha-kv"><span className="k">Facturé sur la période</span><span className="v">88 753,63 $</span></div>
              <div className="ha-kv"><span className="k">Encaissé sur la période</span><span className="v">55 620,02 $</span></div>
              <div className="ha-kv"><span className="k">Reste à recevoir</span><span className="v">33 133,61 $</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Importation ── */}
        <div className="ha-screen" data-ha-pane="import">
          <div className="ha-card">
            <p className="ha-kicker">Importation</p>
            <p className="ha-h">Vos données arrivent depuis un fichier</p>
            <p className="ha-mini">
              Clients, dossiers et historiques se reprennent depuis un tableur. La mise en route
              est faite par nous : vous envoyez ce que vous avez, dans l&apos;état où c&apos;est.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Importations effectuées</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Formats acceptés</span><span className="v">CSV, Excel</span></div>
              <div className="ha-kv"><span className="k">Contrôle avant écriture</span><span className="v">Systématique</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Paramètres ── */}
        <div className="ha-screen" data-ha-pane="parametres">
          <div className="ha-card">
            <p className="ha-kicker">Paramètres</p>
            <p className="ha-h">Le cabinet, sa facture, ses accès</p>
            <p className="ha-mini">
              Numéros de taxes, apparence de la facture, mode de facturation, équipe et
              permissions. Configuré avec vous à la mise en route.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Province de pratique</span><span className="v">Québec</span></div>
              <div className="ha-kv"><span className="k">TPS · TVQ</span><span className="v">5 % · 9,975 %</span></div>
              <div className="ha-kv"><span className="k">Mode de facturation</span><span className="v">Horaire</span></div>
              <div className="ha-kv"><span className="k">Interface</span><span className="v">Français · English</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
