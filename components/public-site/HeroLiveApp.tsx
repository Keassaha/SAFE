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

/** Créances réelles, triées par échéance (les 6 plus anciennes). */
const CREANCES: { num: string; client: string; total: string; solde: string; ech: string; etat: "retard" | "partiel" }[] = [
  { num: "2026-011", client: "Tremblay", total: "1 616,83 $", solde: "1 616,83 $", ech: "24/01", etat: "retard" },
  { num: "2026-003", client: "Groupe immobilier Sainte-Foy ltée", total: "2 917,50 $", solde: "1 517,10 $", ech: "29/04", etat: "partiel" },
  { num: "2026-021", client: "Lévesque", total: "1 293,47 $", solde: "672,60 $", ech: "15/05", etat: "partiel" },
  { num: "2026-025", client: "Bouchard", total: "948,54 $", solde: "350,96 $", ech: "24/05", etat: "partiel" },
  { num: "2026-002", client: "Pelletier", total: "5 533,18 $", solde: "5 533,18 $", ech: "11/06", etat: "retard" },
  { num: "2026-004", client: "Groupe immobilier Sainte-Foy ltée", total: "1 911,46 $", solde: "955,73 $", ech: "14/06", etat: "partiel" },
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
        <span className="ha-cab">Me Camille Roy · Cabinet Demo</span>

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
            recherche appartient a un logiciel et non a un site. */}
        <div className="ha-right">
          <span className="ha-search">
            Rechercher un client…<span className="kbd" aria-hidden>⌘K</span>
          </span>
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
          <span className="ha-lang"><span className="on">FR</span><span>EN</span></span>
          <span className="ha-avatar">CR</span>
        </div>
      </div>

      {/* ── Bandeau d'état ── */}
      <div className="ha-strip">
        <span className="s"><i aria-hidden />Dossiers actifs <b>43</b></span>
        <span className="s"><i aria-hidden />Clients actifs <b>25</b></span>
        <span className="s warn"><i aria-hidden />Fidéicommis <b>À rapprocher</b></span>
        {/* La date, comme dans l'application. Elle disait « Extrait navigable ·
            ouvrez un menu » : une interface qui explique comment s'en servir
            avoue qu'elle n'est pas evidente, et le meme raisonnement avait
            deja fait tomber la legende de l'extrait le 2026-08-26. */}
        <span className="date">jeudi 27 août 2026</span>
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
            <div style={{ marginTop: 9 }}>
              <div className="ha-bullet safe-zoom-menu" data-ha-screen="facturation" role="button" tabIndex={0}>
                <i aria-hidden />13 facture(s) en retard
              </div>
              <div className="ha-bullet safe-zoom-menu" data-ha-screen="temps" role="button" tabIndex={0}>
                <i aria-hidden />118 881,25 $ en heures non facturées
              </div>
            </div>
          </div>

          {/* Les montants à surveiller : fidéicommis sur deux colonnes, comme
             MontantsEssentiels (grid-cols-5, la tuile fiducie span-2). */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <p className="ha-kicker">Les montants à surveiller</p>
            <div className="ha-tiles" style={{ marginTop: 11 }}>
              <div className="ha-tile safe-zoom" style={{ gridColumn: "span 2" }} data-ha-screen="comptes" role="button" tabIndex={0} aria-label="Fidéicommis : 89 275,00 $. Ouvrir l'écran.">
                <p className="lab">Fidéicommis</p>
                <p className="sub">Sommes détenues pour vos clients</p>
                <p className="val" style={{ fontSize: 21 }}>89 275,00 $</p>
                <p className="sub" style={{ marginTop: 8 }}>7 clients avec des fonds · Rapprochement à faire</p>
              </div>
              {[
                { lab: "Créances", sub: "Reste à recevoir", val: "38 060,20 $" },
                { lab: "Encaissements", sub: "Encaissé ce mois", val: "3 362,17 $" },
                { lab: "Facturation", sub: "Facturé ce mois", val: "2 004,88 $" },
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

          {/* Flux du cabinet : reprise en miniature du graphique réel
             (Facturé/Encaissé), pas un graphique interactif. */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <p className="ha-kicker">Flux du cabinet</p>
            <p className="ha-h" style={{ fontSize: 16, marginTop: 4 }}>Facturé et encaissé</p>
            <p className="ha-mini">
              L&apos;écart entre les deux barres, c&apos;est l&apos;argent que vous avez gagné mais qui
              n&apos;est pas encore rentré.
            </p>
            <div className="ha-legend" style={{ marginTop: 10 }}>
              <span className="ha-legend-i"><i aria-hidden />Facturé</span>
              <span className="ha-legend-i verified"><i aria-hidden />Encaissé</span>
            </div>
            <div className="ha-bars">
              {[
                { m: "mars", f: 50, e: 27 },
                { m: "avr.", f: 51, e: 54 },
                { m: "mai", f: 40, e: 34 },
                { m: "juin", f: 50, e: 23 },
                { m: "juill.", f: 93, e: 29 },
                { m: "août", f: 5, e: 8 },
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

          {/* Vos performances : les cinq lignes de Performances, aide comprise. */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <p className="ha-kicker">Vos performances</p>
            <p className="ha-ptitle" style={{ marginTop: 6 }}>Ce que ça donne</p>
            {[
              { k: "Taux d’encaissement", v: "168 %", a: "Part du facturé réellement rentrée." },
              { k: "Taux de facturation", v: "0 %", a: "Part des heures travaillées qui a été facturée." },
              { k: "Heures travaillées", v: "494.25 h", a: "Total saisi sur la période." },
              { k: "Heures facturées", v: "0 h", a: "Portion portée à une facture." },
              { k: "Valeur non facturée", v: "118 881,25 $", a: "Travail fait, pas encore porté à une facture.", amber: true },
            ].map((r) => (
              <div key={r.k} style={{ marginTop: 6 }}>
                <div className="ha-kv" style={{ borderBottom: 0, paddingBottom: 0 }}>
                  <span className="k">{r.k}</span>
                  <span className="v" style={{ fontSize: 13, color: r.amber ? "var(--si-amber-ink)" : undefined }}>{r.v}</span>
                </div>
                <p className="ha-mini" style={{ marginTop: 0 }}>{r.a}</p>
              </div>
            ))}
          </div>

          {/* Navette : ce qui attend une lecture, comme LawyerGlance. */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <p className="ha-ptitle" style={{ marginBottom: 0 }}>Navette</p>
              <span className="ha-mini" style={{ marginTop: 0 }}>· vous attend</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <div className="ha-nav-item">
                <span className="ha-nav-ico warn" aria-hidden>?</span>
                <span className="txt">
                  <span className="type">Question · 2026-002</span>
                  <span className="body">Confirmer la date de signature chez le notaire ?</span>
                  <span className="who">Aaliyah Côté</span>
                </span>
              </div>
              <div className="ha-nav-item">
                <span className="ha-nav-ico" aria-hidden>▤</span>
                <span className="txt">
                  <span className="type">Document prêt · 2026-001</span>
                  <span className="body">Projet de requête en révision</span>
                  <span className="who">Aaliyah Côté</span>
                </span>
              </div>
            </div>
          </div>

          {/* État des obligations + lecture financière + activité récente,
             deux colonnes égales comme dans le produit. */}
          <div className="ha-cols" style={{ marginTop: 11, gridTemplateColumns: "1fr 1fr" }}>
            <div className="ha-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p className="ha-ptitle" style={{ marginBottom: 2 }}>État des obligations</p>
                <span style={{ fontSize: 11, color: "var(--si-verified)", fontWeight: 500 }}>Générer l&apos;attestation</span>
              </div>
              <p className="ha-mini" style={{ marginBottom: 8 }}>
                Suivi automatique des exigences du Barreau et du Règlement B-1 r.5
              </p>
              <div className="ha-oblig-grid">
                {[
                  { t: "Rapprochement fidéicommis", d: "Jamais effectué", s: "À faire", warn: true },
                  { t: "Clients avec fonds en fiducie", d: "Sommes détenues en fiducie (B-1 r.5)", s: "7" },
                  { t: "Factures impayées", d: "Solde à recevoir", s: "17", warn: true },
                  { t: "Temps non facturé", d: "Entrées prêtes à facturer", s: "195", warn: true },
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
                <p className="ha-ptitle">Lecture financière du mois</p>
                <div className="ha-kv"><span className="k">Sorties</span><span className="v">0,00 $</span></div>
                <div className="ha-kv"><span className="k">Cash non reçu</span><span className="v">-1 357,29 $</span></div>
              </div>
              <div className="ha-card">
                <p className="ha-ptitle">Activité récente</p>
                <div className="ha-kv"><span className="k">create — Dossier</span><span className="v">14 août</span></div>
                <div className="ha-kv"><span className="k">create — Client</span><span className="v">14 août</span></div>
                <div className="ha-kv"><span className="k">update — Client</span><span className="v">12 août</span></div>
                <div className="ha-kv"><span className="k">create — Navette</span><span className="v">11 août</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Écran · Facturation ── */}
        <div className="ha-screen" data-ha-pane="facturation">
          <div className="ha-card">
            <p className="ha-kicker">Facturation</p>
            <p className="ha-h">Créances · 38 060,20 $</p>
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
                ["Courant", "11 717,55 $", false],
                ["1 à 30 j", "14 546,50 $", false],
                ["31 à 60 j", "2 105,48 $", true],
                ["61 à 90 j", "6 556,74 $", true],
                ["90 j et plus", "3 133,93 $", true],
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
            <p className="ha-h">24 clients actifs</p>
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
                  ["Distribution Rive-Sud ltée", "Personne morale", "2", "5 633,78 $"],
                  ["Pelletier", "Particulier", "3", "5 533,18 $"],
                  ["Gagnon", "Particulier", "1", "4 139,10 $"],
                  ["Lévesque", "Particulier", "2", "3 815,74 $"],
                  ["Clinique Longueuil inc.", "Personne morale", "3", "3 701,63 $"],
                  ["Groupe immobilier Sainte-Foy ltée", "Personne morale", "2", "2 472,83 $"],
                  ["Fiducie Outremont ltée", "Personne morale", "2", "2 443,22 $"],
                  ["Fortin", "Particulier", "2", "2 414,47 $"],
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
            <p className="ha-h">Aucune somme détenue en fiducie</p>
            <p className="ha-mini">
              Le cabinet ne détient présentement aucun fonds client. Le rapprochement reste
              exigé chaque mois, même à solde nul : c&apos;est la preuve qui est demandée en
              inspection, pas le montant.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Solde fiducie global</span><span className="v">0,00 $</span></div>
              <div className="ha-kv"><span className="k">Comptes ouverts</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Dernier rapprochement</span><span className="v">À faire</span></div>
              <div className="ha-kv"><span className="k">Écart constaté</span><span className="v">0,00 $</span></div>
            </div>
            <span className="ha-act safe-zoom" data-ha-screen="dash" role="button" tabIndex={0}>
              Retour au tableau de bord
            </span>
          </div>

          {/* À solde nul, l'écran ne raconte rien s'il n'affiche qu'un zéro.
             Ce qui compte alors, c'est la preuve que le contrôle a été fait. */}
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
              <div className="ha-kv"><span className="k">Rapprocher le fidéicommis</span><span className="v">Ce mois</span></div>
              <div className="ha-kv"><span className="k">Onze factures en retard</span><span className="v">38 060,20 $</span></div>
              <div className="ha-kv"><span className="k">Temps non facturé à porter</span><span className="v">118 881,25 $</span></div>
            </div>
            <span className="ha-act safe-zoom" data-ha-screen="facturation" role="button" tabIndex={0}>
              Ouvrir la facturation
            </span>
          </div>
          <div className="ha-cols">
            <div className="ha-card">
              <p className="ha-ptitle">Le cabinet en un coup d&apos;œil</p>
              <div className="ha-kv"><span className="k">Dossiers actifs</span><span className="v">43</span></div>
              <div className="ha-kv"><span className="k">Clients actifs</span><span className="v">24</span></div>
              <div className="ha-kv"><span className="k">Entrées de temps</span><span className="v">218</span></div>
            </div>
            <div className="ha-card">
              <p className="ha-ptitle">Ce qui a bougé</p>
              <div className="ha-kv"><span className="k">Paiement reçu · 2026-025</span><span className="v">597,58 $</span></div>
              <div className="ha-kv"><span className="k">Facture émise · 2026-031</span><span className="v">2 104,00 $</span></div>
              <div className="ha-kv"><span className="k">Retrait fidéicommis · ce mois</span><span className="v">2 925,00 $</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Dossiers ── */}
        <div className="ha-screen" data-ha-pane="dossiers">
          <div className="ha-card">
            <p className="ha-kicker">Dossiers</p>
            <p className="ha-h">50 dossiers, dont 43 actifs</p>
            <p className="ha-mini">Répartition des dossiers actifs par domaine de pratique.</p>
            <table className="ha-tbl" style={{ marginTop: 9 }}>
              <thead>
                <tr><th>Domaine</th><th>Actifs</th><th style={{ textAlign: "right" }}>Part</th></tr>
              </thead>
              <tbody>
                {[
                  ["Immobilier", "13", "30 %"],
                  ["Litige civil", "10", "23 %"],
                  ["Droit corporatif", "9", "21 %"],
                  ["Immigration", "6", "14 %"],
                  ["Droit de la famille", "5", "12 %"],
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
              Sept dossiers clôturés. À l&apos;ouverture, SAFE prépare une structure adaptée au
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
            <p className="ha-h">118 881,25 $ de temps non facturé</p>
            <p className="ha-mini">
              Cent quatre-vingt-quinze entrées facturables attendent d&apos;être portées à une
              facture. Le temps est inscrit une fois, au moment où il se fait.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Entrées au total</span><span className="v">218</span></div>
              <div className="ha-kv"><span className="k">Dont facturables non facturées</span><span className="v">195</span></div>
              <div className="ha-kv"><span className="k">Heures consignées</span><span className="v">494,3 h</span></div>
              <div className="ha-kv"><span className="k">Heures à facturer</span><span className="v">442,0 h</span></div>
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
              <div className="ha-kv"><span className="k">Revenus facturés</span><span className="v">87 115,20 $</span></div>
              <div className="ha-kv"><span className="k">Encaissé</span><span className="v">49 055,00 $</span></div>
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
            <p className="ha-h">Deux documents en préparation</p>
            <p className="ha-mini">
              Les documents se rédigent dans SAFE et restent rattachés à leur dossier, avec leur
              source et leur version.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Documents en préparation</span><span className="v">2</span></div>
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
              <div className="ha-kv"><span className="k">Taux d&apos;encaissement</span><span className="v">56 %</span></div>
              <div className="ha-kv"><span className="k">Facturé sur la période</span><span className="v">87 115,20 $</span></div>
              <div className="ha-kv"><span className="k">Encaissé sur la période</span><span className="v">49 055,00 $</span></div>
              <div className="ha-kv"><span className="k">Reste à recevoir</span><span className="v">38 060,20 $</span></div>
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
